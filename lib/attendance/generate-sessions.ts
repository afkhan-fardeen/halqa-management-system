import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { attendancePrograms, attendanceSessions } from "@/lib/db/schema";
import { bahrainLocalToUtc, parseTimeHHMM } from "@/lib/attendance/bahrain";

/** Weeks of materialized sessions to maintain ahead. */
export const SESSION_WEEKS_AHEAD = 8;

function todayBahrainYmd(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bahrain" });
}

/** Add calendar days to a YYYY-MM-DD string in Asia/Bahrain. */
function addBahrainDays(ymd: string, add: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const noonBahrainUtc = Date.UTC(y, m - 1, d + add, 9, 0, 0);
  return new Date(noonBahrainUtc).toLocaleDateString("en-CA", {
    timeZone: "Asia/Bahrain",
  });
}

/** Weekday 0–6 Sun–Sat for that calendar day in Bahrain. */
function weekdayBahrainYmd(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d, 9, 0, 0));
  const wd = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "Asia/Bahrain",
  }).format(t);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[wd] ?? 0;
}

export async function materializeSessionsForProgram(
  programId: string,
  weeksAhead = SESSION_WEEKS_AHEAD,
): Promise<number> {
  const [program] = await db
    .select()
    .from(attendancePrograms)
    .where(eq(attendancePrograms.id, programId))
    .limit(1);

  if (!program || !program.isActive) {
    return 0;
  }

  const startH = parseTimeHHMM(program.startTime);
  const endH = parseTimeHHMM(program.endTime);

  const startYmd = todayBahrainYmd();
  const maxDays = weeksAhead * 7;

  let inserted = 0;
  for (let i = 0; i < maxDays; i++) {
    const ymd = addBahrainDays(startYmd, i);
    if (weekdayBahrainYmd(ymd) !== program.weekday) continue;

    const [y, mo, day] = ymd.split("-").map(Number);
    const startsAt = bahrainLocalToUtc(y, mo - 1, day, startH.hour, startH.minute);
    let endsAt = bahrainLocalToUtc(y, mo - 1, day, endH.hour, endH.minute);
    if (endsAt.getTime() <= startsAt.getTime()) {
      endsAt = new Date(endsAt.getTime() + 24 * 60 * 60 * 1000);
    }

    const sessionDate = new Date(Date.UTC(y, mo - 1, day, 12, 0, 0));

    try {
      await db.insert(attendanceSessions).values({
        programId,
        sessionDate,
        startsAt,
        endsAt,
      });
      inserted += 1;
    } catch {
      /* unique violation — already exists */
    }
  }

  return inserted;
}

/** Regenerate sessions for all active programs (e.g. nightly maintenance). */
export async function materializeAllActivePrograms(): Promise<number> {
  const programs = await db
    .select({ id: attendancePrograms.id })
    .from(attendancePrograms)
    .where(eq(attendancePrograms.isActive, true));

  let total = 0;
  for (const p of programs) {
    total += await materializeSessionsForProgram(p.id);
  }
  return total;
}
