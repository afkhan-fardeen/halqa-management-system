"use client";

import type { ReactNode } from "react";
import { useMemberTheme } from "@/components/member/member-theme-provider";

/** HMS token scope + light/dark synced with member MUI theme. */
export function NotificationsHmsShell({ children }: { children: ReactNode }) {
  const { mode } = useMemberTheme();
  return (
    <div className="hms-root w-full max-w-full" data-theme={mode}>
      {children}
    </div>
  );
}
