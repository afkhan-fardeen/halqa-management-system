"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { resetPasswordWithToken } from "@/lib/actions/password-reset";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/password-input";
import {
  resetPasswordFormSchema,
  fieldErrorsFromZod,
} from "@/lib/validations/auth-forms";
import { toast } from "sonner";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldErrors({});
    const fd = new FormData(e.currentTarget);
    const raw = {
      password: String(fd.get("password") ?? ""),
      confirm: String(fd.get("confirm") ?? ""),
    };
    const parsed = resetPasswordFormSchema.safeParse(raw);
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZod(parsed.error));
      toast.error("Check your passwords", {
        description: "Fix the highlighted fields and try again.",
      });
      return;
    }

    fd.set("token", token);
    startTransition(async () => {
      const res = await resetPasswordWithToken(fd);
      if (res.error) {
        toast.error("Couldn’t update password", { description: res.error });
        return;
      }
      toast.success("Password updated — sign in with your new password");
      router.push("/login");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5" noValidate>
      <input type="hidden" name="token" value={token} readOnly />
      <div className="grid gap-2">
        <Label htmlFor="password" className="text-sm font-medium">
          New password
        </Label>
        <PasswordInput
          id="password"
          name="password"
          label="New password"
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
        <Label htmlFor="confirm" className="text-sm font-medium">
          Confirm password
        </Label>
        <PasswordInput
          id="confirm"
          name="confirm"
          label="Confirm password"
          placeholder="Re-enter your new password"
          autoComplete="new-password"
          required
          inputProps={{ minLength: 8 }}
          error={Boolean(fieldErrors.confirm)}
          helperText={fieldErrors.confirm}
        />
      </div>
      <Button
        type="submit"
        className="h-12 w-full rounded-xl text-base font-semibold shadow-md"
        disabled={pending}
      >
        {pending ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}
