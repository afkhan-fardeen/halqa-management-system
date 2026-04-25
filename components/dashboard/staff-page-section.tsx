import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StaffPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between md:mb-8">
      <div>
        <h1 className="font-staff-headline text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <div className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
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
        "rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",
        padding && "p-5 md:p-6",
        className,
      )}
    >
      {(title || description) && (
        <div className={cn("mb-5", headerClassName)}>
          {title ? (
            <h2 className="font-staff-headline text-base font-bold text-slate-900 dark:text-slate-100 md:text-lg">
              {title}
            </h2>
          ) : null}
          {description ? (
            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</div>
          ) : null}
        </div>
      )}
      {children}
    </div>
  );
}
