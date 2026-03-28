import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { AuthPage } from "@/components/auth/auth-page";
function safeCallbackUrl(raw: string | undefined): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/";
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
      title="Sign in"
      description="Welcome back. Sign in with your Qalbee account email and password."
      footer={
        <p className="text-center text-sm text-stone-600 dark:text-stone-400">
          No account?{" "}
          <Link
            href="/register"
            className="font-semibold text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400"
          >
            Create an account
          </Link>
        </p>
      }
    >
      <LoginForm callbackUrl={callbackUrl} />
    </AuthPage>
  );
}
