import { and, desc, eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { isStaffRole } from "@/lib/auth/roles";
import { buildStaffMemberScope } from "@/lib/auth/staff-scope";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function getPendingRegistrations() {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    return [];
  }

  const scope = buildStaffMemberScope(session.user);
  const where = and(scope, eq(users.status, "PENDING"));

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      halqa: users.halqa,
      genderUnit: users.genderUnit,
      language: users.language,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt));
}

export async function getPendingRegistrationCount() {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    return 0;
  }

  const scope = buildStaffMemberScope(session.user);
  const where = and(scope, eq(users.status, "PENDING"));

  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(users)
    .where(where);
  return row?.n ?? 0;
}
