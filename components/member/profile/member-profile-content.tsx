"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Avatar,
  Box,
  Button,
  Card,
  Divider,
  List,
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
import { MemberFeedbackForm } from "@/components/member/profile/member-feedback-form";
import { PushNotificationsOptIn } from "@/components/pwa/push-notifications-opt-in";
import { formatDisplayMonth } from "@/lib/utils/member-display";
import { initials } from "@/lib/utils/profile-display";

export type MemberProfileAiyanatRow = {
  id: string;
  month: string;
  amount: string;
  status: "PAID" | "NOT_PAID";
  paymentDate: Date | null;
};

export function MemberProfileContent({
  extras,
  aiyanatHistory,
}: {
  extras: {
    phone: string;
    daysLogged: number;
    contactsTotal: number;
  };
  aiyanatHistory: MemberProfileAiyanatRow[];
}) {
  const { data: session } = useSession();
  const user = session?.user;
  const name = user?.name ?? "";
  const email = user?.email ?? "";
  const halqa = user?.halqa?.replaceAll("_", " ") ?? "";
  const gender = user?.genderUnit ?? "";
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
          {name || "Member"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
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
            Member
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
            {halqa} · {gender}
          </Box>
        </Stack>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        {[
          { label: "Days logged", val: String(extras.daysLogged) },
          { label: "Raabta", val: String(extras.contactsTotal) },
          { label: "Aiyanat", val: String(aiyanatHistory.length) },
        ].map((cell) => (
          <Box
            key={cell.label}
            sx={{
              py: 2,
              textAlign: "center",
              borderRight: 1,
              borderColor: "divider",
              "&:last-of-type": { borderRight: "none" },
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 600, lineHeight: 1.15 }}>
              {cell.val}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontSize: 10 }}
            >
              {cell.label}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ py: 3 }}>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
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
        <Card
          variant="outlined"
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: "background.paper",
            borderColor: "divider",
            boxShadow: (t) =>
              t.palette.mode === "dark" ? "0 1px 0 rgba(255,255,255,0.06)" : undefined,
          }}
        >
          <List disablePadding>
            <ListItemButton component={Link} href="/attendance">
              <ListItemIcon sx={{ minWidth: 40 }}>
                <EventAvailableOutlinedIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Session attendance"
                secondary="Dawati dars & Tarbiyati — mark when you attend"
                primaryTypographyProps={{
                  variant: "body2",
                  color: "text.primary",
                  fontWeight: 600,
                }}
                secondaryTypographyProps={{ variant: "body2", color: "text.secondary" }}
              />
              <ChevronRightIcon fontSize="small" sx={{ color: "action.active" }} />
            </ListItemButton>
            <Divider component="li" />
            <ListItemButton disabled>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <PersonOutlineIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Name"
                secondary={name}
                primaryTypographyProps={{
                  variant: "body2",
                  color: "text.secondary",
                  fontWeight: 600,
                }}
                secondaryTypographyProps={{ variant: "body2", color: "text.primary" }}
              />
            </ListItemButton>
            <Divider component="li" />
            <ListItemButton>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <PhoneIphoneOutlinedIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Phone"
                secondary={extras.phone || "—"}
                primaryTypographyProps={{
                  variant: "body2",
                  color: "text.secondary",
                  fontWeight: 600,
                }}
                secondaryTypographyProps={{ variant: "body2", color: "text.primary" }}
              />
            </ListItemButton>
            <Divider component="li" />
            <ListItemButton disabled>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <MosqueOutlinedIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Halqa and gender"
                secondary={`${halqa} · ${gender}`}
                primaryTypographyProps={{
                  variant: "body2",
                  color: "text.secondary",
                  fontWeight: 600,
                }}
                secondaryTypographyProps={{ variant: "body2", color: "text.primary" }}
              />
              <Typography variant="caption" color="text.secondary">
                Fixed
              </Typography>
            </ListItemButton>
          </List>
        </Card>
      </Box>

      <Box sx={{ px: 0.5, pb: 2 }}>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            fontWeight: 600,
            display: "block",
            mb: 1,
          }}
        >
          Notifications on this device
        </Typography>
        <PushNotificationsOptIn />
      </Box>

      <Box sx={{ px: 0.5, pb: 2 }}>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            fontWeight: 600,
            display: "block",
            mb: 1,
          }}
        >
          Feedback
        </Typography>
        <MemberFeedbackForm />
      </Box>

      <Box sx={{ pb: 2 }}>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
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
        <Card
          variant="outlined"
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: "background.paper",
            borderColor: "divider",
            boxShadow: (t) =>
              t.palette.mode === "dark" ? "0 1px 0 rgba(255,255,255,0.06)" : undefined,
          }}
        >
          <List disablePadding>
            <ListItemButton component={Link} href="/forgot-password">
              <ListItemIcon sx={{ minWidth: 40 }}>
                <LockOutlinedIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Reset password"
                secondary="We’ll email you a link to choose a new password"
                primaryTypographyProps={{
                  variant: "body2",
                  color: "text.primary",
                  fontWeight: 600,
                }}
                secondaryTypographyProps={{
                  variant: "body2",
                  color: "text.secondary",
                }}
              />
              <ChevronRightIcon fontSize="small" sx={{ color: "action.active" }} />
            </ListItemButton>
          </List>
        </Card>
      </Box>

      <Box sx={{ pb: 2 }}>
        <Typography
          variant="caption"
          sx={{
            color: "text.secondary",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            fontWeight: 600,
            px: 0.5,
            display: "block",
            mb: 1,
          }}
        >
          Aiyanat
        </Typography>
        <Stack spacing={1}>
          {aiyanatHistory.slice(0, 6).map((row) => (
            <Card
              key={row.id}
              variant="outlined"
              sx={{
                borderRadius: 2,
                p: 2,
                bgcolor: "background.paper",
                borderColor: "divider",
                boxShadow: (t) =>
                  t.palette.mode === "dark" ? "0 1px 0 rgba(255,255,255,0.06)" : undefined,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                  <Typography variant="body2" fontWeight={600} color="text.primary">
                    {formatDisplayMonth(row.month)}
                  </Typography>
                </Box>
                <Box
                  component="span"
                  sx={{
                    fontSize: 11,
                    fontWeight: 600,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 999,
                    bgcolor:
                      row.status === "PAID"
                        ? (t) => (t.palette.mode === "dark" ? "#064E3B" : "#D1FAE5")
                        : (t) => (t.palette.mode === "dark" ? "#451A03" : "#FEF3C7"),
                    color:
                      row.status === "PAID"
                        ? (t) => (t.palette.mode === "dark" ? "#6EE7B7" : "#065F46")
                        : (t) => (t.palette.mode === "dark" ? "#FCD34D" : "#92400E"),
                  }}
                >
                  {row.status === "PAID" ? "Yes" : "No"}
                </Box>
              </Box>
            </Card>
          ))}
        </Stack>
        <Button
          component={Link}
          href="/aiyanat"
          fullWidth
          variant="outlined"
          color="primary"
          sx={{ mt: 2, borderRadius: 2, py: 1.25 }}
        >
          Manage Aiyanat
        </Button>
      </Box>

      <Box sx={{ px: 0.5, pb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.55 }}>
          If your daily log is incomplete (Salah, Quran, and Hadith for today), you may receive
          in-app reminders and, when email is enabled, a reminder message by email.
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.55, mt: 1.25 }}>
          Password resets are sent only to the email address on this account.
        </Typography>
      </Box>

      <SignOutButton />
    </Stack>
  );
}
