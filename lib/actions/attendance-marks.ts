"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { submitAttendanceMarkSchema } from "@/lib/validations/attendance";
import { db } from "@/lib/db";
import { attendanceMarks } from "@/lib/db/schema";
import { getMemberAttendanceSessionForMark } from "@/lib/queries/attendance";

export type SubmitAttendanceState =
  | { ok: true }
  | { ok: false; error: string };

export async function submitAttendance(
  input: unknown,
): Promise<SubmitAttendanceState> {
  const parsed = submitAttendanceMarkSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid attendance data" };
  }

  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: "Unauthorized" };
  }
  if (session.user.role !== "MEMBER" || session.user.status !== "ACTIVE") {
    return { ok: false, error: "Only active members can mark attendance." };
  }

  const bundle = await getMemberAttendanceSessionForMark(
    session.user.id,
    parsed.data.sessionId,
  );
  if ("error" in bundle) {
    return { ok: false, error: bundle.error };
  }

  const lateReason =
    parsed.data.status === "LATE"
      ? (parsed.data.lateReason?.trim() || null)
      : null;
  const absentReason =
    parsed.data.status === "ABSENT"
      ? (parsed.data.absentReason?.trim() || null)
      : null;

  await db
    .insert(attendanceMarks)
    .values({
      sessionId: parsed.data.sessionId,
      userId: session.user.id,
      status: parsed.data.status,
      lateReason,
      absentReason,
      markedAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [attendanceMarks.sessionId, attendanceMarks.userId],
      set: {
        status: parsed.data.status,
        lateReason,
        absentReason,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/attendance");
  revalidatePath(`/attendance/${parsed.data.sessionId}`);
  return { ok: true };
}
