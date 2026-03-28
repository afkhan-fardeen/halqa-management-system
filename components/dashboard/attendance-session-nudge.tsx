"use client";

import { useState, useTransition } from "react";
import { sendAttendanceNudgeToMembers } from "@/lib/actions/attendance-notify";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function AttendanceSessionNudgeForm({ sessionId }: { sessionId: string }) {
  const [onlyUnmarked, setOnlyUnmarked] = useState(true);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h3 className="text-sm font-semibold">Notify members</h3>
      <p className="text-muted-foreground text-xs">
        Sends an in-app notification with a clear title so members can open the attendance screen.
      </p>
      <div className="flex items-center gap-2">
        <input
          id="only-unmarked"
          type="checkbox"
          checked={onlyUnmarked}
          onChange={(e) => setOnlyUnmarked(e.target.checked)}
          className="size-4 rounded border"
        />
        <Label htmlFor="only-unmarked" className="text-sm font-normal">
          Only members who haven&apos;t marked this session yet
        </Label>
      </div>
      <Button
        type="button"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const r = await sendAttendanceNudgeToMembers({
              sessionId,
              onlyUnmarked,
            });
            if (r.ok) {
              toast.success("Notifications sent", {
                description: `Delivered to ${r.sent} member${r.sent === 1 ? "" : "s"}.`,
              });
            } else {
              toast.error(r.error);
            }
          });
        }}
      >
        {pending ? "Sending…" : "Notify members to mark attendance"}
      </Button>
    </div>
  );
}
