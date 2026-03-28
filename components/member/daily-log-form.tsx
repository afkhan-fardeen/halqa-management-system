"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { saveDailyLogSection } from "@/lib/actions/daily-log";
import { DailyLogHmsShell } from "@/components/member/daily-log-hms-shell";
import type { DailyLogForEdit } from "@/lib/queries/daily-log";
import { QURAN_SURAH_PLACEHOLDER } from "@/lib/constants/daily-log";
import { QURAN_SURAH_OPTIONS } from "@/lib/constants/quran-surahs";
import { todayYmdLocal } from "@/lib/utils/date";
import { defaultSalahForGender } from "@/lib/utils/daily-log-defaults";
import { toast } from "sonner";
import {
  clearDailyLogDraft,
  readDailyLogDraftRaw,
  writeDailyLogDraftRaw,
} from "@/lib/utils/daily-log-draft";

const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
const PRAYER_LABEL: Record<(typeof PRAYERS)[number], string> = {
  fajr: "Fajr",
  dhuhr: "Dhuhr",
  asr: "Asr",
  maghrib: "Maghrib",
  isha: "Isha",
};

type Gender = "MALE" | "FEMALE";

type FormState = DailyLogForEdit;

function defaultForm(g: Gender, dateYmd: string): FormState {
  return {
    date: dateYmd,
    salatSaved: false,
    quranSaved: false,
    hadithSaved: false,
    salah: defaultSalahForGender(g),
    quran: {
      quranType: "TILAWAT",
      quranSurah: QURAN_SURAH_PLACEHOLDER,
      quranPages: 1,
    },
    hadithLiterature: {
      hadithRead: false,
      literatureSkipped: false,
      bookTitle: "",
      bookDescription: "",
    },
  };
}

function labelForOpt(o: string) {
  if (o === "BA_JAMAAT") return "Ba jamaat";
  if (o === "MUNFARID") return "Munfarid";
  if (o === "ON_TIME") return "On time";
  return "Qaza";
}

function optClassSuffix(o: string): "bj" | "mf" | "qz" | "ot" {
  if (o === "BA_JAMAAT") return "bj";
  if (o === "MUNFARID") return "mf";
  if (o === "ON_TIME") return "ot";
  return "qz";
}

function shortSalahLabel(o: string) {
  if (o === "BA_JAMAAT") return "BJ";
  if (o === "MUNFARID") return "MF";
  if (o === "ON_TIME") return "OT";
  return "Qaza";
}

