"use client";

import Image from "next/image";
import Link from "next/link";
import { InboxLink } from "@/components/notifications/inbox-link";
import { initials, staffRoleLabel } from "@/lib/utils/profile-display";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/next-auth";

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
        "sticky top-0 z-40 flex w-full items-center justify-between gap-4 border-b border-slate-200/80 bg-slate-50/80 px-4 py-3 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80 md:px-8 md:py-4",
        "pt-[max(0.75rem,env(safe-area-inset-top))]",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {showMobileMenuButton ? (
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-staff-on-surface hover:bg-staff-surface-container md:hidden"
            aria-label="Open navigation menu"
            onClick={onOpenMobileNav}
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
        ) : null}
        <div className="flex max-w-md flex-1 items-center gap-3 rounded-full bg-staff-surface-container px-4 py-2 dark:bg-slate-800/80">
          <span className="material-symbols-outlined shrink-0 text-staff-on-surface-variant text-[22px]">
            search
          </span>
          <input
            type="search"
            readOnly
            disabled
            placeholder="Search members, reports…"
            className="w-full min-w-0 border-0 bg-transparent text-sm text-staff-on-surface placeholder:text-staff-on-surface-variant/50 focus:ring-0 disabled:cursor-not-allowed"
            aria-label="Search (coming soon)"
          />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 md:gap-6">
        <InboxLink href="/dashboard/notifications" unread={unread} variant="staff" />
        <Link
          href="/dashboard/profile"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-staff-on-surface-variant transition-colors hover:bg-staff-surface-container-high dark:hover:bg-slate-800"
          aria-label="Profile settings"
        >
          <span className="material-symbols-outlined text-[22px]">settings</span>
        </Link>
        <div className="hidden h-8 w-px bg-staff-outline-variant/30 sm:block" />
        <div className="flex max-w-[min(40vw,12rem)] items-center gap-2 sm:gap-3">
          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-bold text-staff-on-surface">{displayName}</p>
            <p className="truncate text-[10px] font-medium text-staff-on-surface-variant">
              {roleLabel}
            </p>
          </div>
          {user.image ? (
            <Image
              src={user.image}
              alt={displayName}
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 rounded-full border-2 border-white object-cover shadow-sm dark:border-slate-700"
              unoptimized
            />
          ) : (
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white bg-staff-primary-container text-sm font-bold text-staff-on-primary-container shadow-sm dark:border-slate-700"
              aria-hidden
            >
              {initial}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
