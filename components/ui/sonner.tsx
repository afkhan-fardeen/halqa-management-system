"use client";

import { useEffect, useState } from "react";
import { Toaster as Sonner } from "sonner";
import {
  MEMBER_COLOR_SCHEME_EVENT,
  MEMBER_COLOR_SCHEME_STORAGE_KEY,
} from "@/components/member/member-theme-provider";

function readToastTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  try {
    const s = window.localStorage.getItem(MEMBER_COLOR_SCHEME_STORAGE_KEY);
    if (s === "light" || s === "dark") return s;
  } catch {
    /* ignore */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Sonner defaults with light/dark theme synced to member color scheme. */
export function Toaster() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTheme(readToastTheme());
    const onScheme = (e: Event) => {
      const d = (e as CustomEvent<"light" | "dark">).detail;
      if (d === "light" || d === "dark") {
        queueMicrotask(() => setTheme(d));
      }
    };
    window.addEventListener(MEMBER_COLOR_SCHEME_EVENT, onScheme as EventListener);
    return () =>
      window.removeEventListener(
        MEMBER_COLOR_SCHEME_EVENT,
        onScheme as EventListener,
      );
  }, []);

  return <Sonner theme={theme} richColors closeButton />;
}
