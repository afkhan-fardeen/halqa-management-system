"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Bell,
  UserPlus,
  CircleDollarSign,
  BarChart3,
  Megaphone,
  UserCircle,
  MessageSquare,
  CalendarCheck,
} from "lucide-react";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";

type NavItem = {
  href: string;
  label: string;
  description?: string;
  icon: LucideIcon;
};

type NavSection = {
  id: string;
  title: string;
  items: NavItem[];
};

function isNavItemActive(href: string, pathname: string): boolean {
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

const homeSection: NavSection = {
  id: "home",
  title: "Home",
  items: [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
  ],
};

const peopleSection: NavSection = {
  id: "people",
  title: "People & finance",
  items: [
    {
      href: "/dashboard/registrations",
      label: "Registrations",
      description: "Pending sign-ups",
      icon: UserPlus,
    },
    { href: "/dashboard/members", label: "Members", icon: Users },
    {
      href: "/dashboard/aiyanat",
      label: "Aiyanat",
      description: "Contributions",
      icon: CircleDollarSign,
    },
  ],
};

/** Dedicated block so incharge/secretary see it immediately. */
const attendanceSection: NavSection = {
  id: "attendance",
  title: "Session attendance",
  items: [
    {
      href: "/dashboard/attendance",
      label: "Programs & sessions",
      description: "Dawati dars & Tarbiyati",
      icon: CalendarCheck,
    },
  ],
};

const reportsSection: NavSection = {
  id: "reports",
  title: "Reports & submissions",
  items: [
    {
      href: "/dashboard/reports/monthly",
      label: "Monthly report",
      icon: BarChart3,
    },
    {
      href: "/dashboard/submissions",
      label: "Submissions",
      description: "Logs & outreach",
      icon: FileSpreadsheet,
    },
  ],
};

const messagesSection: NavSection = {
  id: "messages",
  title: "Messages",
  items: [
    {
      href: "/dashboard/notifications",
      label: "Inbox",
      description: "Your alerts",
      icon: Bell,
    },
    {
      href: "/dashboard/notifications/compose",
      label: "Notify members",
      description: "Broadcast",
      icon: Megaphone,
    },
  ],
};

const adminSection: NavSection = {
  id: "admin",
  title: "Administration",
  items: [
    {
      href: "/dashboard/feedback",
      label: "Member feedback",
      description: "App feedback",
      icon: MessageSquare,
    },
  ],
};

function SectionHeader({ title, first }: { title: string; first?: boolean }) {
  return (
    <Box
      sx={{
        px: 1.75,
        pt: first ? 1.25 : 2,
        pb: 0.75,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          display: "block",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontSize: "0.65rem",
          color: "text.secondary",
        }}
      >
        {title}
      </Typography>
    </Box>
  );
}

export function DashboardSidebarNav({
  onNavigate,
  isAdmin = false,
}: {
  onNavigate?: () => void;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();

  const sections: NavSection[] = [
    homeSection,
    peopleSection,
    attendanceSection,
    reportsSection,
    messagesSection,
    ...(isAdmin ? [adminSection] : []),
  ];

  return (
    <List
      component="nav"
      dense
      disablePadding
      sx={{ px: 1, py: 0.5, pb: 2 }}
      aria-label="Dashboard navigation"
    >
      {sections.map((section, idx) => (
        <Box key={section.id} component="li" sx={{ listStyle: "none" }}>
          <SectionHeader title={section.title} first={idx === 0} />
          <List disablePadding>
            {section.items.map(({ href, label, description, icon: Icon }) => {
              const active = isNavItemActive(href, pathname);
              return (
                <ListItemButton
                  key={href}
                  component={Link}
                  href={href}
                  selected={active}
                  onClick={() => onNavigate?.()}
                  sx={{
                    borderRadius: 1.5,
                    mb: 0.35,
                    minHeight: description ? 52 : 44,
                    py: description ? 0.75 : 0.5,
                    px: 1.25,
                    "&.Mui-selected": {
                      bgcolor: (t) =>
                        t.palette.mode === "dark"
                          ? "rgba(67, 56, 202, 0.22)"
                          : "rgba(67, 56, 202, 0.12)",
                      borderLeft: 3,
                      borderColor: "primary.main",
                      pl: 1,
                      "&:hover": {
                        bgcolor: (t) =>
                          t.palette.mode === "dark"
                            ? "rgba(67, 56, 202, 0.28)"
                            : "rgba(67, 56, 202, 0.16)",
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: active ? "primary.main" : "text.secondary",
                    }}
                  >
                    <Icon className="size-[1.125rem] shrink-0" aria-hidden />
                  </ListItemIcon>
                  <ListItemText
                    primary={label}
                    secondary={description}
                    primaryTypographyProps={{
                      fontWeight: active ? 700 : 600,
                      fontSize: "0.875rem",
                      lineHeight: 1.3,
                    }}
                    secondaryTypographyProps={{
                      fontSize: "0.7rem",
                      lineHeight: 1.25,
                      sx: { mt: 0.15 },
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      ))}
    </List>
  );
}
