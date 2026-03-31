import { and, eq, gte, lt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { NOTIFICATION_TYPES } from "@/lib/constants/notification-types";
import { sendDailyReportReminderEmail } from "@/lib/email/reminder-email";
import { insertNotification } from "@/lib/db/insert-notification";
import { db } from "@/lib/db";
import {
  dailyLogs,
  dailyReminderEmailSent,
  notifications,
  users,
} from "@/lib/db/schema";
import { parseYmdToUtcDate, todayYmdLocal } from "@/lib/utils/date";

/**
 * Daily reminders for ACTIVE members missing a full daily log (salat + quran + hadith saved today).
 * In-app rows are deduped per user per calendar day; emails use `daily_reminder_email_sent` so a
 * second cron run the same day cannot send duplicate mail. See docs/cron-reminders.md.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.ENABLE_LEGACY_DAILY_REMINDER !== "true") {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Set ENABLE_LEGACY_DAILY_REMINDER=true to run legacy daily reminders.",
    });
  }

  const today = parseYmdToUtcDate(todayYmdLocal());
  const dayEnd = new Date(today);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const members = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(and(eq(users.role, "MEMBER"), eq(users.status, "ACTIVE")));

  const loggedRows = await db
    .select({
      userId: dailyLogs.userId,
      salatSaved: dailyLogs.salatSaved,
      quranSaved: dailyLogs.quranSaved,
      hadithSaved: dailyLogs.hadithSaved,
    })
    .from(dailyLogs)
    .where(eq(dailyLogs.date, today));
  const logged = new Set(
    loggedRows
      .filter(
        (r) => r.salatSaved && r.quranSaved && r.hadithSaved,
      )
      .map((r) => r.userId),
  );

  let remindersInserted = 0;
  let emailsSent = 0;

  for (const m of members) {
    if (logged.has(m.id)) continue;

    const [already] = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, m.id),
          eq(notifications.type, NOTIFICATION_TYPES.DAILY_REMINDER),
          gte(notifications.createdAt, today),
          lt(notifications.createdAt, dayEnd),
        ),
      )
      .limit(1);

    if (!already) {
      await insertNotification({
        userId: m.id,
        type: NOTIFICATION_TYPES.DAILY_REMINDER,
        message:
          "Reminder: save Salah, Quran, and Hadith for today’s daily log when you can.",
      });
      remindersInserted += 1;
    }

    const [reserved] = await db
      .insert(dailyReminderEmailSent)
      .values({ userId: m.id, logDate: today })
      .onConflictDoNothing({
        target: [dailyReminderEmailSent.userId, dailyReminderEmailSent.logDate],
      })
      .returning({ id: dailyReminderEmailSent.id });

    if (!reserved) continue;

    const sent = await sendDailyReportReminderEmail(m.email, m.name).catch(
      (err) => {
        console.error("[cron:reminder-email]", err);
        return false;
      },
    );

    if (sent) {
      emailsSent += 1;
    } else {
      await db
        .delete(dailyReminderEmailSent)
        .where(eq(dailyReminderEmailSent.id, reserved.id));
    }
  }

  return NextResponse.json({
    ok: true,
    remindersInserted,
    emailsSent,
  });
}
