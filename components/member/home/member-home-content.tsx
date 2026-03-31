"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Box,
  Card,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import type { MemberHomeDashboard } from "@/lib/queries/member-home";
import type { PrayerChip } from "@/lib/utils/prayer-display";
import { formatDisplayMonth } from "@/lib/utils/member-display";

function chipSx(chip: PrayerChip) {
  /** Match daily log: Ba jamaat = green, Munfarid = blue, Qaza = red, On time = teal */
  if (chip === "BJ") {
    return {
      bgcolor: (t: import("@mui/material").Theme) =>
        t.palette.mode === "dark" ? "#064E3B" : "#D1FAE5",
      color: (t: import("@mui/material").Theme) =>
        t.palette.mode === "dark" ? "#6EE7B7" : "#065F46",
    };
  }
  if (chip === "OT") {
    return {
      bgcolor: (t: import("@mui/material").Theme) =>
        alpha(
          t.palette.primary.main,
          t.palette.mode === "dark" ? 0.22 : 0.15,
        ),
      color: (t: import("@mui/material").Theme) =>
        t.palette.mode === "dark"
          ? t.palette.primary.light
          : t.palette.primary.dark,
    };
  }
  if (chip === "MF") {
    return {
      bgcolor: (t: import("@mui/material").Theme) =>
        t.palette.mode === "dark" ? "#1E3A8A" : "#DBEAFE",
      color: (t: import("@mui/material").Theme) =>
        t.palette.mode === "dark" ? "#93C5FD" : "#1E40AF",
    };
  }
  return {
    bgcolor: (t: import("@mui/material").Theme) =>
      t.palette.mode === "dark" ? "#7F1D1D" : "#FEE2E2",
    color: (t: import("@mui/material").Theme) =>
      t.palette.mode === "dark" ? "#FCA5A5" : "#991B1B",
  };
}

const sectionMotion = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.085, delayChildren: 0.05 },
  },
};

