import type { ReactNode } from "react";
import { DM_Sans, Poppins } from "next/font/google";
import { auth } from "@/auth";
import { DashboardLayoutClient } from "@/components/dashboard/dashboard-layout-client";
import type { StaffHeaderUser } from "@/components/dashboard/staff-dashboard-header";
import { isStaffRole } from "@/lib/auth/roles";
import { getUnreadNotificationCount } from "@/lib/queries/notifications";
import { staffRoleLabel } from "@/lib/utils/profile-display";

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-member-heading",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-member-body",
  display: "swap",
});

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [session, unread] = await Promise.all([auth(), getUnreadNotificationCount()]);
  const isAdmin = session?.user?.role === "ADMIN";

  const user: StaffHeaderUser = session?.user
    ? {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
        role: session.user.role,
        scopeSubtitle: isStaffRole(session.user.role)
          ? `${staffRoleLabel(session.user.role)} · ${session.user.halqa.replaceAll("_", " ")} · ${session.user.genderUnit === "MALE" ? "Male unit" : "Female unit"}`
          : null,
      }
    : {
        name: null,
        email: null,
        image: null,
        role: "SECRETARY",
        scopeSubtitle: null,
      };

  return (
    <DashboardLayoutClient
      unread={unread}
      isAdmin={isAdmin}
      user={user}
      shellClassName={`${poppins.variable} ${dmSans.variable}`}
    >
      {children}
    </DashboardLayoutClient>
  );
}
