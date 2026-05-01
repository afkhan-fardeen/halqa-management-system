import { and, desc, eq, sql } from "drizzle-orm";
import { auth } from "@/auth";
import { QURAN_SURAH_PLACEHOLDER } from "@/lib/constants/daily-log";
import { db } from "@/lib/db";
import { contacts, dailyLogs } from "@/lib/db/schema";
import { emptySalah } from "@/lib/utils/daily-log-defaults";
import { isUndefinedColumnError } from "@/lib/utils/pg-error";
import {
  parseYmdToUtcDate,
  formatYmdUtc,
  todayYmdLocal,
} from "@/lib/utils/date";

export type DailyLogListItem = {
  id: string;
  date: string;
  quranPages: number;
  hadith: boolean;
  contactCount: number;
  /** Short salah line for history list; null if columns unavailable. */
  prayerSummary: string | null;
};

/** One-line summary for history rows (English). */
export function prayerSummaryLine(
  salatSaved: boolean,
  fajr: string,
  dhuhr: string,
  asr: string,
  maghrib: string,
  isha: string,
): string {
  if (!salatSaved) return "Prayers not saved";
  const keys = [fajr, dhuhr, asr, maghrib, isha];
  const qaza = keys.filter((k) => k === "QAZA").length;
  if (qaza === 0) return "All prayers logged";
  return qaza === 1 ? "1 Qaza" : `${qaza} Qaza`;
}

export type DailyLogForEdit = {
  date: string;
  salatSaved: boolean;
  quranSaved: boolean;
  hadithSaved: boolean;
  salah: {
    fajr: string;
    dhuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
  };
  quran: {
    quranType: "TILAWAT" | "TAFSEER" | "BOTH";
    quranSurah: string;
    quranPages: number;
  };
  hadithLiterature: {
    hadithRead: boolean;
    literatureRead: boolean;
  };
};

export async function getDailyLogForEdit(
  userId: string,
  genderUnit: "MALE" | "FEMALE",
  dateYmd?: string,
): Promise<DailyLogForEdit | null> {
  const ymd = dateYmd ?? undefined;
  if (!ymd) return null;

  const logDate = parseYmdToUtcDate(ymd);

  const [log] = await db
    .select()
    .from(dailyLogs)
    .where(and(eq(dailyLogs.userId, userId), eq(dailyLogs.date, logDate)))
    .limit(1);

  if (!log) return null;

  const salah = log.salatSaved
    ? {
        fajr: log.fajr,
        dhuhr: log.dhuhr,
        asr: log.asr,
        maghrib: log.maghrib,
        isha: log.isha,
      }
    : emptySalah();

  const quran = log.quranSaved
    ? {
        quranType: log.quranType,
        quranSurah: log.quranSurah,
        quranPages: log.quranPages,
      }
    : {
        quranType: "TILAWAT" as const,
        quranSurah: "",
        quranPages: 1,
      };

  const hadithLiterature = log.hadithSaved
    ? {
        hadithRead: log.hadith,
        literatureRead: log.literature,
      }
    : {
        hadithRead: false,
        literatureRead: false,
      };

  return {
    date: ymd,
    salatSaved: log.salatSaved,
    quranSaved: log.quranSaved,
    hadithSaved: log.hadithSaved,
    salah,
    quran,
    hadithLiterature,
  };
}

