import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { AuthPage } from "@/components/auth/auth-page";
function safeCallbackUrl(raw: string | undefined): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/home";
  }
  return raw;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);

  return (
    <AuthPage
      eyebrow="Welcome back"
      title="Sign in"
      description="Use your Qalbee account email and password."
      footer={
        <p className="text-sm" style={{ color: "var(--hms-text3)" }}>
          No account?{" "}
          <Link href="/register" className="hms-form-link">
            Create an account
          </Link>
        </p>
      }
    >
      <LoginForm callbackUrl={callbackUrl} />
    </AuthPage>
  );
}
