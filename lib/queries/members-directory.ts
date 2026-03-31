import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { isStaffRole } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

const statuses = [
  "PENDING",
  "ACTIVE",
  "REJECTED",
  "DEACTIVATED",
] as const;

export type MemberDirectoryRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  halqa: string;
  genderUnit: string;
  status: string;
  createdAt: Date;
};

export async function listMembersForStaff(options: {
  q?: string;
  status?: string;
  page: number;
  pageSize: number;
}): Promise<{ rows: MemberDirectoryRow[]; total: number }> {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    return { rows: [], total: 0 };
  }

  const page = Math.max(1, options.page);
  const pageSize = Math.min(50_000, Math.max(1, options.pageSize));
  const offset = (page - 1) * pageSize;

  const scope =
    session.user.role === "ADMIN"
      ? eq(users.role, "MEMBER")
      : and(
          eq(users.role, "MEMBER"),
          eq(users.halqa, session.user.halqa),
          eq(users.genderUnit, session.user.genderUnit),
        );

  const q = options.q?.trim();
  const search =
    q && q.length > 0
      ? or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`))
      : undefined;

  const statusFilter =
    options.status &&
    (statuses as readonly string[]).includes(options.status)
      ? eq(users.status, options.status as (typeof statuses)[number])
      : undefined;

  const where = and(scope, search, statusFilter);

  const [countRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(users)
    .where(where);

  const total = countRow?.n ?? 0;

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      halqa: users.halqa,
      genderUnit: users.genderUnit,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(pageSize)
    .offset(offset);

  return { rows, total };
}

export type MemberDirectoryKpis = {
  total: number;
  active: number;
  pending: number;
  deactivated: number;
  rejected: number;
};

/** Status counts for members in staff scope; optional name/email search. Ignores status filter (for KPI strip). */
export async function getMemberDirectoryKpis(options: {
  q?: string;
}): Promise<MemberDirectoryKpis> {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    return {
      total: 0,
      active: 0,
      pending: 0,
      deactivated: 0,
      rejected: 0,
    };
  }

  const scope =
    session.user.role === "ADMIN"
      ? eq(users.role, "MEMBER")
      : and(
          eq(users.role, "MEMBER"),
          eq(users.halqa, session.user.halqa),
          eq(users.genderUnit, session.user.genderUnit),
        );

  const q = options.q?.trim();
  const search =
    q && q.length > 0
      ? or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`))
      : undefined;

  const where = and(scope, search);

  const rows = await db
    .select({
      status: users.status,
      n: sql<number>`count(*)::int`,
    })
    .from(users)
    .where(where)
    .groupBy(users.status);

  const byStatus = Object.fromEntries(
    rows.map((r) => [r.status, r.n]),
  ) as Record<string, number>;

  const active = byStatus.ACTIVE ?? 0;
  const pending = byStatus.PENDING ?? 0;
  const deactivated = byStatus.DEACTIVATED ?? 0;
  const rejected = byStatus.REJECTED ?? 0;
  const total = active + pending + deactivated + rejected;

  return { total, active, pending, deactivated, rejected };
}
