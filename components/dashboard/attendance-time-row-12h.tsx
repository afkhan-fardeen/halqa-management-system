"use client";

import { Label } from "@/components/ui/label";
import type { Meridiem } from "@/lib/attendance/time-12h";

const HOURS_12 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export function TimeRow12h({
  idPrefix,
  label,
  hour12,
  minute,
  meridiem,
  onHour,
  onMinute,
  onMeridiem,
}: {
  idPrefix: string;
  label: string;
  hour12: number;
  minute: number;
  meridiem: Meridiem;
  onHour: (v: number) => void;
  onMinute: (v: number) => void;
  onMeridiem: (v: Meridiem) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-2">
        <select
          id={`${idPrefix}-hour`}
          value={hour12}
          onChange={(e) => onHour(Number(e.target.value))}
          className="h-10 rounded-lg border-0 bg-staff-surface-container-low px-2 text-sm text-staff-on-surface focus:outline-none focus:ring-2 focus:ring-staff-primary/25 dark:bg-slate-800/80"
          aria-label={`${label} hour`}
        >
          {HOURS_12.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="text-muted-foreground text-sm">:</span>
        <select
          id={`${idPrefix}-min`}
          value={minute}
          onChange={(e) => onMinute(Number(e.target.value))}
          className="h-10 rounded-lg border-0 bg-staff-surface-container-low px-2 text-sm text-staff-on-surface focus:outline-none focus:ring-2 focus:ring-staff-primary/25 dark:bg-slate-800/80"
          aria-label={`${label} minute`}
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {String(m).padStart(2, "0")}
            </option>
          ))}
        </select>
        <select
          id={`${idPrefix}-ap`}
          value={meridiem}
          onChange={(e) => onMeridiem(e.target.value as Meridiem)}
          className="h-10 rounded-lg border-0 bg-staff-surface-container-low px-2 text-sm text-staff-on-surface focus:outline-none focus:ring-2 focus:ring-staff-primary/25 dark:bg-slate-800/80"
          aria-label={`${label} AM or PM`}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}
