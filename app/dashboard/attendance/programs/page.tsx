import Link from "next/link";
import { auth } from "@/auth";
import { AttendanceAddSessionForm } from "@/components/dashboard/attendance-add-session-form";
import {
  AttendanceProgramForm,
  AttendanceProgramRowActions,
} from "@/components/dashboard/attendance-program-form";
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
import { listAttendanceProgramsForStaff } from "@/lib/queries/attendance";
import { attendanceKindLabel } from "@/lib/attendance/labels";
import { formatHalqaLabel } from "@/lib/constants/halqas";
import { formatTimeRange12hFrom24hStrings } from "@/lib/attendance/time-12h";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function DashboardAttendanceProgramsPage() {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    redirect("/login");
  }

  const list = await listAttendanceProgramsForStaff(session.user);
  if ("error" in list) {
    return <p className="text-destructive text-sm">{list.error}</p>;
  }

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/dashboard"
          className={buttonVariants({
            variant: "link",
            className: "text-muted-foreground h-auto p-0 text-sm",
          })}
        >
          ← Dashboard
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Attendance programs
        </h1>
        <p className="text-muted-foreground text-sm">
          Create a program per halqa, gender, and kind, then add each class session on the date
          and time you need. Members mark attendance and see their history.
          {!isAdmin ? " You can only manage your halqa and gender unit." : ""}
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Create or update program</CardTitle>
          <CardDescription>
            One row per halqa, gender, and kind (Dawati or Tarbiyati). Add dated sessions in the
            next card.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceProgramForm
            isAdmin={isAdmin}
            defaultHalqa={session.user.halqa}
            defaultGenderUnit={session.user.genderUnit}
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Add a session</CardTitle>
          <CardDescription>
            Choose program, session date, and start/end time (Asia/Bahrain). One session per
            program per calendar day.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceAddSessionForm
            programs={list.programs.map((p) => ({
              id: p.id,
              label: `${formatHalqaLabel(p.halqa)} · ${p.genderUnit} · ${attendanceKindLabel(p.kind)}${p.title ? ` — ${p.title}` : ""}`,
            }))}
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Programs in scope</CardTitle>
          <CardDescription>
            Open a session to see member marks and send reminders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {list.programs.length === 0 ? (
            <p className="text-muted-foreground text-sm">No programs yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Halqa</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Kind</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.programs.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{formatHalqaLabel(p.halqa)}</TableCell>
                    <TableCell>{p.genderUnit}</TableCell>
                    <TableCell>{attendanceKindLabel(p.kind)}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {p.weekday != null && p.startTime && p.endTime ? (
                        <>
                          {WEEKDAYS[p.weekday]}{" "}
                          {formatTimeRange12hFrom24hStrings(p.startTime, p.endTime)}
                        </>
                      ) : (
                        <span className="text-muted-foreground">Per session date</span>
                      )}
                    </TableCell>
                    <TableCell>{p.isActive ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-2">
                        <Link
                          href={`/dashboard/attendance/sessions?program=${p.id}`}
                          className={buttonVariants({ variant: "link", className: "h-auto p-0 text-sm" })}
                        >
                          Sessions →
                        </Link>
                        <AttendanceProgramRowActions
                          programId={p.id}
                          showRecurringRefresh={
                            p.weekday != null &&
                            Boolean(p.startTime) &&
                            Boolean(p.endTime)
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
