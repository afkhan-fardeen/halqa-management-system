"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteAttendanceSession } from "@/lib/actions/attendance-programs";
import { Button } from "@/components/ui/button";

export function AttendanceDeleteSessionButton({
  sessionId,
  programId,
  variant = "list",
}: {
  sessionId: string;
  programId: string;
  variant?: "list" | "detail";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={pending}
      className={
        variant === "detail"
          ? "rounded-lg font-bold"
          : "h-auto rounded-lg px-2 py-1 text-xs font-bold"
      }
      onClick={() => {
        if (
          !confirm(
            "Delete this session? All attendance marks and reminders for this session will be permanently removed.",
          )
        ) {
          return;
        }
        startTransition(async () => {
          const r = await deleteAttendanceSession(sessionId);
          if (r.ok) {
            toast.success("Session deleted");
            if (variant === "detail") {
              router.push(`/dashboard/attendance/sessions?program=${programId}`);
            } else {
              router.refresh();
            }
          } else {
            toast.error(r.error);
          }
        });
      }}
    >
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
