"use client";

import Link from "next/link";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import { Badge, IconButton } from "@mui/material";
import { cn } from "@/lib/utils";

export function InboxLink({
  href,
  unread,
  className,
  variant = "mui",
}: {
  href: string;
  unread: number;
  className?: string;
  variant?: "mui" | "staff";
}) {
  const label =
    unread > 0
      ? `${unread} unread notification${unread === 1 ? "" : "s"}`
      : "Notifications";

  if (variant === "staff") {
    return (
      <Link
        href={href}
        aria-label={label}
        className={cn(
          "relative inline-flex h-10 w-10 items-center justify-center rounded-full text-staff-on-surface-variant transition-colors hover:bg-staff-surface-container-high dark:hover:bg-slate-800",
          unread > 0 && "text-staff-primary",
          className,
        )}
      >
        <span className="material-symbols-outlined text-[22px]">
          {unread > 0 ? "notifications_active" : "notifications"}
        </span>
        {unread > 0 ? (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-slate-50 bg-red-500 dark:border-slate-900" />
        ) : null}
      </Link>
    );
  }

  return (
    <IconButton
      component={Link}
      href={href}
      aria-label={label}
      color={unread > 0 ? "primary" : "default"}
      className={className}
      size="medium"
    >
      <Badge badgeContent={unread > 99 ? "99+" : unread} color="error" invisible={unread === 0}>
        {unread > 0 ? <NotificationsActiveIcon /> : <NotificationsNoneIcon />}
      </Badge>
    </IconButton>
  );
}
