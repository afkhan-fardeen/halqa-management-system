"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deactivateAttendanceProgram,
  deleteAttendanceProgram,
  regenerateAttendanceSessions,
  upsertAttendanceProgram,
} from "@/lib/actions/attendance-programs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { HALQA_OPTIONS, type Halqa } from "@/lib/constants/halqas";
import { toast } from "sonner";

const staffControl =
  "h-10 w-full rounded-lg border-0 bg-staff-surface-container-low px-3 text-sm text-staff-on-surface focus:outline-none focus:ring-2 focus:ring-staff-primary/25 dark:bg-slate-800/80";

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
  const router = useRouter();
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
            router.refresh();
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
                className={staffControl}
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
                className={staffControl}
              >
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
          </>
        ) : (
          <p className="text-sm text-staff-on-surface-variant sm:col-span-2">
            Program applies to your halqa ({defaultHalqa}) and gender unit ({defaultGenderUnit}).
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="ap-kind">Kind</Label>
          <select
            id="ap-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
            className={staffControl}
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
            className={staffControl}
            placeholder="e.g. Main hall"
          />
        </div>
      </div>
      <Button
        type="submit"
        disabled={pending}
        className="bg-staff-primary font-bold text-white hover:opacity-90 dark:text-teal-950"
      >
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
  const router = useRouter();
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
                router.refresh();
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
              router.refresh();
            } else {
              toast.error(r.error);
            }
          });
        }}
        title="Stops new sessions; does not delete past sessions"
      >
        Deactivate (archive)
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/40"
        onClick={() => {
          if (
            !confirm(
              "Permanently delete this program and ALL of its sessions and attendance marks? This cannot be undone.",
            )
          ) {
            return;
          }
          startTransition(async () => {
            const r = await deleteAttendanceProgram(programId);
            if (r.ok) {
              toast.success("Program deleted");
              router.refresh();
            } else {
              toast.error(r.error);
            }
          });
        }}
      >
        Delete program
      </Button>
    </div>
  );
}
