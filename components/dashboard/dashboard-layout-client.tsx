"use client";

import MenuIcon from "@mui/icons-material/Menu";
import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { InboxLink } from "@/components/notifications/inbox-link";
import { DashboardRefresh } from "@/components/dashboard/dashboard-refresh";
import { DashboardSidebarNav } from "@/components/dashboard/dashboard-sidebar-nav";
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  Paper,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

const drawerWidth = 288;

function DashboardSidebarPanel({
  unread,
  onNavigate,
}: {
  unread: number;
  onNavigate?: () => void;
}) {
  return (
    <>
      <Toolbar
        sx={{
          gap: 1,
          justifyContent: "space-between",
          borderBottom: 1,
          borderColor: "divider",
          flexShrink: 0,
        }}
      >
        <Typography
          variant="h6"
          component={Link}
          href="/dashboard"
          color="primary"
          sx={{
            fontWeight: 800,
            textDecoration: "none",
            fontFamily: "var(--font-hms-serif), 'DM Serif Display', serif",
            display: "flex",
            alignItems: "baseline",
            gap: "2px",
          }}
          onClick={() => onNavigate?.()}
        >
          Qalbee
          <Box component="span" sx={{ color: "primary.main" }}>
            .
          </Box>
        </Typography>
        <InboxLink href="/dashboard/notifications" unread={unread} />
      </Toolbar>
      <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
        <DashboardSidebarNav onNavigate={onNavigate} />
      </Box>
      <Box sx={{ mt: "auto", flexShrink: 0, borderTop: 1, borderColor: "divider", p: 1 }}>
        <SignOutButton className="w-full" />
      </Box>
    </>
  );
}

export function DashboardLayoutClient({
  unread,
  children,
}: {
  unread: number;
  children: ReactNode;
}) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"), { defaultMatches: false });
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    if (isMdUp) setMobileOpen(false);
  }, [isMdUp]);

  const sidebarPaperSx = {
    display: "flex",
    flexDirection: "column" as const,
    width: drawerWidth,
    borderRight: 1,
    borderColor: "divider",
    bgcolor: "grey.50",
    height: "100%",
    minHeight: "100dvh",
    boxSizing: "border-box" as const,
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh" }}>
      <Paper
        component="aside"
        elevation={0}
        square
        sx={{
          ...sidebarPaperSx,
          display: { xs: "none", md: "flex" },
        }}
      >
        <DashboardSidebarPanel unread={unread} />
      </Paper>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={closeMobile}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            ...sidebarPaperSx,
            pt: "env(safe-area-inset-top, 0px)",
            pb: "env(safe-area-inset-bottom, 0px)",
          },
        }}
      >
        <DashboardSidebarPanel unread={unread} onNavigate={closeMobile} />
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <AppBar
          position="sticky"
          color="inherit"
          elevation={1}
          sx={{
            display: { md: "none" },
            pt: "env(safe-area-inset-top, 0px)",
          }}
        >
          <Toolbar
            disableGutters
            sx={{
              px: 1.5,
              gap: 1,
              alignItems: "center",
              minHeight: { xs: 56, sm: 64 },
            }}
          >
            <IconButton
              color="inherit"
              edge="start"
              aria-label="Open navigation menu"
              onClick={() => setMobileOpen(true)}
              sx={{ mr: 0.5 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="subtitle1"
              component={Link}
              href="/dashboard"
              fontWeight={800}
              color="text.primary"
              sx={{ flex: 1, textDecoration: "none", minWidth: 0 }}
              noWrap
            >
              Dashboard
            </Typography>
            <InboxLink href="/dashboard/notifications" unread={unread} />
            <SignOutButton variant="ghost" />
          </Toolbar>
        </AppBar>
        <Box
          component="main"
          sx={{
            flex: 1,
            minWidth: 0,
            p: { xs: 1.5, sm: 2, md: 3 },
            pb: { xs: "max(1.5rem, env(safe-area-inset-bottom))", md: 3 },
          }}
        >
          <DashboardRefresh />
          <Box sx={{ mx: "auto", width: "100%", maxWidth: 1152 }}>{children}</Box>
        </Box>
      </Box>
    </Box>
  );
}
