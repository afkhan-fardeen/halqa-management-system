"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { DashboardRefresh } from "@/components/dashboard/dashboard-refresh";
import { PushNotificationWelcomeModal } from "@/components/pwa/push-notification-welcome-modal";
import { DashboardSidebarNav } from "@/components/dashboard/dashboard-sidebar-nav";
import {
  StaffDashboardHeader,
  type StaffHeaderUser,
} from "@/components/dashboard/staff-dashboard-header";
import { cn } from "@/lib/utils";

const SIDEBAR_COLLAPSED_KEY = "staff-sidebar-collapsed";

function StaffSidebarChrome({
  isAdmin,
  onNavigate,
  collapsed,
  onToggleCollapse,
  showCollapseControl,
}: {
  isAdmin: boolean;
  onNavigate?: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  /** Desktop only — hide on mobile drawer */
  showCollapseControl: boolean;
}) {
  return (
    <>
      <div
        className={cn(
          "mb-4 flex items-start justify-between gap-2 px-3 py-5 md:min-h-[3.25rem] md:items-center md:py-4",
          collapsed && "md:px-1",
        )}
      >
        <div className="min-w-0 flex-1">
          <Link
            href="/dashboard"
            className={cn(
              "block font-staff-headline text-xl font-black tracking-tighter text-blue-700 dark:text-blue-400",
              collapsed && "md:flex md:justify-center",
            )}
            onClick={() => onNavigate?.()}
          >
            {collapsed ? (
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-lg font-black text-white dark:bg-blue-400 dark:text-slate-950 md:inline-flex">
                Q
              </span>
            ) : (
              "Qalbee"
            )}
          </Link>
          {collapsed ? null : (
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Management Suite
            </p>
          )}
        </div>
        {showCollapseControl ? (
          <button
            type="button"
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-200/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 md:inline-flex"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span className="material-symbols-outlined text-[22px] leading-none">
              {collapsed ? "chevron_right" : "chevron_left"}
            </span>
          </button>
        ) : null}
      </div>
      <DashboardSidebarNav
        isAdmin={isAdmin}
        onNavigate={onNavigate}
        collapsed={collapsed}
      />
      <div className="mt-auto flex flex-col gap-1 border-t border-slate-200/80 pt-4 dark:border-slate-800">
        <Link
          href="/about"
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200",
            collapsed && "md:justify-center md:px-1",
          )}
          title={collapsed ? "Help" : undefined}
          onClick={() => onNavigate?.()}
        >
          <span className="material-symbols-outlined text-[20px]">help</span>
          <span className={cn(collapsed && "md:sr-only")}>Help</span>
        </Link>
        {collapsed ? (
          <div className="hidden md:flex md:justify-center">
            <SignOutButton variant="staffSidebarCollapsed" />
          </div>
        ) : (
          <SignOutButton variant="staffSidebar" />
        )}
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) setMobileOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true") {
        setSidebarCollapsed(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "true" : "false");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const asideClass = cn(
    "flex h-full min-h-0 flex-col border-r border-slate-200/80 bg-slate-100 dark:border-slate-800 dark:bg-slate-900",
    "w-64 p-4 transition-[width,padding] duration-200 ease-out",
    sidebarCollapsed && "md:w-16 md:overflow-x-hidden md:p-2",
  );

  return (
    <div
      data-staff-dashboard
      className={cn(
        "min-h-dvh overflow-x-hidden bg-staff-background text-staff-on-surface dark:bg-slate-950",
        shellClassName,
      )}
    >
      {/* Desktop sidebar */}
      <aside
        className={cn(
          asideClass,
          "fixed left-0 top-0 z-50 hidden min-h-dvh md:flex",
        )}
      >
        <StaffSidebarChrome
          isAdmin={isAdmin}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
          showCollapseControl
        />
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
        <StaffSidebarChrome
          isAdmin={isAdmin}
          onNavigate={closeMobile}
          collapsed={false}
          onToggleCollapse={toggleSidebarCollapsed}
          showCollapseControl={false}
        />
      </aside>

      <div
        className={cn(
          "flex min-h-dvh min-w-0 flex-col transition-[margin] duration-200 ease-out",
          sidebarCollapsed ? "md:ml-16" : "md:ml-64",
        )}
      >
        <StaffDashboardHeader
          unread={unread}
          user={user}
          showMobileMenuButton
          onOpenMobileNav={() => setMobileOpen(true)}
        />
        <main className="flex min-h-0 min-w-0 flex-1 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 md:px-8 md:py-8">
          <div className="mx-auto w-full min-w-0 max-w-7xl">
            <DashboardRefresh />
            {children}
          </div>
        </main>
      </div>
      <PushNotificationWelcomeModal audience="staff" />
    </div>
  );
}
