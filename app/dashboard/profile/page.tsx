import { auth } from "@/auth";
import { StaffProfileContent } from "@/components/dashboard/staff-profile-content";
import { isStaffRole } from "@/lib/auth/roles";
import { getStaffProfilePhone } from "@/lib/queries/staff-profile";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function DashboardProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (session.user.role === "MEMBER") {
    redirect("/home");
  }
  const staffRole = session.user.role;
  if (!isStaffRole(staffRole)) {
    redirect("/login");
  }

  const phone = await getStaffProfilePhone(session.user.id);
  const u = session.user;

  const user = {
    name: u.name ?? "",
    email: u.email ?? "",
    role: staffRole,
    halqaDisplay: u.halqa.replaceAll("_", " "),
    genderUnit: u.genderUnit,
  };

  return <StaffProfileContent phone={phone} user={user} />;
}
