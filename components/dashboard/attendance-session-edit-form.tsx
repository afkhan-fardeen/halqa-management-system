"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { updateAttendanceSession } from "@/lib/actions/attendance-programs";
import {
  parse24hTo12hParts,
  twelveHourPartsTo24h,
  type Meridiem,
} from "@/lib/attendance/time-12h";
import { TimeRow12h } from "@/components/dashboard/attendance-time-row-12h";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const staffField =
  "h-10 w-full max-w-xs rounded-lg border-0 bg-staff-surface-container-low px-3 text-sm text-staff-on-surface focus:outline-none focus:ring-2 focus:ring-staff-primary/25 dark:bg-slate-800/80";

export function AttendanceSessionEditForm({
  sessionId,
  initialYmd,
  initialStart24,
  initialEnd24,
}: {
  sessionId: string;
  initialYmd: string;
  initialStart24: string;
  initialEnd24: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sessionYmd, setSessionYmd] = useState(initialYmd);

  const s0 = useMemo(() => parse24hTo12hParts(initialStart24), [initialStart24]);
  const e0 = useMemo(() => parse24hTo12hParts(initialEnd24), [initialEnd24]);

  const [startH, setStartH] = useState(s0.hour12);
  const [startM, setStartM] = useState(s0.minute);
  const [startAp, setStartAp] = useState<Meridiem>(s0.meridiem);
  const [endH, setEndH] = useState(e0.hour12);
  const [endM, setEndM] = useState(e0.minute);
  const [endAp, setEndAp] = useState<Meridiem>(e0.meridiem);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
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
          const res = await updateAttendanceSession({
            sessionId,
            sessionDateYmd: sessionYmd,
            startTime,
            endTime,
            timezone: "Asia/Bahrain",
          });
          if (res.ok) {
            toast.success("Session updated");
            router.refresh();
          } else {
            toast.error(res.error);
          }
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="es-date">Session date</Label>
          <input
            id="es-date"
            type="date"
            required
            value={sessionYmd}
            onChange={(e) => setSessionYmd(e.target.value)}
            className={staffField}
          />
          <p className="text-xs text-staff-on-surface-variant">
            Calendar day in <strong>Asia/Bahrain</strong>.
          </p>
        </div>
        <TimeRow12h
          idPrefix="es-start"
          label="Start time"
          hour12={startH}
          minute={startM}
          meridiem={startAp}
          onHour={setStartH}
          onMinute={setStartM}
          onMeridiem={setStartAp}
        />
        <TimeRow12h
          idPrefix="es-end"
          label="End time"
          hour12={endH}
          minute={endM}
          meridiem={endAp}
          onHour={setEndH}
          onMinute={setEndM}
          onMeridiem={setEndAp}
        />
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-staff-primary font-bold text-white hover:opacity-90 dark:text-teal-950"
      >
        {pending ? "Saving…" : "Save session changes"}
      </Button>
    </form>
  );
}
