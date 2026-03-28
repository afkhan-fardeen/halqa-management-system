"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { markNotificationRead } from "@/lib/actions/notifications";

export function MarkReadButton({
  notificationId,
  label = "Read",
}: {
  notificationId: string;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="hms-notif-read-btn inline-flex items-center gap-1"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const fd = new FormData();
          fd.set("id", notificationId);
          await markNotificationRead(fd);
          toast.success("Marked as read");
        })
      }
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        aria-hidden
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
      {pending ? "…" : label}
    </button>
  );
}
