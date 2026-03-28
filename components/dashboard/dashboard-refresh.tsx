"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const DEFAULT_INTERVAL_MS = 8_000;

/**
 * Keeps server-rendered dashboard data fresh for staff (pending registrations, etc.).
 * Pauses while the tab is hidden; refreshes immediately when the user returns.
 */
export function DashboardRefresh({
  intervalMs = DEFAULT_INTERVAL_MS,
}: {
  intervalMs?: number;
}) {
  const router = useRouter();

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | undefined;

    const refresh = () => {
      router.refresh();
    };

    const startInterval = () => {
      if (id) clearInterval(id);
      id = setInterval(() => {
        if (typeof document !== "undefined" && document.hidden) return;
        refresh();
      }, intervalMs);
    };

    startInterval();

    const onVisibility = () => {
      if (document.hidden) {
        if (id) {
          clearInterval(id);
          id = undefined;
        }
      } else {
        refresh();
        startInterval();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (id) clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router, intervalMs]);

  return null;
}
