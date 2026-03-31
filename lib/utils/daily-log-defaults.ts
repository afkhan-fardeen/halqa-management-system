const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;

export type SalahState = Record<(typeof PRAYERS)[number], string>;

/**
 * Values stored in `daily_logs` before the member saves Salah (`salat_saved` false).
 * Same for all genders — not shown in the UI; the client always uses `emptySalah()` until save.
 */
export function placeholderSalahForDb(): SalahState {
  return {
    fajr: "QAZA",
    dhuhr: "QAZA",
    asr: "QAZA",
    maghrib: "QAZA",
    isha: "QAZA",
  };
}

export function emptySalah(): SalahState {
  return {
    fajr: "",
    dhuhr: "",
    asr: "",
    maghrib: "",
    isha: "",
  };
}

const MALE_SET = new Set<string>(["BA_JAMAAT", "MUNFARID", "QAZA"]);
const FEMALE_SET = new Set<string>(["ON_TIME", "QAZA"]);

/** Normalize localStorage drafts: drop old “all Ba jamaat / all On time” pre-fills; keep only valid enum picks. */
export function normalizeUnsavedSalahFromDraft(
  salah: SalahState | undefined,
  genderUnit: "MALE" | "FEMALE",
): SalahState {
  if (!salah) return emptySalah();
  const keys = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
  if (keys.every((k) => salah[k] === "BA_JAMAAT")) return emptySalah();
  if (keys.every((k) => salah[k] === "ON_TIME")) return emptySalah();
  const valid = genderUnit === "MALE" ? MALE_SET : FEMALE_SET;
  return {
    fajr: salah.fajr && valid.has(salah.fajr) ? salah.fajr : "",
    dhuhr: salah.dhuhr && valid.has(salah.dhuhr) ? salah.dhuhr : "",
    asr: salah.asr && valid.has(salah.asr) ? salah.asr : "",
    maghrib: salah.maghrib && valid.has(salah.maghrib) ? salah.maghrib : "",
    isha: salah.isha && valid.has(salah.isha) ? salah.isha : "",
  };
}
