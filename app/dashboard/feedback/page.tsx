import { auth } from "@/auth";
import { formatHalqaLabel } from "@/lib/constants/halqas";
import { listMemberFeedbackForAdmin } from "@/lib/queries/member-feedback";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Member feedback</h1>
        <p className="text-muted-foreground text-sm">
          Ideas, bug reports, and requests submitted from member profiles. Newest first.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
          <CardDescription>
            {rows.length === 0
              ? "No feedback yet — members can send notes from Profile → App feedback."
              : `${rows.length} message${rows.length === 1 ? "" : "s"}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-0">
          {rows.length === 0 ? (
            <p className="text-muted-foreground px-6 pb-6 text-sm">Nothing to show yet.</p>
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
                      <TableCell className="align-top text-xs text-muted-foreground whitespace-nowrap">
                        {r.createdAt.toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="font-medium">{r.memberName}</div>
                        <div className="text-muted-foreground text-xs">{r.memberEmail}</div>
                      </TableCell>
                      <TableCell className="align-top text-sm">
                        {formatHalqaLabel(r.halqa)}
                        <span className="text-muted-foreground"> · </span>
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
        </CardContent>
      </Card>
    </div>
  );
}
