import type { PrayerStatusTotals } from "@/lib/queries/member-monthly-report";

export type PrayerDisplayRow = {
  key: keyof PrayerStatusTotals;
  label: string;
  icon: string;
  iconBg: string;
  pieColor: string;
  pieName: string;
  value: number;
};

const PRAYER_DEF: Record<
  keyof PrayerStatusTotals,
  Omit<PrayerDisplayRow, "value"> & { pieName: string }
> = {
  BA_JAMAAT: {
    key: "BA_JAMAAT",
    label: "Ba jamaat (total)",
    icon: "groups",
    iconBg:
      "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300",
    pieColor: "#059669",
    pieName: "Ba jamaat",
  },
  MUNFARID: {
    key: "MUNFARID",
    label: "Munfarid (total)",
    icon: "person",
    iconBg:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    pieColor: "#2563eb",
    pieName: "Munfarid",
  },
  QAZA: {
    key: "QAZA",
    label: "Qaza (total)",
    icon: "event_busy",
    iconBg: "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-300",
    pieColor: "#dc2626",
    pieName: "Qaza",
  },
  ON_TIME: {
    key: "ON_TIME",
    label: "On time (total)",
    icon: "schedule",
    iconBg:
      "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    pieColor: "#d97706",
    pieName: "On time",
  },
};

/** Male: Ba jamaat / Munfarid / Qaza — Female: On time / Munfarid / Qaza (see schema prayer rules). */
export function prayerRowsForGender(
  totals: PrayerStatusTotals,
  genderUnit: string,
): PrayerDisplayRow[] {
  const g = genderUnit === "FEMALE" ? "FEMALE" : "MALE";
  const keys = (Object.keys(PRAYER_DEF) as (keyof PrayerStatusTotals)[]).filter(
    (k) => {
      if (g === "MALE" && k === "ON_TIME") return false;
      if (g === "FEMALE" && k === "BA_JAMAAT") return false;
      return true;
    },
  );
  return keys.map((key) => {
    const d = PRAYER_DEF[key];
    return {
      ...d,
      value: totals[key],
    };
  });
}

export function prayerPieFromRows(rows: PrayerDisplayRow[]) {
  return rows
    .filter((r) => r.value > 0)
    .map((r) => ({ name: r.pieName, value: r.value, fill: r.pieColor }));
}
