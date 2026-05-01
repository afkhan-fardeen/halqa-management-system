"use client";

import Link from "next/link";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import {
  Box,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { addMonthsYm } from "@/lib/utils/date";
import { formatDisplayMonth } from "@/lib/utils/member-display";

export function MemberHistoryMonthControls({
  monthYm,
  minYm,
  maxYm,
  monthOptionsNewestFirst,
}: {
  monthYm: string;
  minYm: string;
  maxYm: string;
  monthOptionsNewestFirst: string[];
}) {
  const router = useRouter();
  const canPrev = monthYm > minYm;
  const canNext = monthYm < maxYm;

  const onSelect = (e: SelectChangeEvent<string>) => {
    router.push(`/history?month=${encodeURIComponent(e.target.value)}`);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 1,
        mb: 2,
      }}
    >
      {canPrev ? (
        <IconButton
          component={Link}
          href={`/history?month=${encodeURIComponent(addMonthsYm(monthYm, -1))}`}
          aria-label="Previous month"
          size="small"
          sx={{ border: 1, borderColor: "divider" }}
        >
          <ChevronLeft fontSize="small" />
        </IconButton>
      ) : (
        <IconButton disabled aria-label="Previous month" size="small" sx={{ border: 1, borderColor: "divider" }}>
          <ChevronLeft fontSize="small" />
        </IconButton>
      )}

      <FormControl size="small" sx={{ minWidth: { xs: 0, sm: 220 }, flex: { xs: "1 1 0", sm: "0 1 auto" } }}>
        <InputLabel id="member-history-month">Month</InputLabel>
        <Select
          labelId="member-history-month"
          label="Month"
          value={monthYm}
          onChange={onSelect}
        >
          {monthOptionsNewestFirst.map((ym) => (
            <MenuItem key={ym} value={ym}>
              {formatDisplayMonth(ym)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {canNext ? (
        <IconButton
          component={Link}
          href={`/history?month=${encodeURIComponent(addMonthsYm(monthYm, 1))}`}
          aria-label="Next month"
          size="small"
          sx={{ border: 1, borderColor: "divider" }}
        >
          <ChevronRight fontSize="small" />
        </IconButton>
      ) : (
        <IconButton disabled aria-label="Next month" size="small" sx={{ border: 1, borderColor: "divider" }}>
          <ChevronRight fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
}
