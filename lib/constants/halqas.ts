/** Four halqa units (registration, staff scoping, exports). */
export const HALQA_VALUES = [
  "RIFFA",
  "MANAMA",
  "UMM_AL_HASSAM",
  "MUHARRAQ",
] as const;

export type Halqa = (typeof HALQA_VALUES)[number];

export const HALQA_LABELS: Record<Halqa, string> = {
  RIFFA: "Riffa",
  MANAMA: "Manama",
  UMM_AL_HASSAM: "Um Al Hassam",
  MUHARRAQ: "Muharraq",
};

export const HALQA_OPTIONS = HALQA_VALUES.map((value) => ({
  value,
  label: HALQA_LABELS[value],
}));

/** Human label for emails, notifications, and tables. */
export function formatHalqaLabel(halqa: string): string {
  if (halqa in HALQA_LABELS) return HALQA_LABELS[halqa as Halqa];
  return halqa.replaceAll("_", " ");
}
