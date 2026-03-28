"use client";

import Link from "next/link";
import { Typography } from "@mui/material";

export function AuthBrand() {
  return (
    <div className="relative z-10 mb-8 text-center sm:mb-10">
      <Typography
        component={Link}
        href="/login"
        variant="h2"
        className="hms-brand"
        sx={{
          fontWeight: 700,
          textDecoration: "none",
          display: "inline-block",
          lineHeight: 1.05,
          letterSpacing: "-0.03em",
          fontSize: "2rem",
        }}
      >
        Qalbee<span>.</span>
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mt: 1.75, fontWeight: 500, fontSize: "1.0625rem" }}
      >
        Worship, outreach, contributions
      </Typography>
    </div>
  );
}
