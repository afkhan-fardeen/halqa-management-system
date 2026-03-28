import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  attendanceMarks,
  attendancePrograms,
  attendanceSessions,
  users,
} from "@/lib/db/schema";
import type { Halqa } from "@/lib/constants/halqas";
import { isStaffRole } from "@/lib/auth/roles";
import type { StaffRole } from "@/lib/auth/roles";

export function todayBahrainYmd(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bahrain" });
}

export type MemberAttendanceSessionRow = {
  sessionId: string;
  programId: string;
  sessionDate: Date;
  startsAt: Date;
  endsAt: Date;
  kind: "DAWATI" | "TARBIYATI";
  title: string | null;
  weekday: number;
  markStatus: "PRESENT" | "LATE" | "ABSENT" | null;
  lateReason: string | null;
  absentReason: string | null;
};

/** Sessions for the member's halqa + gender (active programs), soonest first. */
export async function listMemberAttendanceSessions(
  userId: string,
): Promise<MemberAttendanceSessionRow[] | { error: string }> {
  const [user] = await db
    .select({
      halqa: users.halqa,
      genderUnit: users.genderUnit,
      role: users.role,
      status: users.status,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || user.role !== "MEMBER" || user.status !== "ACTIVE") {
    return { error: "Only active members can view attendance." };
  }

  const rows = await db
    .select({
      sessionId: attendanceSessions.id,
      programId: attendancePrograms.id,
      sessionDate: attendanceSessions.sessionDate,
      startsAt: attendanceSessions.startsAt,
      endsAt: attendanceSessions.endsAt,
      kind: attendancePrograms.kind,
      title: attendancePrograms.title,
      weekday: attendancePrograms.weekday,
      markStatus: attendanceMarks.status,
      lateReason: attendanceMarks.lateReason,
      absentReason: attendanceMarks.absentReason,
    })
    .from(attendanceSessions)
    .innerJoin(
      attendancePrograms,
      eq(attendanceSessions.programId, attendancePrograms.id),
    )
    .leftJoin(
      attendanceMarks,
      and(
        eq(attendanceMarks.sessionId, attendanceSessions.id),
        eq(attendanceMarks.userId, userId),
      ),
    )
    .where(
      and(
        eq(attendancePrograms.isActive, true),
        eq(attendancePrograms.halqa, user.halqa),
        eq(attendancePrograms.genderUnit, user.genderUnit),
      ),
    )
    .orderBy(asc(attendanceSessions.sessionDate))
    .limit(80);

  return rows.map((r) => ({
    sessionId: r.sessionId,
    programId: r.programId,
    sessionDate: r.sessionDate,
    startsAt: r.startsAt,
    endsAt: r.endsAt,
    kind: r.kind,
    title: r.title,
    weekday: r.weekday,
    markStatus: r.markStatus ?? null,
    lateReason: r.lateReason ?? null,
    absentReason: r.absentReason ?? null,
  }));
}

function staffScopeWhere(
  role: StaffRole,
  halqa: string,
  genderUnit: string,
) {
  if (role === "ADMIN") {
    return undefined;
  }
  return and(
    eq(attendancePrograms.halqa, halqa as Halqa),
    eq(attendancePrograms.genderUnit, genderUnit as "MALE" | "FEMALE"),
  );
}

export async function listAttendanceProgramsForStaff(session: {
  role: string;
  halqa: string;
  genderUnit: string;
}) {
  if (!isStaffRole(session.role)) {
    return { error: "Unauthorized" as const };
  }

  const extra = staffScopeWhere(
    session.role as StaffRole,
    session.halqa,
    session.genderUnit,
  );

  const base = db
    .select({
      id: attendancePrograms.id,
      halqa: attendancePrograms.halqa,
      genderUnit: attendancePrograms.genderUnit,
      kind: attendancePrograms.kind,
      title: attendancePrograms.title,
      weekday: attendancePrograms.weekday,
      startTime: attendancePrograms.startTime,
      endTime: attendancePrograms.endTime,
      timezone: attendancePrograms.timezone,
      isActive: attendancePrograms.isActive,
      createdAt: attendancePrograms.createdAt,
      updatedAt: attendancePrograms.updatedAt,
    })
    .from(attendancePrograms)
    .$dynamic();

  const rows = await (extra ? base.where(extra) : base).orderBy(
    attendancePrograms.halqa,
    attendancePrograms.genderUnit,
    attendancePrograms.kind,
  );

  return { programs: rows };
}

export async function getAttendanceProgramByIdForStaff(
  programId: string,
  session: { role: string; halqa: string; genderUnit: string },
) {
  if (!isStaffRole(session.role)) {
    return { error: "Unauthorized" as const };
  }

  const [row] = await db
    .select()
    .from(attendancePrograms)
    .where(eq(attendancePrograms.id, programId))
    .limit(1);

  if (!row) {
    return { error: "Not found" as const };
  }

  if (session.role !== "ADMIN") {
    if (
      row.halqa !== session.halqa ||
      row.genderUnit !== session.genderUnit
    ) {
      return { error: "Forbidden" as const };
    }
  }

  return { program: row };
}

export async function getAttendanceSessionWithProgramForStaff(
  sessionId: string,
  session: { role: string; halqa: string; genderUnit: string },
) {
  if (!isStaffRole(session.role)) {
    return { error: "Unauthorized" as const };
  }

  const [row] = await db
    .select({
      session: attendanceSessions,
      program: attendancePrograms,
    })
    .from(attendanceSessions)
    .innerJoin(
      attendancePrograms,
      eq(attendanceSessions.programId, attendancePrograms.id),
    )
    .where(eq(attendanceSessions.id, sessionId))
    .limit(1);

  if (!row) {
    return { error: "Not found" as const };
  }

  if (session.role !== "ADMIN") {
    if (
      row.program.halqa !== session.halqa ||
      row.program.genderUnit !== session.genderUnit
    ) {
      return { error: "Forbidden" as const };
    }
  }

  return row;
}

export async function listSessionsForProgramForStaff(
  programId: string,
  session: { role: string; halqa: string; genderUnit: string },
): Promise<
  | { error: string }
  | { sessions: (typeof attendanceSessions.$inferSelect)[] }
> {
  const access = await getAttendanceProgramByIdForStaff(programId, session);
  if ("error" in access) {
    return { error: access.error ?? "Forbidden" };
  }

  const rows = await db
    .select()
    .from(attendanceSessions)
    .where(eq(attendanceSessions.programId, programId))
    .orderBy(desc(attendanceSessions.sessionDate))
    .limit(120);

  return { sessions: rows };
}

export type SessionMarkWithMember = {
  markId: string | null;
  userId: string;
  memberName: string;
  status: "PRESENT" | "LATE" | "ABSENT" | null;
  lateReason: string | null;
  absentReason: string | null;
};

export async function listMarksForSessionForStaff(
  sessionId: string,
  staffSession: { role: string; halqa: string; genderUnit: string },
): Promise<
  | { error: string }
  | {
      session: typeof attendanceSessions.$inferSelect;
      program: typeof attendancePrograms.$inferSelect;
      marks: SessionMarkWithMember[];
    }
> {
  const bundle = await getAttendanceSessionWithProgramForStaff(
    sessionId,
    staffSession,
  );
  if ("error" in bundle) {
    return bundle;
  }

  const { session: sess, program } = bundle;

  const members = await db
    .select({
      id: users.id,
      name: users.name,
    })
    .from(users)
    .where(
      and(
        eq(users.role, "MEMBER"),
        eq(users.status, "ACTIVE"),
        eq(users.halqa, program.halqa),
        eq(users.genderUnit, program.genderUnit),
      ),
    )
    .orderBy(users.name);

  const markRows = await db
    .select()
    .from(attendanceMarks)
    .where(eq(attendanceMarks.sessionId, sessionId));

  const byUser = new Map(markRows.map((m) => [m.userId, m]));

  const marks: SessionMarkWithMember[] = members.map((u) => {
    const m = byUser.get(u.id);
    return {
      markId: m?.id ?? null,
      userId: u.id,
      memberName: u.name,
      status: m?.status ?? null,
      lateReason: m?.lateReason ?? null,
      absentReason: m?.absentReason ?? null,
    };
  });

  return { session: sess, program, marks };
}

/** Member: load session if it belongs to their halqa/gender program. */
export async function getMemberAttendanceSessionForMark(
  userId: string,
  sessionId: string,
) {
  const [user] = await db
    .select({
      halqa: users.halqa,
      genderUnit: users.genderUnit,
      role: users.role,
      status: users.status,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || user.role !== "MEMBER" || user.status !== "ACTIVE") {
    return { error: "Unauthorized" as const };
  }

  const [row] = await db
    .select({
      session: attendanceSessions,
      program: attendancePrograms,
      mark: attendanceMarks,
    })
    .from(attendanceSessions)
    .innerJoin(
      attendancePrograms,
      eq(attendanceSessions.programId, attendancePrograms.id),
    )
    .leftJoin(
      attendanceMarks,
      and(
        eq(attendanceMarks.sessionId, attendanceSessions.id),
        eq(attendanceMarks.userId, userId),
      ),
    )
    .where(
      and(
        eq(attendanceSessions.id, sessionId),
        eq(attendancePrograms.isActive, true),
        eq(attendancePrograms.halqa, user.halqa),
        eq(attendancePrograms.genderUnit, user.genderUnit),
      ),
    )
    .limit(1);

  if (!row) {
    return { error: "Not found" as const };
  }

  return row;
}
