import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { isStaffRole } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import {
  aiyanat,
  contacts,
  dailyLogs,
  memberMonthlyStaffNotes,
  users,
} from "@/lib/db/schema";
import {
  eachYmdInRangeUtc,
  formatYmdUtc,
  monthYyyyMmToRange,
  parseYmdToUtcDate,
} from "@/lib/utils/date";

const AIYANAT_HISTORY_LIMIT = 48;
const DEFAULT_CONTACTS_PAGE_SIZE = 25;
export const MEMBER_MONTHLY_EXPORT_CONTACTS_PAGE_SIZE = 100_000;

function qazaCountForLog(row: {
  salatSaved: boolean;
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}): number {
  if (!row.salatSaved) return 0;
  return [row.fajr, row.dhuhr, row.asr, row.maghrib, row.isha].filter(
    (p) => p === "QAZA",
  ).length;
}

/** Count each prayer slot status across the month (only when salat is saved). */
export type PrayerStatusTotals = {
  BA_JAMAAT: number;
  MUNFARID: number;
  QAZA: number;
  ON_TIME: number;
};

function emptyPrayerTotals(): PrayerStatusTotals {
  return { BA_JAMAAT: 0, MUNFARID: 0, QAZA: 0, ON_TIME: 0 };
}

function addPrayerRowToTotals(
  row: {
    salatSaved: boolean;
    fajr: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
  },
  totals: PrayerStatusTotals,
) {
  if (!row.salatSaved) return;
  for (const p of [row.fajr, row.dhuhr, row.asr, row.maghrib, row.isha]) {
    if (p === "BA_JAMAAT") totals.BA_JAMAAT += 1;
    else if (p === "MUNFARID") totals.MUNFARID += 1;
    else if (p === "QAZA") totals.QAZA += 1;
    else if (p === "ON_TIME") totals.ON_TIME += 1;
  }
}

export type QuranTypeTotals = {
  TILAWAT: number;
  TAFSEER: number;
  BOTH: number;
};

function emptyQuranTypeTotals(): QuranTypeTotals {
  return { TILAWAT: 0, TAFSEER: 0, BOTH: 0 };
}

/** Active member in scope for pickers (Admin: all members; staff: own unit). */
export async function listMembersForReportPicker(): Promise<
  { id: string; name: string; email: string }[]
> {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) return [];

  const scope =
    session.user.role === "ADMIN"
      ? eq(users.role, "MEMBER")
      : and(
          eq(users.role, "MEMBER"),
          eq(users.halqa, session.user.halqa),
          eq(users.genderUnit, session.user.genderUnit),
        );

  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(and(scope, eq(users.status, "ACTIVE")))
    .orderBy(users.name)
    .limit(5000);
}

/**
 * Returns the other unit staff role (Incharge ↔ Secretary) for the same halqa/unit, if any.
 */
export async function getUnitStaffCounterpart(): Promise<{
  name: string;
  roleLabel: "Secretary" | "Incharge";
} | null> {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) return null;
  const r = session.user.role;
  if (r !== "INCHARGE" && r !== "SECRETARY") return null;

  const targetRole: "INCHARGE" | "SECRETARY" =
    r === "INCHARGE" ? "SECRETARY" : "INCHARGE";

  const [row] = await db
    .select({ name: users.name })
    .from(users)
    .where(
      and(
        eq(users.halqa, session.user.halqa),
        eq(users.genderUnit, session.user.genderUnit),
        eq(users.role, targetRole),
        eq(users.status, "ACTIVE"),
      ),
    )
    .limit(1);

  if (!row) return null;
  return {
    name: row.name,
    roleLabel: r === "INCHARGE" ? "Secretary" : "Incharge",
  };
}

/** Verify staff may view this member; returns member row or null. */
export async function getMemberForStaffView(memberId: string) {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) return null;

  const [member] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      halqa: users.halqa,
      genderUnit: users.genderUnit,
      role: users.role,
      status: users.status,
    })
    .from(users)
    .where(eq(users.id, memberId))
    .limit(1);

  if (!member || member.role !== "MEMBER") return null;

  if (session.user.role === "ADMIN") return member;

  if (
    member.halqa === session.user.halqa &&
    member.genderUnit === session.user.genderUnit
  ) {
    return member;
  }

  return null;
}

export type MemberMonthlyContactRow = {
  id: string;
  logDate: string;
  name: string;
  phone: string;
  location: string;
  status: string;
};

