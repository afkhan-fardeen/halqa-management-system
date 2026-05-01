import Link from "next/link";
import { auth } from "@/auth";
import { AttendanceSessionEditForm } from "@/components/dashboard/attendance-session-edit-form";
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
import {
  formatSessionRangeBahrain12h,
  formatTimeHHMMBahrain,
} from "@/lib/attendance/time-12h";

function sessionDateToYmd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

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

  const initialYmd = sessionDateToYmd(data.session.sessionDate);
  const initialStart24 = formatTimeHHMMBahrain(data.session.startsAt);
  const initialEnd24 = formatTimeHHMMBahrain(data.session.endsAt);

  return (
    <div className="space-y-8 md:space-y-10">
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

      <StaffPanel
        title="Edit session"
        description="Change the calendar date or start/end times (Asia/Bahrain). Members see updates on refresh."
      >
        <AttendanceSessionEditForm
          sessionId={data.session.id}
          initialYmd={initialYmd}
          initialStart24={initialStart24}
          initialEnd24={initialEnd24}
        />
      </StaffPanel>

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
