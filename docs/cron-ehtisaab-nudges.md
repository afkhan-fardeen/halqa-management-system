# Ehtisaab nudge cron (`/api/cron/ehtisaab-nudges`)

Sends up to **six** in-app notifications per member per **Bahrain** calendar day (plus web push if enabled):

1. Five nudges, each **PRAYER_NUDGE_OFFSET_MINUTES** (default **27**) after the Aladhan adhan time for Fajr, Dhuhr, Asr, Maghrib, and Isha (Manama, Bahrain).
2. One nudge at **09:30** Bahrain time to fill the ehtisaab form.

Members who already saved **Salah + Quran + Hadith** for that day are skipped for all six.

## Auth

Same as other crons:

```http
GET /api/cron/ehtisaab-nudges
Authorization: Bearer <CRON_SECRET>
```

## Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `CRON_SECRET` | (required) | Bearer token for the route |
| `PRAYER_NUDGE_OFFSET_MINUTES` | `27` | Minutes after adhan to fire each prayer nudge |

Legacy once-daily reminder + email is **off** unless `ENABLE_LEGACY_DAILY_REMINDER=true`. See `docs/cron-reminders.md`.

## Scheduler

- **Vercel:** `vercel.json` runs this route every **5 minutes** (`*/5 * * * *`). Requires a Vercel plan that allows that schedule (or use an external cron hitting the same URL).

- **External:** Any scheduler (e.g. cron-job.org) can `GET` the URL every 5 minutes with the `Authorization` header.

## Database

Apply migration `0011_ehtisaab_nudge_sent.sql` so deduplication table exists.

Prayer times are fetched from the public [Aladhan API](https://aladhan.com/prayer-times-api) (no API key).
