"use client";

import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import { IconButton } from "@mui/material";
import { useMemberTheme } from "@/components/member/member-theme-provider";

export function AuthThemeToggle({ className }: { className?: string }) {
  const { mode, toggleColorScheme } = useMemberTheme();
  return (
    <div className={className}>
      <IconButton
        onClick={toggleColorScheme}
        aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
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
    </div>
  );
}
