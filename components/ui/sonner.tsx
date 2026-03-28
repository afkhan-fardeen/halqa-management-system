"use client";

import { useEffect, useState } from "react";
import { Toaster as Sonner } from "sonner";
import {
  MEMBER_COLOR_SCHEME_EVENT,
  MEMBER_COLOR_SCHEME_STORAGE_KEY,
} from "@/components/member/member-theme-provider";
import { CheckCircle2, CircleAlert, Info, Loader2 } from "lucide-react";

/** Horizontal center, ~30% of viewport height from the top (below status bar area on phones). */
const TOAST_TOP_OFFSET = "calc(30vh + env(safe-area-inset-top, 0px))";

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

/** Compact top-center “flair” toasts: amber-forward base, color accent bar, pill shape. */
export function Toaster() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  const flairBase =
    theme === "dark"
      ? "group !w-[min(100%,240px)] !max-w-[240px] !rounded-full !border !border-amber-700/35 !bg-gradient-to-r !from-amber-950/90 !to-stone-900/95 !px-3 !py-2 !shadow-[0_8px_28px_rgba(0,0,0,0.45)] !backdrop-blur-md !pl-3.5"
      : "group !w-[min(100%,240px)] !max-w-[240px] !rounded-full !border !border-amber-200/80 !bg-gradient-to-r !from-amber-50/95 !to-stone-50/98 !px-3 !py-2 !shadow-[0_8px_28px_rgba(217,119,6,0.14)] !backdrop-blur-md !pl-3.5";

  return (
    <Sonner
      theme={theme}
      richColors={false}
      position="top-center"
      offset={mounted ? { top: TOAST_TOP_OFFSET } : { top: "30vh" }}
      mobileOffset={mounted ? { top: TOAST_TOP_OFFSET } : { top: "30dvh" }}
      gap={6}
      visibleToasts={5}
      toastOptions={{
        duration: 3000,
        classNames: {
          toast: `${flairBase} !border-l-4`,
          title:
            theme === "dark"
              ? "!text-[13px] !font-semibold !leading-tight !text-amber-50"
              : "!text-[13px] !font-semibold !leading-tight !text-stone-900",
          description:
            theme === "dark"
              ? "!text-[11.5px] !leading-snug !text-amber-100/75 !mt-0.5"
              : "!text-[11.5px] !leading-snug !text-stone-600 !mt-0.5",
          success:
            theme === "dark"
              ? "!border-l-emerald-400 !from-emerald-950/85 !to-stone-900/95 !border-emerald-700/40 [&_[data-title]]:!text-emerald-50"
              : "!border-l-emerald-500 !from-emerald-50 !to-amber-50/90 !border-emerald-200/90 [&_[data-title]]:!text-emerald-950",
          error:
            theme === "dark"
              ? "!border-l-red-400 !from-red-950/90 !to-stone-900/95 !border-red-800/50 [&_[data-title]]:!text-red-50"
              : "!border-l-red-500 !from-red-50 !to-amber-50/85 !border-red-200/90 [&_[data-title]]:!text-red-950",
          warning:
            theme === "dark"
              ? "!border-l-amber-300 !from-amber-950/88 !to-stone-900/95 !border-amber-600/45 [&_[data-title]]:!text-amber-50"
              : "!border-l-amber-500 !from-amber-100 !to-amber-50/95 !border-amber-300/80 [&_[data-title]]:!text-amber-950",
          info:
            theme === "dark"
              ? "!border-l-amber-200 !from-amber-950/80 !to-stone-900/95 !border-amber-700/35 [&_[data-title]]:!text-amber-50"
              : "!border-l-amber-400 !from-amber-50 !to-stone-50 !border-amber-200/90 [&_[data-title]]:!text-stone-900",
          closeButton:
            theme === "dark"
              ? "!h-6 !w-6 !rounded-full !border-amber-700/40 !bg-stone-900/80 !text-amber-100/80 hover:!bg-stone-800"
              : "!h-6 !w-6 !rounded-full !border-amber-200/90 !bg-white/90 !text-stone-600 hover:!bg-amber-50",
        },
      }}
      icons={{
        success: (
          <CheckCircle2
            className={`size-3.5 shrink-0 ${theme === "dark" ? "text-emerald-400" : "text-emerald-600"}`}
            aria-hidden
          />
        ),
        error: (
          <CircleAlert
            className={`size-3.5 shrink-0 ${theme === "dark" ? "text-red-400" : "text-red-600"}`}
            aria-hidden
          />
        ),
        warning: (
          <Info
            className={`size-3.5 shrink-0 ${theme === "dark" ? "text-amber-300" : "text-amber-600"}`}
            aria-hidden
          />
        ),
        info: (
          <Info
            className={`size-3.5 shrink-0 ${theme === "dark" ? "text-amber-200" : "text-amber-700"}`}
            aria-hidden
          />
        ),
        loading: (
          <Loader2
            className={`size-3.5 shrink-0 animate-spin ${theme === "dark" ? "text-amber-300" : "text-amber-600"}`}
            aria-hidden
          />
        ),
      }}
      closeButton
    />
  );
}
