"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
import { List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";

const baseNav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle },
  {
    href: "/dashboard/registrations",
    label: "Registrations",
    icon: UserPlus,
  },
  {
    href: "/dashboard/aiyanat",
    label: "Aiyanat",
    icon: CircleDollarSign,
  },
  { href: "/dashboard/members", label: "Members", icon: Users },
  {
    href: "/dashboard/reports/monthly",
    label: "Monthly report",
    icon: BarChart3,
  },
  {
    href: "/dashboard/submissions",
    label: "Submissions",
    icon: FileSpreadsheet,
  },
  {
    href: "/dashboard/attendance",
    label: "Attendance",
    icon: CalendarCheck,
  },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  {
    href: "/dashboard/notifications/compose",
    label: "Notify members",
    icon: Megaphone,
  },
] as const;

export function DashboardSidebarNav({
  onNavigate,
  isAdmin = false,
}: {
  /** Called after a nav item is chosen (e.g. close mobile drawer). */
  onNavigate?: () => void;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();

  const nav = isAdmin
    ? [
        baseNav[0],
        {
          href: "/dashboard/feedback",
          label: "Member feedback",
          icon: MessageSquare,
        },
        ...baseNav.slice(1),
      ]
    : baseNav;

  return (
    <List component="nav" dense sx={{ px: 1, py: 1 }}>
      {nav.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/dashboard"
            ? pathname === "/dashboard"
            : href === "/dashboard/notifications"
              ? pathname === "/dashboard/notifications"
              : href === "/dashboard/profile"
                ? pathname === "/dashboard/profile"
                : href === "/dashboard/feedback"
                  ? pathname === "/dashboard/feedback"
                  : pathname.startsWith(href);
        return (
          <ListItemButton
            key={href}
            component={Link}
            href={href}
            selected={active}
            onClick={() => onNavigate?.()}
            sx={{ borderRadius: 1, mb: 0.25, minHeight: 48 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Icon className="size-4 shrink-0" aria-hidden />
            </ListItemIcon>
            <ListItemText primary={label} primaryTypographyProps={{ fontWeight: active ? 700 : 500 }} />
          </ListItemButton>
        );
      })}
    </List>
  );
}
