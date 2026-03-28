"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { markAllNotificationsRead } from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";

export function MarkAllReadButton({ className }: { className?: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className={cn("hms-mark-all", className)}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await markAllNotificationsRead(new FormData());
          toast.success("All notifications marked as read");
        })
      }
    >
      {pending ? "Updating…" : "Mark all as read"}
    </button>
  );
}
