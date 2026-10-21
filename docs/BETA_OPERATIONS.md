# Sukan Rakyat beta hosting and monitoring

## Deployment

`Deploy Cloudflare Pages beta` runs on main pushes (except documentation-only changes) and manually. It runs tests/build, finds or creates the Direct Upload project `sukan-rakyat`, and takes its actual production subdomain from the Cloudflare API. It refuses to modify an existing Git-integrated project or a project whose production branch is not main.

The workflow publishes `dist`, adds only that exact production origin to the existing API CORS allowlist, redeploys the same backend, checks API access from both origins, and checks frontend assets. The D1 database is reused; this workflow performs no migration, deletion or paid upgrade. Existing GitHub Pages deployment remains enabled during the login trial. No automatic redirect has been installed.

Required existing repository variables: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID`, `GOOGLE_CLIENT_ID`; optional `SUKAN_API_URL` overrides config.js. Existing secret: `CLOUDFLARE_API_TOKEN`. For Pages, the token additionally needs **Account → Cloudflare Pages → Edit**, scoped to this account. Preserve existing Workers Scripts and D1 permissions. Never put the token in chat, code or variables.

The returned production origin appears in the successful workflow summary. Add that exact origin under the existing Google Web Client → Authorized JavaScript origins. Keep the GitHub origin while testing. Do not add arbitrary preview domains or weaken login. This Google setting cannot be changed using repository credentials.

Before the URL becomes the main beta entry point, test Google login on two accounts: organizer creates/invites; participant joins; organizer selects positions; participant claims payment and opens WhatsApp; organizer verifies the bank transaction. No actual payment is needed for a dry run. Test one real session separately when ready. PWA installs and browser login sessions are origin-specific; existing users will need to log in and may reinstall at the new address. Existing invite hashes can be used at the new origin once it is validated; old links keep working during migration.

Backend-only deployments preserve `ADDITIONAL_FRONTEND_ORIGINS` by reading the current Worker settings before building deploy.json. A provider read error stops deployment rather than silently removing a working frontend origin. No tokens are written into config files.

## Monitoring

`Beta health and usage monitor` runs hourly at minute 23 UTC and can be run manually. GitHub scheduled runs can be delayed; this is not a real-time pager. The first push containing the workflow also runs it.

The independent health job checks live backend, a D1-backed Google challenge, client ID, CORS and unauthenticated access denial. It does not log in to Google or verify an actual participant flow. The challenge creates a short-lived auth nonce and rate-limit entries (small database usage); normal cleanup removes expired entries.

The quota job queries Cloudflare analytics, without reading participant or payment data. It reports account-wide Workers requests, account-wide D1 row reads/writes for the UTC day, this API's request/runtime-error counts, and this database's size. It uses Free-plan references, not a declaration that the account is Free. Set repository variable `SUKAN_MONITOR_FREE_LIMITS=false` after upgrading to disable Free threshold failures; paid spend must then be watched separately in Cloudflare Billing.

Thresholds: WATCH ≥50%, PREPARE ≥70%, ACTION ≥80%. ACTION or unavailable metrics fail the usage job visibly. Missing/empty metrics are never reported as zero. Reports appear in the Actions job summary. Analytics can lag or be sampled, so use Cloudflare Billing as the invoice authority. Daily quotas reset at 00:00 UTC (08:00 Malaysia). The database reference is 500 MB, separate from the 5 GB account-wide Free storage allowance; account storage is not collected by this script.

Use a dedicated read-only `CLOUDFLARE_MONITOR_TOKEN` secret if available, with **Account → Account Analytics → Read** and **Account → D1 → Read**, scoped to this account. Otherwise the script uses the existing deployment secret, which may need Account Analytics: Read. Permission failures are surfaced rather than bypassed. No script prints raw API error bodies or secrets.

GitHub Actions notifications must be enabled in the owner's GitHub notification settings to receive failure emails; this repository does not send messages or configure an email recipient. WATCH/PREPARE are summary indicators, not email alerts. There is no automated purchase, plan upgrade or spending cap. On Paid, configure Cloudflare Billing budget alerts separately; those are notifications, not hard caps.

Cloudflare native dashboards: Workers & Pages → sukan-rakyat-api → Metrics (request/error/CPU); D1 → sukan-rakyat → Metrics (read/write/storage); Billing → Billable Usage for paid usage. CPU limits and HTTP 5xx rates are not evaluated by the quota script. User-facing analytics/Web Analytics has not been installed.

## Sources checked 21 October 2026

- https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/
- https://developers.cloudflare.com/analytics/graphql-api/tutorials/querying-workers-metrics/
- https://developers.cloudflare.com/analytics/graphql-api/getting-started/authentication/api-token-auth/
- https://developers.cloudflare.com/d1/observability/metrics-analytics/
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/d1/platform/limits/
- https://developers.cloudflare.com/billing/manage/budget-alerts/