export type MemberMonthlyAiyanatRow = {
  month: string;
  amount: string;
  status: "PAID" | "NOT_PAID";
  paymentDate: string | null;
};

export type MemberMonthlyReportData = {
  member: {
    id: string;
    name: string;
    email: string;
    halqa: string;
    genderUnit: string;
  };
  month: string;
  fromYmd: string;
  toYmd: string;
  summary: {
    daysInMonth: number;
    daysWithLog: number;
    totalQuranPages: number;
    /** Contacts whose log date falls inside the selected report month. */
    contactsLoggedInReportMonth: number;
    totalQazaPrayers: number;
    prayerByStatus: PrayerStatusTotals;
    daysHadithYes: number;
    daysHadithNo: number;
    daysLiteratureYes: number;
    daysLiteratureNo: number;
    daysWithQuranSaved: number;
    quranByType: QuranTypeTotals;
  };
  /** All-time totals for the selected member (not limited to report month). */
  contactByStatusAllTime: { MUSLIM: number; NON_MUSLIM: number };
  contacts: {
    rows: MemberMonthlyContactRow[];
    total: number;
    page: number;
    pageSize: number;
  };
  aiyanatHistory: MemberMonthlyAiyanatRow[];
  staffNote: {
    body: string;
    updatedAt: string;
    updatedByName: string | null;
  } | null;
};

export type MemberMonthlyReportOptions = {
  contactsPage?: number;
  contactsPageSize?: number;
};

