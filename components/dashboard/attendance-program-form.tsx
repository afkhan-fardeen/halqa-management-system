"use client";

import { useMemo, useState, useTransition } from "react";
import {
  deactivateAttendanceProgram,
  regenerateAttendanceSessions,
  upsertAttendanceProgram,
} from "@/lib/actions/attendance-programs";
import {
  parse24hTo12hParts,
  todayYmdBahrain,
  twelveHourPartsTo24h,
  weekdayFromYmdBahrain,
  type Meridiem,
} from "@/lib/attendance/time-12h";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { HALQA_OPTIONS, type Halqa } from "@/lib/constants/halqas";
import { toast } from "sonner";

const KINDS = [
  { value: "DAWATI", label: "Dawati dars" },
  { value: "TARBIYATI", label: "Tarbiyati class" },
] as const;

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const HOURS_12 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function TimeRow12h({
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
          className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 rounded-md border px-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
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
          className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 rounded-md border px-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
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
          className="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 rounded-md border px-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          aria-label={`${label} AM or PM`}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}

export function AttendanceProgramForm({
  isAdmin,
  defaultHalqa,
  defaultGenderUnit,
}: {
  isAdmin: boolean;
  defaultHalqa: string;
  defaultGenderUnit: string;
}) {
  const [pending, startTransition] = useTransition();
  const [halqa, setHalqa] = useState("");
  const [genderUnit, setGenderUnit] = useState("");
  const [kind, setKind] = useState<"DAWATI" | "TARBIYATI">("DAWATI");
  const [title, setTitle] = useState("");

  const initialDate = useMemo(() => todayYmdBahrain(), []);
  const [referenceYmd, setReferenceYmd] = useState(initialDate);

  const s0 = useMemo(() => parse24hTo12hParts("19:00"), []);
  const e0 = useMemo(() => parse24hTo12hParts("20:30"), []);
  const [startH, setStartH] = useState(s0.hour12);
  const [startM, setStartM] = useState(s0.minute);
  const [startAp, setStartAp] = useState<Meridiem>(s0.meridiem);
  const [endH, setEndH] = useState(e0.hour12);
  const [endM, setEndM] = useState(e0.minute);
  const [endAp, setEndAp] = useState<Meridiem>(e0.meridiem);

  const weekday = weekdayFromYmdBahrain(referenceYmd);
  const weekdayLabel = WEEKDAY_NAMES[weekday] ?? "—";

  const effectiveHalqa = (isAdmin ? halqa : defaultHalqa) as Halqa | "";
  const effectiveGender = (isAdmin ? genderUnit : defaultGenderUnit) as
    | "MALE"
    | "FEMALE"
    | "";

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!effectiveHalqa || !effectiveGender) {
          toast.error("Select halqa and gender");
          return;
        }
        const startTime = twelveHourPartsTo24h({
          hour12: startH,
          minute: startM,
          meridiem: startAp,
        });
        const endTime = twelveHourPartsTo24h({
          hour12: endH,
          minute: endM,
          meridiem: endAp,
        });
        startTransition(async () => {
          const res = await upsertAttendanceProgram({
            halqa: effectiveHalqa as Halqa,
            genderUnit: effectiveGender,
            kind,
            title: title.trim() || null,
            weekday,
            startTime,
            endTime,
            timezone: "Asia/Bahrain",
          });
          if (res.ok) {
            toast.success("Program saved", {
              description: "Upcoming sessions were updated.",
            });
          } else {
            toast.error(res.error);
          }
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {isAdmin ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="ap-halqa">Halqa</Label>
              <select
                id="ap-halqa"
                required
                value={halqa}
                onChange={(e) => setHalqa(e.target.value)}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <option value="">Select halqa</option>
                {HALQA_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ap-gender">Gender unit</Label>
              <select
                id="ap-gender"
                required
                value={genderUnit}
                onChange={(e) => setGenderUnit(e.target.value)}
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-sm sm:col-span-2">
            Program applies to your halqa ({defaultHalqa}) and gender unit ({defaultGenderUnit}).
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="ap-kind">Kind</Label>
          <select
            id="ap-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ap-title">Optional title</Label>
          <input
            id="ap-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            placeholder="e.g. Main hall"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="ap-repeat-date">Repeats every week on</Label>
          <input
            id="ap-repeat-date"
            type="date"
            required
            value={referenceYmd}
            onChange={(e) => setReferenceYmd(e.target.value)}
            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 max-w-xs rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          />
          <p className="text-muted-foreground text-xs">
            Calendar day in <strong>Asia/Bahrain</strong>. We use this day’s weekday (
            <strong>{weekdayLabel}</strong>) for the recurring schedule.
          </p>
        </div>

        <TimeRow12h
          idPrefix="ap-start"
          label="Start time"
          hour12={startH}
          minute={startM}
          meridiem={startAp}
          onHour={setStartH}
          onMinute={setStartM}
          onMeridiem={setStartAp}
        />
        <TimeRow12h
          idPrefix="ap-end"
          label="End time"
          hour12={endH}
          minute={endM}
          meridiem={endAp}
          onHour={setEndH}
          onMinute={setEndM}
          onMeridiem={setEndAp}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save program"}
      </Button>
    </form>
  );
}

export function AttendanceProgramRowActions({
  programId,
}: {
  programId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const r = await regenerateAttendanceSessions(programId);
            if (r.ok) {
              toast.success("Sessions refreshed", {
                description: `Inserted ${r.inserted} new session slot(s) if needed.`,
              });
            } else {
              toast.error(r.error);
            }
          });
        }}
      >
        Refresh sessions
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (!confirm("Deactivate this program? New members will not see new sessions.")) {
            return;
          }
          startTransition(async () => {
            const r = await deactivateAttendanceProgram(programId);
            if (r.ok) {
              toast.success("Program deactivated");
            } else {
              toast.error(r.error);
            }
          });
        }}
      >
        Deactivate
      </Button>
    </div>
  );
}
