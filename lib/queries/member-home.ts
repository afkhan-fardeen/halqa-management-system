import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { aiyanat, contacts, dailyLogs } from "@/lib/db/schema";
import { isUndefinedColumnError } from "@/lib/utils/pg-error";
import { parseYmdToUtcDate, todayYmdLocal } from "@/lib/utils/date";
import { prayerStatusToChip, type PrayerChip } from "@/lib/utils/prayer-display";

function localYmdDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type MemberHomeDashboard = {
  submittedToday: boolean;
  yesterdayPrayers: { name: string; chip: PrayerChip }[] | null;
  weekQuranPages: number;
  weekContacts: { total: number; muslim: number; nonMuslim: number };
  currentAiyanat: {
    month: string;
    amount: string;
    status: "PAID" | "NOT_PAID";
    paymentDateYmd: string | null;
  } | null;
};

export async function getMemberHomeDashboard(
  userId: string,
): Promise<MemberHomeDashboard> {
  const todayYmd = todayYmdLocal();
  const todayUtc = parseYmdToUtcDate(todayYmd);

  const yesterdayYmd = localYmdDaysAgo(1);
  const yesterdayUtc = parseYmdToUtcDate(yesterdayYmd);

  const [yLog] = await db
    .select({
      fajr: dailyLogs.fajr,
      dhuhr: dailyLogs.dhuhr,
      asr: dailyLogs.asr,
      maghrib: dailyLogs.maghrib,
      isha: dailyLogs.isha,
    })
    .from(dailyLogs)
    .where(and(eq(dailyLogs.userId, userId), eq(dailyLogs.date, yesterdayUtc)))
    .limit(1);

  const yesterdayPrayers: MemberHomeDashboard["yesterdayPrayers"] = yLog
    ? [
        { name: "Fajr", chip: prayerStatusToChip(yLog.fajr) },
        { name: "Dhuhr", chip: prayerStatusToChip(yLog.dhuhr) },
        { name: "Asr", chip: prayerStatusToChip(yLog.asr) },
        { name: "Maghrib", chip: prayerStatusToChip(yLog.maghrib) },
        { name: "Isha", chip: prayerStatusToChip(yLog.isha) },
      ]
    : null;

  const rangeStart = parseYmdToUtcDate(localYmdDaysAgo(6));
  const rangeEnd = parseYmdToUtcDate(todayYmd);

  let weekQuranPages = 0;
  try {
    const [sumRow] = await db
      .select({
        n: sql<number>`coalesce(sum(case when ${dailyLogs.quranSaved} then ${dailyLogs.quranPages} else 0 end), 0)::int`,
      })
      .from(dailyLogs)
      .where(
        and(
          eq(dailyLogs.userId, userId),
          gte(dailyLogs.date, rangeStart),
          lte(dailyLogs.date, rangeEnd),
        ),
      );
    weekQuranPages = sumRow?.n ?? 0;
  } catch (e) {
    if (!isUndefinedColumnError(e)) throw e;
    const [sumRow] = await db
      .select({
        n: sql<number>`coalesce(sum(${dailyLogs.quranPages}), 0)::int`,
      })
      .from(dailyLogs)
      .where(
        and(
          eq(dailyLogs.userId, userId),
          gte(dailyLogs.date, rangeStart),
          lte(dailyLogs.date, rangeEnd),
        ),
      );
    weekQuranPages = sumRow?.n ?? 0;
  }

  const [muslimRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(contacts)
    .where(
      and(
        eq(contacts.userId, userId),
        eq(contacts.status, "MUSLIM"),
        gte(contacts.logDate, rangeStart),
        lte(contacts.logDate, rangeEnd),
      ),
    );
  const [nonRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(contacts)
    .where(
      and(
        eq(contacts.userId, userId),
        eq(contacts.status, "NON_MUSLIM"),
        gte(contacts.logDate, rangeStart),
        lte(contacts.logDate, rangeEnd),
      ),
    );
  const muslim = muslimRow?.n ?? 0;
  const nonMuslim = nonRow?.n ?? 0;

  const monthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const [aiy] = await db
    .select({
      id: aiyanat.id,
      month: aiyanat.month,
      amount: aiyanat.amount,
      status: aiyanat.status,
      paymentDate: aiyanat.paymentDate,
    })
    .from(aiyanat)
    .where(and(eq(aiyanat.userId, userId), eq(aiyanat.month, monthStr)))
    .limit(1);

  let submittedToday = false;
  try {
    const [todayLog] = await db
      .select({
        salatSaved: dailyLogs.salatSaved,
        quranSaved: dailyLogs.quranSaved,
        hadithSaved: dailyLogs.hadithSaved,
      })
      .from(dailyLogs)
      .where(and(eq(dailyLogs.userId, userId), eq(dailyLogs.date, todayUtc)))
      .limit(1);
    submittedToday = Boolean(
      todayLog?.salatSaved &&
        todayLog?.quranSaved &&
        todayLog?.hadithSaved,
    );
  } catch (e) {
    if (!isUndefinedColumnError(e)) throw e;
    const [row] = await db
      .select({ id: dailyLogs.id })
      .from(dailyLogs)
      .where(and(eq(dailyLogs.userId, userId), eq(dailyLogs.date, todayUtc)))
      .limit(1);
    submittedToday = Boolean(row);
  }

  let currentAiyanat: MemberHomeDashboard["currentAiyanat"] = null;
  if (aiy) {
    const pd =
      aiy.paymentDate instanceof Date
        ? `${aiy.paymentDate.getFullYear()}-${String(aiy.paymentDate.getMonth() + 1).padStart(2, "0")}-${String(aiy.paymentDate.getDate()).padStart(2, "0")}`
        : null;
    currentAiyanat = {
      month: aiy.month,
      amount: String(aiy.amount),
      status: aiy.status,
      paymentDateYmd: pd,
    };
  }

  return {
    submittedToday,
    yesterdayPrayers,
    weekQuranPages,
    weekContacts: { total: muslim + nonMuslim, muslim, nonMuslim },
    currentAiyanat,
  };
}
