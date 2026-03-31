"use client";

import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";

export function NotificationTypeIcon({ type }: { type: string }) {
  const t = type.toLowerCase();
  let Icon = NotificationsNoneOutlinedIcon;
  let bg = "rgba(0, 128, 128, 0.16)";
  let fg = "#008080";

  if (t.includes("pending_registration_staff")) {
    Icon = PersonAddAltOutlinedIcon;
    bg = "rgba(0, 128, 128, 0.18)";
    fg = "#008080";
  } else if (t.includes("reject")) {
    Icon = CancelOutlinedIcon;
    bg = "rgba(239, 68, 68, 0.14)";
    fg = "#DC2626";
  } else if (t.includes("approv")) {
    Icon = CheckCircleOutlineIcon;
    bg = "rgba(34, 197, 94, 0.14)";
    fg = "#16A34A";
  } else if (t.includes("attendance")) {
    Icon = EventAvailableOutlinedIcon;
    bg = "rgba(5, 150, 105, 0.14)";
    fg = "#059669";
  } else if (t.includes("ehtisaab")) {
    Icon = NotificationsNoneOutlinedIcon;
    bg = "rgba(37, 99, 235, 0.14)";
    fg = "#2563EB";
  } else if (t.includes("reminder")) {
    Icon = NotificationsNoneOutlinedIcon;
    bg = "rgba(0, 128, 128, 0.18)";
    fg = "#008080";
  } else if (t.includes("welcome") || t.includes("demo")) {
    Icon = AutoAwesomeOutlinedIcon;
    bg = "rgba(120, 113, 108, 0.14)";
    fg = "#78716C";
  } else if (t.includes("password")) {
    Icon = LockOutlinedIcon;
    bg = "rgba(59, 130, 246, 0.12)";
    fg = "#2563EB";
  } else if (t.includes("deactivat")) {
    Icon = BlockOutlinedIcon;
    bg = "rgba(107, 114, 128, 0.16)";
    fg = "#4B5563";
  } else if (t.includes("staff_announcement") || t.includes("announcement")) {
    Icon = CampaignOutlinedIcon;
    bg = "rgba(21, 101, 192, 0.12)";
    fg = "#1565c0";
  }

  return (
    <div
      className="hms-notif-icon-wrap"
      style={{
        background: bg,
        color: fg,
      }}
      aria-hidden
    >
      <Icon style={{ fontSize: 20 }} />
    </div>
  );
}
