import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { isStaffRole } from "@/lib/auth/roles";
import { buildStaffMemberScope } from "@/lib/auth/staff-scope";
import { db } from "@/lib/db";
import { aiyanat, users } from "@/lib/db/schema";

export async function listAiyanatForMember(userId: string) {
  return db
    .select()
    .from(aiyanat)
    .where(eq(aiyanat.userId, userId))
    .orderBy(desc(aiyanat.month));
}

/** Count of months in the year marked as contributed (yes). */
export async function countAiyanatYesMonthsForYear(
  userId: string,
  year: number,
) {
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(aiyanat)
    .where(
      and(
        eq(aiyanat.userId, userId),
        eq(aiyanat.status, "PAID"),
        gte(aiyanat.month, `${year}-01`),
        lte(aiyanat.month, `${year}-12`),
      ),
    );
  return row?.n ?? 0;
}

export type StaffAiyanatRow = {
  id: string;
  month: string;
  amount: string;
  status: "PAID" | "NOT_PAID";
  paymentDate: Date | null;
  memberName: string;
  memberEmail: string;
  halqa: string;
  genderUnit: string;
};

const staffSelect = {
  id: aiyanat.id,
  month: aiyanat.month,
  amount: aiyanat.amount,
  status: aiyanat.status,
  paymentDate: aiyanat.paymentDate,
  memberName: users.name,
  memberEmail: users.email,
  halqa: users.halqa,
  genderUnit: users.genderUnit,
} as const;

export async function listAiyanatForStaff(): Promise<StaffAiyanatRow[]> {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    return [];
  }

  const memberScope = buildStaffMemberScope(session.user);

  return db
    .select(staffSelect)
    .from(aiyanat)
    .innerJoin(users, eq(aiyanat.userId, users.id))
    .where(memberScope)
    .orderBy(desc(aiyanat.month), users.name);
}
