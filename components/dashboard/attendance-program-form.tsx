"use client";

import { useState, useTransition } from "react";
import {
  deactivateAttendanceProgram,
  regenerateAttendanceSessions,
  upsertAttendanceProgram,
} from "@/lib/actions/attendance-programs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { HALQA_OPTIONS, type Halqa } from "@/lib/constants/halqas";
import { toast } from "sonner";

const KINDS = [
  { value: "DAWATI", label: "Dawati dars" },
  { value: "TARBIYATI", label: "Tarbiyati class" },
] as const;

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
        startTransition(async () => {
          const res = await upsertAttendanceProgram({
            halqa: effectiveHalqa as Halqa,
            genderUnit: effectiveGender,
            kind,
            title: title.trim() || null,
            timezone: "Asia/Bahrain",
          });
          if (res.ok) {
            toast.success("Program saved", {
              description: "Add dated sessions below when you are ready.",
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
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save program"}
      </Button>
    </form>
  );
}

export function AttendanceProgramRowActions({
  programId,
  showRecurringRefresh,
}: {
  programId: string;
  /** Legacy programs with a weekday + times can still bulk-generate slots. */
  showRecurringRefresh?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {showRecurringRefresh ? (
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
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (
            !confirm(
              "Archive (deactivate) this program? It will stop appearing for new sessions; existing sessions stay until you delete them individually.",
            )
          ) {
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
        title="Stops new sessions; does not delete past sessions"
      >
        Deactivate (archive)
      </Button>
    </div>
  );
}
