export function attendanceKindLabel(kind: "DAWATI" | "TARBIYATI"): string {
  return kind === "DAWATI" ? "Dawati dars" : "Tarbiyati class";
}

export function attendanceProgramDisplayTitle(program: {
  kind: "DAWATI" | "TARBIYATI";
  title: string | null;
}): string {
  const base = attendanceKindLabel(program.kind);
  if (program.title?.trim()) {
    return `${base} — ${program.title.trim()}`;
  }
  return base;
}
