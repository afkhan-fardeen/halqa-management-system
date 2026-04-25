"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createMemberTheme } from "@/lib/theme/member-theme";

export const MEMBER_COLOR_SCHEME_STORAGE_KEY = "member-color-scheme";

/** Fired when member light/dark changes (same tab + other tabs via storage). */
export const MEMBER_COLOR_SCHEME_EVENT = "qalbee:member-color-scheme";

type Scheme = "light" | "dark";

type Ctx = {
  mode: Scheme;
  toggleColorScheme: () => void;
  setMode: (m: Scheme) => void;
};

const MemberThemeCtx = createContext<Ctx | null>(null);

export function useMemberTheme() {
  const v = useContext(MemberThemeCtx);
  if (!v) throw new Error("useMemberTheme must be used under MemberThemeProvider");
  return v;
}

function readInitial(): Scheme {
  if (typeof window === "undefined") return "light";
  const s = window.localStorage.getItem(
    MEMBER_COLOR_SCHEME_STORAGE_KEY,
  ) as Scheme | null;
  if (s === "light" || s === "dark") return s;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function MemberThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Scheme>("light");

  useEffect(() => {
    const initial = readInitial();
    queueMicrotask(() => setModeState(initial));
    queueMicrotask(() => {
      try {
        window.dispatchEvent(
          new CustomEvent(MEMBER_COLOR_SCHEME_EVENT, { detail: initial }),
        );
      } catch {
        /* ignore */
      }
    });
  }, []);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== MEMBER_COLOR_SCHEME_STORAGE_KEY || !e.newValue) return;
      if (e.newValue === "light" || e.newValue === "dark") {
        setModeState(e.newValue);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setMode = useCallback((m: Scheme) => {
    setModeState(m);
    queueMicrotask(() => {
      try {
        window.localStorage.setItem(MEMBER_COLOR_SCHEME_STORAGE_KEY, m);
      } catch {
        /* ignore */
      }
      try {
        window.dispatchEvent(
          new CustomEvent(MEMBER_COLOR_SCHEME_EVENT, { detail: m }),
        );
      } catch {
        /* ignore */
      }
    });
  }, []);

  const toggleColorScheme = useCallback(() => {
    setModeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      // Never dispatch / write storage inside the updater — it can run during render
      // and synchronously updates other components (e.g. Sonner Toaster).
      queueMicrotask(() => {
        try {
          window.localStorage.setItem(MEMBER_COLOR_SCHEME_STORAGE_KEY, next);
        } catch {
          /* ignore */
        }
        try {
          window.dispatchEvent(
            new CustomEvent(MEMBER_COLOR_SCHEME_EVENT, { detail: next }),
          );
        } catch {
          /* ignore */
        }
      });
      return next;
    });
  }, []);

  const theme = useMemo(() => createMemberTheme(mode), [mode]);

  const value = useMemo(
    () => ({ mode, toggleColorScheme, setMode }),
    [mode, toggleColorScheme, setMode],
  );

  return (
    <MemberThemeCtx.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </MemberThemeCtx.Provider>
  );
}
