# SUSTREND Swipe — Kiosk production guide

SDGs 5P swipe game built for a 61:110 portrait kiosk. The production data path is offline-first and writes every completed game to both Supabase and a private Google Sheet.

## Architecture

```text
Kiosk → IndexedDB → Vercel Functions
                         ├─ Supabase
                         └─ signed Google Apps Script → private Google Sheet
```

- Registration is local and never waits for the network.
- A completed game is written to IndexedDB before any network request.
- Vercel accepts a submission when either Supabase or Google Sheets succeeds.
- The kiosk keeps retrying until both stores confirm the same submission ID and SHA-256 payload hash.
- The dashboard is protected by an independent shared admin credential, so Google Sheets fallback still works when Supabase is unavailable.
- Raw data is never readable through the public Supabase key.

## Local development

```bash
npm install
npm run dev
```

`vite` runs the UI only. Submission attempts remain safely queued when the local Vercel API is absent. Use `vercel dev` with a fully populated `.env.local` to exercise the complete gateway.

Checks:

```bash
npm test
npm run build
```

## Production setup

### 1. Supabase

Create a project and run these migrations in order:

1. `supabase/migrations/001_initial.sql`
2. `supabase/migrations/002_add_participant_gender.sql`
3. `supabase/migrations/003_dual_storage_gateway.sql`

Migration 003 removes anonymous inserts, adds event/device/submission metadata, adds service-role-only RPCs, and makes submissions idempotent.

Never expose `SUPABASE_SERVICE_ROLE_KEY` as a `VITE_*` variable.

### 2. Google Sheets

Follow [`google-apps-script/README.md`](google-apps-script/README.md). The spreadsheet must remain private and the owning Gmail account must have 2-Step Verification enabled.

The Apps Script creates:

- `Submissions`: full backup records, including nickname and optional phone.
- `Summary`: aggregate event totals.
- `SyncLog`: sanitized delivery and conflict diagnostics.

### 3. Admin credential

Generate a salted scrypt hash:

```bash
npm run admin:hash -- "a-long-unique-admin-password"
```

Store the output as `ADMIN_PASSWORD_HASH`. Store the login name as `ADMIN_USERNAME` and generate separate random values of at least 32 bytes for `ADMIN_SESSION_SECRET` and `GOOGLE_APPS_SCRIPT_SECRET`.

The shared admin password must not match the Gmail password.

### 4. Vercel environment

Copy the names from `.env.example` into the Vercel project:

- Public/build: `VITE_EVENT_SLUG`, `VITE_PRIVACY_VERSION`, `VITE_CARD_SET_VERSION`, `VITE_PUBLIC_GAME_URL`
- Server-only: `EVENT_SLUG`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- Google backup: `GOOGLE_APPS_SCRIPT_URL`, `GOOGLE_APPS_SCRIPT_SECRET`
- Admin: `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`
- Security: leave `PUBLIC_APP_ORIGINS` blank for same-origin deployment, or set a comma-separated exact-origin allowlist when the frontend and API are on different origins

`VITE_PUBLIC_GAME_URL` may also remain blank; the result share link then uses the deployed site's current origin.

Production intentionally shows a configuration error when required public configuration is missing.

## Data contract

Each completed game contains:

- UUID submission, participant, and kiosk device identifiers
- event and card-set versions
- nickname, exact numeric age, gender, and optional phone
- privacy policy version and acceptance time
- 15 card responses, server-verified result, and client completion time

Phone accepts 8–15 digits and may include spaces, `+`, `-`, or parentheses. The stored value preserves the submitted formatting after trimming its outer whitespace.

## Dashboard

Open `/dashboard` and sign in with the shared admin credential.

- Summary reads Supabase first and falls back to Google Sheets.
- Export merges available rows from both stores and deduplicates by submission ID.
- CSV cells that could execute spreadsheet formulas are escaped.
- Sessions last up to eight hours and expire after 30 minutes without an authenticated request.
- Five failed login attempts per IP within 15 minutes trigger a temporary application-level limit.

The in-process limiter is an initial protection for the intended kiosk scale. Enable Vercel Firewall rate limiting if the public URL is broadly distributed.

## Event operations

### Before the event

- Confirm the approved privacy language is current and increment `VITE_PRIVACY_VERSION` whenever it changes.
- Wake and smoke-test the Supabase Free project seven days, 24 hours, and the morning before the event.
- Complete one online play and verify the same submission ID in Supabase and the Sheet.
- Complete one offline play, reconnect, and verify both replicas.
- Confirm every kiosk dashboard reports zero pending, partial, and dead-letter items.
- Test CSV export and restore a staging Supabase project from Sheet data.
- Run the 100-submission acceptance load test:

```bash
LOAD_TEST_URL=https://sdgs-go.vercel.app/api/submissions npm run load:test
```

### During the event

- Monitor Vercel Function errors, Apps Script executions, Supabase database size, and each kiosk's local sync banner.
- Never clear browser storage while pending or partial items exist.
- Treat dead-letter items as an operator incident; preserve the kiosk before troubleshooting.

### After the event

- Wait until every kiosk has zero pending and partial submissions.
- Export CSV and an SQL backup.
- Compare unique submission counts across Supabase and Google Sheets.
- Store two protected copies: the operations laptop and organization-controlled cloud storage.

## Privacy release gate

The checked-in Thai and English privacy text must remain aligned with the version approved by the project owner. Increment `VITE_PRIVACY_VERSION` whenever the policy changes so each acceptance records the applicable revision.

Nickname and phone are stored as readable values by explicit product decision. Keep the Sheet private, restrict editors, avoid PII in logs, and rotate the shared admin credential after staff changes.
