import { and, eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { isStaffRole } from "@/lib/auth/roles";
import { buildStaffMemberScope, buildStaffHalqaGenderScope } from "@/lib/auth/staff-scope";
import { db } from "@/lib/db";
import { aiyanat, dailyUnitStats, users } from "@/lib/db/schema";
import { parseYmdToUtcDate, todayYmdLocal } from "@/lib/utils/date";

function currentMonthYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export type DashboardOverview = {
  submissionRatePct: number | null;
  submittedToday: number;
  totalMembersUnit: number;
  aiyanatMonthLabel: string;
  aiyanatPaidMembers: number;
  aiyanatEligibleMembers: number;
};

export async function getDashboardOverview(): Promise<DashboardOverview | null> {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    return null;
  }

  const today = parseYmdToUtcDate(todayYmdLocal());
  const monthStr = currentMonthYmd();

  let submittedToday = 0;
  let totalMembersUnit = 0;

  const statsScope = buildStaffHalqaGenderScope(
    session.user,
    dailyUnitStats.halqa,
    dailyUnitStats.genderUnit,
  );
  const statsRows = await db
    .select()
    .from(dailyUnitStats)
    .where(and(eq(dailyUnitStats.date, today), statsScope));
  for (const r of statsRows) {
    submittedToday += r.submittedCount;
    totalMembersUnit += r.totalMembers;
  }

  const submissionRatePct =
    totalMembersUnit > 0
      ? Math.round((submittedToday / totalMembersUnit) * 100)
      : null;

  const memberScope = and(buildStaffMemberScope(session.user), eq(users.status, "ACTIVE"));

  const [eligible] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(users)
    .where(memberScope);
  const aiyanatEligibleMembers = eligible?.n ?? 0;

  const [paidDistinct] = await db
    .select({
      n: sql<number>`count(distinct ${aiyanat.userId})::int`,
    })
    .from(aiyanat)
    .innerJoin(users, eq(aiyanat.userId, users.id))
    .where(
      and(
        eq(aiyanat.month, monthStr),
        eq(aiyanat.status, "PAID"),
        memberScope,
      ),
    );

  const aiyanatPaidMembers = paidDistinct?.n ?? 0;

  return {
    submissionRatePct,
    submittedToday,
    totalMembersUnit,
    aiyanatMonthLabel: monthStr,
    aiyanatPaidMembers,
    aiyanatEligibleMembers,
  };
}
