import { redirect } from "next/navigation";

export default async function DashboardAttendanceIndexPage() {
  redirect("/dashboard/attendance/programs");
}
