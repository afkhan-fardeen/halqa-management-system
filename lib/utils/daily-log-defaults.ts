const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;

export type SalahState = Record<(typeof PRAYERS)[number], string>;

const MALE_DEFAULT = {
  fajr: "BA_JAMAAT",
  dhuhr: "BA_JAMAAT",
  asr: "BA_JAMAAT",
  maghrib: "BA_JAMAAT",
  isha: "BA_JAMAAT",
} as const;

const FEMALE_DEFAULT = {
  fajr: "ON_TIME",
  dhuhr: "ON_TIME",
  asr: "ON_TIME",
  maghrib: "ON_TIME",
  isha: "ON_TIME",
} as const;

export function defaultSalahForGender(
  genderUnit: "MALE" | "FEMALE",
): SalahState {
  return genderUnit === "MALE"
    ? { ...MALE_DEFAULT }
    : { ...FEMALE_DEFAULT };
}

/** Unsaved Salah in the form: no option selected until the member chooses. */
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

/** Normalize localStorage drafts: drop old “all default” pre-fills; keep only valid enum picks. */
export function normalizeUnsavedSalahFromDraft(
  salah: SalahState | undefined,
  genderUnit: "MALE" | "FEMALE",
): SalahState {
  if (!salah) return emptySalah();
  const def = defaultSalahForGender(genderUnit);
  const keys = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
  if (keys.every((k) => salah[k] === def[k])) return emptySalah();
  const valid = genderUnit === "MALE" ? MALE_SET : FEMALE_SET;
  return {
    fajr: salah.fajr && valid.has(salah.fajr) ? salah.fajr : "",
    dhuhr: salah.dhuhr && valid.has(salah.dhuhr) ? salah.dhuhr : "",
    asr: salah.asr && valid.has(salah.asr) ? salah.asr : "",
    maghrib: salah.maghrib && valid.has(salah.maghrib) ? salah.maghrib : "",
    isha: salah.isha && valid.has(salah.isha) ? salah.isha : "",
  };
}
