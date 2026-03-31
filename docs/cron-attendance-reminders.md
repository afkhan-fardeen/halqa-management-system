# Session attendance reminders

## What it does

`GET /api/cron/attendance-reminders` (Bearer `CRON_SECRET`) runs the same logic as **Attendance programs → Send attendance reminders (24h window)** and **Remind to mark** on a session row:

1. **Materializes** upcoming session rows for all active programs.
2. Finds **concrete sessions** whose `ends_at` is **within the last 24 hours** and **not in the future**.
3. For each such session, for each **ACTIVE** member in the program’s **halqa + gender unit** who has **no** `attendance_marks` row yet, inserts into `attendance_reminder_sent` (unique per user per session) and sends an in-app notification + web push.

Duplicate runs do **not** send duplicate reminders: `attendance_reminder_sent` enforces one reminder per user per session.

## Primary path (staff)

Use the **dashboard** — no cron required:

- **Attendance programs:** “Send attendance reminders (24h window)”
- **Attendance sessions** (per program): “Remind to mark” on each session row

These call `POST /api/dashboard/attendance/send-reminders` (global) or `POST /api/dashboard/attendance/sessions/[sessionId]/send-reminders` (single session). Staff must be signed in.

## Optional script

| Variable | Purpose |
|----------|---------|
| `CRON_SECRET` | Required for `GET`. The route expects `Authorization: Bearer <CRON_SECRET>`. |

## Scheduling

**Default:** `vercel.json` has **no** `crons` entry for this route. Use the dashboard buttons, or `curl` with `CRON_SECRET`, or add a **daily** Vercel cron on Hobby if you want automation once per day.

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" "https://your-domain.com/api/cron/attendance-reminders"
```

## Database

Apply migrations so `attendance_programs`, `attendance_sessions`, `attendance_marks`, and `attendance_reminder_sent` exist: `npm run db:migrate`.
