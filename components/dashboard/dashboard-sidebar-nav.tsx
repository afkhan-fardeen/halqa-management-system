"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getStaffNavSections, isNavItemActive } from "@/lib/dashboard/staff-nav-config";

export function DashboardSidebarNav({
  onNavigate,
  isAdmin = false,
  collapsed = false,
}: {
  onNavigate?: () => void;
  isAdmin?: boolean;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const sections = getStaffNavSections(isAdmin);

  return (
    <nav
      className="flex flex-col gap-0.5 px-2 py-2"
      aria-label="Dashboard navigation"
    >
      {sections.map((section, idx) => (
        <div key={section.id} className={idx > 0 ? "mt-1" : ""}>
          {!collapsed && (
            <p className="mb-0.5 px-3 pb-0.5 pt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">
              {section.title}
            </p>
          )}
          {collapsed && idx > 0 && (
            <div className="mx-auto mb-1 mt-2 h-px w-6 bg-slate-200 dark:bg-slate-800 md:block" />
          )}
          <ul className="flex flex-col gap-0.5">
            {section.items.map(({ href, label, icon }) => {
              const active = isNavItemActive(href, pathname);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => onNavigate?.()}
                    title={collapsed ? label : undefined}
                    aria-label={collapsed ? label : undefined}
                    className={cn(
                      "flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors",
                      collapsed ? "md:justify-center md:px-0 md:w-9 md:mx-auto" : "",
                      active
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200",
                    )}
                  >
                    <span
                      className={cn(
                        "material-symbols-outlined shrink-0 text-[18px] leading-none",
                        active ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500",
                      )}
                    >
                      {icon}
                    </span>
                    {!collapsed && <span className="truncate">{label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