export async function getMemberMonthlyReport(
  memberId: string,
  monthYyyyMm: string,
  options?: MemberMonthlyReportOptions,
): Promise<MemberMonthlyReportData | null> {
  const member = await getMemberForStaffView(memberId);
  if (!member) return null;

  const range = monthYyyyMmToRange(monthYyyyMm);
  if (!range) return null;

  const fromD = parseYmdToUtcDate(range.fromYmd);
  const toD = parseYmdToUtcDate(range.toYmd);

  const contactsPage = Math.max(1, options?.contactsPage ?? 1);
  const contactsPageSize = Math.min(
    MEMBER_MONTHLY_EXPORT_CONTACTS_PAGE_SIZE,
    Math.max(1, options?.contactsPageSize ?? DEFAULT_CONTACTS_PAGE_SIZE),
  );
  const contactsOffset = (contactsPage - 1) * contactsPageSize;

  const logRows = await db
    .select({
      id: dailyLogs.id,
      date: dailyLogs.date,
      salatSaved: dailyLogs.salatSaved,
      fajr: dailyLogs.fajr,
      dhuhr: dailyLogs.dhuhr,
      asr: dailyLogs.asr,
      maghrib: dailyLogs.maghrib,
      isha: dailyLogs.isha,
      quranSaved: dailyLogs.quranSaved,
      quranType: dailyLogs.quranType,
      quranPages: dailyLogs.quranPages,
      hadith: dailyLogs.hadith,
      hadithSaved: dailyLogs.hadithSaved,
      literature: dailyLogs.literature,
    })
    .from(dailyLogs)
    .where(
      and(
        eq(dailyLogs.userId, memberId),
        gte(dailyLogs.date, fromD),
        lte(dailyLogs.date, toD),
      ),
    );

  const [contactsMonthRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(contacts)
    .where(
      and(
        eq(contacts.userId, memberId),
        gte(contacts.logDate, fromD),
        lte(contacts.logDate, toD),
      ),
    );

  const contactsLoggedInReportMonth = contactsMonthRow?.n ?? 0;

  const [contactsTotalRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(contacts)
    .where(eq(contacts.userId, memberId));

  const contactsTotal = contactsTotalRow?.n ?? 0;

  const statusAgg = await db
    .select({
      status: contacts.status,
      n: sql<number>`count(*)::int`,
    })
    .from(contacts)
    .where(eq(contacts.userId, memberId))
    .groupBy(contacts.status);

  const contactByStatusAllTime = { MUSLIM: 0, NON_MUSLIM: 0 };
  for (const row of statusAgg) {
    if (row.status === "MUSLIM") contactByStatusAllTime.MUSLIM = row.n;
    else contactByStatusAllTime.NON_MUSLIM += row.n;
  }

  const contactPageRows = await db
    .select({
      id: contacts.id,
      logDate: contacts.logDate,
      name: contacts.name,
      phone: contacts.phone,
      location: contacts.location,
      status: contacts.status,
    })
    .from(contacts)
    .where(eq(contacts.userId, memberId))
    .orderBy(desc(contacts.logDate))
    .limit(contactsPageSize)
    .offset(contactsOffset);

  const contactsRows: MemberMonthlyContactRow[] = contactPageRows.map((c) => ({
    id: c.id,
    logDate: formatYmdUtc(
      c.logDate instanceof Date ? c.logDate : new Date(String(c.logDate)),
    ),
    name: c.name,
    phone: c.phone,
    location: c.location,
    status: c.status,
  }));

  const aiyanatRowsRaw = await db
    .select({
      month: aiyanat.month,
      amount: aiyanat.amount,
      status: aiyanat.status,
      paymentDate: aiyanat.paymentDate,
    })
    .from(aiyanat)
    .where(eq(aiyanat.userId, memberId))
    .orderBy(desc(aiyanat.month))
    .limit(AIYANAT_HISTORY_LIMIT);

  const aiyanatHistory: MemberMonthlyAiyanatRow[] = aiyanatRowsRaw.map((r) => ({
    month: r.month,
    amount: String(r.amount),
    status: r.status,
    paymentDate: r.paymentDate
      ? formatYmdUtc(
          r.paymentDate instanceof Date
            ? r.paymentDate
            : new Date(String(r.paymentDate)),
        )
      : null,
  }));

  const prayerByStatus = emptyPrayerTotals();
  const quranByType = emptyQuranTypeTotals();
  let daysHadithYes = 0;
  let daysHadithNo = 0;
  let daysLiteratureYes = 0;
  let daysLiteratureNo = 0;
  let daysWithQuranSaved = 0;
  let daysWithLog = 0;
  let totalQuranPages = 0;
  let totalQazaPrayers = 0;

  for (const log of logRows) {
    daysWithLog += 1;
    addPrayerRowToTotals(log, prayerByStatus);
    totalQazaPrayers += qazaCountForLog(log);
    if (log.quranSaved) {
      daysWithQuranSaved += 1;
      totalQuranPages += log.quranPages ?? 0;
      if (log.quranType === "TILAWAT") quranByType.TILAWAT += 1;
      else if (log.quranType === "TAFSEER") quranByType.TAFSEER += 1;
      else quranByType.BOTH += 1;
    }
    if (log.hadithSaved) {
      if (log.hadith) daysHadithYes += 1;
      else daysHadithNo += 1;
      if (log.literature) daysLiteratureYes += 1;
      else daysLiteratureNo += 1;
    }
  }

  const days = eachYmdInRangeUtc(range.fromYmd, range.toYmd);
  const daysInMonth = days.length;

  const [noteJoin] = await db
    .select({
      body: memberMonthlyStaffNotes.body,
      updatedAt: memberMonthlyStaffNotes.updatedAt,
      updaterName: users.name,
    })
    .from(memberMonthlyStaffNotes)
    .leftJoin(users, eq(users.id, memberMonthlyStaffNotes.updatedBy))
    .where(
      and(
        eq(memberMonthlyStaffNotes.memberId, memberId),
        eq(memberMonthlyStaffNotes.month, monthYyyyMm),
      ),
    )
    .limit(1);

  const staffNote = noteJoin
    ? {
        body: noteJoin.body,
        updatedAt: (noteJoin.updatedAt instanceof Date
          ? noteJoin.updatedAt
          : new Date(String(noteJoin.updatedAt))
        ).toISOString(),
        updatedByName: noteJoin.updaterName ?? null,
      }
    : null;

  return {
    member: {
      id: member.id,
      name: member.name,
      email: member.email,
      halqa: member.halqa,
      genderUnit: member.genderUnit,
    },
    month: monthYyyyMm,
    fromYmd: range.fromYmd,
    toYmd: range.toYmd,
    summary: {
      daysInMonth,
      daysWithLog,
      totalQuranPages,
      contactsLoggedInReportMonth,
      totalQazaPrayers,
      prayerByStatus,
      daysHadithYes,
      daysHadithNo,
      daysLiteratureYes,
      daysLiteratureNo,
      daysWithQuranSaved,
      quranByType,
    },
    contactByStatusAllTime,
    contacts: {
      rows: contactsRows,
      total: contactsTotal,
      page: contactsPage,
      pageSize: contactsPageSize,
    },
    aiyanatHistory,
    staffNote,
  };
}
