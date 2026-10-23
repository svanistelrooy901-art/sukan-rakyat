# Platform admin

Open `https://sukanr.digitalsambal.space/#admin` or select **Monitor platform** from the profile menu after logging in.

The Worker authorizes `/admin/stats` using a verified Google email in `user_identities` and the server-side `ADMIN_EMAILS` allowlist. Set the `ADMIN_EMAILS` GitHub repository variable to the admin Google email (comma-separated for multiple admins), then deploy the Worker. It is injected into the server configuration and is not published in frontend assets or source. An empty allowlist denies everyone. The frontend role is only a display hint. There is no public role-changing endpoint.

Existing users must log out and log in once after deployment to populate the verified identity. Email is never returned in `/me`, session dashboards or aggregate statistics. No Google Client Secret is needed.

Deployment applies `0002_admin_identity.sql` before deploying the Worker. It adds a separate table and leaves the old users schema compatible with rollback. Do not delete the table during rollback.

## Metric definitions

- Registered accounts: unique Google subject IDs that have completed login; not visits or Google OAuth client counts.
- New accounts and sessions: rolling 7 and 30 days. Daily rows group those events by Malaysia calendar date; days without events are omitted.
- Login 7 days: accounts with an unexpired seven-day auth session. Logging out revokes that session. This is not daily activity or page views.
- Upcoming/past: session start time compared with now; not an organizer-confirmed completion status.
- Organizers: unique account IDs owning at least one session.
- Participation: current joined player entries, including organizers, counted per session. Unique players deduplicate account IDs. Waiting list entries are separate.
- Collection: current joined participants only; ledger net amounts include corrections. Legacy verified payments use the session fee. Values are in MYR and are manual organizer records, not platform revenue or bank verification.
- All-time aggregates include TEST sessions. No analytics events, marketing trackers, polling or automatic refresh are added.

Every response is no-store. Requests require the normal bearer token and have an additional limit of 12 admin reads per minute. Queries project aggregate values directly in D1 and do not return QR images, phone numbers, invitations, names or email addresses. Large datasets may require precomputed summaries later; monitor D1 rows read during beta. Cloudflare account quotas remain in the separate infrastructure monitor.
