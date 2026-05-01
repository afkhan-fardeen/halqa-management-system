import type { ReactNode } from "react";
import { MemberLayoutShell } from "@/components/member/member-layout-shell";
import { MemberStyleRoot } from "@/components/member/member-style-root";
import { MemberTopBar } from "@/components/member/member-top-bar";

export default async function MemberLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <MemberStyleRoot>
      <MemberLayoutShell>
        <MemberTopBar />
        {children}
      </MemberLayoutShell>
    </MemberStyleRoot>
  );
}
