import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export { StaffMetricCard } from "@/components/dashboard/ui/staff-metric-card";

export function StaffPageHeader({
  title,
  description,
  action,
  titleClassName,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  /** Override default title sizing (e.g. hero pages). */
  titleClassName?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 sm:flex-row sm:justify-between md:mb-8",
        action ? "sm:items-end" : "sm:items-start",
      )}
    >
      <div className="min-w-0">
        <h1
          className={cn(
            "font-staff-headline text-2xl font-bold tracking-tight text-staff-on-surface dark:text-slate-100 sm:text-3xl",
            titleClassName,
          )}
        >
          {title}
        </h1>
        {description ? (
          <div className="mt-1.5 max-w-2xl text-sm leading-relaxed text-staff-on-surface-variant dark:text-slate-400">
            {description}
          </div>
        ) : null}
      </div>
      {action ? (
        <div className="flex shrink-0 flex-wrap gap-2">{action}</div>
      ) : null}
    </div>
  );
}

export function StaffPanel({
  title,
  description,
  children,
  className,
  padding = true,
  headerClassName,
}: {
  title?: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  padding?: boolean;
  headerClassName?: string;
}) {
  return (
    <div
      className={cn(
        "staff-elevated-surface rounded-2xl bg-staff-surface-container-lowest dark:bg-slate-900",
        padding && "p-5 md:p-6",
        className,
      )}
    >
      {(title || description) && (
        <div className={cn("mb-5", headerClassName)}>
          {title ? (
            <h2 className="font-staff-headline text-base font-bold text-staff-on-surface dark:text-slate-100 md:text-lg">
              {title}
            </h2>
          ) : null}
          {description ? (
            <div className="mt-1 text-sm text-staff-on-surface-variant dark:text-slate-400">
              {description}
            </div>
          ) : null}
        </div>
      )}
      {children}
    </div>
  );
}
