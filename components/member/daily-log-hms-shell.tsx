"use client";

import type { ReactNode } from "react";
import { useMemberTheme } from "@/components/member/member-theme-provider";

/** HMS tokens for daily log (matches marketing/auth `hms-root`). */
export function DailyLogHmsShell({ children }: { children: ReactNode }) {
  const { mode } = useMemberTheme();
  return (
    <div className="hms-root hms-daily-page w-full" data-theme={mode}>
      {children}
    </div>
  );
}
