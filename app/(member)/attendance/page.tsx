import Link from "next/link";
import { auth } from "@/auth";
import { MemberPageShell } from "@/components/member/member-page-shell";
import {
  MemberAttendanceList,
  type MemberAttendanceRow,
} from "@/components/member/attendance/member-attendance-list";
import { listMemberAttendanceSessions } from "@/lib/queries/attendance";
import { redirect } from "next/navigation";
import { Box, Typography } from "@mui/material";

export default async function MemberAttendancePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "MEMBER") {
    redirect("/login");
  }
  if (session.user.status !== "ACTIVE") {
    redirect("/home");
  }

  const raw = await listMemberAttendanceSessions(session.user.id);
  if ("error" in raw) {
    return (
      <MemberPageShell>
        <Typography color="error">{raw.error}</Typography>
      </MemberPageShell>
    );
  }

  const rows: MemberAttendanceRow[] = raw.map((r) => ({
    sessionId: r.sessionId,
    programId: r.programId,
    sessionDate: r.sessionDate.toISOString(),
    startsAt: r.startsAt.toISOString(),
    endsAt: r.endsAt.toISOString(),
    kind: r.kind,
    title: r.title,
    markStatus: r.markStatus,
    lateReason: r.lateReason,
    absentReason: r.absentReason,
  }));

  return (
    <MemberPageShell>
      <Box>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
          Session attendance
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Mark Present, Late, or Absent for Dawati dars and Tarbiyati classes in your halqa.
        </Typography>
        <MemberAttendanceList rows={rows} />
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
          <Link href="/home" style={{ color: "inherit" }}>
            ← Back to home
          </Link>
        </Typography>
      </Box>
    </MemberPageShell>
  );
}
