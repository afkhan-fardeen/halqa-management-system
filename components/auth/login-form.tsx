"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import {
  loginFormSchema,
  fieldErrorsFromZod,
} from "@/lib/validations/auth-forms";
import { toast } from "sonner";

export function LoginForm({ callbackUrl = "/home" }: { callbackUrl?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPw, setShowPw] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    const form = new FormData(e.currentTarget);
    const raw = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };

    const parsed = loginFormSchema.safeParse(raw);
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZod(parsed.error));
      toast.error("Check your details", {
        description: "Fix the highlighted fields and try again.",
      });
      return;
    }

    setPending(true);
    const email = parsed.data.email.trim().toLowerCase();
    const res = await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirect: false,
      callbackUrl,
    });

    setPending(false);

    if (res?.error) {
      if (res.code === "database_unavailable") {
        toast.error("Cannot reach the database", {
          description:
            "Start PostgreSQL and check DATABASE_URL in .env.local, then try again.",
        });
        return;
      }
      if (res.code === "inactive") {
        toast.error("Account not active", {
          description:
            "Your registration is pending approval. You’ll get an email when your account is ready.",
        });
        return;
      }
      toast.error("Sign-in failed", {
        description:
          res.code === "credentials"
            ? "Check email and password."
            : "Wrong email or password, or your account is not active yet.",
      });
      return;
    }

    if (res?.ok) {
      toast.success("Signed in");
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {Object.keys(fieldErrors).length > 0 ? (
        <p
          className="rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: "var(--hms-danger)",
            background: "var(--hms-danger-bg)",
            color: "var(--hms-danger)",
          }}
          role="alert"
        >
          Please fix the fields below.
        </p>
      ) : null}
      <div className="hms-field">
        <label className="hms-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          required
          className={`hms-input ${fieldErrors.email ? "hms-input-error" : ""}`}
          aria-invalid={Boolean(fieldErrors.email)}
        />
        {fieldErrors.email ? (
          <p className="text-xs" style={{ color: "var(--hms-danger)" }}>
            {fieldErrors.email}
          </p>
        ) : null}
      </div>
      <div className="hms-field">
        <label className="hms-label" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            className={`hms-input pr-11 ${fieldErrors.password ? "hms-input-error" : ""}`}
            aria-invalid={Boolean(fieldErrors.password)}
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent p-1"
            style={{ color: "var(--hms-text3)" }}
            onClick={() => setShowPw((s) => !s)}
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        {fieldErrors.password ? (
          <p className="text-xs" style={{ color: "var(--hms-danger)" }}>
            {fieldErrors.password}
          </p>
        ) : null}
      </div>
      <button type="submit" className="hms-submit-btn mt-1" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm" style={{ color: "var(--hms-text2)" }}>
        <Link href="/forgot-password" className="hms-form-link">
          Forgot password?
        </Link>
      </p>
    </form>
  );
}
