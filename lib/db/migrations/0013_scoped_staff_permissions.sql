-- Create the scope_gender enum type
CREATE TYPE "scope_gender" AS ENUM('MALE', 'FEMALE', 'BOTH');--> statement-breakpoint

-- Add new columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "staff_tag" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "scope_all_halqas" boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "scope_gender" "scope_gender";--> statement-breakpoint

-- Set existing ADMINs to full-scope so their behaviour is unchanged
UPDATE "users" SET "scope_all_halqas" = true, "scope_gender" = 'BOTH' WHERE "role" = 'ADMIN';
