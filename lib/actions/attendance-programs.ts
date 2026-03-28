"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/auth";
import { bahrainLocalToUtc, parseTimeHHMM } from "@/lib/attendance/bahrain";
import { materializeSessionsForProgram } from "@/lib/attendance/generate-sessions";
import { isStaffRole } from "@/lib/auth/roles";
import {
  createAttendanceSessionSchema,
  upsertAttendanceProgramSchema,
} from "@/lib/validations/attendance";
import { db } from "@/lib/db";
import { attendancePrograms, attendanceSessions } from "@/lib/db/schema";
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
      weekday: null,
      startTime: null,
      endTime: null,
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
        weekday: null,
        startTime: null,
        endTime: null,
        timezone: tz,
        isActive: true,
        updatedAt: new Date(),
      },
    })
    .returning({ id: attendancePrograms.id });

  if (!row) {
    return { ok: false, error: "Could not save program" };
  }
  revalidatePath("/dashboard/attendance/programs");
  revalidatePath("/dashboard/attendance/sessions");
  revalidatePath("/attendance");
  return { ok: true, programId: row.id };
}

export async function createAttendanceSession(
  input: z.input<typeof createAttendanceSessionSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = createAttendanceSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid session data" };
  }

  const staff = await requireStaff();
  if (!staff.ok) {
    return { ok: false, error: staff.error };
  }

  const access = await getAttendanceProgramByIdForStaff(
    parsed.data.programId,
    staff.session.user,
  );
  if ("error" in access) {
    return { ok: false, error: access.error ?? "Forbidden" };
  }
  if (!access.program.isActive) {
    return { ok: false, error: "Program is not active." };
  }

  const ymd = parsed.data.sessionDateYmd;
  const [y, mo, day] = ymd.split("-").map(Number);
  if (!y || !mo || !day) {
    return { ok: false, error: "Invalid date" };
  }

  const startH = parseTimeHHMM(parsed.data.startTime);
  const endH = parseTimeHHMM(parsed.data.endTime);
  const startsAt = bahrainLocalToUtc(y, mo - 1, day, startH.hour, startH.minute);
  let endsAt = bahrainLocalToUtc(y, mo - 1, day, endH.hour, endH.minute);
  if (endsAt.getTime() <= startsAt.getTime()) {
    endsAt = new Date(endsAt.getTime() + 24 * 60 * 60 * 1000);
  }
  const sessionDate = new Date(Date.UTC(y, mo - 1, day, 12, 0, 0));

  try {
    await db.insert(attendanceSessions).values({
      programId: parsed.data.programId,
      sessionDate,
      startsAt,
      endsAt,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/unique|duplicate|23505/i.test(msg)) {
      return {
        ok: false,
        error: "A session for this program on that date already exists.",
      };
    }
    console.error("[createAttendanceSession]", e);
    return { ok: false, error: "Could not add session." };
  }

  revalidatePath("/dashboard/attendance/programs");
  revalidatePath("/dashboard/attendance/sessions");
  revalidatePath("/attendance");
  return { ok: true };
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

  const p = access.program;
  if (p.weekday == null || !p.startTime || !p.endTime) {
    return {
      ok: false,
      error:
        "This program has no recurring weekday. Add sessions with the “Add session” form instead.",
    };
  }

  const inserted = await materializeSessionsForProgram(programId);
  revalidatePath("/dashboard/attendance/programs");
  revalidatePath("/dashboard/attendance/sessions");
  return { ok: true, inserted };
}
