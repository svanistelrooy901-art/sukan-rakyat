# Sukan Rakyat custom subdomain

Requested hostname: `sukanr.digitalsambal.space`.
Cloudflare Pages project: `sukan-rakyat`, target `sukan-rakyat.pages.dev`.

Main deployment registers the hostname through the Pages API. It reports pending separately from Active. It does not edit DNS records or redirect existing addresses. DNS and valid HTTPS must be confirmed before publishing the new address.

If no CNAME exists, add this at the authoritative DNS provider:
- Type: CNAME
- Name: sukanr
- Target: sukan-rakyat.pages.dev
- TTL: Auto/default

Cloudflare Pages → sukan-rakyat → Custom domains must show Active. If validation asks for another record, use the exact record shown there. Leave existing records for the apex, www and email intact.

In the existing Google Web Client, add `https://sukanr.digitalsambal.space` to Authorized JavaScript origins. Keep the pages.dev and GitHub origins during testing.

Backend deployments read site-config.json and allow only the exact requested HTTPS origin, together with preserved existing origins. The pipeline checks a D1-backed auth challenge from the custom origin. This verifies CORS, not Google's authorized origin settings or DNS.

Before sharing: open the custom URL with valid HTTPS; test Google login, organizer session creation and participant invitation from separate accounts. Existing database records are reused. Browser login sessions and PWA installs are tied to the origin, so users may need to log in and install again.
