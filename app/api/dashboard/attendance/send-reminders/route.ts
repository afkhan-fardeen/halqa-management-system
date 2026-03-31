import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { runAttendanceReminders } from "@/lib/attendance/run-attendance-reminders";
import { isStaffRole } from "@/lib/auth/roles";

export async function POST() {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runAttendanceReminders();
  return NextResponse.json(result);
}
