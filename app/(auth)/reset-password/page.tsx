import Link from "next/link";
import { AuthPage } from "@/components/auth/auth-page";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const valid = typeof token === "string" && token.length >= 10;

  return (
    <AuthPage
      title="Set a new password"
      description="Choose a strong password. You’ll be redirected to sign in when done."
      footer={
        <Link href="/login" className="hms-form-link font-semibold">
          ← Back to sign in
        </Link>
      }
    >
      {valid ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div
          className="rounded-2xl border px-4 py-4 text-center text-sm leading-relaxed"
          style={{
            borderColor: "var(--hms-danger)",
            background: "var(--hms-danger-bg)",
            color: "var(--hms-danger)",
          }}
        >
          This link is invalid or expired. Request a new reset from the forgot
          password page.
        </div>
      )}
    </AuthPage>
  );
}
