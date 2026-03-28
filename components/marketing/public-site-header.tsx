"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function ThemeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
      style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 0.2s ease" }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export type PublicSiteHeaderPage = "landing" | "about";

type Props = {
  page?: PublicSiteHeaderPage;
  onToggleTheme: () => void;
};

/**
 * Logo, theme toggle, and a Menu dropdown (Sign in, Get started, About on landing).
 * About is also linked from the footer; on the About page the menu offers Home + Sign in + Get started.
 */
export function PublicSiteHeader({ page = "landing", onToggleTheme }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="hms-nav">
      <Link href="/" className="hms-nav-brand">
        Qalbee<span>.</span>
      </Link>
      <div className="hms-nav-right">
        <button type="button" className="hms-theme-btn" onClick={onToggleTheme} aria-label="Toggle theme">
          <ThemeIcon />
        </button>
        <div className="hms-nav-menu-wrap" ref={wrapRef}>
          <button
            type="button"
            className="hms-nav-menu-btn"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-controls="public-site-menu"
            id="public-site-menu-button"
            onClick={() => setMenuOpen((o) => !o)}
          >
            Menu
            <ChevronDown open={menuOpen} />
          </button>
          {menuOpen ? (
            <div
              id="public-site-menu"
              role="menu"
              aria-labelledby="public-site-menu-button"
              className="hms-nav-dropdown"
            >
              {page === "about" ? (
                <Link href="/" role="menuitem" className="hms-nav-dropdown-link" onClick={closeMenu}>
                  Home
                </Link>
              ) : null}
              <Link href="/login" role="menuitem" className="hms-nav-dropdown-link" onClick={closeMenu}>
                Sign in
              </Link>
              <Link href="/register" role="menuitem" className="hms-nav-dropdown-link" onClick={closeMenu}>
                Get started
              </Link>
              {page === "landing" ? (
                <Link href="/about" role="menuitem" className="hms-nav-dropdown-link" onClick={closeMenu}>
                  About
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
