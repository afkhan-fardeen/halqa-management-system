/**
 * Format a date in the Islamic (Hijri) calendar for display.
 * Uses Intl when the runtime supports islamic-umalqura or islamic calendars.
 */
export function formatHijriDateLine(date: Date): string {
  const tryFormat = (calendar: "islamic-umalqura" | "islamic") => {
    try {
      return new Intl.DateTimeFormat("en", {
        calendar,
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
    } catch {
      return "";
    }
  };

  const umalqura = tryFormat("islamic-umalqura");
  if (umalqura) return umalqura;

  const islamic = tryFormat("islamic");
  if (islamic) return islamic;

  try {
    return new Intl.DateTimeFormat("en-SA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

/** Non-empty label for UI when no Hijri formatter is available (never silent blank). */
export const HIJRI_DATE_FALLBACK = "Hijri date unavailable";
