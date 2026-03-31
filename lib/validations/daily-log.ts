import { z } from "zod";
import { QURAN_SURAH_PLACEHOLDER } from "@/lib/constants/daily-log";

const malePrayerEnum = z.enum(["BA_JAMAAT", "MUNFARID", "QAZA"]);
const femalePrayerEnum = z.enum(["ON_TIME", "QAZA"]);

const hadithLiteratureSchema = z
  .object({
    hadithRead: z.boolean(),
    literatureSkipped: z.boolean(),
    bookTitle: z.string().max(255).optional(),
    bookDescription: z.string().max(500).optional(),
  })
  .superRefine((hl, ctx) => {
    if (!hl.literatureSkipped) {
      if (!hl.bookTitle?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Book title is required",
          path: ["bookTitle"],
        });
      }
      if (!hl.bookDescription?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Description is required",
          path: ["bookDescription"],
        });
      }
    }
  });

export function buildDailyLogSchema(genderUnit: "MALE" | "FEMALE") {
  const prayerSchema =
    genderUnit === "MALE" ? malePrayerEnum : femalePrayerEnum;

  return z
    .object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      salah: z.object({
        fajr: prayerSchema,
        dhuhr: prayerSchema,
        asr: prayerSchema,
        maghrib: prayerSchema,
        isha: prayerSchema,
      }),
      quran: z.object({
        quranType: z.enum(["TILAWAT", "TAFSEER", "BOTH"]),
        quranSurah: z.string().trim().min(1).max(255),
        quranPages: z.coerce.number().int().min(0),
      }),
      hadithLiterature: hadithLiteratureSchema,
    })
    .strict();
}

export type DailyLogInput = z.infer<ReturnType<typeof buildDailyLogSchema>>;

const dateYmd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export function buildSaveDailyLogSectionSchema(genderUnit: "MALE" | "FEMALE") {
  const prayerSchema =
    genderUnit === "MALE" ? malePrayerEnum : femalePrayerEnum;

  const salahSlotSchema = z.union([z.literal(""), prayerSchema]);

  const salahShape = z
    .object({
      fajr: salahSlotSchema,
      dhuhr: salahSlotSchema,
      asr: salahSlotSchema,
      maghrib: salahSlotSchema,
      isha: salahSlotSchema,
    })
    .superRefine((salah, ctx) => {
      const keys = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
      if (keys.some((k) => salah[k] === "")) {
        ctx.addIssue({
          code: "custom",
          message: "Choose a status for each prayer.",
          path: ["fajr"],
        });
      }
    });

  const quranShape = z
    .object({
      quranType: z.enum(["TILAWAT", "TAFSEER", "BOTH"]),
      quranSurah: z
        .string()
        .trim()
        .min(1)
        .max(255)
        .refine((s) => s !== QURAN_SURAH_PLACEHOLDER, "Enter a surah name"),
      quranPages: z.coerce.number().int().min(0),
    })
    .strict();

  return z.discriminatedUnion("section", [
    z
      .object({
        section: z.literal("salah"),
        date: dateYmd,
        salah: salahShape,
      })
      .strict(),
    z
      .object({
        section: z.literal("quran"),
        date: dateYmd,
        quran: quranShape,
      })
      .strict(),
    z
      .object({
        section: z.literal("hadith"),
        date: dateYmd,
        hadithLiterature: hadithLiteratureSchema,
      })
      .strict(),
  ]);
}

export type SaveDailyLogSectionInput = z.infer<
  ReturnType<typeof buildSaveDailyLogSectionSchema>
>;
