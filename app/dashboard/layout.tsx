import type { ReactNode } from "react";
import { Inter, Manrope } from "next/font/google";
import { auth } from "@/auth";
import { DashboardLayoutClient } from "@/components/dashboard/dashboard-layout-client";
import type { StaffHeaderUser } from "@/components/dashboard/staff-dashboard-header";
import { getUnreadNotificationCount } from "@/lib/queries/notifications";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-staff-headline",
  weight: ["400", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-staff-body",
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
      }
    : {
        name: null,
        email: null,
        image: null,
        role: "SECRETARY",
      };

  const materialSymbolsHref =
    "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap";

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preload" href={materialSymbolsHref} as="style" />
      <link rel="stylesheet" href={materialSymbolsHref} />
      <DashboardLayoutClient
        unread={unread}
        isAdmin={isAdmin}
        user={user}
        shellClassName={`${manrope.variable} ${inter.variable}`}
      >
        {children}
      </DashboardLayoutClient>
    </>
  );
}
