import Link from "next/link";
import { auth } from "@/auth";
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
import { formatSessionRangeBahrain12h } from "@/lib/attendance/time-12h";
import { AttendanceDeleteSessionButton } from "@/components/dashboard/attendance-delete-session-button";
import { AttendanceSessionReminderButton } from "@/components/dashboard/attendance-session-reminder-button";
import {
  getAttendanceProgramByIdForStaff,
  listSessionsForProgramForStaff,
} from "@/lib/queries/attendance";

export default async function DashboardAttendanceSessionsListPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    redirect("/login");
  }

  const sp = await searchParams;
  const programId = sp.program?.trim();
  if (!programId) {
    redirect("/dashboard/attendance/programs");
  }

  const p = await getAttendanceProgramByIdForStaff(programId, session.user);
  if ("error" in p) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">
        {p.error === "Not found" ? "Program not found." : p.error}
      </p>
    );
  }

  const sessions = await listSessionsForProgramForStaff(programId, session.user);
  if ("error" in sessions) {
    return <p className="text-sm text-red-600 dark:text-red-400">{sessions.error}</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard/attendance/programs"
          className={buttonVariants({
            variant: "link",
            className:
              "h-auto p-0 text-sm text-staff-on-surface-variant hover:text-staff-primary",
          })}
        >
          ← Programs
        </Link>
      </div>

      <StaffPageHeader
        title="Sessions"
        description="Choose a session to view marks and notify members."
      />

      <StaffPanel
        title="Upcoming & recent"
        description={`Program ID: ${programId.slice(0, 8)}…`}
      >
        {sessions.sessions.length === 0 ? (
          <p className="text-sm text-staff-on-surface-variant">
            No sessions materialized yet. Save the program or use Refresh sessions.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time (Bahrain)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.sessions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    {s.sessionDate.toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      timeZone: "Asia/Bahrain",
                    })}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatSessionRangeBahrain12h(s.startsAt, s.endsAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Link
                        href={`/dashboard/attendance/sessions/${s.id}`}
                        className={buttonVariants({
                          variant: "link",
                          className: "h-auto p-0 text-sm",
                        })}
                      >
                        Open →
                      </Link>
                      <AttendanceSessionReminderButton sessionId={s.id} />
                      <AttendanceDeleteSessionButton
                        sessionId={s.id}
                        programId={programId}
                        variant="list"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </StaffPanel>
    </div>
  );
}
