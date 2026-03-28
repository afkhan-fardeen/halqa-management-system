"use client";

import { useState, useTransition, type FormEvent } from "react";
import { requestPasswordReset } from "@/lib/actions/password-reset";
import { PASSWORD_RESET_EXPIRY_MINUTES } from "@/lib/constants/password-reset";
import { requestResetSchema, fieldErrorsFromZod } from "@/lib/validations/auth-forms";
import { Mail } from "lucide-react";
import { toast } from "sonner";

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    const fd = new FormData(e.currentTarget);
    const raw = { email: String(fd.get("email") ?? "") };
    const parsed = requestResetSchema.safeParse(raw);
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZod(parsed.error));
      toast.error("Invalid email", {
        description: "Enter a valid email address.",
      });
      return;
    }

    startTransition(async () => {
      const res = await requestPasswordReset(fd);
      if (res.error) {
        setError(res.error);
        toast.error("Couldn’t send email", { description: res.error });
        return;
      }
      setDone(true);
      toast.success("If an account exists, we sent a reset link");
    });
  }

  if (done) {
    return (
      <div
        className="space-y-4 rounded-2xl border px-5 py-7 text-center"
        style={{
          borderColor: "var(--hms-border)",
          background: "var(--hms-amber-pale)",
        }}
      >
        <div
          className="mx-auto flex size-14 items-center justify-center rounded-full"
          style={{ background: "var(--hms-bg2)", color: "var(--hms-amber)" }}
        >
          <Mail className="size-7" strokeWidth={1.75} aria-hidden />
        </div>
        <p className="text-base font-semibold" style={{ color: "var(--hms-text)" }}>
          Check your inbox
        </p>
        <p className="text-sm leading-relaxed" style={{ color: "var(--hms-text2)" }}>
          If an account exists for that email, you&apos;ll receive a reset link shortly.
          It expires in {PASSWORD_RESET_EXPIRY_MINUTES} minutes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error ? (
        <p
          className="rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: "var(--hms-danger)",
            background: "var(--hms-danger-bg)",
            color: "var(--hms-danger)",
          }}
          role="alert"
        >
          {error}
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
          aria-invalid={Boolean(fieldErrors.email)}
          className={`hms-input ${fieldErrors.email ? "hms-input-error" : ""}`}
        />
        {fieldErrors.email ? (
          <p className="text-xs" style={{ color: "var(--hms-danger)" }}>
            {fieldErrors.email}
          </p>
        ) : null}
      </div>
      <button type="submit" className="hms-submit-btn mt-1" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
