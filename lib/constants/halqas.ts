/** Eight halqa units (registration, staff scoping, exports). */
export const HALQA_VALUES = [
  "MANAMA",
  "RIFFA",
  "MUHARRAQ",
  "UMM_AL_HASSAM",
  "ISA_TOWN",
  "SITRA",
  "HAMAD_TOWN",
  "ZALLAQ",
] as const;

export type Halqa = (typeof HALQA_VALUES)[number];

export const HALQA_LABELS: Record<Halqa, string> = {
  MANAMA: "Manama",
  RIFFA: "Riffa",
  MUHARRAQ: "Muharraq",
  UMM_AL_HASSAM: "Umm Al Hassam",
  ISA_TOWN: "Isa Town",
  SITRA: "Sitra",
  HAMAD_TOWN: "Hamad Town",
  ZALLAQ: "Zallaq",
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
