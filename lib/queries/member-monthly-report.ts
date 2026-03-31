import { and, eq, gte, lte } from "drizzle-orm";
import { auth } from "@/auth";
import { isStaffRole } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { aiyanat, contacts, dailyLogs, users } from "@/lib/db/schema";
import {
  eachYmdInRangeUtc,
  formatYmdUtc,
  monthYyyyMmToRange,
  parseYmdToUtcDate,
} from "@/lib/utils/date";

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

export type MemberMonthlyDailyPoint = {
  ymd: string;
  dayLabel: string;
  hasLog: boolean;
  quranPages: number;
  qazaCount: number;
  hadith: boolean;
  contactCount: number;
};

export type MemberMonthlyContactRow = {
  id: string;
  logDate: string;
  name: string;
  phone: string;
  location: string;
  status: string;
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
    totalContacts: number;
    totalQazaPrayers: number;
    /** Prayer slot totals for the month (5 prayers × days with saved salat). */
    prayerByStatus: PrayerStatusTotals;
    /** Days where hadith section was saved and hadith read = yes. */
    daysHadithYes: number;
    /** Days where hadith section was saved and hadith read = no. */
    daysHadithNo: number;
    /** Days where literature was explicitly skipped (hadith section saved). */
    daysLiteratureSkipped: number;
    /** Days with a book title logged (not skipped). */
    daysLiteratureWithBook: number;
    /** Days where the Quran section was saved for that daily log. */
    daysWithQuranSaved: number;
    /** Quran type counts among days with quran saved. */
    quranByType: QuranTypeTotals;
  };
  /** Contact outreach totals by status for pie chart. */
  contactByStatus: { MUSLIM: number; NON_MUSLIM: number };
  dailySeries: MemberMonthlyDailyPoint[];
  contactRows: MemberMonthlyContactRow[];
  aiyanat: {
    month: string;
    amount: string;
    status: "PAID" | "NOT_PAID";
    paymentDate: string | null;
  } | null;
};

export async function getMemberMonthlyReport(
  memberId: string,
  monthYyyyMm: string,
): Promise<MemberMonthlyReportData | null> {
  const member = await getMemberForStaffView(memberId);
  if (!member) return null;

  const range = monthYyyyMmToRange(monthYyyyMm);
  if (!range) return null;

  const fromD = parseYmdToUtcDate(range.fromYmd);
  const toD = parseYmdToUtcDate(range.toYmd);

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
      literatureSkipped: dailyLogs.literatureSkipped,
      bookTitle: dailyLogs.bookTitle,
    })
    .from(dailyLogs)
    .where(
      and(
        eq(dailyLogs.userId, memberId),
        gte(dailyLogs.date, fromD),
        lte(dailyLogs.date, toD),
      ),
    );

  const logByYmd = new Map<
    string,
    (typeof logRows)[number]
  >();
  for (const r of logRows) {
    const ymd = formatYmdUtc(
      r.date instanceof Date ? r.date : new Date(String(r.date)),
    );
    logByYmd.set(ymd, r);
  }

  const contactRaw = await db
    .select({
      id: contacts.id,
      logDate: contacts.logDate,
      name: contacts.name,
      phone: contacts.phone,
      location: contacts.location,
      status: contacts.status,
    })
    .from(contacts)
    .where(
      and(
        eq(contacts.userId, memberId),
        gte(contacts.logDate, fromD),
        lte(contacts.logDate, toD),
      ),
    )
    .orderBy(contacts.logDate);

  const contactsByYmd = new Map<string, number>();
  for (const c of contactRaw) {
    const ymd = formatYmdUtc(
      c.logDate instanceof Date ? c.logDate : new Date(String(c.logDate)),
    );
    contactsByYmd.set(ymd, (contactsByYmd.get(ymd) ?? 0) + 1);
  }

  const [aiRow] = await db
    .select({
      month: aiyanat.month,
      amount: aiyanat.amount,
      status: aiyanat.status,
      paymentDate: aiyanat.paymentDate,
    })
    .from(aiyanat)
    .where(and(eq(aiyanat.userId, memberId), eq(aiyanat.month, monthYyyyMm)))
    .limit(1);

  const prayerByStatus = emptyPrayerTotals();
  const quranByType = emptyQuranTypeTotals();
  let daysHadithYes = 0;
  let daysHadithNo = 0;
  let daysLiteratureSkipped = 0;
  let daysLiteratureWithBook = 0;
  let daysWithQuranSaved = 0;

  for (const log of logRows) {
    addPrayerRowToTotals(log, prayerByStatus);
    if (log.quranSaved) {
      daysWithQuranSaved += 1;
      if (log.quranType === "TILAWAT") quranByType.TILAWAT += 1;
      else if (log.quranType === "TAFSEER") quranByType.TAFSEER += 1;
      else quranByType.BOTH += 1;
    }
    if (log.hadithSaved) {
      if (log.hadith) daysHadithYes += 1;
      else daysHadithNo += 1;
      if (log.literatureSkipped) daysLiteratureSkipped += 1;
      else if (log.bookTitle && log.bookTitle.trim().length > 0) {
        daysLiteratureWithBook += 1;
      }
    }
  }

  const contactByStatus = { MUSLIM: 0, NON_MUSLIM: 0 };
  for (const c of contactRaw) {
    if (c.status === "MUSLIM") contactByStatus.MUSLIM += 1;
    else contactByStatus.NON_MUSLIM += 1;
  }

  const days = eachYmdInRangeUtc(range.fromYmd, range.toYmd);
  const dailySeries: MemberMonthlyDailyPoint[] = [];
  let daysWithLog = 0;
  let totalQuranPages = 0;
  let totalQazaPrayers = 0;

  for (const ymd of days) {
    const log = logByYmd.get(ymd);
    const hasLog = Boolean(log);
    const quranPages =
      log && log.quranSaved !== false ? log.quranPages : 0;
    const qaza = log ? qazaCountForLog(log) : 0;
    const hadith = log ? log.hadith : false;
    const contactCount = contactsByYmd.get(ymd) ?? 0;

    const dt = parseYmdToUtcDate(ymd);
    const dayLabel = dt.toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
    });

    if (hasLog) {
      daysWithLog += 1;
      totalQuranPages += quranPages;
      totalQazaPrayers += qaza;
    }

    dailySeries.push({
      ymd,
      dayLabel,
      hasLog,
      quranPages,
      qazaCount: qaza,
      hadith,
      contactCount,
    });
  }

  const contactRows: MemberMonthlyContactRow[] = contactRaw.map((c) => ({
    id: c.id,
    logDate: formatYmdUtc(
      c.logDate instanceof Date ? c.logDate : new Date(String(c.logDate)),
    ),
    name: c.name,
    phone: c.phone,
    location: c.location,
    status: c.status,
  }));

  const totalContacts = contactRows.length;

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
      daysInMonth: days.length,
      daysWithLog,
      totalQuranPages,
      totalContacts,
      totalQazaPrayers,
      prayerByStatus,
      daysHadithYes,
      daysHadithNo,
      daysLiteratureSkipped,
      daysLiteratureWithBook,
      daysWithQuranSaved,
      quranByType,
    },
    contactByStatus,
    dailySeries,
    contactRows,
    aiyanat: aiRow
      ? {
          month: aiRow.month,
          amount: String(aiRow.amount),
          status: aiRow.status,
          paymentDate: aiRow.paymentDate
            ? formatYmdUtc(
                aiRow.paymentDate instanceof Date
                  ? aiRow.paymentDate
                  : new Date(String(aiRow.paymentDate)),
              )
            : null,
        }
      : null,
  };
}
