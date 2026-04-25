"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

function StaffDashboardSearchInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qFromUrl = searchParams.get("q") ?? "";
  const [expanded, setExpanded] = useState(false);
  const [value, setValue] = useState(qFromUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(qFromUrl);
  }, [qFromUrl]);

  useEffect(() => {
    if (expanded) {
      inputRef.current?.focus();
    }
  }, [expanded]);

  const submit = useCallback(() => {
    const q = value.trim();
    router.push(q ? `/dashboard/members?q=${encodeURIComponent(q)}` : "/dashboard/members");
  }, [value, router]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  if (!expanded) {
    return (
      <button
        type="button"
        className="flex min-h-10 max-w-md min-w-0 flex-1 items-center gap-2 rounded-full border border-transparent bg-staff-surface-container px-3 py-2 text-left text-sm text-staff-on-surface-variant transition-colors hover:bg-staff-surface-container-high dark:bg-slate-800/80 dark:hover:bg-slate-800"
        aria-expanded={false}
        aria-label="Open member search"
        onClick={() => setExpanded(true)}
      >
        <span className="material-symbols-outlined shrink-0 text-[22px] leading-none">search</span>
        <span className="hidden min-w-0 truncate sm:inline">Search members…</span>
      </button>
    );
  }

  return (
    <form
      className="flex min-h-10 max-w-md min-w-0 flex-1 items-center gap-2 rounded-full bg-staff-surface-container px-3 py-2 dark:bg-slate-800/80"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <span className="material-symbols-outlined shrink-0 text-staff-on-surface-variant text-[22px] leading-none">
        search
      </span>
      <input
        ref={inputRef}
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Name or email — Enter to search"
        className="min-w-0 flex-1 border-0 bg-transparent text-sm text-staff-on-surface placeholder:text-staff-on-surface-variant/50 focus:outline-none focus:ring-0"
        aria-label="Search members by name or email"
        autoComplete="off"
      />
      <button
        type="button"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-staff-on-surface-variant hover:bg-staff-surface-container-high dark:hover:bg-slate-700"
        aria-label="Close search"
        onClick={() => setExpanded(false)}
      >
        <span className="material-symbols-outlined text-[20px] leading-none">close</span>
      </button>
    </form>
  );
}

/** Collapsible member directory search; navigates to `/dashboard/members?q=`. */
export function StaffDashboardSearch() {
  return <StaffDashboardSearchInner />;
}
