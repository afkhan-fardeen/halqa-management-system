"use client";

import { useEffect, useState } from "react";
import { PublicSiteHeader } from "@/components/marketing/public-site-header";
import { AppAttributionFooter } from "@/components/site/app-attribution-footer";

const THEME_KEY = "qalbee-hms-theme";

/**
 * Public About page — matches landing header (logo, theme, Menu dropdown).
 * About is linked from the footer; the menu here offers Home, Sign in, and Get started.
 */
export function AboutPageClient() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem(THEME_KEY);
    const nextTheme =
      s === "dark" || s === "light"
        ? s
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    queueMicrotask(() => {
      setTheme(nextTheme);
      setMounted(true);
    });
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
  };

  return (
    <div className="hms-root flex min-h-dvh flex-col" data-theme={mounted ? theme : "light"}>
      <PublicSiteHeader page="about" onToggleTheme={toggleTheme} />

      <main className="hms-about-main flex-1 px-4 pb-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="hms-hero-badge mx-auto mb-6 w-fit">
            <div className="hms-hero-badge-dot" aria-hidden />
            For the sake of Allah
          </div>
          <h1 className="hms-hero-title text-3xl sm:text-4xl md:text-[2.75rem]">
            About <em>Qalbee</em>
          </h1>
          <p className="hms-hero-sub mx-auto mt-4 max-w-xl">
            A note of gratitude and intention — from the creator of this app.
          </p>
        </div>

        <div className="mx-auto mt-12 w-full max-w-[560px]">
          <article className="hms-card hms-about-card hms-about-prose text-left" style={{ animationDelay: "0.05s" }}>
            <p>
              This app was created sincerely for the sake of Allah by Afkhan Fardeen Khan, son of Mohammad Haneef
              Khan.
            </p>
            <p>
              It is made with the intention that it benefits others and becomes a source of ṣadaqah jāriyah.
            </p>
            <p>If this app helps you, please remember us in your duʿāʾ.</p>
            <p className="font-semibold" style={{ color: "var(--hms-text)" }}>
              May Allah accept this effort.
            </p>
          </article>
        </div>
      </main>

      <AppAttributionFooter variant="marketing" hideAboutLink />
    </div>
  );
}
