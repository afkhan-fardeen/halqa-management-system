"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, CircleHelp, UserRound } from "lucide-react";
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
  showCollapseControl: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center justify-between px-4",
          collapsed && "md:justify-center md:px-2",
        )}
      >
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-2.5"
          onClick={() => onNavigate?.()}
        >
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-staff-primary to-staff-primary-dim text-sm font-black text-white shadow-sm select-none">
            Q
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-none text-staff-on-surface dark:text-slate-100">
                Qalbee
              </p>
              <p className="mt-0.5 truncate text-[10px] font-medium leading-tight text-staff-on-surface-variant dark:text-slate-500">
                Unit portal
              </p>
            </div>
          )}
        </Link>
        {showCollapseControl && (
          <button
            type="button"
            className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 md:inline-flex"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="size-[18px]" aria-hidden />
            ) : (
              <ChevronLeft className="size-[18px]" aria-hidden />
            )}
          </button>
        )}
      </div>

      {/* Nav */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        <DashboardSidebarNav
          isAdmin={isAdmin}
          onNavigate={onNavigate}
          collapsed={collapsed}
        />
      </div>

      {/* Footer */}
      <div
        className={cn(
          "shrink-0 border-t border-slate-200 pb-2 pt-1 dark:border-slate-800",
          collapsed && "md:flex md:flex-col md:items-center",
        )}
      >
        <Link
          href="/dashboard/profile"
          className={cn(
            "mx-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
            collapsed && "md:justify-center md:px-2",
          )}
          title={collapsed ? "Profile" : undefined}
          onClick={() => onNavigate?.()}
        >
          <UserRound className="size-[18px] shrink-0" aria-hidden />
          <span className={cn(collapsed && "md:sr-only")}>Profile</span>
        </Link>
        <Link
          href="/about"
          className={cn(
            "mx-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
            collapsed && "md:justify-center md:px-2",
          )}
          title={collapsed ? "Help" : undefined}
          onClick={() => onNavigate?.()}
        >
          <CircleHelp className="size-[18px] shrink-0" aria-hidden />
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
    </div>
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
    const onChange = () => { if (mq.matches) setMobileOpen(false); };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true") {
        queueMicrotask(() => setSidebarCollapsed(true));
      }
    } catch { /* ignore */ }
  }, []);

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((c) => {
      const next = !c;
      try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "true" : "false"); }
      catch { /* ignore */ }
      return next;
    });
  }, []);

  const sidebarCls = cn(
    "flex h-full min-h-0 flex-col border-r border-staff-outline-variant/20 bg-staff-surface-container-lowest dark:border-slate-800 dark:bg-slate-950",
    "w-60 transition-[width] duration-200 ease-out",
    sidebarCollapsed && "md:w-[3.75rem] md:overflow-x-hidden",
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
        className={cn(sidebarCls, "fixed left-0 top-0 z-50 hidden min-h-dvh md:flex")}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <StaffSidebarChrome
          isAdmin={isAdmin}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
          showCollapseControl
        />
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
          aria-label="Close menu"
          onClick={closeMobile}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          sidebarCls,
          "fixed left-0 top-0 z-[70] min-h-dvh shadow-xl transition-transform duration-200 ease-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full pointer-events-none",
        )}
        style={{
          paddingTop: "max(0px, env(safe-area-inset-top))",
          paddingBottom: "max(0px, env(safe-area-inset-bottom))",
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

      {/* Main content */}
      <div
        className={cn(
          "flex min-h-dvh min-w-0 flex-col transition-[margin] duration-200 ease-out",
          sidebarCollapsed ? "md:ml-[3.75rem]" : "md:ml-60",
        )}
      >
        <StaffDashboardHeader
          unread={unread}
          user={user}
          showMobileMenuButton
          onOpenMobileNav={() => setMobileOpen(true)}
        />
        <main className="flex min-h-0 min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto w-full min-w-0 max-w-6xl">
            <DashboardRefresh />
            {children}
          </div>
        </main>
      </div>

      <PushNotificationWelcomeModal audience="staff" />
    </div>
  );
}
