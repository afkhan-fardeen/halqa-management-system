"use client";

import { useMemo, useState, useTransition } from "react";
import { createAttendanceSession } from "@/lib/actions/attendance-programs";
import {
  parse24hTo12hParts,
  todayYmdBahrain,
  twelveHourPartsTo24h,
  type Meridiem,
} from "@/lib/attendance/time-12h";
import { TimeRow12h } from "@/components/dashboard/attendance-time-row-12h";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export type AttendanceProgramOption = {
  id: string;
  label: string;
};

export function AttendanceAddSessionForm({
  programs,
}: {
  programs: AttendanceProgramOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [programId, setProgramId] = useState("");
  const [sessionYmd, setSessionYmd] = useState(() => todayYmdBahrain());

  const s0 = useMemo(() => parse24hTo12hParts("19:00"), []);
  const e0 = useMemo(() => parse24hTo12hParts("20:30"), []);
  const [startH, setStartH] = useState(s0.hour12);
  const [startM, setStartM] = useState(s0.minute);
  const [startAp, setStartAp] = useState<Meridiem>(s0.meridiem);
  const [endH, setEndH] = useState(e0.hour12);
  const [endM, setEndM] = useState(e0.minute);
  const [endAp, setEndAp] = useState<Meridiem>(e0.meridiem);

  if (programs.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Save a program first, then you can add sessions on any date.
      </p>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!programId) {
          toast.error("Choose a program");
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
          const res = await createAttendanceSession({
            programId,
            sessionDateYmd: sessionYmd,
            startTime,
            endTime,
            timezone: "Asia/Bahrain",
          });
          if (res.ok) {
            toast.success("Session added");
          } else {
            toast.error(res.error);
          }
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="as-program">Program</Label>
          <select
            id="as-program"
            required
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full max-w-md rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <option value="">Select program</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="as-date">Session date</Label>
          <input
            id="as-date"
            type="date"
            required
            value={sessionYmd}
            onChange={(e) => setSessionYmd(e.target.value)}
            className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 max-w-xs rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          />
          <p className="text-muted-foreground text-xs">
            Calendar day in <strong>Asia/Bahrain</strong> for this class.
          </p>
        </div>
        <TimeRow12h
          idPrefix="as-start"
          label="Start time"
          hour12={startH}
          minute={startM}
          meridiem={startAp}
          onHour={setStartH}
          onMinute={setStartM}
          onMeridiem={setStartAp}
        />
        <TimeRow12h
          idPrefix="as-end"
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
        {pending ? "Adding…" : "Add session"}
      </Button>
    </form>
  );
}
