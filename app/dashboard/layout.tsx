import type { ReactNode } from "react";
import { auth } from "@/auth";
import { DashboardLayoutClient } from "@/components/dashboard/dashboard-layout-client";
import { getUnreadNotificationCount } from "@/lib/queries/notifications";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [session, unread] = await Promise.all([auth(), getUnreadNotificationCount()]);
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <DashboardLayoutClient unread={unread} isAdmin={isAdmin}>
      {children}
    </DashboardLayoutClient>
  );
}
