import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Serif “Qalbee.” mark — matches the member PWA top bar (DM Serif Display + teal dot).
 */
export function QalbeeWordmark({
  href,
  size = "default",
  subtitle,
  className,
  onClick,
}: {
  href: string;
  size?: "default" | "compact";
  subtitle?: string | null;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-w-0 flex-col gap-0.5 no-underline select-none",
        className,
      )}
      onClick={onClick}
    >
      <span
        className={cn(
          "font-qalbee-wordmark text-stone-900 dark:text-stone-100",
          size === "compact" ? "text-sm leading-tight" : "text-base leading-[1.15]",
        )}
      >
        Qalbee
        <span className="text-[#008080] dark:text-teal-400" aria-hidden>
          .
        </span>
      </span>
      {subtitle ? (
        <span className="truncate text-[10px] font-medium leading-tight text-stone-500 dark:text-stone-500">
          {subtitle}
        </span>
      ) : null}
    </Link>
  );
}
