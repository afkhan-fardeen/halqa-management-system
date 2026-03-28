# Session attendance reminders (cron)

## What it does

`GET /api/cron/attendance-reminders`:

1. **Materializes** upcoming session rows for all active programs (same logic as saving a program — extends the rolling window of concrete sessions).
2. Finds **concrete sessions** whose `ends_at` is **within the last 24 hours** and **not in the future** (session has ended).
3. For each such session, for each **ACTIVE** member in the program’s **halqa + gender unit** who has **no** `attendance_marks` row yet, inserts a row into `attendance_reminder_sent` (unique per user per session) and sends an in-app notification + web push with a clear title and body.

Duplicate cron runs do **not** send duplicate reminders: `attendance_reminder_sent` enforces one auto-reminder per user per session.

## Configuration

| Variable | Purpose |
|----------|---------|
| `CRON_SECRET` | Required. The route expects `Authorization: Bearer <CRON_SECRET>`. |

## Scheduling

The handler looks at sessions whose `ends_at` falls in the **last 24 hours**, so **one run per day** is enough to remind everyone who hasn’t marked yet (within that window).

**Vercel Hobby:** cron is limited to **at most once per day** per job — use a daily schedule (e.g. `30 7 * * *` = 07:30 UTC). Hourly schedules require **Pro**.

**Vercel Cron example** (`vercel.json`):

```json
{
  "crons": [
    { "path": "/api/cron/attendance-reminders", "schedule": "30 7 * * *" }
  ]
}
```

Stagger this from your daily log reminder cron (e.g. `0 6 * * *`) so both stay under Hobby limits.

**Manual:**

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" "https://your-domain.com/api/cron/attendance-reminders"
```

## Database

Apply migrations so `attendance_programs`, `attendance_sessions`, `attendance_marks`, and `attendance_reminder_sent` exist: `npm run db:migrate`.
