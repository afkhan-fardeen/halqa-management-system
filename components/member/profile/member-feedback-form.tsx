"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  TextField,
  Typography,
} from "@mui/material";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import {
  submitMemberFeedback,
  type MemberFeedbackActionState,
} from "@/lib/actions/member-feedback";

const initialState: MemberFeedbackActionState | null = null;

export function MemberFeedbackForm() {
  const [state, formAction, pending] = useActionState(
    submitMemberFeedback,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && "success" in state && state.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <Card
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
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, mb: 1.5 }}>
        <RateReviewOutlinedIcon sx={{ color: "primary.main", mt: 0.25 }} fontSize="small" />
        <Box>
          <Typography variant="body2" fontWeight={600} color="text.primary">
            App feedback
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
            Share bugs, ideas, or things you&apos;d like improved. Admins can read this in the dashboard.
          </Typography>
        </Box>
      </Box>
      <form ref={formRef} action={formAction} className="flex flex-col gap-2">
        <TextField
          name="message"
          multiline
          minRows={4}
          fullWidth
          required
          placeholder="What would help you most? (e.g. a fix, a feature, or clarity on something)"
          disabled={pending}
          inputProps={{ maxLength: 8000, "aria-label": "Feedback message" }}
          size="small"
        />
        {state && "error" in state && state.error ? (
          <Alert severity="error" sx={{ py: 0.5 }}>
            {state.error}
          </Alert>
        ) : null}
        {state && "success" in state && state.success ? (
          <Alert severity="success" sx={{ py: 0.5 }}>
            Thanks — your feedback was sent.
          </Alert>
        ) : null}
        <Button type="submit" variant="contained" disabled={pending} sx={{ alignSelf: "flex-start", mt: 0.5 }}>
          {pending ? "Sending…" : "Send feedback"}
        </Button>
      </form>
    </Card>
  );
}
