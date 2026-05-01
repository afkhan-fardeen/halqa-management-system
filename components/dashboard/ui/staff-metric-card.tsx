import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StaffMetricCard({
  label,
  value,
  subtitle,
  icon,
  iconClassName,
  footer,
  progress,
  footerLink,
  valueClassName,
  className,
}: {
  label: string;
  value: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  iconClassName?: string;
  footer?: ReactNode;
  progress?: { widthPct: string };
  footerLink?: { href: string; label: string };
  valueClassName?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-staff-outline-variant/15 bg-staff-surface-container-lowest p-5 shadow-sm dark:border-slate-700/80 dark:bg-slate-900",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-staff-on-surface-variant dark:text-slate-500">
          {label}
        </span>
        {icon ? (
          <span
            className={cn(
              "inline-flex text-staff-primary dark:text-teal-300 [&_svg]:size-5",
              iconClassName,
            )}
            aria-hidden
          >
            {icon}
          </span>
        ) : null}
      </div>
      <div
        className={cn(
          "font-staff-headline text-4xl font-black tabular-nums text-staff-on-surface dark:text-slate-100",
          valueClassName,
        )}
      >
        {value}
      </div>
      {subtitle ? (
        <p className="mt-1 text-sm font-medium text-staff-on-surface-variant dark:text-slate-400">
          {subtitle}
        </p>
      ) : null}
      {progress ? (
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-staff-surface-container dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-staff-primary transition-all duration-700 dark:bg-teal-500"
            style={{ width: progress.widthPct }}
          />
        </div>
      ) : null}
      {footer ? (
        <div className="mt-2 text-xs text-staff-on-surface-variant dark:text-slate-500">
          {footer}
        </div>
      ) : null}
      {footerLink ? (
        <div className="mt-auto pt-4">
          <Link
            href={footerLink.href}
            className="inline-flex items-center gap-1 text-xs font-semibold text-staff-primary hover:underline dark:text-teal-300"
          >
            {footerLink.label}
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
