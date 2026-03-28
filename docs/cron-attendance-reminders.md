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

Run **every hour** or a few times per day so sessions that end are picked up within the 24h window.

**Vercel Cron example** (`vercel.json`):

```json
{
  "crons": [
    { "path": "/api/cron/attendance-reminders", "schedule": "15 * * * *" }
  ]
}
```

**Manual:**

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" "https://your-domain.com/api/cron/attendance-reminders"
```

## Database

Apply migrations so `attendance_programs`, `attendance_sessions`, `attendance_marks`, and `attendance_reminder_sent` exist: `npm run db:migrate`.
