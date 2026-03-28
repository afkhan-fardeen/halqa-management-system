"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import {
  getStaffAnnouncementRecipientCount,
  sendStaffAnnouncements,
  type StaffAnnouncementState,
} from "@/lib/actions/staff-announcements";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { HALQA_OPTIONS } from "@/lib/constants/halqas";

const HALQAS = [{ value: "", label: "All halqas" }, ...HALQA_OPTIONS];

const GENDERS = [
  { value: "", label: "All genders" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
] as const;

export function StaffAnnouncementComposeForm({ isAdmin }: { isAdmin: boolean }) {
  const [state, formAction, pending] = useActionState(
    sendStaffAnnouncements,
    null as StaffAnnouncementState | null,
  );
  const [halqa, setHalqa] = useState("");
  const [genderUnit, setGenderUnit] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [countPending, setCountPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setCountPending(true);
    const opts = isAdmin
      ? { halqa: halqa || undefined, genderUnit: genderUnit || undefined }
      : {};
    getStaffAnnouncementRecipientCount(opts)
      .then((r) => {
        if (cancelled) return;
        if ("error" in r) setCount(null);
        else setCount(r.count);
      })
      .finally(() => {
        if (!cancelled) setCountPending(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin, halqa, genderUnit]);

  useEffect(() => {
    if (state?.ok) {
      toast.success("Announcement sent", {
        description: `Delivered to ${state.sent} member${state.sent === 1 ? "" : "s"}.`,
      });
    } else if (state && !state.ok) {
      toast.error("Could not send", { description: state.error });
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      {isAdmin ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="halqa">Halqa (optional)</Label>
            <select
              id="halqa"
              name="halqa"
              value={halqa}
              onChange={(e) => setHalqa(e.target.value)}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {HALQAS.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="genderUnit">Gender (optional)</Label>
            <select
              id="genderUnit"
              name="genderUnit"
              value={genderUnit}
              onChange={(e) => setGenderUnit(e.target.value)}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {GENDERS.map((o) => (
                <option key={o.value || "all-u"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm leading-relaxed">
          Recipients: <strong>active members</strong> in your halqa and gender only.
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          maxLength={4000}
          placeholder="Write the message members will see in their notifications inbox."
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[120px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        />
        <p className="text-muted-foreground text-xs">Up to 4,000 characters. English only.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          {countPending ? (
            "Calculating recipients…"
          ) : count !== null ? (
            <>
              <strong>{count}</strong> member{count === 1 ? "" : "s"} will receive this.
            </>
          ) : (
            "—"
          )}
        </p>
        <div className="flex gap-2">
          <Link
            href="/dashboard/notifications"
            className={buttonVariants({ variant: "outline" })}
          >
            Cancel
          </Link>
          <Button type="submit" disabled={pending || countPending || count === 0}>
            {pending ? "Sending…" : "Send to members"}
          </Button>
        </div>
      </div>
    </form>
  );
}
