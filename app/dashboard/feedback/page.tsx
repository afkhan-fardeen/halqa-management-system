import { auth } from "@/auth";
import {
  StaffPageHeader,
  StaffPanel,
} from "@/components/dashboard/staff-page-section";
import { formatHalqaLabel } from "@/lib/constants/halqas";
import { listMemberFeedbackForAdmin } from "@/lib/queries/member-feedback";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { redirect } from "next/navigation";

export default async function DashboardMemberFeedbackPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const rows = await listMemberFeedbackForAdmin();

  return (
    <div className="space-y-8">
      <StaffPageHeader
        title="Member feedback"
        description="Ideas, bug reports, and requests submitted from member profiles. Newest first."
      />

      <StaffPanel
        title="Inbox"
        description={
          rows.length === 0
            ? "No feedback yet — members can send notes from Profile → App feedback."
            : `${rows.length} message${rows.length === 1 ? "" : "s"}`
        }
      >
        {rows.length === 0 ? (
          <p className="text-sm text-staff-on-surface-variant">Nothing to show yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[140px]">When</TableHead>
                  <TableHead className="min-w-[160px]">Member</TableHead>
                  <TableHead className="min-w-[120px]">Unit</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="align-top whitespace-nowrap text-xs text-staff-on-surface-variant">
                      {r.createdAt.toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="font-medium">{r.memberName}</div>
                      <div className="text-xs text-staff-on-surface-variant">
                        {r.memberEmail}
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-sm">
                      {formatHalqaLabel(r.halqa)}
                      <span className="text-staff-on-surface-variant"> · </span>
                      {r.genderUnit}
                    </TableCell>
                    <TableCell className="align-top max-w-[min(100vw-2rem,32rem)] whitespace-pre-wrap text-sm">
                      {r.message}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </StaffPanel>
    </div>
  );
}
