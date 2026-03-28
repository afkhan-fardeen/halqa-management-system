"use client";

import {
  useEffect,
  useState,
  useTransition,
} from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import { submitAttendance } from "@/lib/actions/attendance-marks";
import { attendanceKindLabel } from "@/lib/attendance/labels";

export type MemberAttendanceRow = {
  sessionId: string;
  programId: string;
  sessionDate: string;
  startsAt: string;
  endsAt: string;
  kind: "DAWATI" | "TARBIYATI";
  title: string | null;
  markStatus: "PRESENT" | "LATE" | "ABSENT" | null;
  lateReason: string | null;
  absentReason: string | null;
};

function ymdBahrainFromIso(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Bahrain" });
}

function todayBahrainYmd(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bahrain" });
}

function SessionCard({
  row,
  highlightSessionId,
}: {
  row: MemberAttendanceRow;
  highlightSessionId?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"PRESENT" | "LATE" | "ABSENT">(
    row.markStatus ?? "PRESENT",
  );
  const [lateReason, setLateReason] = useState(row.lateReason ?? "");
  const [absentReason, setAbsentReason] = useState(row.absentReason ?? "");

  const sessionYmd = ymdBahrainFromIso(row.sessionDate);
  const todayYmd = todayBahrainYmd();
  const canEdit = sessionYmd >= todayYmd;

  const kindLabel = attendanceKindLabel(row.kind);
  const titleLine = row.title?.trim()
    ? `${kindLabel} — ${row.title.trim()}`
    : kindLabel;

  const dateLabel = new Date(row.sessionDate).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Bahrain",
  });

  const focusId =
    highlightSessionId && row.sessionId === highlightSessionId
      ? "session-focus"
      : undefined;

  return (
    <Card
      id={focusId}
      variant="outlined"
      sx={{
        borderRadius: 2,
        scrollMarginTop: 96,
        borderColor:
          highlightSessionId === row.sessionId ? "primary.main" : "divider",
      }}
    >
      <Box sx={{ p: 2.25 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25, mb: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: "action.hover",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <EventAvailableOutlinedIcon color="primary" fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              {titleLine}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {dateLabel}
            </Typography>
          </Box>
        </Box>

        {!canEdit && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
            This session is in the past — view only.
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {error}
          </Alert>
        )}

        <FormControl component="fieldset" disabled={!canEdit || pending} sx={{ width: "100%" }}>
          <FormLabel component="legend" sx={{ fontSize: "0.875rem", mb: 1 }}>
            Your attendance
          </FormLabel>
          <RadioGroup
            row
            value={status}
            onChange={(_, v) => setStatus(v as typeof status)}
          >
            <FormControlLabel
              value="PRESENT"
              control={<Radio size="small" />}
              label="Present"
            />
            <FormControlLabel
              value="LATE"
              control={<Radio size="small" />}
              label="Late"
            />
            <FormControlLabel
              value="ABSENT"
              control={<Radio size="small" />}
              label="Absent"
            />
          </RadioGroup>
        </FormControl>

        {status === "LATE" && (
          <TextField
            label="Note (optional)"
            value={lateReason}
            onChange={(e) => setLateReason(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            disabled={!canEdit || pending}
            sx={{ mt: 1.5 }}
            inputProps={{ maxLength: 500 }}
          />
        )}
        {status === "ABSENT" && (
          <TextField
            label="Reason (optional)"
            value={absentReason}
            onChange={(e) => setAbsentReason(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            disabled={!canEdit || pending}
            sx={{ mt: 1.5 }}
            inputProps={{ maxLength: 500 }}
          />
        )}

        {canEdit && (
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            disabled={pending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const res = await submitAttendance({
                  sessionId: row.sessionId,
                  status,
                  lateReason: status === "LATE" ? lateReason : null,
                  absentReason: status === "ABSENT" ? absentReason : null,
                });
                if (!res.ok) {
                  setError(res.error);
                }
              });
            }}
          >
            {pending ? "Saving…" : "Save"}
          </Button>
        )}

        {!canEdit && row.markStatus && (
          <Typography variant="body2" sx={{ mt: 1.5 }} color="text.secondary">
            Saved: {row.markStatus}
            {row.lateReason ? ` — ${row.lateReason}` : ""}
            {row.absentReason ? ` — ${row.absentReason}` : ""}
          </Typography>
        )}
      </Box>
    </Card>
  );
}

export function MemberAttendanceList({
  rows,
  highlightSessionId,
}: {
  rows: MemberAttendanceRow[];
  highlightSessionId?: string;
}) {
  useEffect(() => {
    if (highlightSessionId && typeof document !== "undefined") {
      const el = document.getElementById("session-focus");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [highlightSessionId]);

  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No scheduled sessions yet. When your halqa team sets up Dawati and Tarbiyati
        programs, they will appear here.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {rows.map((row) => (
        <SessionCard
          key={row.sessionId}
          row={row}
          highlightSessionId={highlightSessionId}
        />
      ))}
    </Box>
  );
}
