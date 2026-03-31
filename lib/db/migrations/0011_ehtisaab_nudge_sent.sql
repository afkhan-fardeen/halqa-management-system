CREATE TABLE "ehtisaab_nudge_sent" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "day_ymd" varchar(10) NOT NULL,
  "slot" varchar(32) NOT NULL,
  "sent_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "ehtisaab_nudge_sent_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "ehtisaab_nudge_sent_user_day_slot_unique" UNIQUE ("user_id","day_ymd","slot")
);

CREATE INDEX "ehtisaab_nudge_sent_day_ymd_idx" ON "ehtisaab_nudge_sent" ("day_ymd");
