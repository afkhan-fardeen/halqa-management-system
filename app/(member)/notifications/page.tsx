import Link from "next/link";
import { auth } from "@/auth";
import { MemberPageShell } from "@/components/member/member-page-shell";
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
      <NotificationsHmsShell>
        <div className="hms-notif-wrap">
          <div className="hms-notif-topbar">
            <Link href="/home" className="hms-nt-back" aria-label="Back to home">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </Link>
            <span className="hms-notif-topbar-title">Notifications</span>
            <span className="w-9 shrink-0" aria-hidden />
          </div>

          {hasUnread ? (
            <div className="hms-actions-row">
              <MarkAllReadButton />
            </div>
          ) : null}

          <NotificationInboxList rows={rows} />
        </div>
      </NotificationsHmsShell>
    </MemberPageShell>
  );
}
