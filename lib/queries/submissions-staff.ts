import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { isStaffRole } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { contacts, dailyLogs, users } from "@/lib/db/schema";
import { parseYmdToUtcDate } from "@/lib/utils/date";
import type { Halqa } from "@/lib/constants/halqas";

type GenderUnit = "MALE" | "FEMALE";

type Scope =
  | { type: "admin" }
  | { type: "unit"; halqa: Halqa; genderUnit: GenderUnit };

async function getScope(): Promise<Scope | null> {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    return null;
  }
  if (session.user.role === "ADMIN") {
    return { type: "admin" };
  }
  return {
    type: "unit",
    halqa: session.user.halqa,
    genderUnit: session.user.genderUnit,
  };
}

export type StaffDailyLogRow = {
  logId: string;
  date: string;
  memberName: string;
  memberEmail: string;
  halqa: string;
  genderUnit: string;
  quranPages: number;
  hadith: boolean;
};

export type StaffContactRow = {
  id: string;
  logDate: string;
  memberName: string;
  contactName: string;
  phone: string;
  location: string;
  status: string;
};

function formatDate(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
}

export async function listDailyLogsForStaff(options: {
  fromYmd?: string;
  toYmd?: string;
  page: number;
  pageSize: number;
}): Promise<{ rows: StaffDailyLogRow[]; total: number }> {
  const scope = await getScope();
  if (!scope) {
    return { rows: [], total: 0 };
  }

  const page = Math.max(1, options.page);
  const pageSize = Math.min(50_000, Math.max(1, options.pageSize));
  const offset = (page - 1) * pageSize;

  const fromDate = options.fromYmd
    ? parseYmdToUtcDate(options.fromYmd)
    : undefined;
  const toDate = options.toYmd ? parseYmdToUtcDate(options.toYmd) : undefined;

  const dateParts = [];
  if (fromDate) dateParts.push(gte(dailyLogs.date, fromDate));
  if (toDate) dateParts.push(lte(dailyLogs.date, toDate));
  const dateFilter =
    dateParts.length > 0 ? and(...dateParts) : undefined;

  const unitFilter =
    scope.type === "admin"
      ? undefined
      : and(
          eq(users.halqa, scope.halqa),
          eq(users.genderUnit, scope.genderUnit),
        );

  const parts = [dateFilter, unitFilter].filter(
    (x): x is NonNullable<typeof x> => x != null,
  );
  const whereClause = parts.length > 0 ? and(...parts) : undefined;

  const countQuery = db
    .select({ n: sql<number>`count(*)::int` })
    .from(dailyLogs)
    .innerJoin(users, eq(dailyLogs.userId, users.id));

  const [countRow] = whereClause
    ? await countQuery.where(whereClause)
    : await countQuery;

  const total = countRow?.n ?? 0;

  const listQuery = db
    .select({
      logId: dailyLogs.id,
      date: dailyLogs.date,
      memberName: users.name,
      memberEmail: users.email,
      halqa: users.halqa,
      genderUnit: users.genderUnit,
      quranPages: dailyLogs.quranPages,
      hadith: dailyLogs.hadith,
    })
    .from(dailyLogs)
    .innerJoin(users, eq(dailyLogs.userId, users.id))
    .orderBy(desc(dailyLogs.date))
    .limit(pageSize)
    .offset(offset);

  const logs = whereClause
    ? await listQuery.where(whereClause)
    : await listQuery;

  const rows: StaffDailyLogRow[] = logs.map((r) => ({
    logId: r.logId,
    date: formatDate(r.date),
    memberName: r.memberName,
    memberEmail: r.memberEmail,
    halqa: r.halqa,
    genderUnit: r.genderUnit,
    quranPages: r.quranPages,
    hadith: r.hadith,
  }));

  return { rows, total };
}

export async function listContactsForStaff(options: {
  fromYmd?: string;
  toYmd?: string;
  page: number;
  pageSize: number;
}): Promise<{ rows: StaffContactRow[]; total: number }> {
  const scope = await getScope();
  if (!scope) {
    return { rows: [], total: 0 };
  }

  const page = Math.max(1, options.page);
  const pageSize = Math.min(50_000, Math.max(1, options.pageSize));
  const offset = (page - 1) * pageSize;

  const fromDate = options.fromYmd
    ? parseYmdToUtcDate(options.fromYmd)
    : undefined;
  const toDate = options.toYmd ? parseYmdToUtcDate(options.toYmd) : undefined;

  const dateParts = [];
  if (fromDate) dateParts.push(gte(contacts.logDate, fromDate));
  if (toDate) dateParts.push(lte(contacts.logDate, toDate));
  const dateFilter =
    dateParts.length > 0 ? and(...dateParts) : undefined;

  const unitFilter =
    scope.type === "admin"
      ? undefined
      : and(
          eq(users.halqa, scope.halqa),
          eq(users.genderUnit, scope.genderUnit),
        );

  const parts = [dateFilter, unitFilter].filter(
    (x): x is NonNullable<typeof x> => x != null,
  );
  const whereClause = parts.length > 0 ? and(...parts) : undefined;

  const countQuery = db
    .select({ n: sql<number>`count(*)::int` })
    .from(contacts)
    .innerJoin(users, eq(contacts.userId, users.id));

  const [countRow] = whereClause
    ? await countQuery.where(whereClause)
    : await countQuery;

  const total = countRow?.n ?? 0;

  const listQuery = db
    .select({
      id: contacts.id,
      logDate: contacts.logDate,
      memberName: users.name,
      contactName: contacts.name,
      phone: contacts.phone,
      location: contacts.location,
      status: contacts.status,
    })
    .from(contacts)
    .innerJoin(users, eq(contacts.userId, users.id))
    .orderBy(desc(contacts.logDate))
    .limit(pageSize)
    .offset(offset);

  const raw = whereClause
    ? await listQuery.where(whereClause)
    : await listQuery;

  const rows: StaffContactRow[] = raw.map((r) => ({
    id: r.id,
    logDate: formatDate(r.logDate),
    memberName: r.memberName,
    contactName: r.contactName,
    phone: r.phone,
    location: r.location,
    status: r.status,
  }));

  return { rows, total };
}
