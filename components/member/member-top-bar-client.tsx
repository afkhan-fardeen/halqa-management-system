"use client";

import Link from "next/link";
import {
  Badge,
  Box,
  Chip,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import { MEMBER_BAR_ROW_MIN_HEIGHT_PX } from "@/components/member/member-chrome";
import { useMemberTheme } from "@/components/member/member-theme-provider";

export function MemberTopBarClient({
  unread,
  dateLine,
}: {
  unread: number;
  dateLine: string;
}) {
  const { mode, toggleColorScheme } = useMemberTheme();
  const label =
    unread > 0
      ? `${unread} unread notification${unread === 1 ? "" : "s"}`
      : "Notifications";

  return (
    <Box component="header" sx={{ bgcolor: "transparent" }}>
      <Toolbar
        disableGutters
        sx={{
          minHeight: MEMBER_BAR_ROW_MIN_HEIGHT_PX,
          gap: 1.5,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography
              component={Link}
              href="/home"
              variant="h6"
              sx={{
                fontFamily: "var(--font-hms-serif), 'DM Serif Display', serif",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                textDecoration: "none",
                color: "text.primary",
                lineHeight: 1.15,
                display: "flex",
                alignItems: "baseline",
                gap: "2px",
              }}
            >
              Qalbee
              <Box component="span" sx={{ color: "primary.main" }}>
                .
              </Box>
            </Typography>
            <Chip
              label="Members"
              size="small"
              sx={{
                height: 22,
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 0.04,
                bgcolor: (t) =>
                  t.palette.mode === "dark"
                    ? "rgba(217, 119, 6, 0.18)"
                    : "rgba(217, 119, 6, 0.12)",
                color: "primary.main",
                border: 1,
                borderColor: "rgba(217, 119, 6, 0.28)",
              }}
            />
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontWeight: 500, fontSize: "0.9375rem" }}
          >
            {dateLine}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
          <IconButton
            onClick={toggleColorScheme}
            aria-label={mode === "dark" ? "Light mode" : "Dark mode"}
            size="medium"
            sx={{
              border: 1,
              borderColor: "divider",
              bgcolor: "action.hover",
              color: "text.secondary",
            }}
          >
            {mode === "dark" ? (
              <LightModeOutlinedIcon fontSize="small" />
            ) : (
              <DarkModeOutlinedIcon fontSize="small" />
            )}
          </IconButton>
          <IconButton
            component={Link}
            href="/notifications"
            aria-label={label}
            size="medium"
            color={unread > 0 ? "primary" : "default"}
          >
            <Badge
              badgeContent={unread > 99 ? "99+" : unread}
              color="error"
              invisible={unread === 0}
            >
              {unread > 0 ? (
                <NotificationsActiveOutlinedIcon fontSize="small" />
              ) : (
                <NotificationsNoneOutlinedIcon fontSize="small" />
              )}
            </Badge>
          </IconButton>
        </Box>
      </Toolbar>
    </Box>
  );
}
