CREATE TYPE "attendance_program_kind" AS ENUM ('DAWATI', 'TARBIYATI');
CREATE TYPE "attendance_mark_status" AS ENUM ('PRESENT', 'LATE', 'ABSENT');

CREATE TABLE "attendance_programs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "halqa" "halqa" NOT NULL,
  "gender_unit" "gender_unit" NOT NULL,
  "kind" "attendance_program_kind" NOT NULL,
  "title" varchar(255),
  "weekday" integer NOT NULL,
  "start_time" varchar(8) NOT NULL,
  "end_time" varchar(8) NOT NULL,
  "timezone" varchar(64) NOT NULL DEFAULT 'Asia/Bahrain',
  "is_active" boolean NOT NULL DEFAULT true,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "attendance_programs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE set null ON UPDATE no action,
  CONSTRAINT "attendance_programs_halqa_gender_kind_unique" UNIQUE ("halqa","gender_unit","kind")
);

CREATE TABLE "attendance_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "program_id" uuid NOT NULL,
  "session_date" date NOT NULL,
  "starts_at" timestamp with time zone NOT NULL,
  "ends_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "attendance_sessions_program_id_attendance_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "attendance_programs"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "attendance_sessions_program_id_session_date_unique" UNIQUE ("program_id","session_date")
);

CREATE INDEX "attendance_sessions_ends_at_idx" ON "attendance_sessions" ("ends_at");
CREATE INDEX "attendance_sessions_program_id_idx" ON "attendance_sessions" ("program_id");

CREATE TABLE "attendance_marks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "session_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "status" "attendance_mark_status" NOT NULL,
  "absent_reason" text,
  "late_reason" text,
  "marked_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "attendance_marks_session_id_attendance_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "attendance_sessions"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "attendance_marks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "attendance_marks_session_id_user_id_unique" UNIQUE ("session_id","user_id")
);

CREATE INDEX "attendance_marks_user_id_idx" ON "attendance_marks" ("user_id");

CREATE TABLE "attendance_reminder_sent" (
  "user_id" uuid NOT NULL,
  "session_id" uuid NOT NULL,
  "sent_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "attendance_reminder_sent_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "attendance_reminder_sent_session_id_attendance_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "attendance_sessions"("id") ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "attendance_reminder_sent_user_session_unique" UNIQUE ("user_id","session_id")
);
