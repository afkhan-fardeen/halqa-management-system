import { auth } from "@/auth";
import { MemberPageShell } from "@/components/member/member-page-shell";
import { MemberScreenHeader } from "@/components/member/member-screen-header";
import { MarkAllReadButton } from "@/components/notifications/mark-all-read-button";
import { NotificationInboxList } from "@/components/notifications/notification-inbox-list";
import { NotificationsHmsShell } from "@/components/notifications/notifications-hms-shell";
import { listNotificationsForCurrentUser } from "@/lib/queries/notifications";
import { redirect } from "next/navigation";

export default async function MemberNotificationsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "MEMBER") {
    redirect("/login");
  }

  const rows = await listNotificationsForCurrentUser();
  const hasUnread = rows.some((r) => !r.read);

  return (
    <MemberPageShell>
      <MemberScreenHeader
        eyebrow="Inbox"
        title="Notifications"
        description="Reminders, registration updates, and messages from your halqa team."
        action={hasUnread ? <MarkAllReadButton /> : undefined}
      />
      <NotificationsHmsShell>
        <div className="hms-notif-wrap" style={{ paddingTop: 0 }}>
          <NotificationInboxList rows={rows} />
        </div>
      </NotificationsHmsShell>
    </MemberPageShell>
  );
}
