import { auth } from "@/auth";
import { MarkAllReadButton } from "@/components/notifications/mark-all-read-button";
import { NotificationInboxList } from "@/components/notifications/notification-inbox-list";
import {
  StaffPageHeader,
  StaffPanel,
} from "@/components/dashboard/staff-page-section";
import { listNotificationsForCurrentUser } from "@/lib/queries/notifications";
import { isStaffRole } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export default async function DashboardNotificationsPage() {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    redirect("/login");
  }

  const rows = await listNotificationsForCurrentUser();

  return (
    <div className="space-y-8">
      <StaffPageHeader
        title="Notifications"
        description="Alerts for your account."
        action={rows.some((r) => !r.read) ? <MarkAllReadButton /> : undefined}
      />

      <StaffPanel title="Inbox">
        <NotificationInboxList rows={rows} readLabel="Mark read" />
      </StaffPanel>
    </div>
  );
}
