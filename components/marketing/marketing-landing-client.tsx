"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PublicSiteHeader } from "@/components/marketing/public-site-header";
import { AppAttributionFooter } from "@/components/site/app-attribution-footer";

const THEME_KEY = "qalbee-hms-theme";

const FEATURES = [
  {
    title: "Daily Salah tracking",
    desc: "Log all 5 prayers — Ba Jamaat, Munfarid, or Qaza. One screen, under 30 seconds.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    title: "Quran & literature",
    desc: "Track Tilawat, Tafseer, pages read, and the books you're studying.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    title: "Da'wah contacts",
    desc: "Record everyone you did da'wah with — name, location, and status.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: "Aiyanat payments",
    desc: "Log your monthly contribution. Leadership sees compliance across the whole unit.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 1 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    title: "Smart reminders",
    desc: "Daily submission reminders at 8 PM if you haven't logged yet. Aiyanat alerts on the 25th.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
];

const IOS_STEPS = [
  {
    n: "1",
    title: "Open Qalbee in Safari",
    desc: "Make sure you're using Safari — Chrome and other browsers on iPhone don't support PWA installation.",
    hint: "Must use Safari on iOS",
  },
  {
    n: "2",
    title: "Tap the Share button",
    desc: "At the bottom of Safari, tap the share icon — it looks like a box with an arrow pointing upward.",
    hint: "Tap the share icon at the bottom",
  },
  {
    n: "3",
    title: 'Tap "Add to Home Screen"',
    desc: 'Scroll down in the share sheet and tap "Add to Home Screen". You\'ll see a preview of the Qalbee icon.',
  },
  {
    n: "4",
    title: 'Tap "Add" to confirm',
    desc: 'Confirm the name as "Qalbee" and tap Add in the top right. The app will appear on your home screen instantly.',
    hint: "Done — open Qalbee from your home screen like any app",
  },
];

const ANDROID_STEPS = [
  {
    n: "1",
    title: "Open Qalbee in Chrome",
    desc: "Navigate to the Qalbee website in Google Chrome on your Android device.",
    hint: "Chrome recommended for Android",
  },
  {
    n: "2",
    title: "Tap the three-dot menu",
    desc: "In the top-right corner of Chrome, tap the ⋮ menu icon to open browser options.",
  },
  {
    n: "3",
    title: 'Tap "Add to Home screen"',
    desc: 'Find and tap "Add to Home screen" in the menu. A banner may also appear at the bottom — tap "Install".',
  },
  {
    n: "4",
    title: "Confirm the installation",
    desc: "Tap Add in the dialog that appears. Qalbee will be installed on your home screen and app drawer.",
    hint: "Done — Qalbee works like a native app",
  },
];

export function MarketingLandingClient() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);
  const [device, setDevice] = useState<"ios" | "android">("ios");

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

  const steps = device === "ios" ? IOS_STEPS : ANDROID_STEPS;

  return (
    <div className="hms-root min-h-dvh" data-theme={mounted ? theme : "light"}>
      <PublicSiteHeader page="landing" onToggleTheme={toggleTheme} />

      <section className="hms-hero">
        <div className="hms-hero-bg" aria-hidden />
        <div className="hms-hero-bg-grid" aria-hidden />
        <div className="hms-hero-badge">
          <div className="hms-hero-badge-dot" aria-hidden />
          Built for Halqas in Bahrain
        </div>
        <h1 className="hms-hero-title">
          Track ibadah.
          <br />
          <em>Build accountability.</em>
        </h1>
        <p className="hms-hero-sub">
          A simple, structured system for members to log daily Salah, Quran, Hadith, and Da&apos;wah — and for
          leadership to see it all, in real time.
        </p>
        <div className="hms-hero-actions">
          <Link href="/register" className="hms-btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Register your account
          </Link>
          <a href="#install" className="hms-btn-secondary">
            Install the app ↓
          </a>
        </div>
        <div className="hms-hero-stats">
          <div>
            <div className="hms-hero-stat-val">4</div>
            <div className="hms-hero-stat-lbl">Halqas</div>
          </div>
          <div style={{ width: 1, background: "var(--hms-border)" }} aria-hidden />
          <div>
            <div className="hms-hero-stat-val">8</div>
            <div className="hms-hero-stat-lbl">Units</div>
          </div>
          <div style={{ width: 1, background: "var(--hms-border)" }} aria-hidden />
          <div>
            <div className="hms-hero-stat-val">&lt; 60s</div>
            <div className="hms-hero-stat-lbl">To submit daily</div>
          </div>
        </div>
      </section>

      <div className="hms-section">
        <div className="hms-section-label">What&apos;s inside</div>
        <h2 className="hms-section-title">Everything your halqa needs, nothing it doesn&apos;t.</h2>
        <p className="hms-section-sub">
          Designed for daily use. Fast to submit, clear to read, honest about what matters.
        </p>
        <div className="hms-divider" />
        <div className="hms-features-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="hms-feature-card">
              <div className="hms-feature-icon">{f.icon}</div>
              <div className="hms-feature-title">{f.title}</div>
              <div className="hms-feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <section className="hms-install-section" id="install">
        <div className="hms-install-inner">
          <div className="hms-section-label">Install the app</div>
          <h2 className="hms-section-title">Add Qalbee to your home screen</h2>
          <p className="hms-section-sub">
            Qalbee is a Progressive Web App — no App Store needed. Install it directly from your browser in seconds.
          </p>
          <div className="hms-divider" />

          <div className="hms-install-tabs">
            <button
              type="button"
              className="hms-install-tab"
              data-active={device === "ios" ? "true" : "false"}
              onClick={() => setDevice("ios")}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              iPhone / iPad
            </button>
            <button
              type="button"
              className="hms-install-tab"
              data-active={device === "android" ? "true" : "false"}
              onClick={() => setDevice("android")}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M17.523 15.341c-.74 0-1.34-.6-1.34-1.341 0-.74.6-1.34 1.34-1.34.74 0 1.34.6 1.34 1.34 0 .741-.6 1.341-1.34 1.341m-11.046 0c-.74 0-1.34-.6-1.34-1.341 0-.74.6-1.34 1.34-1.34.74 0 1.34.6 1.34 1.34 0 .741-.6 1.341-1.34 1.341m11.405-6.441l1.347-2.333a.28.28 0 0 0-.103-.383.282.282 0 0 0-.383.104L17.38 8.64C16.33 8.173 15.2 7.913 14 7.913s-2.33.26-3.38.727L9.257 6.288a.282.282 0 0 0-.383-.104.282.282 0 0 0-.103.383L10.118 8.9C7.697 10.15 6.07 12.584 6 15.4h12c-.07-2.816-1.697-5.25-4.118-6.5" />
              </svg>
              Android
            </button>
          </div>

          <div className="hms-install-steps">
            {steps.map((s) => (
              <div key={s.n} className="hms-install-step">
                <div className="hms-step-num">{s.n}</div>
                <div>
                  <div className="hms-step-title">{s.title}</div>
                  <div className="hms-step-desc">{s.desc}</div>
                  {s.hint ? (
                    <div className="hms-step-hint">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {s.hint}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-sm" style={{ color: "var(--hms-text3)" }}>
            More detail: <Link href="/install" className="text-[var(--hms-amber)] underline-offset-2 hover:underline">Install guide</Link>
          </p>
        </div>
      </section>

      <div className="hms-section">
        <div className="hms-section-label">Who it&apos;s for</div>
        <h2 className="hms-section-title">Four roles, one system.</h2>
        <p className="hms-section-sub">
          Every person in the halqa has a defined role. Access is automatically scoped — no extra configuration needed.
        </p>
        <div className="hms-divider" />
        <div className="hms-roles-grid">
          <div className="hms-role-card">
            <span className="hms-role-tag hms-tag-member">Member</span>
            <div className="hms-role-name">Member</div>
            <div className="hms-role-desc">Submits daily reports. Views personal history and Aiyanat status only.</div>
          </div>
          <div className="hms-role-card">
            <span className="hms-role-tag hms-tag-secretary">Secretary</span>
            <div className="hms-role-name">Secretary</div>
            <div className="hms-role-desc">Supports unit operations. Same dashboard access as Incharge for their unit.</div>
          </div>
          <div className="hms-role-card">
            <span className="hms-role-tag hms-tag-incharge">Incharge</span>
            <div className="hms-role-name">Incharge</div>
            <div className="hms-role-desc">Monitors their unit in real time. Approves registrations. Manages members.</div>
          </div>
          <div className="hms-role-card">
            <span className="hms-role-tag hms-tag-admin">Admin</span>
            <div className="hms-role-name">Admin</div>
            <div className="hms-role-desc">Full visibility across all halqas. Manages users, roles, and data exports.</div>
          </div>
        </div>
      </div>

      <section className="hms-cta-section">
        <h2 className="hms-cta-title">Ready to get started?</h2>
        <p className="hms-cta-sub">Register your account. Your Incharge will approve it and you&apos;ll be in.</p>
        <div className="hms-cta-actions">
          <Link href="/register" className="hms-btn-primary">
            Create account
          </Link>
          <Link href="/login" className="hms-cta-secondary">
            Sign in instead
          </Link>
        </div>
      </section>

      <AppAttributionFooter variant="marketing" />
    </div>
  );
}
