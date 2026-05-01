/** Calendar date as YYYY-MM-DD (UTC components). */
export function formatYmdUtc(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseYmdToUtcDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function todayYmdLocal(): string {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, "0");
  const d = String(n.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Calendar YYYY-MM-DD in Asia/Bahrain (no DST). Use for cron alignment with local prayer day. */
export function todayYmdBahrain(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bahrain",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

/** `YYYY-MM` calendar month to inclusive UTC date range (matches `daily_logs.date` storage). */
export function monthYyyyMmToRange(ym: string): { fromYmd: string; toYmd: string } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(ym.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return null;
  const fromYmd = `${y}-${String(mo).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const toYmd = `${y}-${String(mo).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { fromYmd, toYmd };
}

/** Shift `YYYY-MM` by `delta` calendar months (e.g. -1 = previous month). */
export function addMonthsYm(ym: string, delta: number): string {
  const m = /^(\d{4})-(\d{2})$/.exec(ym.trim());
  if (!m) {
    const now = new Date();
    let y = now.getFullYear();
    let mo = now.getMonth() + 1 + delta;
    while (mo > 12) {
      mo -= 12;
      y += 1;
    }
    while (mo < 1) {
      mo += 12;
      y -= 1;
    }
    return `${y}-${String(mo).padStart(2, "0")}`;
  }
  let y = Number(m[1]);
  let mo = Number(m[2]) + delta;
  while (mo > 12) {
    mo -= 12;
    y += 1;
  }
  while (mo < 1) {
    mo += 12;
    y -= 1;
  }
  return `${y}-${String(mo).padStart(2, "0")}`;
}

/** Today as `YYYY-MM` in the user’s local calendar. */
export function currentYmLocal(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}`;
}

/** Every `YYYY-MM` from `minYm` through `maxYm` inclusive (lexicographic order). */
export function enumerateYmInclusive(minYm: string, maxYm: string): string[] {
  if (minYm > maxYm) return [maxYm];
  const out: string[] = [];
  let ym = minYm;
  for (let i = 0; i < 2400 && ym <= maxYm; i++) {
    out.push(ym);
    ym = addMonthsYm(ym, 1);
  }
  return out;
}

/** Iterate each YYYY-MM-DD from `fromYmd` through `toYmd` (inclusive), UTC. */
export function eachYmdInRangeUtc(fromYmd: string, toYmd: string): string[] {
  const out: string[] = [];
  let d = parseYmdToUtcDate(fromYmd);
  const end = parseYmdToUtcDate(toYmd);
  while (d.getTime() <= end.getTime()) {
    out.push(formatYmdUtc(d));
    d = new Date(d.getTime() + 86400000);
  }
  return out;
}
