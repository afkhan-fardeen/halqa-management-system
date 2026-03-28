"use client";

import {
  startTransition,
  useActionState,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/password-input";
import {
  authInputClassName,
  authSelectClassName,
} from "@/components/auth/auth-field-styles";
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
      <div className="border-primary/15 bg-primary/5 space-y-5 rounded-2xl border px-5 py-8 text-center">
        <div className="bg-primary/12 text-primary mx-auto flex size-16 items-center justify-center rounded-full">
          <CheckCircle2 className="size-9" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="space-y-2">
          <p className="text-foreground text-base font-semibold">
            Request received
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your halqa Incharge or an administrator will review your request.
            You&apos;ll get an email when your account is approved.
          </p>
        </div>
        <Link
          href="/login"
          className={cn(
            buttonVariants({ size: "lg" }),
            "inline-flex h-12 w-full justify-center rounded-xl text-base font-semibold",
          )}
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5" noValidate>
      {state.error ? (
        <p
          className="border-destructive/25 bg-destructive/5 text-destructive rounded-2xl border px-4 py-3 text-sm"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      <div className="grid gap-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Full name
        </Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          placeholder="Your full name"
          required
          aria-invalid={Boolean(fieldErrors.name)}
          className={authInputClassName}
        />
        {fieldErrors.name ? (
          <p className="text-destructive text-xs">{fieldErrors.name}</p>
        ) : null}
      </div>
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
      <div className="grid gap-2">
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
      <div className="grid gap-2">
        <Label htmlFor="phone" className="text-sm font-medium">
          Phone
        </Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+973 …"
          required
          aria-invalid={Boolean(fieldErrors.phone)}
          className={authInputClassName}
        />
        {fieldErrors.phone ? (
          <p className="text-destructive text-xs">{fieldErrors.phone}</p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="halqa" className="text-sm font-medium">
          Halqa
        </Label>
        <select
          id="halqa"
          name="halqa"
          required
          aria-invalid={Boolean(fieldErrors.halqa)}
          className={authSelectClassName}
        >
          <option value="">Select halqa</option>
          <option value="MANAMA">Manama</option>
          <option value="RIFFA">Riffa</option>
          <option value="MUHARRAQ">Muharraq</option>
          <option value="UMM_AL_HASSAM">Umm Al Hassam</option>
        </select>
        {fieldErrors.halqa ? (
          <p className="text-destructive text-xs">{fieldErrors.halqa}</p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="genderUnit" className="text-sm font-medium">
          Gender
        </Label>
        <select
          id="genderUnit"
          name="genderUnit"
          required
          aria-invalid={Boolean(fieldErrors.genderUnit)}
          className={authSelectClassName}
        >
          <option value="">Select gender</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>
        {fieldErrors.genderUnit ? (
          <p className="text-destructive text-xs">{fieldErrors.genderUnit}</p>
        ) : null}
      </div>
      <Button
        type="submit"
        className="h-12 w-full rounded-xl text-base font-semibold shadow-md"
        disabled={pending}
      >
        {pending ? "Submitting…" : "Submit request"}
      </Button>
    </form>
  );
}
