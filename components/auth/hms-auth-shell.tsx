"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

const THEME_KEY = "qalbee-hms-theme";

function ThemeGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

export function HmsAuthShell({ children }: { children: ReactNode }) {
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
      <header className="hms-topbar shrink-0">
        <Link href="/" className="hms-brand">
          Qalbee<span>.</span>
        </Link>
        <button type="button" className="hms-theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
          <ThemeGlyph />
        </button>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-10 pt-4 sm:px-6">{children}</div>
    </div>
  );
}
