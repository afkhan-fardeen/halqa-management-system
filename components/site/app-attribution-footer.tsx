import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "marketing" | "plain";

export function AppAttributionFooter({
  className,
  variant = "plain",
  hideAboutLink = false,
}: {
  className?: string;
  /** `marketing` uses HMS footer tokens (landing / public HMS pages). */
  variant?: Variant;
  /** Omit the About + nav row (e.g. on the About page). */
  hideAboutLink?: boolean;
}) {
  return (
    <footer
      className={cn(
        variant === "marketing" ? "hms-footer" : "border-t px-4 py-6 text-center text-sm",
        className,
      )}
      style={
        variant === "plain"
          ? {
              borderColor: "var(--hms-border, #e5e7eb)",
              color: "var(--hms-text2, #64748b)",
            }
          : undefined
      }
    >
      <p className={variant === "marketing" ? "" : "leading-relaxed"}>
        By Afkhan Fardeen Khan, son of Mohammad Haneef Khan · For the sake of Allah
      </p>
      {!hideAboutLink ? (
        <p className={variant === "marketing" ? "mt-2" : "mt-2"}>
          <Link
            href="/about"
            className={
              variant === "marketing" ? "hms-form-link" : "text-primary font-medium underline-offset-4 hover:underline"
            }
          >
            About
          </Link>
          {variant === "marketing" ? (
            <>
              {" "}
              · Qalbee · Bahrain · <Link href="/login">Sign in</Link> · <Link href="/register">Register</Link>
            </>
          ) : null}
        </p>
      ) : null}
    </footer>
  );
}
