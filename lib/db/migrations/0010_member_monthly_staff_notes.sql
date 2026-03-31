CREATE TABLE "member_monthly_staff_notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid NOT NULL,
  "month" varchar(7) NOT NULL,
  "body" text NOT NULL,
  "updated_by" uuid,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "member_monthly_staff_notes_member_id_users_id_fk" FOREIGN KEY ("member_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "member_monthly_staff_notes_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action,
  CONSTRAINT "member_monthly_staff_notes_member_id_month_unique" UNIQUE ("member_id","month")
);

CREATE INDEX "member_monthly_staff_notes_member_id_idx" ON "member_monthly_staff_notes" ("member_id");
