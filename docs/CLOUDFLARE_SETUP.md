# Sukan Rakyat — activate the real trial

Source is ready; account setup below is required before real users can log in. Current Pages deployment remains the local demo until `SUKAN_API_URL` is set. No Supabase project is required. No real demo data is automatically imported.

## 1. Create dedicated D1 database

In Cloudflare dashboard → Storage & databases → D1 SQL Database → Create database:

- Name: `sukan-rakyat`
- Retain the database UUID and Cloudflare Account ID.
- This database must be dedicated to Sukan Rakyat, not an AdvisorLink database.

## 2. Configure Google sign-in

In Google Cloud Console → Google Auth Platform:

1. Create/select a project for **Sukan Rakyat**.
2. Set application name and support email. Set audience to External, Testing for the initial trial; add the testers who should be able to sign in.
3. Create an OAuth client of type **Web application**.
4. Authorized JavaScript origin: `https://svanistelrooy901-art.github.io` (origin only, no `/sukan-rakyat/` path).
5. Save the **Client ID** ending in `.apps.googleusercontent.com`.

This app uses Google Identity Services ID-token login, not a redirect-based authorization-code exchange. **No Google Client Secret or redirect URI is used by this implementation.** The browser sends a nonce-bound ID token over HTTPS; the Worker checks Google's signature, issuer, audience, expiry, issuance time and nonce before creating its own revocable session.

Reference: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token

## 3. Add GitHub repository variables and one secret

Repo → Settings → Secrets and variables → Actions.

**Variables** (public configuration; safe to share with the developer):

| Name | Value |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
| `CLOUDFLARE_D1_DATABASE_ID` | UUID of the dedicated `sukan-rakyat` database |
| `GOOGLE_CLIENT_ID` | Web OAuth Client ID |

Create a Cloudflare API token scoped to the selected account with **Workers Scripts: Edit** and **D1: Edit**. Add it directly to GitHub as the **secret** `CLOUDFLARE_API_TOKEN`. Do not paste the token into chat, a repository file or a screenshot.

## 4. Deploy backend

GitHub → Actions → **Deploy Cloudflare trial backend** → Run workflow → main.

The workflow installs pinned dependencies, runs tests, generates ignored deploy configuration, applies the additive D1 migration, and deploys only `sukan-rakyat-api`. It runs manually; frontend pushes do not automatically deploy this Worker. No existing application is migrated.

When successful, retain the actual `https://sukan-rakyat-api.<your-subdomain>.workers.dev` URL printed by Wrangler. Open `<actual-worker-url>/health`; it must return `{"ok":true,"service":"sukan-rakyat-api"}`. A successful health response alone does not verify Google sign-in or database permissions.

## 5. Activate frontend

Add repository **variable** `SUKAN_API_URL` with the actual Worker origin (HTTPS, no trailing path).

Then GitHub → Actions → **Deploy GitHub Pages** → Run workflow → main.

Frontend build injects the public API origin into `dist/config.js`. Open:

https://svanistelrooy901-art.github.io/sukan-rakyat/

Google sign-in is now used by default. `?mode=demo` always opens the isolated local demo. `?mode=live` before configuration explicitly reports that the backend is not configured; it does not pretend to authenticate.

## 6. Real two-account trial (required)

1. Organizer logs in through Google and creates a future game with capacity 2 (including organizer), fee and Maps link.
2. Organizer copies invite link. Second tester opens it on another phone/account.
3. Before joining, tester sees only preview, no roster, QR/account or collections. After joining, dashboard becomes available.
4. A third tester joins the same invite: waiting list only, no private dashboard.
5. Player marks paid; organizer verifies the exact amount after checking their bank.
6. Organizer changes fee and deadline. Previous confirmed amount stays fixed; balance/overpayment changes correctly on both devices after refresh.
7. Player cannot verify payments or change organizer settings. A tester without membership cannot open `/sessions/<id>` through the API.
8. Unpaid joined player leaves; earliest waiting player is promoted.
9. Log out; previous bearer session must stop working. Reopening a new tab requires login again because the frontend token is kept in sessionStorage.

Do not call the trial fully validated until this checklist passes with actual Google accounts and the deployed D1 backend.

## Data and limits

- Separate live and demo entry modules. Live data is read/written through the server; no roster/financial data goes to localStorage or offline cache. The opaque login token is stored in sessionStorage for the current tab.
- D1 stores users, hashed session tokens/challenges, rate limits and versioned session aggregates. Server compares versions on every update and retries conflicts. Explicit fee previews reject stale versions.
- Every mutation carries an idempotency ID retained for the lifetime of the session; retrying a timed-out payment uses the same ID. Aggregate command cap: 5,000 updates/session. Trial capacity cap: 500 participants/session; organizer chooses the actual capacity.
- QR images: PNG/JPG/WebP up to 64 KB, stored in the private session record. No R2 account or file-storage billing setup is needed for the trial. Receipt uploads are not part of this release.
- Invite links are bearer invitations: anyone who receives one can see the summary and request a slot with a Google account. Do not publish a private game's invite link publicly.
- Attendance settlement assigns RM0 to absent players only after organizer confirms it. Overpayments are displayed; refund/credit transfers remain manual.
- Reminders are in-app and copied text only. Daily cron only removes expired auth sessions, challenges and rate-limit rows; it does not send notifications.
- Collection data is refreshed on user action. Realtime subscriptions, email/push reminders, account deletion UI and refunds ledger are not included.
- The existing GitHub Pages origin also hosts the user's other projects; a dedicated domain for Sukan Rakyat would provide a separate web origin when moving beyond the trial.
- Free-tier quotas are finite. No paid upgrade is configured by this code. Check Cloudflare usage before expanding beyond the initial group trial.

## Roll back the frontend

Clear `SUKAN_API_URL` and rerun Pages to restore demo-only default. This does not delete D1 records or revoke existing backend sessions. For a compromised deployment, disable the Worker and revoke its sessions before reopening access.

## Local validation

```sh
npm ci
npm test
npm run check
npm run build
npx --no-install wrangler deploy --config worker/wrangler.jsonc --dry-run
npx --no-install wrangler d1 migrations apply sukan-rakyat --local --config worker/wrangler.jsonc
```

Use Node.js 24.15 or newer. Local tests use SQLite to exercise the D1 query adapter and generated RSA keys to test Google token validation. They do not authenticate to a real Google account or remote Cloudflare database.
