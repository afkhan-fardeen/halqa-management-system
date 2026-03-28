import Link from "next/link";
import { auth } from "@/auth";
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
          Set up Dawati dars and Tarbiyati class schedules per halqa and gender. Sessions are
          generated for the next several weeks.
          {!isAdmin
            ? " You can only manage your halqa and gender unit."
            : ""}
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Create or update</CardTitle>
          <CardDescription>
            One active program per halqa, gender, and kind (Dawati or Tarbiyati). Saving updates
            the schedule and materializes upcoming sessions.
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
                  <TableHead>When</TableHead>
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
                      {WEEKDAYS[p.weekday] ?? "—"}{" "}
                      {formatTimeRange12hFrom24hStrings(p.startTime, p.endTime)}
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
                        <AttendanceProgramRowActions programId={p.id} />
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