export function DailyLogForm({
  genderUnit,
  initial,
  defaultDateYmd,
  userId,
}: {
  genderUnit: Gender;
  initial?: DailyLogForEdit | null;
  defaultDateYmd?: string;
  userId: string;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [pending, startTransition] = useTransition();
  const [pendingSection, setPendingSection] = useState<
    "salah" | "quran" | "hadith" | null
  >(null);
  const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const allowSaveDraft = useRef(false);
  const draftToastShown = useRef(false);

  const base = useMemo(() => {
    if (initial) return initial;
    const d = defaultForm(genderUnit, todayYmdLocal());
    if (defaultDateYmd && /^\d{4}-\d{2}-\d{2}$/.test(defaultDateYmd)) {
      d.date = defaultDateYmd;
    }
    return d;
  }, [initial, genderUnit, defaultDateYmd]);

  const [form, setForm] = useState<FormState>(base);
  const [surahInput, setSurahInput] = useState(() =>
    base.quran.quranSurah === QURAN_SURAH_PLACEHOLDER
      ? ""
      : base.quran.quranSurah,
  );

  useEffect(() => {
    setForm(base);
    setSurahInput(
      base.quran.quranSurah === QURAN_SURAH_PLACEHOLDER
        ? ""
        : base.quran.quranSurah,
    );
  }, [base]);

  const draftHydrateKey = useMemo(
    () =>
      [
        userId,
        base.date,
        genderUnit,
        initial?.date ?? "",
        initial?.salatSaved ? "1" : "0",
        initial?.quranSaved ? "1" : "0",
        initial?.hadithSaved ? "1" : "0",
      ].join("|"),
    [
      userId,
      base.date,
      genderUnit,
      initial?.date,
      initial?.salatSaved,
      initial?.quranSaved,
      initial?.hadithSaved,
    ],
  );

  useEffect(() => {
    if (initial) {
      allowSaveDraft.current = true;
      return;
    }
    const raw = readDailyLogDraftRaw(userId, base.date);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<FormState> & {
          contacts?: unknown;
        };
        if (parsed.date === base.date) {
          const d = defaultForm(genderUnit, base.date);
          const merged = {
            date: parsed.date ?? d.date,
            salatSaved: parsed.salatSaved ?? d.salatSaved,
            quranSaved: parsed.quranSaved ?? d.quranSaved,
            hadithSaved: parsed.hadithSaved ?? d.hadithSaved,
            salah: parsed.salah ?? d.salah,
            quran: parsed.quran ?? d.quran,
            hadithLiterature: parsed.hadithLiterature ?? d.hadithLiterature,
          };
          setForm(merged);
          setSurahInput(
            merged.quran.quranSurah === QURAN_SURAH_PLACEHOLDER
              ? ""
              : merged.quran.quranSurah,
          );
          if (!draftToastShown.current) {
            draftToastShown.current = true;
            toast.success("Draft loaded", { duration: 2500, id: "draft-once" });
          }
        }
      } catch {
        /* ignore */
      }
    }
    allowSaveDraft.current = true;
  }, [draftHydrateKey]);

  useEffect(() => {
    if (!allowSaveDraft.current) return;
    setDraftStatus("saving");
    const t = setTimeout(() => {
      try {
        writeDailyLogDraftRaw(userId, form.date, JSON.stringify(form));
        setLastSaved(new Date());
        setDraftStatus("saved");
      } catch {
        setDraftStatus("idle");
      }
    }, 550);
    return () => clearTimeout(t);
  }, [form, userId]);

  function onDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const ymd = e.target.value;
    draftToastShown.current = false;
    const raw = readDailyLogDraftRaw(userId, ymd);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<FormState>;
        if (parsed.date === ymd) {
          const d = defaultForm(genderUnit, ymd);
          const merged = {
            date: parsed.date ?? ymd,
            salatSaved: parsed.salatSaved ?? d.salatSaved,
            quranSaved: parsed.quranSaved ?? d.quranSaved,
            hadithSaved: parsed.hadithSaved ?? d.hadithSaved,
            salah: parsed.salah ?? d.salah,
            quran: parsed.quran ?? d.quran,
            hadithLiterature: parsed.hadithLiterature ?? d.hadithLiterature,
          };
          setForm(merged);
          setSurahInput(
            merged.quran.quranSurah === QURAN_SURAH_PLACEHOLDER
              ? ""
              : merged.quran.quranSurah,
          );
          return;
        }
      } catch {
        /* fresh */
      }
    }
    const fresh = defaultForm(genderUnit, ymd);
    setForm(fresh);
    setSurahInput("");
  }

  function setSalah(p: (typeof PRAYERS)[number], v: string) {
    setForm((f) => ({
      ...f,
      salah: { ...f.salah, [p]: v },
    }));
  }

  function saveSection(section: "salah" | "quran" | "hadith") {
    setPendingSection(section);
    startTransition(async () => {
      const payload =
        section === "salah"
          ? { section, date: form.date, salah: form.salah }
          : section === "quran"
            ? { section, date: form.date, quran: form.quran }
            : {
                section,
                date: form.date,
                hadithLiterature: form.hadithLiterature,
              };

      const res = await saveDailyLogSection(payload);
      setPendingSection(null);
      if (res.error) {
        toast.error("Couldn’t save", { description: res.error });
        return;
      }
      const nextSalat = section === "salah" ? true : form.salatSaved;
      const nextQuran = section === "quran" ? true : form.quranSaved;
      const nextHadith = section === "hadith" ? true : form.hadithSaved;
      if (section === "salah") {
        setForm((f) => ({ ...f, salatSaved: true }));
      } else if (section === "quran") {
        setForm((f) => ({ ...f, quranSaved: true }));
      } else {
        setForm((f) => ({ ...f, hadithSaved: true }));
      }
      if (nextSalat && nextQuran && nextHadith) {
        clearDailyLogDraft(userId, form.date);
      }
      toast.success("Saved");
      router.refresh();
    });
  }

  const maleOpts = ["BA_JAMAAT", "MUNFARID", "QAZA"] as const;
  const femaleOpts = ["ON_TIME", "QAZA"] as const;
  const opts = genderUnit === "MALE" ? maleOpts : femaleOpts;

  const busy = (s: "salah" | "quran" | "hadith") =>
    pending && pendingSection === s;

  const draftLabel =
    draftStatus === "saving"
      ? "Saving draft…"
      : lastSaved
        ? `Draft · ${lastSaved.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`
        : "Draft on device";

  const cardShellSx = {
    borderRadius: "var(--hms-radius)",
    borderColor: "var(--hms-border)",
    bgcolor: "var(--hms-bg3)",
    boxShadow: "none",
  };

  return (
    <DailyLogHmsShell>
      <Stack spacing={0}>
        <Typography
          variant="overline"
          sx={{
            color: "text.secondary",
            fontWeight: 700,
            letterSpacing: "0.14em",
            display: "block",
            mb: 1,
          }}
        >
          Daily log
        </Typography>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 0.5 }}>
          Today&apos;s report
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.55 }}>
          Salah, Quran, and hadith — open each tab and save when ready.
        </Typography>

        <div className="hms-daily-date-bar">
          <span className="hms-daily-date-label">Date</span>
          <input
            id="log-date"
            type="date"
            className="hms-daily-date-input"
            value={form.date}
            onChange={onDateChange}
            max={todayYmdLocal()}
            required
            aria-label="Log date"
          />
        </div>

        <div className="hms-daily-draft-row">
          {draftStatus === "saving" ? (
            <CircularProgress size={14} sx={{ color: "var(--hms-text3)" }} />
          ) : (
            <CloudUploadIcon sx={{ fontSize: 16, flexShrink: 0, color: "var(--hms-text3)" }} />
          )}
          <span>{draftLabel}</span>
        </div>

        <div className="hms-daily-tab-nav" role="tablist" aria-label="Daily log sections">
          {(
            [
              ["Salah", form.salatSaved],
              ["Quran", form.quranSaved],
              ["Hadith", form.hadithSaved],
            ] as const
          ).map(([label, done], i) => (
            <button
              key={label}
              type="button"
              role="tab"
              className="hms-daily-tab"
              data-active={activeTab === i ? "true" : "false"}
              aria-selected={activeTab === i}
              onClick={() => setActiveTab(i)}
            >
              <span className="hms-daily-tab-dot" data-done={done ? "true" : "false"} aria-hidden />
              {label}
            </button>
          ))}
        </div>

        {activeTab === 0 ? (
          <Card variant="outlined" sx={cardShellSx}>
          <CardHeader
            title="Prayers"
            titleTypographyProps={{ variant: "h6", fontWeight: 700 }}
            action={
              form.salatSaved ? (
                <Chip
                  icon={<CheckCircleIcon />}
                  label="Synced"
                  color="success"
                  size="small"
                  variant="outlined"
                />
              ) : null
            }
            sx={{ pb: 0 }}
          />
          <CardContent sx={{ pt: 2 }}>
            <Stack spacing={2}>
              {genderUnit === "MALE" ? (
                <div className="hms-daily-legend">
                  <div className="hms-daily-legend-item">
                    <span className="hms-daily-legend-dot hms-daily-ld-bj" />
                    Ba jamaat
                  </div>
                  <div className="hms-daily-legend-item">
                    <span className="hms-daily-legend-dot hms-daily-ld-mf" />
                    Munfarid
                  </div>
                  <div className="hms-daily-legend-item">
                    <span className="hms-daily-legend-dot hms-daily-ld-qz" />
                    Qaza
                  </div>
                </div>
              ) : (
                <div className="hms-daily-legend">
                  <div className="hms-daily-legend-item">
                    <span className="hms-daily-legend-dot hms-daily-ld-ot" />
                    On time
                  </div>
                  <div className="hms-daily-legend-item">
                    <span className="hms-daily-legend-dot hms-daily-ld-qz" />
                    Qaza
                  </div>
                </div>
              )}
              <div className="hms-daily-prayer-table">
                {PRAYERS.map((p) => (
                  <div key={p} className="hms-daily-prayer-row">
                    <span className="hms-daily-prayer-name">{PRAYER_LABEL[p]}</span>
                    <div className="hms-daily-prayer-options">
                      {opts.map((o) => {
                        const sel = form.salah[p] === o;
                        const suf = optClassSuffix(o);
                        return (
                          <button
                            key={o}
                            type="button"
                            className={`hms-daily-opt${sel ? ` hms-daily-opt--${suf}` : ""}`}
                            aria-pressed={sel}
                            aria-label={`${PRAYER_LABEL[p]} ${labelForOpt(o)}`}
                            onClick={() => setSalah(p, o)}
                          >
                            {shortSalahLabel(o)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="hms-daily-save-btn"
                disabled={busy("salah")}
                onClick={() => saveSection("salah")}
              >
                {busy("salah") ? (
                  <CircularProgress size={20} sx={{ color: "#fff" }} />
                ) : null}
                {busy("salah") ? "Saving…" : "Save prayers"}
              </button>
            </Stack>
          </CardContent>
        </Card>
        ) : null}

        {activeTab === 1 ? (
          <Card variant="outlined" sx={cardShellSx}>
        <CardHeader
          title="Quran"
          titleTypographyProps={{ variant: "h6", fontWeight: 700 }}
          action={
            form.quranSaved ? (
              <Chip
                icon={<CheckCircleIcon />}
                label="Synced"
                color="success"
                size="small"
                variant="outlined"
              />
            ) : null
          }
          sx={{ pb: 0 }}
        />
        <CardContent sx={{ pt: 2 }}>
          <Stack spacing={2.25}>
            <FormControl fullWidth size="small">
              <InputLabel id="quran-type">Type</InputLabel>
              <Select
                labelId="quran-type"
                label="Type"
                value={form.quran.quranType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    quran: {
                      ...f.quran,
                      quranType: e.target.value as FormState["quran"]["quranType"],
                    },
                  }))
                }
              >
                <MenuItem value="TILAWAT">Tilawat</MenuItem>
                <MenuItem value="TAFSEER">Tafseer</MenuItem>
                <MenuItem value="BOTH">Both</MenuItem>
              </Select>
            </FormControl>
            <Autocomplete
              freeSolo
              options={[...QURAN_SURAH_OPTIONS]}
              value={surahInput}
              onInputChange={(_, v) => {
                setSurahInput(v);
                setForm((f) => ({
                  ...f,
                  quran: {
                    ...f.quran,
                    quranSurah: v.trim() ? v : QURAN_SURAH_PLACEHOLDER,
                  },
                }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Surah"
                  placeholder="Search or type a surah"
                  fullWidth
                  size="small"
                />
              )}
            />
            <TextField
              label="Pages"
              type="number"
              inputProps={{ min: 1 }}
              value={form.quran.quranPages}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  quran: {
                    ...f.quran,
                    quranPages: Number(e.target.value) || 1,
                  },
                }))
              }
              sx={{ maxWidth: 160 }}
              size="small"
            />
            <button
              type="button"
              className="hms-daily-save-btn"
              disabled={busy("quran")}
              onClick={() => saveSection("quran")}
            >
              {busy("quran") ? (
                <CircularProgress size={20} sx={{ color: "#fff" }} />
              ) : null}
              {busy("quran") ? "Saving…" : "Save Quran"}
            </button>
          </Stack>
        </CardContent>
      </Card>
        ) : null}

        {activeTab === 2 ? (
          <Card variant="outlined" sx={cardShellSx}>
        <CardHeader
          title="Hadith & literature"
          titleTypographyProps={{ variant: "h6", fontWeight: 700 }}
          action={
            form.hadithSaved ? (
              <Chip
                icon={<CheckCircleIcon />}
                label="Synced"
                color="success"
                size="small"
                variant="outlined"
              />
            ) : null
          }
          sx={{ pb: 0 }}
        />
        <CardContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.hadithLiterature.hadithRead}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      hadithLiterature: {
                        ...f.hadithLiterature,
                        hadithRead: e.target.checked,
                      },
                    }))
                  }
                  color="primary"
                  size="medium"
                />
              }
              label={<Typography fontWeight={500}>Hadith read</Typography>}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.hadithLiterature.literatureSkipped}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      hadithLiterature: {
                        ...f.hadithLiterature,
                        literatureSkipped: e.target.checked,
                      },
                    }))
                  }
                  color="primary"
                  size="medium"
                />
              }
              label={<Typography fontWeight={500}>No literature</Typography>}
            />
            {!form.hadithLiterature.literatureSkipped ? (
              <>
                <TextField
                  label="Book"
                  value={form.hadithLiterature.bookTitle}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      hadithLiterature: {
                        ...f.hadithLiterature,
                        bookTitle: e.target.value,
                      },
                    }))
                  }
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Summary (max 500)"
                  multiline
                  rows={3}
                  inputProps={{ maxLength: 500 }}
                  value={form.hadithLiterature.bookDescription}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      hadithLiterature: {
                        ...f.hadithLiterature,
                        bookDescription: e.target.value,
                      },
                    }))
                  }
                  fullWidth
                  size="small"
                />
              </>
            ) : null}
            <button
              type="button"
              className="hms-daily-save-btn"
              disabled={busy("hadith")}
              onClick={() => saveSection("hadith")}
            >
              {busy("hadith") ? (
                <CircularProgress size={20} sx={{ color: "#fff" }} />
              ) : null}
              {busy("hadith") ? "Saving…" : "Save hadith & literature"}
            </button>
          </Stack>
        </CardContent>
      </Card>
        ) : null}
      </Stack>
    </DailyLogHmsShell>
  );
}
