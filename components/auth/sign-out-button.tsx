"use client";

import { signOut } from "next-auth/react";
import { Button } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "default" | "outline" | "ghost" | "staffSidebar";
  className?: string;
};

export function SignOutButton({ variant = "outline", className }: Props) {
  if (variant === "staffSidebar") {
    return (
      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 transition-colors hover:bg-slate-200/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200",
          className,
        )}
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        <span className="material-symbols-outlined text-[20px]">logout</span>
        Sign out
      </button>
    );
  }

  const muiVariant =
    variant === "ghost" ? "text" : variant === "outline" ? "outlined" : "contained";
  return (
    <Button
      type="button"
      variant={muiVariant}
      color="error"
      className={className}
      fullWidth={variant !== "ghost"}
      onClick={() => signOut({ callbackUrl: "/login" })}
      startIcon={<LogoutIcon />}
      sx={{
        borderRadius: 999,
        py: 1.35,
        fontWeight: 600,
        textTransform: "none",
        ...(variant === "outline" && {
          borderWidth: 2,
        }),
      }}
    >
      Sign out
    </Button>
  );
}
