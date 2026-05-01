"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { QURAN_SURAH_PLACEHOLDER } from "@/lib/constants/daily-log";
import { refreshDailyUnitStats } from "@/lib/db/refresh-daily-unit-stats";
import { db } from "@/lib/db";
import { dailyLogs } from "@/lib/db/schema";
import { placeholderSalahForDb } from "@/lib/utils/daily-log-defaults";
import { parseYmdToUtcDate, todayYmdLocal } from "@/lib/utils/date";
import { buildSaveDailyLogSectionSchema } from "@/lib/validations/daily-log";

export type DailyLogActionState = { error?: string; success?: boolean };

function dateFromYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function todayCalendarDate(): Date {
  return parseYmdToUtcDate(todayYmdLocal());
}

type LogRow = typeof dailyLogs.$inferSelect;
type PrayerCol = LogRow["fajr"];
type QuranTypeCol = LogRow["quranType"];

function basePlaceholderRow(userId: string, logDate: Date) {
  const salah = placeholderSalahForDb();
  return {
    userId,
    date: logDate,
    fajr: salah.fajr,
    dhuhr: salah.dhuhr,
    asr: salah.asr,
    maghrib: salah.maghrib,
    isha: salah.isha,
    quranType: "TILAWAT" as QuranTypeCol,
    quranSurah: QURAN_SURAH_PLACEHOLDER,
    quranPages: 0,
    hadith: false,
    literature: false,
    salatSaved: false,
    quranSaved: false,
    hadithSaved: false,
  };
}

function rowToMerge(existing: LogRow) {
  return {
    userId: existing.userId,
    date: existing.date,
    fajr: existing.fajr,
    dhuhr: existing.dhuhr,
    asr: existing.asr,
    maghrib: existing.maghrib,
    isha: existing.isha,
    quranType: existing.quranType,
    quranSurah: existing.quranSurah,
    quranPages: existing.quranPages,
    hadith: existing.hadith,
    literature: existing.literature,
    salatSaved: existing.salatSaved,
    quranSaved: existing.quranSaved,
    hadithSaved: existing.hadithSaved,
  };
}

export async function saveDailyLogSection(
  data: unknown,
): Promise<DailyLogActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "MEMBER") {
    return { error: "Only members can submit daily logs." };
  }
  if (session.user.status !== "ACTIVE") {
    return { error: "Your account is not active." };
  }

  const genderUnit = session.user.genderUnit;
  const schema = buildSaveDailyLogSectionSchema(genderUnit);
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Invalid data." };
  }

  const logDate = dateFromYmd(parsed.data.date);
  const today = todayCalendarDate();
  if (logDate.getTime() > today.getTime()) {
    return { error: "You cannot submit for a future date." };
  }

  const userId = session.user.id;
  const halqa = session.user.halqa;

  try {
    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(dailyLogs)
        .where(and(eq(dailyLogs.userId, userId), eq(dailyLogs.date, logDate)))
        .limit(1);

      const base = existing
        ? rowToMerge(existing)
        : basePlaceholderRow(userId, logDate);

      let merged = { ...base };

      if (parsed.data.section === "salah") {
        const s = parsed.data.salah;
        merged = {
          ...merged,
          fajr: s.fajr,
          dhuhr: s.dhuhr,
          asr: s.asr,
          maghrib: s.maghrib,
          isha: s.isha,
          salatSaved: true,
        };
      } else if (parsed.data.section === "quran") {
        const q = parsed.data.quran;
        merged = {
          ...merged,
          quranType: q.quranType,
          quranSurah: q.quranSurah.trim(),
          quranPages: q.quranPages,
          quranSaved: true,
        };
      } else {
        const hl = parsed.data.hadithLiterature;
        merged = {
          ...merged,
          hadith: hl.hadithRead,
          literature: hl.literatureRead,
          hadithSaved: true,
        };
      }

      if (existing) {
        await tx
          .update(dailyLogs)
          .set({
            fajr: merged.fajr as PrayerCol,
            dhuhr: merged.dhuhr as PrayerCol,
            asr: merged.asr as PrayerCol,
            maghrib: merged.maghrib as PrayerCol,
            isha: merged.isha as PrayerCol,
            quranType: merged.quranType as QuranTypeCol,
            quranSurah: merged.quranSurah,
            quranPages: merged.quranPages,
            hadith: merged.hadith,
            literature: merged.literature,
            salatSaved: merged.salatSaved,
            quranSaved: merged.quranSaved,
            hadithSaved: merged.hadithSaved,
            updatedAt: new Date(),
          })
          .where(eq(dailyLogs.id, existing.id));
      } else {
        await tx.insert(dailyLogs).values({
          id: crypto.randomUUID(),
          userId: merged.userId,
          date: merged.date,
          fajr: merged.fajr as PrayerCol,
          dhuhr: merged.dhuhr as PrayerCol,
          asr: merged.asr as PrayerCol,
          maghrib: merged.maghrib as PrayerCol,
          isha: merged.isha as PrayerCol,
          quranType: merged.quranType as QuranTypeCol,
          quranSurah: merged.quranSurah,
          quranPages: merged.quranPages,
          hadith: merged.hadith,
          literature: merged.literature,
          salatSaved: merged.salatSaved,
          quranSaved: merged.quranSaved,
          hadithSaved: merged.hadithSaved,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      await refreshDailyUnitStats(tx, logDate, halqa, genderUnit);
    });
  } catch (e) {
    console.error(e);
    return { error: "Could not save your report. Please try again." };
  }

  revalidatePath("/");
  revalidatePath("/submit");
  revalidatePath("/history");
  return { success: true };
}
