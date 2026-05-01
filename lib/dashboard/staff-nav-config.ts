import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  FileText,
  FolderOpen,
  Inbox,
  LayoutDashboard,
  Megaphone,
  MessageSquareText,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

export type StaffNavItem = {
  href: string;
  label: string;
  description?: string;
  icon: LucideIcon;
};

export type StaffNavSection = {
  id: string;
  title: string;
  items: StaffNavItem[];
};

export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  if (href === "/dashboard/notifications/compose") {
    return pathname.startsWith("/dashboard/notifications/compose");
  }
  if (href === "/dashboard/notifications") {
    return pathname === "/dashboard/notifications";
  }
  if (pathname === href) {
    return true;
  }
  return pathname.startsWith(`${href}/`);
}

const homeSection: StaffNavSection = {
  id: "home",
  title: "Home",
  items: [{ href: "/dashboard", label: "Overview", icon: LayoutDashboard }],
};

const peopleSection: StaffNavSection = {
  id: "people",
  title: "People",
  items: [
    { href: "/dashboard/members", label: "Members", icon: Users },
    {
      href: "/dashboard/registrations",
      label: "Registrations",
      description: "Pending sign-ups",
      icon: UserPlus,
    },
    {
      href: "/dashboard/aiyanat",
      label: "Aiyanat",
      description: "Contributions",
      icon: Wallet,
    },
  ],
};

const programsSection: StaffNavSection = {
  id: "programs",
  title: "Programs",
  items: [
    {
      href: "/dashboard/attendance",
      label: "Attendance",
      description: "Programs & sessions entry",
      icon: CalendarDays,
    },
  ],
};

const insightsSection: StaffNavSection = {
  id: "insights",
  title: "Insights",
  items: [
    {
      href: "/dashboard/reports/monthly",
      label: "Monthly report",
      icon: FileText,
    },
    {
      href: "/dashboard/submissions",
      label: "Submissions",
      description: "Logs & contacts",
      icon: FolderOpen,
    },
  ],
};

const messagesSection: StaffNavSection = {
  id: "messages",
  title: "Messages",
  items: [
    {
      href: "/dashboard/notifications",
      label: "Inbox",
      description: "Your alerts",
      icon: Inbox,
    },
    {
      href: "/dashboard/notifications/compose",
      label: "Notify members",
      description: "Broadcast",
      icon: Megaphone,
    },
  ],
};

const adminSection: StaffNavSection = {
  id: "admin",
  title: "Admin only",
  items: [
    {
      href: "/dashboard/feedback",
      label: "Member feedback",
      description: "App feedback",
      icon: MessageSquareText,
    },
  ],
};

export function getStaffNavSections(isAdmin: boolean): StaffNavSection[] {
  return [
    homeSection,
    peopleSection,
    programsSection,
    insightsSection,
    messagesSection,
    ...(isAdmin ? [adminSection] : []),
  ];
}
