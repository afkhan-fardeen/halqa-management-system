import type { ReactNode } from "react";
import { DM_Sans, Poppins } from "next/font/google";
import { AuthBrand } from "@/components/auth/auth-brand";
import { AuthThemeToggle } from "@/components/auth/auth-theme-toggle";
import { MemberStyleRoot } from "@/components/member/member-style-root";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-member-body",
  display: "swap",
  preload: true,
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-member-heading",
  display: "swap",
  preload: true,
});

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${dmSans.variable} ${poppins.variable}`}>
      <MemberStyleRoot>
        <div
          className="relative flex min-h-dvh flex-col items-center justify-center overflow-x-hidden px-4 pb-10 pt-[max(2.5rem,env(safe-area-inset-top))] sm:px-6 sm:pb-12 sm:pt-[max(3rem,env(safe-area-inset-top))]"
          style={{
            fontFamily:
              'var(--font-member-body), "DM Sans", system-ui, sans-serif',
          }}
        >
          <AuthThemeToggle className="absolute right-3 top-3 z-20 sm:right-6 sm:top-4" />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-stone-100/90 via-background to-amber-50/40 dark:from-stone-950 dark:via-background dark:to-stone-900/80"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-40 top-0 size-[26rem] rounded-full bg-amber-400/20 blur-[110px] dark:bg-amber-600/12"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-36 bottom-0 size-[22rem] rounded-full bg-stone-400/15 blur-[100px] dark:bg-stone-600/10"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,rgba(217,119,6,0.1),transparent_55%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,rgba(217,119,6,0.16),transparent_55%)]"
            aria-hidden
          />

          <AuthBrand />
          <div className="relative z-10 w-full max-w-xl">{children}</div>
        </div>
      </MemberStyleRoot>
    </div>
  );
}
