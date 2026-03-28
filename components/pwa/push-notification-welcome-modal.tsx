"use client";

import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { isStaffRole } from "@/lib/auth/roles";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  PUSH_WELCOME_DISMISS_KEY,
  getPushEnvironment,
  hasActivePushSubscription,
  subscribeDeviceToPush,
} from "@/components/pwa/push-subscription-utils";

type Audience = "member" | "staff";

function shouldShowForAudience(
  audience: Audience,
  role: string | undefined,
  userStatus: string | undefined,
): boolean {
  if (userStatus !== "ACTIVE") return false;
  if (audience === "member") return role === "MEMBER";
  return isStaffRole(role);
}

/**
 * One-time (per device) prompt to enable Web Push after sign-in (member app or staff dashboard).
 */
export function PushNotificationWelcomeModal({ audience }: { audience: Audience }) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);

  const shouldConsider =
    status === "authenticated" &&
    shouldShowForAudience(audience, session?.user?.role, session?.user?.status);

  useEffect(() => {
    if (!shouldConsider || typeof window === "undefined") {
      setChecking(false);
      return;
    }

    let cancelled = false;
    let timeoutId: number | undefined;

    void (async () => {
      try {
        if (localStorage.getItem(PUSH_WELCOME_DISMISS_KEY) === "1") {
          if (!cancelled) setChecking(false);
          return;
        }
        const env = await getPushEnvironment();
        if (cancelled) return;
        if (!env.supported || !env.configured) {
          if (!cancelled) setChecking(false);
          return;
        }
        const subscribed = await hasActivePushSubscription();
        if (cancelled) return;
        if (subscribed) {
          localStorage.setItem(PUSH_WELCOME_DISMISS_KEY, "1");
          if (!cancelled) setChecking(false);
          return;
        }
        timeoutId = window.setTimeout(() => {
          if (!cancelled) {
            setOpen(true);
            setChecking(false);
          }
        }, 600);
      } catch {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [shouldConsider]);

  const dismiss = useCallback(() => {
    localStorage.setItem(PUSH_WELCOME_DISMISS_KEY, "1");
    setOpen(false);
  }, []);

  const onEnable = useCallback(async () => {
    setBusy(true);
    try {
      const result = await subscribeDeviceToPush();
      if (result.ok) {
        localStorage.setItem(PUSH_WELCOME_DISMISS_KEY, "1");
        setOpen(false);
        toast.success("Notifications enabled", {
          description: "You’ll get alerts on this device for new messages.",
        });
      } else {
        toast.error("Could not enable", { description: result.error });
      }
    } finally {
      setBusy(false);
    }
  }, []);

  if (!shouldConsider || checking) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") {
          dismiss();
        }
      }}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            px: { xs: 0.5, sm: 1 },
            py: 0.5,
          },
        },
      }}
    >
      <DialogTitle component="div" sx={{ pt: 2.5, pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: "primary.main",
              color: "primary.contrastText",
            }}
          >
            <NotificationsActiveOutlinedIcon />
          </Stack>
          <Typography variant="h6" component="span" sx={{ fontWeight: 700, lineHeight: 1.25 }}>
            Stay in the loop
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
          Turn on notifications so you don’t miss reminders, halqa messages, and updates from your team. You can
          change this anytime in your profile.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 0, flexDirection: { xs: "column-reverse", sm: "row" }, gap: 1 }}>
        <Button fullWidth variant="text" color="inherit" onClick={dismiss} disabled={busy} sx={{ textTransform: "none" }}>
          Maybe later
        </Button>
        <Button fullWidth variant="contained" onClick={onEnable} disabled={busy} sx={{ textTransform: "none" }}>
          {busy ? "Enabling…" : "Enable notifications"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
