/** 12-hour clock helpers for attendance program UI; storage remains "HH:MM" 24h. */

export type Meridiem = "AM" | "PM";

const BAHRAIN_TZ = "Asia/Bahrain";

/** JS weekday 0=Sun…6=Sat for calendar day `ymd` (YYYY-MM-DD) in Bahrain. */
export function weekdayFromYmdBahrain(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return 0;
  const t = new Date(Date.UTC(y, m - 1, d, 9, 0, 0));
  const wd = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: BAHRAIN_TZ,
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

/** Today’s calendar date YYYY-MM-DD in Bahrain. */
export function todayYmdBahrain(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: BAHRAIN_TZ });
}

export function twelveHourPartsTo24h(parts: {
  hour12: number;
  minute: number;
  meridiem: Meridiem;
}): string {
  const minute = Math.min(59, Math.max(0, Math.floor(parts.minute)));
  const h12 = Math.min(12, Math.max(1, Math.floor(parts.hour12)));
  let h24: number;
  if (parts.meridiem === "AM") {
    h24 = h12 === 12 ? 0 : h12;
  } else {
    h24 = h12 === 12 ? 12 : h12 + 12;
  }
  return `${String(h24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function parse24hTo12hParts(hhmm: string): {
  hour12: number;
  minute: number;
  meridiem: Meridiem;
} {
  const parts = hhmm.trim().split(":");
  const h24 = Number(parts[0]);
  const minute = Math.min(59, Math.max(0, Number(parts[1] ?? 0)));
  if (!Number.isFinite(h24) || h24 < 0 || h24 > 23) {
    return { hour12: 12, minute: 0, meridiem: "PM" };
  }
  if (h24 === 0) {
    return { hour12: 12, minute, meridiem: "AM" };
  }
  if (h24 === 12) {
    return { hour12: 12, minute, meridiem: "PM" };
  }
  if (h24 < 12) {
    return { hour12: h24, minute, meridiem: "AM" };
  }
  return { hour12: h24 - 12, minute, meridiem: "PM" };
}

/** "19:00" / "20:30" → "7:00 PM – 8:30 PM" */
export function formatTimeRange12hFrom24hStrings(
  startHHMM: string,
  endHHMM: string,
): string {
  const a = parse24hTo12hParts(startHHMM);
  const b = parse24hTo12hParts(endHHMM);
  const fmt = (p: ReturnType<typeof parse24hTo12hParts>) =>
    `${p.hour12}:${String(p.minute).padStart(2, "0")} ${p.meridiem}`;
  return `${fmt(a)} – ${fmt(b)}`;
}

/** "HH:MM" 24h wall clock in Asia/Bahrain for an instant. */
export function formatTimeHHMMBahrain(d: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: BAHRAIN_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/** Format session wall-clock range in Bahrain (12-hour). */
export function formatSessionRangeBahrain12h(startsAt: Date, endsAt: Date): string {
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: BAHRAIN_TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  return `${startsAt.toLocaleString("en-US", opts)} – ${endsAt.toLocaleString("en-US", opts)}`;
}
