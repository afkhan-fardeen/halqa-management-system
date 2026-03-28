"use client";

import { Alert, Stack } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

export function MemberHomeGuidance({
  submittedToday,
}: {
  submittedToday: boolean;
}) {
  return (
    <Stack spacing={1}>
      {submittedToday ? (
        <Alert severity="success" icon={<CheckCircleOutlineIcon fontSize="inherit" />}>
          Today&apos;s log is complete. You can still edit any card.
        </Alert>
      ) : (
        <Alert severity="info">
          Ehtisaab has three tabs — salah, Quran, and literature and hadith; changes save automatically. A
          draft stays on this device. Find Raabta in the bottom nav.
        </Alert>
      )}
    </Stack>
  );
}
