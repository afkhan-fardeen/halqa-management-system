"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function AttendanceSessionReminderButton({
  sessionId,
}: {
  sessionId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-auto rounded-lg px-2 py-1 text-xs font-semibold"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const res = await fetch(
            `/api/dashboard/attendance/sessions/${sessionId}/send-reminders`,
            { method: "POST" },
          );
          const data = (await res.json()) as {
            ok?: boolean;
            error?: string;
            notificationsSent?: number;
            sessionsInWindow?: number;
          };
          if (!res.ok) {
            toast.error(data.error ?? "Request failed");
            return;
          }
          toast.success("Reminders sent", {
            description: `${data.notificationsSent ?? 0} notification(s)`,
          });
          router.refresh();
        });
      }}
    >
      {pending ? "…" : "Remind to mark"}
    </Button>
  );
}
