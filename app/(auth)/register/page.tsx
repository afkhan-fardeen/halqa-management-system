import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { AuthPage } from "@/components/auth/auth-page";

export default function RegisterPage() {
  return (
    <AuthPage
      wide
      eyebrow="Request access"
      title="Create an account"
      description="Request access to your halqa. An Incharge or administrator will review your details before you can sign in."
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/login" className="hms-form-link font-semibold">
            Sign in
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthPage>
  );
}
