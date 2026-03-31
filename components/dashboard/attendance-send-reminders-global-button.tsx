"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Runs the same logic as the old daily cron: sessions ended in the last 24h, unmarked members only (deduped). */
export function AttendanceSendRemindersGlobalButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const res = await fetch("/api/dashboard/attendance/send-reminders", {
            method: "POST",
          });
          const data = (await res.json()) as {
            ok?: boolean;
            error?: string;
            notificationsSent?: number;
            sessionsInWindow?: number;
            materializedSessionsInserted?: number;
          };
          if (!res.ok) {
            toast.error(data.error ?? "Request failed");
            return;
          }
          toast.success("Attendance reminders sent", {
            description: `${data.notificationsSent ?? 0} notification(s) · ${data.sessionsInWindow ?? 0} session(s) in window`,
          });
          router.refresh();
        });
      }}
    >
      {pending ? "Sending…" : "Send attendance reminders (24h window)"}
    </Button>
  );
}
