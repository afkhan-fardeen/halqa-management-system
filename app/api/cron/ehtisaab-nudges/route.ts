import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { NOTIFICATION_TYPES } from "@/lib/constants/notification-types";
import { insertNotification } from "@/lib/db/insert-notification";
import { db } from "@/lib/db";
import { dailyLogs, ehtisaabNudgeSent, users } from "@/lib/db/schema";
import {
  getCachedBahrainTimings,
  isNowInTriggerWindow,
  MORNING_SLOT,
  NUDGE_WINDOW_MS,
  parseOffsetMinutes,
  PRAYER_NUDGE_SLOTS,
  triggerMsForMorning0930,
  triggerMsForPrayer,
} from "@/lib/prayer/ehtisaab-nudge-schedule";
import { parseYmdToUtcDate, todayYmdBahrain } from "@/lib/utils/date";

/**
 * Up to 6 nudges per member per Bahrain day: 5 after adhan + offset, 1 at 09:30.
 * Deduped via `ehtisaab_nudge_sent`. Skips members who already saved full daily log today.
 * Schedule: Vercel cron every 5 min or external hit with CRON_SECRET.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dayYmd = todayYmdBahrain();
  const logDate = parseYmdToUtcDate(dayYmd);
  const nowMs = Date.now();
  const offsetMin = parseOffsetMinutes();

  let timings;
  try {
    timings = await getCachedBahrainTimings(dayYmd);
  } catch (e) {
    console.error("[ehtisaab-nudges] Aladhan", e);
    return NextResponse.json(
      { error: "Prayer times unavailable" },
      { status: 502 },
    );
  }

  const members = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, "MEMBER"), eq(users.status, "ACTIVE")));

  const completedRows = await db
    .select({ userId: dailyLogs.userId })
    .from(dailyLogs)
    .where(
      and(
        eq(dailyLogs.date, logDate),
        eq(dailyLogs.salatSaved, true),
        eq(dailyLogs.quranSaved, true),
        eq(dailyLogs.hadithSaved, true),
      ),
    );

  const completed = new Set(completedRows.map((r) => r.userId));

  let notificationsInserted = 0;

  for (const m of members) {
    if (completed.has(m.id)) continue;

    const slotDefs = [
      ...PRAYER_NUDGE_SLOTS.map((p) => ({
        slot: p.slot,
        triggerMs: triggerMsForPrayer(dayYmd, timings, p.aladhanKey, offsetMin),
        message: `Reminder: add your ehtisaab for ${p.label} when you can.`,
        type: NOTIFICATION_TYPES.EHTISAAB_PRAYER_NUDGE as string,
        pushTitle: "Salah — Ehtisaab",
      })),
      {
        slot: MORNING_SLOT,
        triggerMs: triggerMsForMorning0930(dayYmd),
        message:
          "Reminder: fill today’s ehtisaab (Salah, Quran, and literature) when you can.",
        type: NOTIFICATION_TYPES.EHTISAAB_MORNING_NUDGE as string,
        pushTitle: "Ehtisaab",
      },
    ];

    for (const item of slotDefs) {
      if (!isNowInTriggerWindow(nowMs, item.triggerMs, NUDGE_WINDOW_MS)) {
        continue;
      }

      const [dedupe] = await db
        .insert(ehtisaabNudgeSent)
        .values({
          userId: m.id,
          dayYmd,
          slot: item.slot,
        })
        .onConflictDoNothing({
          target: [
            ehtisaabNudgeSent.userId,
            ehtisaabNudgeSent.dayYmd,
            ehtisaabNudgeSent.slot,
          ],
        })
        .returning({ id: ehtisaabNudgeSent.id });

      if (!dedupe) continue;

      await insertNotification({
        userId: m.id,
        type: item.type,
        message: item.message,
        pushTitle: item.pushTitle,
      });
      notificationsInserted += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    dayYmd,
    notificationsInserted,
    membersConsidered: members.length,
  });
}
