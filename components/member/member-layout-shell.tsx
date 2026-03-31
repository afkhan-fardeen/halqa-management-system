"use client";

import {
  Children,
  type ReactElement,
  type ReactNode,
  isValidElement,
} from "react";
import { Box } from "@mui/material";
import {
  MEMBER_BOTTOM_NAV_SPACER_CSS,
  MemberBottomNav,
} from "@/components/member/member-bottom-nav";
import { memberFogBarSx } from "@/components/member/member-chrome";
import { PushNotificationWelcomeModal } from "@/components/pwa/push-notification-welcome-modal";

/**
 * Expects exactly: [MemberTopBar (or any header), ...pageContent].
 * Header is full viewport width (like bottom nav); content stays max 430px.
 */
export function MemberLayoutShell({ children }: { children: ReactNode }) {
  const items = Children.toArray(children).filter(Boolean);
  const topBar = items[0];
  const page = items.slice(1);

  return (
    <Box
      data-shell="member"
      sx={{
        display: "flex",
        minHeight: "100dvh",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      {isValidElement(topBar) ? (
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: (t) => t.zIndex.appBar,
            width: "100%",
            borderBottom: 1,
            ...memberFogBarSx,
            pt: "max(0px, env(safe-area-inset-top, 0px))",
            pb: 1,
          }}
        >
          <Box
            sx={{
              maxWidth: "min(100%, 430px)",
              mx: "auto",
              px: { xs: 2.5, sm: 3 },
            }}
          >
            {topBar as ReactElement}
          </Box>
        </Box>
      ) : null}

      <Box
        sx={{
          mx: "auto",
          width: "100%",
          maxWidth: "min(100%, 430px)",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          px: { xs: 2.5, sm: 3 },
        }}
      >
        <Box
          component="main"
          sx={{
            flex: 1,
            minWidth: 0,
            pt: 1.5,
            pb: MEMBER_BOTTOM_NAV_SPACER_CSS,
          }}
        >
          {page}
        </Box>
      </Box>
      <MemberBottomNav />
      <PushNotificationWelcomeModal audience="member" />
    </Box>
  );
}
