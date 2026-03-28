"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppAttributionFooter } from "@/components/site/app-attribution-footer";

const THEME_KEY = "qalbee-hms-theme";

function ThemeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

/**
 * Public About page — same visual language as the landing (nav, theme, HMS tokens).
 */
export function AboutPageClient() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem(THEME_KEY);
    if (s === "dark" || s === "light") setTheme(s);
    else if (window.matchMedia("(prefers-color-scheme: dark)").matches) setTheme("dark");
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
  };

  return (
    <div className="hms-root flex min-h-dvh flex-col" data-theme={mounted ? theme : "light"}>
      <nav className="hms-nav">
        <Link href="/" className="hms-nav-brand">
          Qalbee<span>.</span>
        </Link>
        <div className="hms-nav-right hms-nav-right--wrap">
          <button type="button" className="hms-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
            <ThemeIcon />
          </button>
          <Link href="/about" className="hms-nav-login hms-nav-link-active" aria-current="page">
            About
          </Link>
          <Link href="/install" className="hms-nav-login max-[420px]:hidden">
            Install
          </Link>
          <Link href="/login" className="hms-nav-login">
            Sign in
          </Link>
          <Link href="/register" className="hms-nav-cta">
            Get started
          </Link>
        </div>
      </nav>

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

        <nav
          className="mx-auto mt-10 flex max-w-[560px] flex-wrap justify-center gap-x-1 gap-y-2 text-sm"
          style={{ color: "var(--hms-text3)" }}
          aria-label="Site links"
        >
          <Link href="/" className="hms-form-link px-2 font-medium">
            Home
          </Link>
          <span aria-hidden className="select-none px-0.5">
            ·
          </span>
          <Link href="/install" className="hms-form-link px-2 font-medium">
            Install
          </Link>
          <span aria-hidden className="select-none px-0.5">
            ·
          </span>
          <Link href="/login" className="hms-form-link px-2 font-medium">
            Sign in
          </Link>
          <span aria-hidden className="select-none px-0.5">
            ·
          </span>
          <Link href="/register" className="hms-form-link px-2 font-medium">
            Register
          </Link>
        </nav>
      </main>

      <AppAttributionFooter variant="marketing" hideAboutLink />
    </div>
  );
}
