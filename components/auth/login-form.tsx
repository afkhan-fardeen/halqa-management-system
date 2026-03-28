"use client";

import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { Alert, Button, Link as MuiLink, Stack, TextField, Typography } from "@mui/material";
import { PasswordInput } from "@/components/auth/password-input";
import {
  loginFormSchema,
  fieldErrorsFromZod,
} from "@/lib/validations/auth-forms";
import { toast } from "sonner";

export function LoginForm({ callbackUrl = "/" }: { callbackUrl?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
            ? "Check email and password. Dev admin: run npm run db:seed (admin@example.com / ChangeMe123). If that user already exists, run npm run db:reset-admin-password."
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
    <form onSubmit={onSubmit} noValidate>
      <Stack spacing={2.5}>
        {Object.keys(fieldErrors).length > 0 ? (
          <Alert severity="error" variant="outlined">
            Please fix the fields below.
          </Alert>
        ) : null}
        <TextField
          id="email"
          name="email"
          type="email"
          label="Email"
          placeholder="name@example.com"
          autoComplete="email"
          required
          fullWidth
          error={Boolean(fieldErrors.email)}
          helperText={fieldErrors.email}
        />
        <PasswordInput
          name="password"
          label="Password"
          placeholder="Enter your password"
          required
          error={Boolean(fieldErrors.password)}
          helperText={fieldErrors.password}
          autoComplete="current-password"
        />
        <Button type="submit" variant="contained" size="large" fullWidth disabled={pending} sx={{ py: 1.5 }}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
        <Typography align="center" variant="body2">
          <MuiLink component={Link} href="/forgot-password" color="inherit" underline="hover" fontWeight={600}>
            Forgot password?
          </MuiLink>
        </Typography>
      </Stack>
    </form>
  );
}
