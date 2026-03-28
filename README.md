# Halqa Management

Next.js app for tracking daily worship, outreach, and contributions across halqas. PostgreSQL (Drizzle), NextAuth, and a mobile-first member experience.

## Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL)

## Setup

1. Copy environment variables and set secrets:

   ```bash
   cp .env.example .env.local
   ```

   Set `AUTH_SECRET` (`openssl rand -base64 32`). Set `AUTH_URL` to your site URL (e.g. `http://localhost:3000` for dev).

2. Start the database:

   ```bash
   docker compose up -d
   ```

3. Install and apply the schema:

   ```bash
   npm install
   npm run db:push
   ```

4. (Optional) Seed a local admin:

   ```bash
   npm run db:seed
   ```

   Defaults: `admin@qalbee.com` / `password123` — override with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `.env.local`.

   If seed says “user already exists” but login fails, run `npm run db:reset-admin-password` to set the password from those env vars.

5. Configure **outgoing email** (e.g. Gmail with an [App Password](https://support.google.com/accounts/answer/185833)):

   - `SMTP_USER`, `SMTP_PASS`, and optionally `EMAIL_FROM` (e.g. `Halqa Management <you@gmail.com>`).
   - Registration approval and rejection emails use this transport.

6. Run the dev server:

   ```bash
   npm run dev
   ```

The **marketing site** is at `/` (public). **Active members** are redirected to **`/home`**; staff (Admin, Incharge, Secretary) signing in go to `/dashboard`. New registrations stay **pending** until approved in **Dashboard → Registrations**.

**After pulling:** with Docker Postgres running, run `npm run db:migrate` so local schema matches (including `notifications.action_url`). If migrate fails with `ECONNREFUSED`, start the DB (`docker compose up -d`) and retry.

## Authentication

- NextAuth.js (Auth.js) with credentials and JWT sessions.
- Passwords hashed with bcrypt.
- **`/` is the marketing landing** (public). **`/home`** is the member app shell (after sign-in). Protected member routes redirect to `/login` when needed. Set `AUTH_URL` on Vercel to your production origin so sessions work.

## Registration approvals

- Incharge and Secretary see pending members for their halqa and gender; Admin sees all.
- Approve or reject under `/dashboard/registrations`. Applicants receive email when SMTP is configured.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run db:push` | Push Drizzle schema (dev) |
| `npm run db:generate` | Generate SQL migrations |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed` | Seed one `ADMIN` user (local dev) |
| `npm run db:seed:staff` | Seed `admin@qalbee.com` (ADMIN) + `riffa.incharge@qalbee.com` (INCHARGE, Riffa, male); password `password123` |
| `npm run db:seed:staff:neon` | Same, against **Neon** (`DATABASE_URL_PRODUCTION` in `.env.local`) |
| `npm run db:reset-admin-password` | Set password for existing admin (same env as seed) |

Use a hosted Postgres URL (e.g. Neon) in production via `DATABASE_URL`.

## Deploying to Vercel (with Neon)

1. **Neon:** Create a database and copy the connection string (prefer **pooled** / serverless-friendly if Neon shows two URLs). Add `?sslmode=require` if not already present.

2. **Vercel:** Import this Git repo, framework **Next.js**. Leave the **Root Directory** empty (`.`). Do **not** set it to `halqa-management-system` unless that folder exists inside the repo (it does not when this repo is only the app). Wrong root → successful build can still yield **404 NOT_FOUND** on every route. Use the default Next.js preset and **do not** set a custom **Output Directory** (Vercel handles `.next`).

3. **Environment variables** (Project → Settings → Environment Variables): copy from `.env.example` and fill at least:

   | Variable | Notes |
   |----------|--------|
   | `DATABASE_URL` | Neon URL |
   | `AUTH_SECRET` | `openssl rand -base64 32` |
   | `AUTH_URL` | Your live origin, e.g. `https://your-project.vercel.app` or `https://your-domain.com` (no trailing slash). Set this for password-reset links and emails; with a **custom domain**, this must match that domain. |
   | `CRON_SECRET` | `openssl rand -hex 32` — must match what secures `/api/cron/reminders` (see `vercel.json` cron). |
   | `SMTP_*`, `EMAIL_FROM` | Same as local if you want email in production. |
   | `VAPID_*` | Optional; required for device push notifications. |

4. **Database migrations:** With `DATABASE_URL_PRODUCTION` set in `.env.local` (same string as Vercel’s `DATABASE_URL`):

   ```bash
   npm run db:migrate:neon
   ```

   For local Docker Postgres only, use `npm run db:migrate`.

5. **Cron:** `vercel.json` schedules `GET /api/cron/reminders` daily at **06:00 UTC**. Your Vercel plan must include [Cron Jobs](https://vercel.com/docs/cron-jobs); set `CRON_SECRET` in the project (Vercel sends `Authorization: Bearer <CRON_SECRET>`). See `docs/cron-reminders.md`.

6. **Redeploy** after changing env vars.

**Edge vs Node:** This app uses **`proxy.ts`** (Next.js 16) for auth, not `middleware.ts`. Edge middleware cannot load `@/auth` (Node-only deps). If you see `unsupported modules: @/auth` on deploy, ensure **`middleware.ts` is not present** and **`proxy.ts`** is committed.

## PWA and Web Push

- **Install:** Public page at `/install`. PWA icons and manifest-related assets live under `public/icons_and_manifest/` (URLs `/icons_and_manifest/...`). Add `icon-192.png` and `icon-512.png` next to `icon.svg`; optional extra sizes in `public/icons_and_manifest/icons/`. Legacy paths `/icon.svg`, `/icon-192.png`, `/icon-512.png` redirect to the new folder.
- **Service worker:** `public/sw.js` registers from the root layout. It caches same-origin static assets only (`/_next/static`, fonts, manifest, images); **`/api/*` is never cached**. Updates show an in-app “Update and reload” prompt before activating a new worker.
- **Web Push (optional):** Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` in `.env.local` (see `.env.example`). Run `npx web-push generate-vapid-keys` to create keys. Without VAPID, the app still works; subscribe UI and push delivery are skipped.
- **Database:** `push_subscriptions` stores per-device subscription endpoints (migration `0004_push_subscriptions`). Apply with `npm run db:migrate` after pulling.
- **Testing:** Use **HTTPS** in production for push. On localhost, push may be limited by browser. Prefer a stable origin (`localhost` or staging) when debugging; LAN-only URLs can cause Next.js RSC fetch issues. **iOS Safari** has stricter PWA/push behavior—test on real devices.
