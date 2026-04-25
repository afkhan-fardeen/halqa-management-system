"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { InboxLink } from "@/components/notifications/inbox-link";
import { StaffDashboardSearch } from "@/components/dashboard/staff-dashboard-search";
import { initials, staffRoleLabel } from "@/lib/utils/profile-display";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/next-auth";

function StaffSearchFallback() {
  return (
    <div className="flex h-9 w-full max-w-xs items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900">
      <span className="material-symbols-outlined shrink-0 text-[18px] leading-none text-slate-400">
        search
      </span>
      <div className="h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}

export type StaffHeaderUser = {
  name: string | null;
  email: string | null;
  image: string | null;
  role: UserRole;
};

export function StaffDashboardHeader({
  unread,
  user,
  onOpenMobileNav,
  showMobileMenuButton,
}: {
  unread: number;
  user: StaffHeaderUser;
  onOpenMobileNav?: () => void;
  showMobileMenuButton?: boolean;
}) {
  const displayName = user.name?.trim() || user.email?.trim() || "Staff";
  const roleLabel = staffRoleLabel(user.role);
  const initial = initials(user.name ?? user.email);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 w-full shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/95 md:px-6",
        "pt-[env(safe-area-inset-top)]",
      )}
      style={{ minHeight: "max(3.5rem, calc(3.5rem + env(safe-area-inset-top)))" }}
    >
      {/* Left */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {showMobileMenuButton && (
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
            aria-label="Open navigation menu"
            onClick={onOpenMobileNav}
          >
            <span className="material-symbols-outlined text-[22px] leading-none">menu</span>
          </button>
        )}
        <Suspense fallback={<StaffSearchFallback />}>
          <StaffDashboardSearch />
        </Suspense>
      </div>

      {/* Right */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <InboxLink href="/dashboard/notifications" unread={unread} variant="staff" />

        <Link
          href="/dashboard/profile"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Profile & settings"
          title="Profile & settings"
        >
          <span className="material-symbols-outlined text-[20px] leading-none">settings</span>
        </Link>

        <div className="hidden h-5 w-px bg-slate-200 dark:bg-slate-700 sm:block" />

        {/* User chip */}
        <div className="hidden items-center gap-2 sm:flex">
          <div className="min-w-0 text-right">
            <p className="max-w-[9rem] truncate text-sm font-semibold leading-tight text-slate-800 dark:text-slate-200">
              {displayName}
            </p>
            <p className="text-[10px] font-medium leading-tight text-slate-400">{roleLabel}</p>
          </div>
          {user.image ? (
            <Image
              src={user.image}
              alt={displayName}
              width={34}
              height={34}
              className="h-[34px] w-[34px] shrink-0 rounded-full border border-slate-200 object-cover dark:border-slate-700"
              unoptimized
            />
          ) : (
            <div
              className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-blue-600 text-[13px] font-bold text-white"
              aria-hidden
            >
              {initial}
            </div>
          )}
        </div>

        {/* Mobile avatar only */}
        <div className="sm:hidden">
          {user.image ? (
            <Image
              src={user.image}
              alt={displayName}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full border border-slate-200 object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-[12px] font-bold text-white">
              {initial}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
