import type { ReactNode } from "react";
import { HmsAuthShell } from "@/components/auth/hms-auth-shell";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <HmsAuthShell>{children}</HmsAuthShell>;
}
