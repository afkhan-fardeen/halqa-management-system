-- Programs no longer require a recurring weekday/times; staff add sessions per date.
ALTER TABLE "attendance_programs" ALTER COLUMN "weekday" DROP NOT NULL;
ALTER TABLE "attendance_programs" ALTER COLUMN "start_time" DROP NOT NULL;
ALTER TABLE "attendance_programs" ALTER COLUMN "end_time" DROP NOT NULL;
