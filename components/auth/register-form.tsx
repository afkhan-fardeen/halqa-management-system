"use client";

import {
  startTransition,
  useActionState,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { PasswordInput } from "@/components/auth/password-input";
import {
  registerSchema,
  fieldErrorsFromZod,
} from "@/lib/validations/auth-forms";
import {
  registerAction,
  type RegisterState,
} from "@/lib/actions/register";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const initialState: RegisterState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState,
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    const fd = new FormData(e.currentTarget);
    const raw = {
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      halqa: String(fd.get("halqa") ?? ""),
      genderUnit: String(fd.get("genderUnit") ?? ""),
    };

    const parsed = registerSchema.safeParse(raw);
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZod(parsed.error));
      toast.error("Check your details", {
        description: "Fix the highlighted fields and try again.",
      });
      return;
    }

    startTransition(() => {
      formAction(fd);
    });
  }

  if (state.success) {
    return (
      <div
        className="space-y-5 rounded-2xl border px-5 py-8 text-center"
        style={{
          borderColor: "var(--hms-border)",
          background: "var(--hms-amber-pale)",
        }}
      >
        <div
          className="mx-auto flex size-16 items-center justify-center rounded-full"
          style={{ background: "var(--hms-bg2)", color: "var(--hms-amber)" }}
        >
          <CheckCircle2 className="size-9" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="space-y-2">
          <p className="text-base font-semibold" style={{ color: "var(--hms-text)" }}>
            Request received
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--hms-text2)" }}>
            Your halqa Incharge or an administrator will review your request. You&apos;ll get an email when your
            account is approved.
          </p>
        </div>
        <Link href="/login" className="hms-submit-btn inline-flex w-full no-underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3.5" noValidate>
      {state.error ? (
        <p
          className="rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: "var(--hms-danger)",
            background: "var(--hms-danger-bg)",
            color: "var(--hms-danger)",
          }}
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <div className="grid gap-3.5 sm:grid-cols-2">
        <div className="hms-field">
          <label className="hms-label" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Your full name"
            required
            className={`hms-input ${fieldErrors.name ? "hms-input-error" : ""}`}
          />
          {fieldErrors.name ? (
            <p className="text-xs" style={{ color: "var(--hms-danger)" }}>
              {fieldErrors.name}
            </p>
          ) : null}
        </div>
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
          />
          {fieldErrors.email ? (
            <p className="text-xs" style={{ color: "var(--hms-danger)" }}>
              {fieldErrors.email}
            </p>
          ) : null}
        </div>
      </div>
      <div className="hms-field">
        <PasswordInput
          id="password"
          name="password"
          label="Password"
          placeholder="At least 8 characters, one number"
          autoComplete="new-password"
          required
          inputProps={{ minLength: 8 }}
          error={Boolean(fieldErrors.password)}
          helperText={
            fieldErrors.password
              ? fieldErrors.password
              : "At least 8 characters and one number."
          }
        />
      </div>
      <div className="hms-field">
        <label className="hms-label" htmlFor="phone">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+973 …"
          required
          className={`hms-input ${fieldErrors.phone ? "hms-input-error" : ""}`}
        />
        {fieldErrors.phone ? (
          <p className="text-xs" style={{ color: "var(--hms-danger)" }}>
            {fieldErrors.phone}
          </p>
        ) : null}
      </div>
      <div className="grid gap-3.5 sm:grid-cols-2">
        <div className="hms-field">
          <label className="hms-label" htmlFor="halqa">
            Halqa
          </label>
          <select
            id="halqa"
            name="halqa"
            required
            className={`hms-select ${fieldErrors.halqa ? "hms-input-error" : ""}`}
          >
            <option value="">Select halqa</option>
            <option value="MANAMA">Manama</option>
            <option value="RIFFA">Riffa</option>
            <option value="MUHARRAQ">Muharraq</option>
            <option value="UMM_AL_HASSAM">Umm Al Hassam</option>
          </select>
          {fieldErrors.halqa ? (
            <p className="text-xs" style={{ color: "var(--hms-danger)" }}>
              {fieldErrors.halqa}
            </p>
          ) : null}
        </div>
        <div className="hms-field">
          <label className="hms-label" htmlFor="genderUnit">
            Gender
          </label>
          <select
            id="genderUnit"
            name="genderUnit"
            required
            className={`hms-select ${fieldErrors.genderUnit ? "hms-input-error" : ""}`}
          >
            <option value="">Select gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          {fieldErrors.genderUnit ? (
            <p className="text-xs" style={{ color: "var(--hms-danger)" }}>
              {fieldErrors.genderUnit}
            </p>
          ) : null}
        </div>
      </div>
      <button type="submit" className="hms-submit-btn mt-1" disabled={pending}>
        {pending ? "Submitting…" : "Submit request"}
      </button>
    </form>
  );
}
