import Link from "next/link";
import { auth } from "@/auth";
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
      <p className="text-destructive text-sm">
        {p.error === "Not found" ? "Program not found." : p.error}
      </p>
    );
  }

  const sessions = await listSessionsForProgramForStaff(programId, session.user);
  if ("error" in sessions) {
    return <p className="text-destructive text-sm">{sessions.error}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/dashboard/attendance/programs"
          className={buttonVariants({
            variant: "link",
            className: "text-muted-foreground h-auto p-0 text-sm",
          })}
        >
          ← Programs
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Sessions
        </h1>
        <p className="text-muted-foreground text-sm">
          Choose a session to view marks and notify members.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Upcoming & recent</CardTitle>
          <CardDescription>
            Program ID: {programId.slice(0, 8)}…
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.sessions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No sessions materialized yet. Save the program or use Refresh sessions.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Starts (UTC)</TableHead>
                  <TableHead className="text-right">Detail</TableHead>
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
                    <TableCell className="text-xs text-muted-foreground">
                      {s.startsAt.toISOString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/dashboard/attendance/sessions/${s.id}`}
                        className={buttonVariants({
                          variant: "link",
                          className: "h-auto p-0 text-sm",
                        })}
                      >
                        Open →
                      </Link>
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
