/**
 * Bahrain prayer times via Aladhan (free, no key). Used by ehtisaab nudge cron.
 * @see https://aladhan.com/prayer-times-api
 */

/** Bahrain is UTC+3 year-round. */
export function bahrainWallClockToUtcMs(ymd: string, hhmm: string): number {
  const [y, mo, d] = ymd.split("-").map(Number);
  const parts = hhmm.trim().split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1] ?? 0);
  if (!y || !mo || !d || Number.isNaN(h) || Number.isNaN(m)) {
    return NaN;
  }
  return Date.UTC(y, mo - 1, d, h - 3, m, 0);
}

function ymdToAladhanPathDate(ymd: string): string {
  const [y, mo, d] = ymd.split("-").map(Number);
  return `${String(d).padStart(2, "0")}-${String(mo).padStart(2, "0")}-${y}`;
}

export type AladhanTimings = Record<string, string>;

let timingsCache: { ymd: string; timings: AladhanTimings } | null = null;

/** One fetch per process per calendar day (Bahrain ymd). */
export async function getCachedBahrainTimings(
  ymd: string,
): Promise<AladhanTimings> {
  if (timingsCache?.ymd === ymd) return timingsCache.timings;

  const datePath = ymdToAladhanPathDate(ymd);
  const url = `https://api.aladhan.com/v1/timingsByCity/${datePath}?city=Manama&country=Bahrain&method=8`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Aladhan HTTP ${res.status}`);
  }
  const json = (await res.json()) as {
    data?: { timings?: AladhanTimings };
  };
  const timings = json?.data?.timings;
  if (!timings || typeof timings !== "object") {
    throw new Error("Aladhan: missing timings");
  }
  timingsCache = { ymd, timings };
  return timings;
}

export const PRAYER_NUDGE_SLOTS = [
  { slot: "FAJR", aladhanKey: "Fajr", label: "Fajr" },
  { slot: "DHUHR", aladhanKey: "Dhuhr", label: "Dhuhr" },
  { slot: "ASR", aladhanKey: "Asr", label: "Asr" },
  { slot: "MAGHRIB", aladhanKey: "Maghrib", label: "Maghrib" },
  { slot: "ISHA", aladhanKey: "Isha", label: "Isha" },
] as const;

export const MORNING_SLOT = "EHTISAABI_0930";

/** 5-minute delivery window after trigger instant. */
export const NUDGE_WINDOW_MS = 5 * 60 * 1000;

export function parseOffsetMinutes(): number {
  const raw = process.env.PRAYER_NUDGE_OFFSET_MINUTES?.trim();
  const n = raw ? Number(raw) : 27;
  return Number.isFinite(n) && n >= 0 && n <= 120 ? n : 27;
}

export function triggerMsForPrayer(
  ymd: string,
  timings: AladhanTimings,
  aladhanKey: string,
  offsetMinutes: number,
): number {
  const raw = timings[aladhanKey];
  if (!raw || typeof raw !== "string") return NaN;
  const timePart = raw.slice(0, 5).trim();
  const base = bahrainWallClockToUtcMs(ymd, timePart);
  if (Number.isNaN(base)) return NaN;
  return base + offsetMinutes * 60 * 1000;
}

export function triggerMsForMorning0930(ymd: string): number {
  return bahrainWallClockToUtcMs(ymd, "09:30");
}

export function isNowInTriggerWindow(
  nowMs: number,
  triggerMs: number,
  windowMs: number,
): boolean {
  if (Number.isNaN(triggerMs)) return false;
  return nowMs >= triggerMs && nowMs < triggerMs + windowMs;
}
