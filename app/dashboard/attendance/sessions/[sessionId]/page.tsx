import Link from "next/link";
import { auth } from "@/auth";
import { AttendanceSessionNudgeForm } from "@/components/dashboard/attendance-session-nudge";
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
import { buttonVariants } from "@/components/ui/button-variants";
import { isStaffRole } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { listMarksForSessionForStaff } from "@/lib/queries/attendance";
import { attendanceProgramDisplayTitle } from "@/lib/attendance/labels";

export default async function DashboardAttendanceSessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    redirect("/login");
  }

  const { sessionId } = await params;

  const data = await listMarksForSessionForStaff(sessionId, session.user);
  if ("error" in data) {
    return (
      <p className="text-destructive text-sm">
        {data.error === "Not found" ? "Session not found." : data.error}
      </p>
    );
  }

  const title = attendanceProgramDisplayTitle(data.program);
  const dateLabel = data.session.sessionDate.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Bahrain",
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Link
          href={`/dashboard/attendance/sessions?program=${data.program.id}`}
          className={buttonVariants({
            variant: "link",
            className: "text-muted-foreground h-auto p-0 text-sm",
          })}
        >
          ← Sessions
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="text-muted-foreground text-sm">{dateLabel}</p>
      </div>

      <AttendanceSessionNudgeForm sessionId={data.session.id} />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Member marks</CardTitle>
          <CardDescription>
            Active members in this halqa and gender unit; those without a row have not marked yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.marks.map((m) => (
                <TableRow key={m.userId}>
                  <TableCell className="font-medium">{m.memberName}</TableCell>
                  <TableCell>{m.status ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {m.status === "LATE" && m.lateReason
                      ? m.lateReason
                      : m.status === "ABSENT" && m.absentReason
                        ? m.absentReason
                        : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
