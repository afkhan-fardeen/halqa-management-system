import { auth } from "@/auth";
import { MemberOutreachPanel } from "@/components/member/member-outreach-panel";
import { MemberPageShell } from "@/components/member/member-page-shell";
import { MemberScreenHeader } from "@/components/member/member-screen-header";
import { listOutreachForMember } from "@/lib/queries/outreach";
import { redirect } from "next/navigation";

export default async function OutreachPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "MEMBER") {
    redirect("/login");
  }

  const rows = await listOutreachForMember(session.user.id);

  return (
    <MemberPageShell>
      <MemberScreenHeader
        eyebrow="Raabta"
        title="Raabta"
        description="Record da'wah contacts — separate from your daily worship log."
      />

      <MemberOutreachPanel rows={rows} />
    </MemberPageShell>
  );
}
