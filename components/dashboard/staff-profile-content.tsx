"use client";

import Link from "next/link";
import {
  Avatar,
  Box,
  Card,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MosqueOutlinedIcon from "@mui/icons-material/MosqueOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PhoneIphoneOutlinedIcon from "@mui/icons-material/PhoneIphoneOutlined";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { PushNotificationsOptIn } from "@/components/pwa/push-notifications-opt-in";
import type { StaffRole } from "@/lib/auth/roles";
import {
  formatHalqaGenderLine,
  initials,
  staffRoleLabel,
} from "@/lib/utils/profile-display";

export type StaffProfileUserSnapshot = {
  name: string;
  email: string;
  role: StaffRole;
  halqaDisplay: string;
  genderUnit: string;
};

export function StaffProfileContent({
  phone,
  user,
}: {
  phone: string;
  user: StaffProfileUserSnapshot;
}) {
  const { name, email, role, halqaDisplay, genderUnit } = user;
  const halqaGenderLine = formatHalqaGenderLine(halqaDisplay, genderUnit);

  return (
    <Stack spacing={0}>
      <Box
        sx={{
          py: 4,
          px: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Avatar
          sx={{
            width: 72,
            height: 72,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            fontSize: 26,
            fontFamily: (t) => t.typography.h4.fontFamily,
            fontWeight: 600,
          }}
        >
          {initials(name)}
        </Avatar>
        <Typography variant="h5" sx={{ mt: 1.5, fontWeight: 600 }}>
          {name || "Staff"}
        </Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
          {email}
        </Typography>
        <Stack direction="row" gap={1} flexWrap="wrap" justifyContent="center" sx={{ mt: 1.5 }}>
          <Box
            component="span"
            sx={{
              fontSize: 11,
              fontWeight: 600,
              px: 1.5,
              py: 0.5,
              borderRadius: 999,
              bgcolor: (t) =>
                t.palette.mode === "dark" ? "rgba(217,119,6,0.2)" : "rgba(217,119,6,0.12)",
              color: "primary.main",
              border: 1,
              borderColor: "rgba(217,119,6,0.25)",
            }}
          >
            {staffRoleLabel(role)}
          </Box>
          <Box
            component="span"
            sx={{
              fontSize: 11,
              fontWeight: 600,
              px: 1.5,
              py: 0.5,
              borderRadius: 999,
              bgcolor: "action.hover",
              border: 1,
              borderColor: "divider",
            }}
          >
            {halqaGenderLine}
          </Box>
        </Stack>
      </Box>

      <Box sx={{ py: 3 }}>
        <Typography
          variant="caption"
          sx={{
            color: "text.disabled",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            fontWeight: 600,
            px: 0.5,
            display: "block",
            mb: 1,
          }}
        >
          Notifications
        </Typography>
        <PushNotificationsOptIn />
      </Box>

      <Box sx={{ py: 3 }}>
        <Typography
          variant="caption"
          sx={{
            color: "text.disabled",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            fontWeight: 600,
            px: 0.5,
            display: "block",
            mb: 1,
          }}
        >
          Account
        </Typography>
        <Card variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
          <List disablePadding>
            <ListItemButton component={Link} href="/dashboard/attendance/programs">
              <ListItemIcon sx={{ minWidth: 40 }}>
                <EventAvailableOutlinedIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Session attendance"
                secondary="Programs, sessions, and member marks"
              />
              <ChevronRightIcon fontSize="small" color="disabled" />
            </ListItemButton>
            <Divider component="li" />
            <ListItemButton disabled>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <PersonOutlineIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText primary="Name" secondary={name} />
            </ListItemButton>
            <Divider component="li" />
            <ListItem
              sx={{
                py: 1.25,
                px: 2,
                alignItems: "flex-start",
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, mt: 0.25 }}>
                <PhoneIphoneOutlinedIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText primary="Phone" secondary={phone || "—"} />
            </ListItem>
            <Divider component="li" />
            <ListItemButton disabled>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <MosqueOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Halqa and gender" secondary={halqaGenderLine} />
              <Typography variant="caption" color="text.disabled">
                Fixed
              </Typography>
            </ListItemButton>
          </List>
        </Card>
      </Box>

      <Box sx={{ pb: 2 }}>
        <Typography
          variant="caption"
          sx={{
            color: "text.disabled",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            fontWeight: 600,
            px: 0.5,
            display: "block",
            mb: 1,
          }}
        >
          Security
        </Typography>
        <Card variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
          <List disablePadding>
            <ListItemButton component={Link} href="/forgot-password">
              <ListItemIcon sx={{ minWidth: 40 }}>
                <LockOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Reset password"
                secondary="We’ll email you a link to choose a new password"
              />
              <ChevronRightIcon fontSize="small" color="disabled" />
            </ListItemButton>
          </List>
        </Card>
      </Box>

      <Box sx={{ px: 0.5, pb: 2 }}>
        <Typography variant="caption" color="text.disabled" sx={{ display: "block", lineHeight: 1.55 }}>
          Password resets are sent only to the email address on this account.
        </Typography>
      </Box>

      <SignOutButton />
    </Stack>
  );
}
