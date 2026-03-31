import Link from "next/link";
import { auth } from "@/auth";
import { StaffAnnouncementComposeForm } from "@/components/dashboard/staff-announcement-compose-form";
import {
  StaffPageHeader,
  StaffPanel,
} from "@/components/dashboard/staff-page-section";
import { buttonVariants } from "@/components/ui/button-variants";
import { isStaffRole } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export default async function DashboardNotifyMembersPage() {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard/notifications"
          className={buttonVariants({
            variant: "link",
            className:
              "h-auto p-0 text-sm text-staff-on-surface-variant hover:text-staff-primary",
          })}
        >
          ← Back to notifications
        </Link>
      </div>

      <StaffPageHeader
        title="Notify members"
        description={
          <>
            Send an in-app message to active members’ notification inbox.
            {isAdmin
              ? " Optionally limit by halqa and/or gender."
              : " Only members in your halqa and gender receive it."}
          </>
        }
      />

      <StaffPanel
        title="Compose"
        description="Members see this under Notifications in the app. No email is sent."
      >
        <StaffAnnouncementComposeForm isAdmin={isAdmin} />
      </StaffPanel>
    </div>
  );
}
