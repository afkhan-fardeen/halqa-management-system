"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { saveDailyLogSection } from "@/lib/actions/daily-log";
import { buildSaveDailyLogSectionSchema } from "@/lib/validations/daily-log";
import { DailyLogHmsShell } from "@/components/member/daily-log-hms-shell";
import type { DailyLogForEdit } from "@/lib/queries/daily-log";
import { QURAN_SURAH_PLACEHOLDER } from "@/lib/constants/daily-log";
import { todayYmdLocal } from "@/lib/utils/date";
import {
  emptySalah,
  normalizeUnsavedSalahFromDraft,
} from "@/lib/utils/daily-log-defaults";
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
    salah: emptySalah(),
    quran: {
      quranType: "TILAWAT",
      quranSurah: QURAN_SURAH_PLACEHOLDER,
      quranPages: 0,
    },
    hadithLiterature: {
      hadithRead: false,
      literatureRead: false,
    },
  };
}

function normalizeHadithLiteratureFromDraft(
  raw: unknown,
  fallback: DailyLogForEdit["hadithLiterature"],
): DailyLogForEdit["hadithLiterature"] {
  if (!raw || typeof raw !== "object") return fallback;
  const o = raw as Record<string, unknown>;
  const hadithRead =
    typeof o.hadithRead === "boolean" ? o.hadithRead : fallback.hadithRead;
  if (typeof o.literatureRead === "boolean") {
    return { hadithRead, literatureRead: o.literatureRead };
  }
  if (typeof o.literatureSkipped === "boolean") {
    return { hadithRead, literatureRead: !o.literatureSkipped };
  }
  return { hadithRead, literatureRead: fallback.literatureRead };
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
  const [, startTransition] = useTransition();
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
  const formRef = useRef(form);
  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    setForm(base);
  }, [base]);

  const [autoSaveReady, setAutoSaveReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAutoSaveReady(true), 600);
    return () => clearTimeout(t);
  }, []);

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
            salah: parsed.salatSaved
              ? (parsed.salah ?? d.salah)
              : normalizeUnsavedSalahFromDraft(parsed.salah, genderUnit),
            quran: parsed.quran ?? d.quran,
            hadithLiterature: normalizeHadithLiteratureFromDraft(
              parsed.hadithLiterature,
              d.hadithLiterature,
            ),
          };
          setForm(merged);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            salah: parsed.salatSaved
              ? (parsed.salah ?? d.salah)
              : normalizeUnsavedSalahFromDraft(parsed.salah, genderUnit),
            quran: parsed.quran ?? d.quran,
            hadithLiterature: normalizeHadithLiteratureFromDraft(
              parsed.hadithLiterature,
              d.hadithLiterature,
            ),
          };
          setForm(merged);
          return;
        }
      } catch {
        /* fresh */
      }
    }
    const fresh = defaultForm(genderUnit, ymd);
    setForm(fresh);
  }

  function setSalah(p: (typeof PRAYERS)[number], v: string) {
    setForm((f) => ({
      ...f,
      salatSaved: false,
      salah: { ...f.salah, [p]: v },
    }));
  }

  const flushSection = useCallback(
    (section: "salah" | "quran" | "hadith", opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false;
      const f = formRef.current;
      const schema = buildSaveDailyLogSectionSchema(genderUnit);
      const parsed =
        section === "salah"
          ? schema.safeParse({
              section: "salah",
              date: f.date,
              salah: f.salah,
            })
          : section === "quran"
            ? schema.safeParse({
                section: "quran",
                date: f.date,
                quran: f.quran,
              })
            : schema.safeParse({
                section: "hadith",
                date: f.date,
                hadithLiterature: f.hadithLiterature,
              });

      if (!parsed.success) {
        return;
      }

      setPendingSection(section);
      startTransition(async () => {
        const res = await saveDailyLogSection(parsed.data);
        setPendingSection(null);
        if (res.error) {
          toast.error("Couldn’t save", { description: res.error });
          return;
        }
        const nextSalat = section === "salah" ? true : f.salatSaved;
        const nextQuran = section === "quran" ? true : f.quranSaved;
        const nextHadith = section === "hadith" ? true : f.hadithSaved;
        if (section === "salah") {
          setForm((prev) => ({ ...prev, salatSaved: true }));
        } else if (section === "quran") {
          setForm((prev) => ({ ...prev, quranSaved: true }));
        } else {
          setForm((prev) => ({ ...prev, hadithSaved: true }));
        }
        if (nextSalat && nextQuran && nextHadith) {
          clearDailyLogDraft(userId, f.date);
        }
        if (!silent) {
          toast.success("Saved");
        }
        router.refresh();
      });
    },
    [genderUnit, router, userId],
  );

  useEffect(() => {
    if (!autoSaveReady) return;
    const id = setTimeout(() => flushSection("salah", { silent: true }), 1500);
    return () => clearTimeout(id);
  }, [form.salah, form.date, autoSaveReady, flushSection]);

  useEffect(() => {
    if (!autoSaveReady) return;
    const id = setTimeout(() => flushSection("quran", { silent: true }), 1500);
    return () => clearTimeout(id);
  }, [
    form.quran.quranType,
    form.quran.quranSurah,
    form.quran.quranPages,
    form.date,
    autoSaveReady,
    flushSection,
  ]);

  useEffect(() => {
    if (!autoSaveReady) return;
    const id = setTimeout(() => flushSection("hadith", { silent: true }), 1500);
    return () => clearTimeout(id);
  }, [form.hadithLiterature, form.date, autoSaveReady, flushSection]);

  const maleOpts = ["BA_JAMAAT", "MUNFARID", "QAZA"] as const;
  const femaleOpts = ["ON_TIME", "QAZA"] as const;
  const opts = genderUnit === "MALE" ? maleOpts : femaleOpts;

  const draftLabel = pendingSection
    ? `Saving ${pendingSection === "salah" ? "prayers" : pendingSection === "quran" ? "Quran" : "literature & hadith"}…`
    : draftStatus === "saving"
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
          Ehtisaab
        </Typography>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 0.5 }}>
          Today&apos;s report
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.55 }}>
          Salah, Quran, and literature — changes save automatically a few seconds after you edit.
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

        <div className="hms-daily-tab-nav" role="tablist" aria-label="Ehtisaab sections">
          {(
            [
              ["Salah", form.salatSaved],
              ["Quran", form.quranSaved],
              ["Lit. & Hadith", form.hadithSaved],
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
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                Select each prayer when you&apos;re ready—nothing is selected until you tap.
              </Typography>
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
              <InputLabel id="quran-done">Done?</InputLabel>
              <Select
                labelId="quran-done"
                label="Done?"
                value={form.quran.quranSurah === "YES" ? "YES" : "NO"}
                onChange={(e) => {
                  const v = String(e.target.value);
                  setForm((f) => ({
                    ...f,
                    quranSaved: false,
                    quran: {
                      ...f.quran,
                      quranSurah: v === "YES" ? "YES" : QURAN_SURAH_PLACEHOLDER,
                      quranPages: 0,
                    },
                  }));
                }}
              >
                <MenuItem value="YES">Yes</MenuItem>
                <MenuItem value="NO">No</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel id="quran-type">Type</InputLabel>
              <Select
                labelId="quran-type"
                label="Type"
                value={form.quran.quranType}
                disabled={form.quran.quranSurah !== "YES"}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    quranSaved: false,
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
          </Stack>
        </CardContent>
      </Card>
        ) : null}

        {activeTab === 2 ? (
          <Card variant="outlined" sx={cardShellSx}>
        <CardHeader
          title="Literature & Hadith"
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
          <Stack spacing={2.5}>
            <FormControl component="fieldset" variant="standard" sx={{ m: 0 }}>
              <FormLabel component="legend" sx={{ typography: "subtitle2", fontWeight: 600, mb: 0.75 }}>
                Hadith
              </FormLabel>
              <RadioGroup
                row
                value={form.hadithLiterature.hadithRead ? "yes" : "no"}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    hadithSaved: false,
                    hadithLiterature: {
                      ...f.hadithLiterature,
                      hadithRead: e.target.value === "yes",
                    },
                  }))
                }
              >
                <FormControlLabel value="yes" control={<Radio color="primary" />} label="Yes" />
                <FormControlLabel value="no" control={<Radio color="primary" />} label="No" sx={{ ml: 1 }} />
              </RadioGroup>
            </FormControl>
            <FormControl component="fieldset" variant="standard" sx={{ m: 0 }}>
              <FormLabel component="legend" sx={{ typography: "subtitle2", fontWeight: 600, mb: 0.75 }}>
                Literature
              </FormLabel>
              <RadioGroup
                row
                value={form.hadithLiterature.literatureRead ? "yes" : "no"}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    hadithSaved: false,
                    hadithLiterature: {
                      ...f.hadithLiterature,
                      literatureRead: e.target.value === "yes",
                    },
                  }))
                }
              >
                <FormControlLabel value="yes" control={<Radio color="primary" />} label="Yes" />
                <FormControlLabel value="no" control={<Radio color="primary" />} label="No" sx={{ ml: 1 }} />
              </RadioGroup>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>
        ) : null}
      </Stack>
    </DailyLogHmsShell>
  );
}
