"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { DashboardRefresh } from "@/components/dashboard/dashboard-refresh";
import { PushNotificationWelcomeModal } from "@/components/pwa/push-notification-welcome-modal";
import { DashboardSidebarNav } from "@/components/dashboard/dashboard-sidebar-nav";
import {
  StaffDashboardHeader,
  type StaffHeaderUser,
} from "@/components/dashboard/staff-dashboard-header";
import { cn } from "@/lib/utils";

function StaffSidebarChrome({
  isAdmin,
  onNavigate,
}: {
  isAdmin: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="mb-4 px-3 py-6">
        <Link
          href="/dashboard"
          className="block font-staff-headline text-xl font-black tracking-tighter text-blue-700 dark:text-blue-400"
          onClick={() => onNavigate?.()}
        >
          Qalbee
        </Link>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Management Suite
        </p>
      </div>
      <DashboardSidebarNav isAdmin={isAdmin} onNavigate={onNavigate} />
      <div className="mt-auto flex flex-col gap-1 border-t border-slate-200/80 pt-4 dark:border-slate-800">
        <Link
          href="/about"
          className="flex items-center gap-3 px-3 py-2 text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
          onClick={() => onNavigate?.()}
        >
          <span className="material-symbols-outlined text-[20px]">help</span>
          Help
        </Link>
        <SignOutButton variant="staffSidebar" />
      </div>
    </>
  );
}

export function DashboardLayoutClient({
  unread,
  isAdmin,
  user,
  shellClassName,
  children,
}: {
  unread: number;
  isAdmin: boolean;
  user: StaffHeaderUser;
  shellClassName?: string;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) setMobileOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const asideClass =
    "flex h-full min-h-0 w-64 flex-col border-r border-slate-200/80 bg-slate-100 p-4 dark:border-slate-800 dark:bg-slate-900";

  return (
    <div
      data-staff-dashboard
      className={cn("min-h-dvh bg-staff-background text-staff-on-surface dark:bg-slate-950", shellClassName)}
    >
      {/* Desktop sidebar */}
      <aside className={cn(asideClass, "fixed left-0 top-0 z-50 hidden min-h-dvh md:flex")}>
        <StaffSidebarChrome isAdmin={isAdmin} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[60] bg-black/40 md:hidden"
          aria-label="Close menu"
          onClick={closeMobile}
        />
      ) : null}
      <aside
        className={cn(
          asideClass,
          "fixed left-0 top-0 z-[70] min-h-dvh transition-transform duration-200 ease-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full pointer-events-none",
        )}
        style={{
          paddingTop: "max(1rem, env(safe-area-inset-top))",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
        aria-hidden={!mobileOpen}
      >
        <StaffSidebarChrome isAdmin={isAdmin} onNavigate={closeMobile} />
      </aside>

      <div className="flex min-h-dvh flex-col md:ml-64">
        <StaffDashboardHeader
          unread={unread}
          user={user}
          showMobileMenuButton
          onOpenMobileNav={() => setMobileOpen(true)}
        />
        <main
          className="flex-1 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 md:px-8 md:py-8"
        >
          <div className="mx-auto w-full max-w-7xl">
            <DashboardRefresh />
            {children}
          </div>
        </main>
      </div>
      <PushNotificationWelcomeModal audience="staff" />
    </div>
  );
}
