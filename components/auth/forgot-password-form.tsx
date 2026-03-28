"use client";

import { useState, useTransition, type FormEvent } from "react";
import { requestPasswordReset } from "@/lib/actions/password-reset";
import { PASSWORD_RESET_EXPIRY_MINUTES } from "@/lib/constants/password-reset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authInputClassName } from "@/components/auth/auth-field-styles";
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
      <div className="border-primary/15 bg-primary/5 space-y-4 rounded-2xl border px-5 py-7 text-center">
        <div className="bg-primary/12 text-primary mx-auto flex size-14 items-center justify-center rounded-full">
          <Mail className="size-7" strokeWidth={1.75} aria-hidden />
        </div>
        <p className="text-foreground text-base font-semibold">Check your inbox</p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          If an account exists for that email, you&apos;ll receive a reset link
          shortly. It expires in {PASSWORD_RESET_EXPIRY_MINUTES} minutes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5" noValidate>
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <div className="grid gap-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          required
          aria-invalid={Boolean(fieldErrors.email)}
          className={authInputClassName}
        />
        {fieldErrors.email ? (
          <p className="text-destructive text-xs">{fieldErrors.email}</p>
        ) : null}
      </div>
      <Button
        type="submit"
        className="h-12 w-full rounded-xl text-base font-semibold shadow-md"
        disabled={pending}
      >
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
