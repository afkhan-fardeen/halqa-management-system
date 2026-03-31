"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getStaffNavSections, isNavItemActive } from "@/lib/dashboard/staff-nav-config";
import { cn } from "@/lib/utils";

export function DashboardSidebarNav({
  onNavigate,
  isAdmin = false,
}: {
  onNavigate?: () => void;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const sections = getStaffNavSections(isAdmin);

  return (
    <nav
      className="flex flex-1 flex-col gap-1 overflow-y-auto px-1 py-2"
      aria-label="Dashboard navigation"
    >
      {sections.map((section, idx) => (
        <div key={section.id}>
          <p
            className={cn(
              "px-3 pb-1 pt-2 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400",
              idx === 0 && "pt-1",
            )}
          >
            {section.title}
          </p>
          <ul className="flex flex-col gap-0.5">
            {section.items.map(({ href, label, description, icon }) => {
              const active = isNavItemActive(href, pathname);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => onNavigate?.()}
                    className={cn(
                      "flex min-h-11 items-start gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-300"
                        : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200",
                    )}
                  >
                    <span
                      className={cn(
                        "material-symbols-outlined mt-0.5 shrink-0 text-[1.25rem] leading-none",
                        active ? "text-blue-700 dark:text-blue-300" : "text-slate-500 dark:text-slate-400",
                      )}
                      aria-hidden
                    >
                      {icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block leading-tight">{label}</span>
                      {description ? (
                        <span className="mt-0.5 block text-[0.7rem] font-normal leading-snug text-slate-500 dark:text-slate-500">
                          {description}
                        </span>
                      ) : null}
                    </span>
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
