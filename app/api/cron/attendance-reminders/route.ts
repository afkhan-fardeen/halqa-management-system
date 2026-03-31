import { NextResponse } from "next/server";
import { runAttendanceReminders } from "@/lib/attendance/run-attendance-reminders";

/**
 * Optional GET with CRON_SECRET for scripts. Primary path: dashboard POST routes.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 503 },
    );
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runAttendanceReminders();
  return NextResponse.json(result);
}
