ALTER TABLE "daily_logs" ADD COLUMN IF NOT EXISTS "literature" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "daily_logs" SET "literature" = NOT "literature_skipped" WHERE "hadith_saved" = true;--> statement-breakpoint
ALTER TABLE "daily_logs" DROP COLUMN IF EXISTS "literature_skipped";--> statement-breakpoint
ALTER TABLE "daily_logs" DROP COLUMN IF EXISTS "book_title";--> statement-breakpoint
ALTER TABLE "daily_logs" DROP COLUMN IF EXISTS "book_description";
