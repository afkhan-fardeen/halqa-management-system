# Ehtisaab nudges (`/api/cron/ehtisaab-nudges`)

Sends up to **five** in-app notifications per member per **Bahrain** calendar day (plus web push if enabled):

- One nudge per prayer, each **PRAYER_NUDGE_OFFSET_MINUTES** (default **27**) after the Aladhan adhan time for Fajr, Dhuhr, Asr, Maghrib, and Isha (Manama, Bahrain).

Members who already saved **Salah + Quran + Hadith** for that day are skipped for all five.

## Auth

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

**Not configured in `vercel.json` by default** (Hobby-friendly). Nudges only run when something calls this `GET`:

- **External:** e.g. [cron-job.org](https://cron-job.org) — `GET` your production URL **every ~5 minutes** with `Authorization: Bearer <CRON_SECRET>` so each prayer’s short delivery window is hit.
- **Manual:** `curl` for testing.

If you use **Vercel Pro** (or another host) you may add a `*/5 * * * *` cron in `vercel.json` pointing at this path.

## Database

Apply migration `0011_ehtisaab_nudge_sent.sql` so deduplication table exists.

Prayer times are fetched from the public [Aladhan API](https://aladhan.com/prayer-times-api) (no API key).
