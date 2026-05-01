import { auth } from "@/auth";
import { MemberHistoryMonthControls } from "@/components/member/member-history-month-controls";
import { MemberPageShell } from "@/components/member/member-page-shell";
import { MemberScreenHeader } from "@/components/member/member-screen-header";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  getEarliestDailyLogYm,
  listDailyLogsForMemberInMonth,
} from "@/lib/queries/daily-log";
import {
  formatDisplayMonth,
  formatHistoryDateHeading,
} from "@/lib/utils/member-display";
import {
  currentYmLocal,
  enumerateYmInclusive,
  monthYyyyMmToRange,
} from "@/lib/utils/date";
import { redirect } from "next/navigation";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "MEMBER") {
    redirect("/login");
  }

  const maxYm = currentYmLocal();
  const { month: monthRaw } = await searchParams;
  const parsed =
    typeof monthRaw === "string" && monthYyyyMmToRange(monthRaw.trim())
      ? monthRaw.trim()
      : null;
  let monthYm = parsed ?? maxYm;

  const earliestYm = await getEarliestDailyLogYm(session.user.id);
  const floorYm = earliestYm ?? maxYm;

  if (monthYm < floorYm) {
    redirect(`/history?month=${encodeURIComponent(floorYm)}`);
  }
  if (monthYm > maxYm) {
    redirect(`/history?month=${encodeURIComponent(maxYm)}`);
  }

  const { rows, totalInMonth } = await listDailyLogsForMemberInMonth(
    session.user.id,
    monthYm,
  );

  const monthOptionsAsc = enumerateYmInclusive(floorYm, maxYm);
  const monthOptionsNewestFirst = [...monthOptionsAsc].reverse();

  return (
    <MemberPageShell>
      <MemberScreenHeader
        eyebrow="Your activity"
        title="Past logs"
        description="Browse by month (newest first). Tap a row to open your log for that day."
      />

      <MemberHistoryMonthControls
        monthYm={monthYm}
        minYm={floorYm}
        maxYm={maxYm}
        monthOptionsNewestFirst={monthOptionsNewestFirst}
      />

      <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: 2, overflow: "hidden" }}>
        <CardHeader
          sx={{ pb: 0 }}
          title={
            <Typography variant="h6" component="h2" fontWeight={700}>
              {formatDisplayMonth(monthYm)}
            </Typography>
          }
          subheader={
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {totalInMonth === 0
                ? "No entries for this month"
                : `${totalInMonth} entr${totalInMonth === 1 ? "y" : "ies"} — scroll the list below.`}
            </Typography>
          }
        />
        <CardContent sx={{ pt: 2, px: { xs: 2, sm: 2.5 }, pb: 2.5 }}>
          {rows.length === 0 ? (
            <Box
              sx={{
                borderRadius: 2,
                border: 2,
                borderStyle: "dashed",
                borderColor: "divider",
                bgcolor: "action.hover",
                px: 2,
                py: 4,
                textAlign: "center",
              }}
            >
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                Nothing for this month yet. Submit from{" "}
                <Typography
                  component="a"
                  href="/submit"
                  color="primary"
                  fontWeight={700}
                  sx={{ textDecoration: "underline", textUnderlineOffset: 3 }}
                >
                  Log
                </Typography>{" "}
                — it will appear here.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                maxHeight: { xs: "min(58dvh, 520px)", sm: "min(52dvh, 560px)" },
                overflowY: "auto",
                pr: 0.5,
                WebkitOverflowScrolling: "touch",
              }}
            >
              <Box
                component="ul"
                sx={{
                  listStyle: "none",
                  m: 0,
                  p: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.25,
                }}
              >
                {rows.map((row) => (
                  <Box component="li" key={row.id}>
                    <Box
                      component="a"
                      href={`/submit?date=${encodeURIComponent(row.date)}`}
                      aria-label={`View or edit log for ${row.date}`}
                      sx={{
                        display: "flex",
                        minHeight: 56,
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 1.5,
                        borderRadius: 2,
                        border: 1,
                        borderColor: "divider",
                        bgcolor: "background.paper",
                        px: 2,
                        py: 1.75,
                        textDecoration: "none",
                        color: "inherit",
                        transition: "background-color 0.15s",
                        "&:hover": { bgcolor: "action.hover" },
                        "&:active": { bgcolor: "action.selected" },
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={700} sx={{ lineHeight: 1.25 }}>
                          {formatHistoryDateHeading(row.date)}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.disabled"
                          sx={{ display: "block", mt: 0.35, fontVariantNumeric: "tabular-nums" }}
                        >
                          {row.date}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {[
                            row.prayerSummary,
                            `${row.quranPages} Quran page${row.quranPages === 1 ? "" : "s"}`,
                            row.hadith ? "Hadith" : "No hadith",
                            row.contactCount > 0
                              ? `${row.contactCount} contact${row.contactCount === 1 ? "" : "s"}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 0.25,
                          flexShrink: 0,
                        }}
                      >
                        <Typography variant="caption" color="primary" fontWeight={700}>
                          Edit
                        </Typography>
                        <ChevronRightIcon sx={{ color: "text.disabled" }} fontSize="small" />
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </MemberPageShell>
  );
}
