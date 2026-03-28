import { and, eq, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { attendanceProgramDisplayTitle } from "@/lib/attendance/labels";
import { materializeAllActivePrograms } from "@/lib/attendance/generate-sessions";
import { NOTIFICATION_TYPES } from "@/lib/constants/notification-types";
import { insertNotification } from "@/lib/db/insert-notification";
import { db } from "@/lib/db";
import {
  attendanceMarks,
  attendancePrograms,
  attendanceReminderSent,
  attendanceSessions,
  users,
} from "@/lib/db/schema";

/**
 * After a session ends, remind ACTIVE members in the same halqa + gender unit who have
 * not marked attendance — once per user per session (`attendance_reminder_sent`).
 * See docs/cron-attendance-reminders.md.
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

  let materialized = 0;
  try {
    materialized = await materializeAllActivePrograms();
  } catch (e) {
    console.error("[cron:attendance-reminders] materialize", e);
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const sessionRows = await db
    .select({
      session: attendanceSessions,
      program: attendancePrograms,
    })
    .from(attendanceSessions)
    .innerJoin(
      attendancePrograms,
      eq(attendanceSessions.programId, attendancePrograms.id),
    )
    .where(
      and(
        eq(attendancePrograms.isActive, true),
        lte(attendanceSessions.endsAt, now),
        gte(attendanceSessions.endsAt, windowStart),
      ),
    );

  let notificationsSent = 0;

  for (const { session: sess, program } of sessionRows) {
    const members = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.role, "MEMBER"),
          eq(users.status, "ACTIVE"),
          eq(users.halqa, program.halqa),
          eq(users.genderUnit, program.genderUnit),
        ),
      );

    const markRows = await db
      .select({ userId: attendanceMarks.userId })
      .from(attendanceMarks)
      .where(eq(attendanceMarks.sessionId, sess.id));
    const marked = new Set(markRows.map((m) => m.userId));

    const display = attendanceProgramDisplayTitle(program);
    const dateLabel = sess.sessionDate.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "Asia/Bahrain",
    });
    const pushTitle = `Mark attendance — ${display}`;
    const message = `Session ended (${dateLabel}) — please mark Present, Late, or Absent for ${display}.`;
    const actionUrl = `/attendance/${sess.id}`;

    for (const m of members) {
      if (marked.has(m.id)) continue;

      const [dedupe] = await db
        .insert(attendanceReminderSent)
        .values({ userId: m.id, sessionId: sess.id })
        .onConflictDoNothing({
          target: [
            attendanceReminderSent.userId,
            attendanceReminderSent.sessionId,
          ],
        })
        .returning({ userId: attendanceReminderSent.userId });

      if (!dedupe) continue;

      await insertNotification({
        userId: m.id,
        type: NOTIFICATION_TYPES.ATTENDANCE_REMINDER,
        message,
        actionUrl,
        pushTitle,
      });
      notificationsSent += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    materializedSessionsInserted: materialized,
    sessionsInWindow: sessionRows.length,
    notificationsSent,
  });
}
