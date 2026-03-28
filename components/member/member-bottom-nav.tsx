"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Fab, Paper, Typography } from "@mui/material";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import ContactsOutlinedIcon from "@mui/icons-material/ContactsOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import AddIcon from "@mui/icons-material/Add";
import { MEMBER_BAR_ROW_MIN_HEIGHT_PX } from "@/components/member/member-chrome";

const NAV_MAX_WIDTH_PX = 430;

const items = [
  {
    href: "/home",
    label: "Home",
    icon: HomeOutlinedIcon,
    match: (p: string) => p === "/home",
  },
  {
    href: "/history",
    label: "Past",
    icon: HistoryOutlinedIcon,
    match: (p: string) => p.startsWith("/history"),
  },
  {
    href: "/attendance",
    label: "Class",
    icon: EventAvailableOutlinedIcon,
    match: (p: string) => p.startsWith("/attendance"),
  },
  {
    href: "/outreach",
    label: "Raabta",
    icon: ContactsOutlinedIcon,
    match: (p: string) => p.startsWith("/outreach"),
  },
  {
    href: "/profile",
    label: "You",
    icon: PersonOutlineIcon,
    match: (p: string) => p.startsWith("/profile"),
  },
] as const;

function NavItem({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: (typeof items)[number]["icon"];
  active: boolean;
}) {
  return (
    <Box
      component={Link}
      href={href}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 0.35,
        py: 1,
        minWidth: 0,
        textDecoration: "none",
        color: active ? "primary.main" : "text.disabled",
        transition: "color 0.15s",
        "&:hover": { color: "primary.main", opacity: 0.9 },
      }}
    >
      <Icon sx={{ fontSize: 26 }} />
      <Typography
        variant="caption"
        sx={{
          fontSize: 11,
          fontWeight: active ? 600 : 500,
          lineHeight: 1.15,
          fontFamily: (t) => t.typography.button.fontFamily,
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

export function MemberBottomNav() {
  const pathname = usePathname();
  const submitActive = pathname.startsWith("/submit");

  return (
    <Paper
      square
      component="nav"
      aria-label="Member navigation"
      elevation={12}
      sx={{
        position: "fixed",
        left: "50%",
        bottom: 0,
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: NAV_MAX_WIDTH_PX,
        zIndex: (t) => t.zIndex.appBar,
        borderTop: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
        borderRadius: 0,
        pb: "max(12px, env(safe-area-inset-bottom))",
        pt: 1.25,
        boxSizing: "border-box",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          alignItems: "flex-end",
          minHeight: MEMBER_BAR_ROW_MIN_HEIGHT_PX,
          px: 0.25,
        }}
      >
        <NavItem
          href={items[0].href}
          label={items[0].label}
          Icon={items[0].icon}
          active={items[0].match(pathname)}
        />
        <NavItem
          href={items[1].href}
          label={items[1].label}
          Icon={items[1].icon}
          active={items[1].match(pathname)}
        />

        <Box
          sx={{
            gridColumn: "3 / 5",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            mt: "-24px",
            mb: 0.35,
          }}
        >
          <Fab
            component={Link}
            href="/submit"
            color="primary"
            aria-label="Open Ehtisaab daily report"
            sx={{
              width: 58,
              height: 58,
              boxShadow: (t) =>
                t.palette.mode === "dark"
                  ? "0 4px 20px rgba(217,119,6,0.42)"
                  : "0 4px 18px rgba(217,119,6,0.48)",
            }}
          >
            <AddIcon sx={{ fontSize: 28 }} />
          </Fab>
          <Typography
            variant="caption"
            sx={{
              fontSize: 11,
              mt: 0.45,
              fontWeight: submitActive ? 600 : 500,
              fontFamily: (t) => t.typography.button.fontFamily,
              color: submitActive ? "primary.main" : "text.disabled",
            }}
          >
            Ehtisaab
          </Typography>
        </Box>

        <NavItem
          href={items[2].href}
          label={items[2].label}
          Icon={items[2].icon}
          active={items[2].match(pathname)}
        />
        <NavItem
          href={items[3].href}
          label={items[3].label}
          Icon={items[3].icon}
          active={items[3].match(pathname)}
        />
        <NavItem
          href={items[4].href}
          label={items[4].label}
          Icon={items[4].icon}
          active={items[4].match(pathname)}
        />
      </Box>
    </Paper>
  );
}

/** Bottom padding for main scroll area so content clears the fixed bar (keep in sync with nav height). */
export const MEMBER_BOTTOM_NAV_SPACER_CSS =
  "calc(110px + env(safe-area-inset-bottom, 0px))";
