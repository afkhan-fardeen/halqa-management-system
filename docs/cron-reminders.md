# Daily log reminders (cron)

## What it does

`GET /api/cron/reminders` selects **ACTIVE** members who have **not** saved **Salah, Quran, and Hadith** for the current calendar day (same rule as the daily log UI). For each such member it:

1. Inserts at most **one** in-app notification of type `daily_reminder` per user per calendar day.
2. Sends at most **one** reminder email per user per calendar day when outgoing mail is configured, using the `daily_reminder_email_sent` table so duplicate cron runs do not duplicate emails.

The “today” date uses the server’s local calendar (`todayYmdLocal()`), so schedule your job for the time of day you want that date to represent (e.g. evening in your region).

## Configuration

**Legacy behavior is disabled by default.** Set `ENABLE_LEGACY_DAILY_REMINDER=true` to run this route’s in-app + email reminders. Prefer [`/api/cron/ehtisaab-nudges`](cron-ehtisaab-nudges.md) for Bahrain-time nudges.

| Variable | Purpose |
|----------|---------|
| `CRON_SECRET` | Required. The route expects `Authorization: Bearer <CRON_SECRET>`. |
| `ENABLE_LEGACY_DAILY_REMINDER` | Must be `true` to run (otherwise the handler returns `skipped: true`). |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, etc. | Optional. If unset, in-app reminders still run; emails are skipped. See `.env.example`. |
| `AUTH_URL` | Used when building links inside emails (same origin as the app). |

## Scheduling

Call the endpoint **once per day** (or more often if you want retries; duplicate in-app rows and duplicate emails are prevented as above).

**Vercel Cron example** (`vercel.json`):

```json
{
  "crons": [{ "path": "/api/cron/reminders", "schedule": "0 18 * * *" }]
}
```

Set `CRON_SECRET` in the project environment and configure the cron to send the bearer token (per Vercel docs for secured cron routes).

**Manual / external scheduler:** `curl` with the header:

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" "https://your-domain.com/api/cron/reminders"
```

## Database

Apply migrations so `daily_reminder_email_sent` exists: `npm run db:migrate`.
