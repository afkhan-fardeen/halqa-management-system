import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { runAttendanceReminders } from "@/lib/attendance/run-attendance-reminders";
import { isStaffRole } from "@/lib/auth/roles";
import { getAttendanceSessionWithProgramForStaff } from "@/lib/queries/attendance";

type RouteParams = { params: Promise<{ sessionId: string }> };

export async function POST(_req: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const bundle = await getAttendanceSessionWithProgramForStaff(
    sessionId,
    session.user,
  );
  if ("error" in bundle) {
    const status = bundle.error === "Not found" ? 404 : 403;
    return NextResponse.json({ error: bundle.error }, { status });
  }

  const { session: sess, program } = bundle;
  const now = new Date();
  const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  if (!program.isActive) {
    return NextResponse.json(
      { error: "Program is not active." },
      { status: 400 },
    );
  }
  if (sess.endsAt > now) {
    return NextResponse.json(
      { error: "Session has not ended yet." },
      { status: 400 },
    );
  }
  if (sess.endsAt < windowStart) {
    return NextResponse.json(
      {
        error:
          "Session ended more than 24 hours ago — use the global reminder flow if needed.",
      },
      { status: 400 },
    );
  }

  const result = await runAttendanceReminders({ sessionId });
  return NextResponse.json(result);
}
