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
    <div className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="font-staff-headline text-3xl font-extrabold tracking-tight text-staff-on-surface sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <div className="mt-2 max-w-2xl text-sm leading-relaxed text-staff-on-surface-variant md:text-base">
            {description}
          </div>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

/** Primary content panel for staff dashboard pages (replaces ad hoc Card chrome). */
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
        "rounded-xl border border-staff-outline-variant/10 bg-staff-surface-container-lowest shadow-sm",
        padding && "p-6 md:p-8",
        className,
      )}
    >
      {(title || description) && (
        <div className={cn("mb-6", headerClassName)}>
          {title ? (
            <h2 className="font-staff-headline text-lg font-bold text-staff-on-surface md:text-xl">
              {title}
            </h2>
          ) : null}
          {description ? (
            <div className="mt-1 text-sm text-staff-on-surface-variant">{description}</div>
          ) : null}
        </div>
      )}
      {children}
    </div>
  );
}
