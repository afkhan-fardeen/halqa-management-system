import { z } from "zod";
import { HALQA_VALUES } from "@/lib/constants/halqas";

const GENDER_UNITS = ["MALE", "FEMALE"] as const;

const timeHHMM = z
  .string()
  .trim()
  .regex(/^([01]?\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24h)");

const REASON_MAX = 500;

/** Program row only (halqa / gender / kind / title). Sessions are added separately per date. */
export const upsertAttendanceProgramSchema = z.object({
  halqa: z.enum(HALQA_VALUES),
  genderUnit: z.enum(GENDER_UNITS),
  kind: z.enum(["DAWATI", "TARBIYATI"]),
  title: z.string().trim().max(200).optional().nullable(),
  timezone: z.string().trim().min(1).max(64).optional(),
});

const ymd = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const createAttendanceSessionSchema = z.object({
  programId: z.string().uuid(),
  sessionDateYmd: ymd,
  startTime: timeHHMM,
  endTime: timeHHMM,
  timezone: z.string().trim().min(1).max(64).optional(),
});

export const updateAttendanceSessionSchema = z.object({
  sessionId: z.string().uuid(),
  sessionDateYmd: ymd,
  startTime: timeHHMM,
  endTime: timeHHMM,
  timezone: z.string().trim().min(1).max(64).optional(),
});

export const submitAttendanceMarkSchema = z.object({
  sessionId: z.string().uuid(),
  status: z.enum(["PRESENT", "LATE", "ABSENT"]),
  lateReason: z
    .string()
    .trim()
    .max(REASON_MAX, `Reason must be at most ${REASON_MAX} characters`)
    .optional()
    .nullable(),
  absentReason: z
    .string()
    .trim()
    .max(REASON_MAX, `Reason must be at most ${REASON_MAX} characters`)
    .optional()
    .nullable(),
});

export const sendAttendanceNudgeSchema = z.object({
  sessionId: z.string().uuid(),
  /** When true, only members without a mark for this session. */
  onlyUnmarked: z.boolean().optional(),
});
