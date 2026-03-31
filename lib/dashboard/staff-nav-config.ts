export type StaffNavItem = {
  href: string;
  label: string;
  description?: string;
  /** Material Symbols ligature name */
  icon: string;
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
  items: [
    { href: "/dashboard", label: "Overview", icon: "dashboard" },
    { href: "/dashboard/profile", label: "Profile", icon: "person" },
  ],
};

const peopleSection: StaffNavSection = {
  id: "people",
  title: "People & finance",
  items: [
    {
      href: "/dashboard/registrations",
      label: "Registrations",
      description: "Pending sign-ups",
      icon: "how_to_reg",
    },
    { href: "/dashboard/members", label: "Members", icon: "group" },
    {
      href: "/dashboard/aiyanat",
      label: "Aiyanat",
      description: "Contributions",
      icon: "payments",
    },
  ],
};

const attendanceSection: StaffNavSection = {
  id: "attendance",
  title: "Session attendance",
  items: [
    {
      href: "/dashboard/attendance",
      label: "Programs & sessions",
      description: "Dawati dars & Tarbiyati",
      icon: "calendar_today",
    },
  ],
};

const reportsSection: StaffNavSection = {
  id: "reports",
  title: "Reports & submissions",
  items: [
    {
      href: "/dashboard/reports/monthly",
      label: "Monthly report",
      icon: "description",
    },
    {
      href: "/dashboard/submissions",
      label: "Submissions",
      description: "Logs & contacts",
      icon: "folder_open",
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
      icon: "inbox",
    },
    {
      href: "/dashboard/notifications/compose",
      label: "Notify members",
      description: "Broadcast",
      icon: "campaign",
    },
  ],
};

const adminSection: StaffNavSection = {
  id: "admin",
  title: "Administration",
  items: [
    {
      href: "/dashboard/feedback",
      label: "Member feedback",
      description: "App feedback",
      icon: "feedback",
    },
  ],
};

export function getStaffNavSections(isAdmin: boolean): StaffNavSection[] {
  return [
    homeSection,
    peopleSection,
    attendanceSection,
    reportsSection,
    messagesSection,
    ...(isAdmin ? [adminSection] : []),
  ];
}
