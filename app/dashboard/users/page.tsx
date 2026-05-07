import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isStaffRole } from "@/lib/auth/roles";
import { isSuperAdmin } from "@/lib/auth/staff-scope";
import {
  StaffPageHeader,
  StaffPanel,
} from "@/components/dashboard/staff-page-section";
import { listStaffUsers } from "@/lib/actions/staff-user-management";
import { StaffUsersClient } from "@/components/dashboard/staff-users-client";

export const dynamic = "force-dynamic";

export default async function DashboardUsersPage() {
  const session = await auth();

  if (!session?.user || !isStaffRole(session.user.role)) {
    redirect("/login");
  }

  if (!isSuperAdmin(session.user)) {
    redirect("/dashboard");
  }

  const staffUsers = await listStaffUsers();

  return (
    <div className="space-y-8 md:space-y-10">
      <StaffPageHeader
        title="Staff user management"
        description="Create and manage admin, incharge, and secretary accounts. Set their visibility scope (which halqas and gender units they can see)."
      />

      <StaffUsersClient staffUsers={staffUsers} currentUserId={session.user.id} />
    </div>
  );
}
