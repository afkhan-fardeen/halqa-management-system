"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { attendanceProgramDisplayTitle } from "@/lib/attendance/labels";
import { isStaffRole } from "@/lib/auth/roles";
import { NOTIFICATION_TYPES } from "@/lib/constants/notification-types";
import { insertNotification } from "@/lib/db/insert-notification";
import { db } from "@/lib/db";
import { attendanceMarks, users } from "@/lib/db/schema";
import { getAttendanceSessionWithProgramForStaff } from "@/lib/queries/attendance";
import { sendAttendanceNudgeSchema } from "@/lib/validations/attendance";

function formatSessionDateLine(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Bahrain",
  });
}

export type AttendanceNudgeState =
  | { ok: true; sent: number }
  | { ok: false; error: string };

export async function sendAttendanceNudgeToMembers(
  input: unknown,
): Promise<AttendanceNudgeState> {
  const parsed = sendAttendanceNudgeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid request" };
  }

  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    return { ok: false, error: "Unauthorized" };
  }

  const bundle = await getAttendanceSessionWithProgramForStaff(
    parsed.data.sessionId,
    session.user,
  );
  if ("error" in bundle) {
    return { ok: false, error: bundle.error };
  }

  const { session: sess, program } = bundle;
  const onlyUnmarked = parsed.data.onlyUnmarked === true;

  const memberRows = await db
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

  let markedIds = new Set<string>();
  if (onlyUnmarked) {
    const marks = await db
      .select({ userId: attendanceMarks.userId })
      .from(attendanceMarks)
      .where(eq(attendanceMarks.sessionId, sess.id));
    markedIds = new Set(marks.map((m) => m.userId));
  }

  const display = attendanceProgramDisplayTitle(program);
  const dateLabel = formatSessionDateLine(sess.sessionDate);
  const pushTitle = `Mark attendance — ${display}`;
  const message = onlyUnmarked
    ? `Reminder: please mark Present, Late, or Absent for ${dateLabel} (${display}) if you haven’t yet.`
    : `Please mark your attendance for ${dateLabel} (${display}) when you can.`;

  const actionUrl = `/attendance/${sess.id}`;

  let sent = 0;
  for (const m of memberRows) {
    if (onlyUnmarked && markedIds.has(m.id)) {
      continue;
    }
    await insertNotification({
      userId: m.id,
      type: NOTIFICATION_TYPES.ATTENDANCE_REMINDER,
      message,
      actionUrl,
      pushTitle,
    });
    sent += 1;
  }

  revalidatePath("/dashboard/attendance/sessions");
  revalidatePath("/attendance");
  return { ok: true, sent };
}
