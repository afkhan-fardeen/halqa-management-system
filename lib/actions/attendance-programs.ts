"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { materializeSessionsForProgram } from "@/lib/attendance/generate-sessions";
import { isStaffRole } from "@/lib/auth/roles";
import { upsertAttendanceProgramSchema } from "@/lib/validations/attendance";
import { db } from "@/lib/db";
import { attendancePrograms } from "@/lib/db/schema";
import { getAttendanceProgramByIdForStaff } from "@/lib/queries/attendance";

export type AttendanceProgramActionState =
  | { ok: true; programId: string }
  | { ok: false; error: string };

async function requireStaff() {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    return { ok: false as const, error: "Unauthorized" };
  }
  return { ok: true as const, session };
}

export async function upsertAttendanceProgram(
  input: z.input<typeof upsertAttendanceProgramSchema>,
): Promise<AttendanceProgramActionState> {
  const parsed = upsertAttendanceProgramSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid program data" };
  }

  const staff = await requireStaff();
  if (!staff.ok) {
    return { ok: false, error: staff.error };
  }

  const { halqa, genderUnit } = parsed.data;
  if (staff.session.user.role !== "ADMIN") {
    if (
      staff.session.user.halqa !== halqa ||
      staff.session.user.genderUnit !== genderUnit
    ) {
      return { ok: false, error: "You can only manage programs for your halqa and unit." };
    }
  }

  const tz = parsed.data.timezone?.trim() || "Asia/Bahrain";
  const title = parsed.data.title?.trim() || null;

  const [row] = await db
    .insert(attendancePrograms)
    .values({
      halqa,
      genderUnit,
      kind: parsed.data.kind,
      title,
      weekday: parsed.data.weekday,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      timezone: tz,
      isActive: true,
      createdBy: staff.session.user.id,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        attendancePrograms.halqa,
        attendancePrograms.genderUnit,
        attendancePrograms.kind,
      ],
      set: {
        title,
        weekday: parsed.data.weekday,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        timezone: tz,
        isActive: true,
        updatedAt: new Date(),
      },
    })
    .returning({ id: attendancePrograms.id });

  if (!row) {
    return { ok: false, error: "Could not save program" };
  }

  await materializeSessionsForProgram(row.id);
  revalidatePath("/dashboard/attendance/programs");
  revalidatePath("/dashboard/attendance/sessions");
  revalidatePath("/attendance");
  return { ok: true, programId: row.id };
}

export async function deactivateAttendanceProgram(
  programId: string,
): Promise<AttendanceProgramActionState> {
  const staff = await requireStaff();
  if (!staff.ok) {
    return { ok: false, error: staff.error };
  }

  const access = await getAttendanceProgramByIdForStaff(programId, staff.session.user);
  if ("error" in access) {
    return { ok: false, error: access.error ?? "Forbidden" };
  }

  await db
    .update(attendancePrograms)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(attendancePrograms.id, programId));

  revalidatePath("/dashboard/attendance/programs");
  revalidatePath("/attendance");
  return { ok: true, programId };
}

export async function regenerateAttendanceSessions(
  programId: string,
): Promise<{ ok: true; inserted: number } | { ok: false; error: string }> {
  const staff = await requireStaff();
  if (!staff.ok) {
    return { ok: false, error: staff.error };
  }

  const access = await getAttendanceProgramByIdForStaff(programId, staff.session.user);
  if ("error" in access) {
    return { ok: false, error: access.error ?? "Forbidden" };
  }

  const inserted = await materializeSessionsForProgram(programId);
  revalidatePath("/dashboard/attendance/programs");
  revalidatePath("/dashboard/attendance/sessions");
  return { ok: true, inserted };
}
