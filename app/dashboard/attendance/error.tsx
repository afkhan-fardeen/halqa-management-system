"use client";

import Link from "next/link";
import { useEffect } from "react";
import { buttonVariants } from "@/components/ui/button-variants";

/**
 * Shown when a Server Component under /dashboard/attendance throws (e.g. unexpected DB driver errors).
 * Query-level failures usually return inline messages from listAttendanceProgramsForStaff instead.
 */
export default function AttendanceRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[attendance route]", error);
  }, [error]);

  return (
    <div className="space-y-4 rounded-lg border border-destructive/30 bg-destructive/5 p-6">
      <h1 className="font-display text-xl font-semibold text-destructive">
        Attendance could not load
      </h1>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Something failed while rendering this page. This often happens if the database migration for
        attendance (<code className="text-xs">0008_attendance</code>) has not been applied on
        production, or if <code className="text-xs">DATABASE_URL</code> is wrong.
      </p>
      {error.digest ? (
        <p className="text-muted-foreground text-xs">Reference: {error.digest}</p>
      ) : null}
      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="button"
          onClick={() => reset()}
          className={buttonVariants({ variant: "default" })}
        >
          Try again
        </button>
        <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
