import Link from "next/link";
import { auth } from "@/auth";
import { AttendanceSessionNudgeForm } from "@/components/dashboard/attendance-session-nudge";
import {
  StaffPageHeader,
  StaffPanel,
} from "@/components/dashboard/staff-page-section";
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
import { AttendanceDeleteSessionButton } from "@/components/dashboard/attendance-delete-session-button";
import { listMarksForSessionForStaff } from "@/lib/queries/attendance";
import { attendanceProgramDisplayTitle } from "@/lib/attendance/labels";
import { formatSessionRangeBahrain12h } from "@/lib/attendance/time-12h";

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
      <p className="text-sm text-red-600 dark:text-red-400">
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
  const timeLabel = formatSessionRangeBahrain12h(
    data.session.startsAt,
    data.session.endsAt,
  );

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/dashboard/attendance/sessions?program=${data.program.id}`}
          className={buttonVariants({
            variant: "link",
            className:
              "h-auto p-0 text-sm text-staff-on-surface-variant hover:text-staff-primary",
          })}
        >
          ← Sessions
        </Link>
      </div>

      <StaffPageHeader
        title={title}
        description={
          <>
            <span className="block">{dateLabel}</span>
            <span className="block">{timeLabel}</span>
          </>
        }
        action={
          <AttendanceDeleteSessionButton
            sessionId={data.session.id}
            programId={data.program.id}
            variant="detail"
          />
        }
      />

      <AttendanceSessionNudgeForm sessionId={data.session.id} />

      <StaffPanel
        title="Member marks"
        description="Active members in this halqa and gender unit; those without a row have not marked yet."
      >
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
                <TableCell className="text-xs text-staff-on-surface-variant">
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
      </StaffPanel>
    </div>
  );
}