export function MemberHomeContent({
  data,
  todayLabel,
}: {
  data: MemberHomeDashboard;
  todayLabel: string;
}) {
  const quranBar = Math.min(100, data.weekQuranPages);
  const contactTotal = data.weekContacts.total;

  return (
    <Box
      component={motion.div}
      variants={stagger}
      initial="hidden"
      animate="show"
      sx={{ display: "flex", flexDirection: "column", gap: 3, pb: 2.5 }}
    >
        <motion.div variants={sectionMotion}>
      {data.submittedToday ? (
        <Card
          variant="outlined"
          sx={{
            borderColor: "primary.main",
            borderWidth: 1,
            bgcolor: (t) =>
              alpha(
                t.palette.primary.main,
                t.palette.mode === "dark" ? 0.12 : 0.08,
              ),
            borderRadius: 2,
          }}
        >
          <Box sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: "primary.main",
                color: "primary.contrastText",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <CheckCircleOutlineIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={600} color="primary.main">
                Today is complete
              </Typography>
              <Typography variant="caption" color="primary.main">
                {todayLabel}
              </Typography>
            </Box>
          </Box>
        </Card>
      ) : (
        <Card
          component={Link}
          href="/submit"
          sx={{
            bgcolor: "#1c1917",
            borderRadius: 2,
            overflow: "hidden",
            position: "relative",
            textDecoration: "none",
            color: "#fff",
            display: "block",
            "&:hover": { opacity: 0.98 },
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 140,
              height: 140,
              borderRadius: "50%",
              bgcolor: "primary.main",
              opacity: 0.12,
            }}
          />
          {/** Single <a> from Card — no CardActionArea (button) or inner Button */}
          <Box sx={{ p: 3, position: "relative" }}>
            <Typography
              variant="caption"
              sx={{ color: "rgba(255,255,255,0.55)", letterSpacing: 0.5 }}
            >
              {todayLabel}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                mt: 0.75,
                lineHeight: 1.25,
                fontWeight: 600,
                color: "#fff",
              }}
            >
              Submit today&apos;s log
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.55)", mt: 0.5 }}>
              Salah, Quran, hadith & outreach
            </Typography>
            <Box
              component="span"
              sx={{
                mt: 2.5,
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                borderRadius: 999,
                px: 2.25,
                py: 0.75,
                fontWeight: 600,
                fontSize: "0.875rem",
                bgcolor: "primary.main",
                color: "primary.contrastText",
                pointerEvents: "none",
              }}
            >
              Start
              <ArrowForwardIcon sx={{ fontSize: 16 }} aria-hidden />
            </Box>
          </Box>
        </Card>
      )}
        </motion.div>

        <motion.div variants={sectionMotion}>
          <Card
            component={Link}
            href="/attendance"
            variant="outlined"
            sx={{
              borderRadius: 2,
              textDecoration: "none",
              display: "block",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <Box
              sx={{
                p: 2,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  bgcolor: "action.selected",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <EventAvailableOutlinedIcon color="primary" fontSize="small" />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Session attendance
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Mark upcoming classes and review past attendance
                </Typography>
              </Box>
              <ArrowForwardIcon sx={{ fontSize: 18, color: "text.disabled" }} />
            </Box>
          </Card>
        </motion.div>

        <motion.div variants={sectionMotion}>
      <Box>
        <Typography
          variant="caption"
          sx={{
            color: "text.disabled",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            fontWeight: 600,
            px: 0.5,
            display: "block",
            mb: 1.25,
          }}
        >
          This week
        </Typography>
        <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 1 }}>
          <Box sx={{ p: 2.5 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Streak
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    lineHeight: 1,
                    fontWeight: 600,
                  }}
                >
                  {data.daysSubmittedLast7}{" "}
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.disabled"
                    sx={{ fontWeight: 500 }}
                  >
                    / 7 days
                  </Typography>
                </Typography>
              </Box>
              <Typography
                component={Link}
                href="/history"
                variant="caption"
                sx={{ color: "primary.main", fontWeight: 600 }}
              >
                History →
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 0.75 }}>
              {data.weekPips.map((p) => (
                <Box
                  key={p.ymd}
                  sx={{
                    flex: 1,
                    height: 36,
                    borderRadius: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 600,
                    bgcolor:
                      p.state === "done"
                        ? "primary.main"
                        : p.state === "today"
                          ? (t) =>
                              alpha(
                                t.palette.primary.main,
                                t.palette.mode === "dark" ? 0.2 : 0.12,
                              )
                          : "action.hover",
                    color:
                      p.state === "done"
                        ? "primary.contrastText"
                        : p.state === "today"
                          ? "primary.main"
                          : "text.disabled",
                    border:
                      p.state === "today"
                        ? (t) => `2px solid ${t.palette.primary.main}`
                        : "none",
                  }}
                >
                  {p.label}
                </Box>
              ))}
            </Box>
          </Box>
        </Card>
      </Box>
        </motion.div>

        <motion.div variants={sectionMotion}>
      <Box>
        <Typography
          variant="caption"
          sx={{
            color: "text.disabled",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            fontWeight: 600,
            px: 0.5,
            display: "block",
            mb: 1.25,
          }}
        >
          Yesterday
        </Typography>
        <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 1 }}>
          <Box sx={{ p: 2.5 }}>
            {data.yesterdayPrayers ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: 1,
                }}
              >
                {data.yesterdayPrayers.map((p) => (
                  <Box key={p.name} sx={{ textAlign: "center" }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        mx: "auto",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 9,
                        fontWeight: 700,
                        ...chipSx(p.chip),
                      }}
                    >
                      {p.chip}
                    </Box>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10, mt: 0.5, display: "block" }}>
                      {p.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No log for yesterday
              </Typography>
            )}
          </Box>
        </Card>
      </Box>
        </motion.div>

        <motion.div variants={sectionMotion}>
      <Box>
        <Typography
          variant="caption"
          sx={{
            color: "text.disabled",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            fontWeight: 600,
            px: 0.5,
            display: "block",
            mb: 1.25,
          }}
        >
          This week
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.75, mt: 0 }}>
          <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 1, p: 2 }}>
            <Typography variant="caption" color="text.disabled">
              Quran pages
            </Typography>
            <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 600, lineHeight: 1.2 }}>
              {data.weekQuranPages}{" "}
              <Typography component="span" variant="body2" color="text.disabled" fontWeight={500}>
                pg
              </Typography>
            </Typography>
            <LinearProgress
              variant="determinate"
              value={quranBar}
              sx={{
                mt: 1.25,
                height: 3,
                borderRadius: 1,
                bgcolor: "action.hover",
                "& .MuiLinearProgress-bar": { bgcolor: "primary.main" },
              }}
            />
          </Card>
          <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 1, p: 2 }}>
            <Typography variant="caption" color="text.disabled">
              Raabta
            </Typography>
            <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 600, lineHeight: 1.2 }}>
              {contactTotal}
            </Typography>
            <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 1.25 }}>
              <Chip
                label={`${data.weekContacts.muslim} M`}
                size="small"
                sx={{
                  height: 22,
                  fontSize: 10,
                  bgcolor: (t) =>
                    t.palette.mode === "dark" ? "#064E3B" : "#D1FAE5",
                  color: (t) =>
                    t.palette.mode === "dark" ? "#6EE7B7" : "#065F46",
                }}
              />
              <Chip
                label={`${data.weekContacts.nonMuslim} NM`}
                size="small"
                sx={{
                  height: 22,
                  fontSize: 10,
                  bgcolor: (t) =>
                    t.palette.mode === "dark" ? "#1E3A8A" : "#DBEAFE",
                  color: (t) =>
                    t.palette.mode === "dark" ? "#93C5FD" : "#1E40AF",
                }}
              />
            </Stack>
          </Card>
        </Box>
      </Box>
        </motion.div>

        <motion.div variants={sectionMotion}>
      <Box>
        <Typography
          variant="caption"
          sx={{
            color: "text.disabled",
            letterSpacing: 0.8,
            textTransform: "uppercase",
            fontWeight: 600,
            px: 0.5,
            display: "block",
            mb: 1.25,
          }}
        >
          Aiyanat
        </Typography>
        <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 1 }}>
          <Box
            component={Link}
            href="/aiyanat"
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            {data.currentAiyanat ? (
              <>
                <Box>
                  <Typography variant="body1" fontWeight={600}>
                    {formatDisplayMonth(data.currentAiyanat.month)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Paid this month
                  </Typography>
                </Box>
                <Chip
                  label={data.currentAiyanat.status === "PAID" ? "Yes" : "No"}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    bgcolor:
                      data.currentAiyanat.status === "PAID"
                        ? (t) => (t.palette.mode === "dark" ? "#064E3B" : "#D1FAE5")
                        : (t) =>
                            alpha(
                              t.palette.primary.main,
                              t.palette.mode === "dark" ? 0.2 : 0.12,
                            ),
                    color:
                      data.currentAiyanat.status === "PAID"
                        ? (t) => (t.palette.mode === "dark" ? "#6EE7B7" : "#065F46")
                        : (t) =>
                            t.palette.mode === "dark"
                              ? t.palette.primary.light
                              : t.palette.primary.dark,
                  }}
                />
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No entry this month — tap to add
              </Typography>
            )}
          </Box>
        </Card>
      </Box>
        </motion.div>
    </Box>
  );
}
