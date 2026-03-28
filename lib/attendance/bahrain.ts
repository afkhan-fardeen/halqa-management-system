/** Bahrain is UTC+3 year-round (no DST). */
const BAHRAIN_OFFSET_HOURS = 3;

/**
 * Calendar date (YYYY-MM-DD) + local time HH:MM in Asia/Bahrain → UTC `Date`.
 */
export function bahrainLocalToUtc(
  year: number,
  monthIndex0: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  const utcMs = Date.UTC(year, monthIndex0, day, hour - BAHRAIN_OFFSET_HOURS, minute, 0);
  return new Date(utcMs);
}

/** Parse "HH:MM" or "HH:MM:SS" → { hour, minute } */
export function parseTimeHHMM(s: string): { hour: number; minute: number } {
  const parts = s.trim().split(":");
  const hour = Number(parts[0]);
  const minute = Number(parts[1] ?? 0);
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error("Invalid time format");
  }
  return { hour, minute };
}