export async function listDailyLogsForMember(
  userId: string,
  page: number,
  pageSize: number,
): Promise<{ rows: DailyLogListItem[]; total: number }> {
  const offset = (page - 1) * pageSize;

  const [countRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(dailyLogs)
    .where(eq(dailyLogs.userId, userId));
  const total = countRow?.n ?? 0;

  let logs: {
    id: string;
    date: Date;
    quranPages: number;
    hadith: boolean;
    quranSaved?: boolean;
    salatSaved?: boolean;
    fajr?: string;
    dhuhr?: string;
    asr?: string;
    maghrib?: string;
    isha?: string;
  }[];

  try {
    logs = await db
      .select({
        id: dailyLogs.id,
        date: dailyLogs.date,
        quranPages: dailyLogs.quranPages,
        hadith: dailyLogs.hadith,
        quranSaved: dailyLogs.quranSaved,
        salatSaved: dailyLogs.salatSaved,
        fajr: dailyLogs.fajr,
        dhuhr: dailyLogs.dhuhr,
        asr: dailyLogs.asr,
        maghrib: dailyLogs.maghrib,
        isha: dailyLogs.isha,
      })
      .from(dailyLogs)
      .where(eq(dailyLogs.userId, userId))
      .orderBy(desc(dailyLogs.date))
      .limit(pageSize)
      .offset(offset);
  } catch (e) {
    if (!isUndefinedColumnError(e)) throw e;
    logs = await db
      .select({
        id: dailyLogs.id,
        date: dailyLogs.date,
        quranPages: dailyLogs.quranPages,
        hadith: dailyLogs.hadith,
        salatSaved: dailyLogs.salatSaved,
        fajr: dailyLogs.fajr,
        dhuhr: dailyLogs.dhuhr,
        asr: dailyLogs.asr,
        maghrib: dailyLogs.maghrib,
        isha: dailyLogs.isha,
      })
      .from(dailyLogs)
      .where(eq(dailyLogs.userId, userId))
      .orderBy(desc(dailyLogs.date))
      .limit(pageSize)
      .offset(offset);
  }

  const rows: DailyLogListItem[] = [];
  for (const log of logs) {
    const logDate = log.date;
    const [cRow] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(contacts)
      .where(
        and(eq(contacts.userId, userId), eq(contacts.logDate, logDate)),
      );
    const ymd = formatYmdUtc(
      logDate instanceof Date ? logDate : new Date(String(logDate)),
    );
    const prayerSummary =
      log.fajr != null &&
      log.dhuhr != null &&
      log.asr != null &&
      log.maghrib != null &&
      log.isha != null &&
      log.salatSaved != null
        ? prayerSummaryLine(
            log.salatSaved,
            log.fajr,
            log.dhuhr,
            log.asr,
            log.maghrib,
            log.isha,
          )
        : null;

    rows.push({
      id: log.id,
      date: ymd,
      quranPages: log.quranSaved === false ? 0 : log.quranPages,
      hadith: log.hadith,
      contactCount: cRow?.n ?? 0,
      prayerSummary,
    });
  }

  return { rows, total };
}

/** When `salat_saved` columns are missing (migration not applied), treat any row as a full day. */
async function getMemberHomeSummaryLegacy(userId: string, todayUtc: Date) {
  const [todayLog] = await db
    .select({ id: dailyLogs.id })
    .from(dailyLogs)
    .where(and(eq(dailyLogs.userId, userId), eq(dailyLogs.date, todayUtc)))
    .limit(1);

  const submittedToday = Boolean(todayLog);

  let daysSubmittedLast7 = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(todayUtc);
    d.setUTCDate(d.getUTCDate() - i);
    const [row] = await db
      .select({ id: dailyLogs.id })
      .from(dailyLogs)
      .where(and(eq(dailyLogs.userId, userId), eq(dailyLogs.date, d)))
      .limit(1);
    if (row) daysSubmittedLast7 += 1;
  }

  return { submittedToday, daysSubmittedLast7 };
}

export async function getMemberHomeSummary(userId: string) {
  const todayUtc = parseYmdToUtcDate(todayYmdLocal());

  try {
    const [todayLog] = await db
      .select({
        id: dailyLogs.id,
        salatSaved: dailyLogs.salatSaved,
        quranSaved: dailyLogs.quranSaved,
        hadithSaved: dailyLogs.hadithSaved,
      })
      .from(dailyLogs)
      .where(and(eq(dailyLogs.userId, userId), eq(dailyLogs.date, todayUtc)))
      .limit(1);

    const submittedToday = Boolean(
      todayLog?.salatSaved &&
        todayLog?.quranSaved &&
        todayLog?.hadithSaved,
    );

    let daysSubmittedLast7 = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(todayUtc);
      d.setUTCDate(d.getUTCDate() - i);
      const [row] = await db
        .select({
          salatSaved: dailyLogs.salatSaved,
          quranSaved: dailyLogs.quranSaved,
          hadithSaved: dailyLogs.hadithSaved,
        })
        .from(dailyLogs)
        .where(and(eq(dailyLogs.userId, userId), eq(dailyLogs.date, d)))
        .limit(1);
      if (
        row?.salatSaved &&
        row?.quranSaved &&
        row?.hadithSaved
      ) {
        daysSubmittedLast7 += 1;
      }
    }

    return {
      submittedToday,
      daysSubmittedLast7,
    };
  } catch (e) {
    if (!isUndefinedColumnError(e)) throw e;
    return getMemberHomeSummaryLegacy(userId, todayUtc);
  }
}

export async function getCurrentMemberDailyContext() {
  const session = await auth();
  if (!session?.user || session.user.role !== "MEMBER") {
    return null;
  }
  const summary = await getMemberHomeSummary(session.user.id);
  return { userId: session.user.id, ...summary };
}
