# Sukan Rakyat
**Ajak gang main.**

A vibrant, mobile-first sports-session portal for football (11/9 a side), futsal and badminton (singles/doubles).

## Status

- Phase 1 demo is published on GitHub Pages: https://svanistelrooy901-art.github.io/sukan-rakyat/
- Cloudflare Workers + D1 backend and connected trial frontend are implemented and tested locally.
- Real Google login and shared trial data require the owner account setup in [CLOUDFLARE_SETUP.md](docs/CLOUDFLARE_SETUP.md). They are not active merely because this source is present.
- Without `SUKAN_API_URL`, the website stays in local demo mode. `?mode=demo` explicitly opens it; real/demo data never mix.

## Features

- Organizer-defined participant capacity, invite links, waiting lists and cancellation of unpaid participation.
- Session-only dashboards, player list, booking cost and verified collections.
- Manual fees or automatic fees by maximum capacity / actual attendance, with explicit preview and confirmation. Deadline may precede or follow the event.
- Google Maps links, attendance marking, outstanding balances, partial payments, overpayments and correction history.
- Organizer QR and account details; direct bank transfer with organizer verification. No payment gateway.
- Team shuffle / manual assignment, formation presets, bench; badminton pair limits and court view.
- Reusable sessions, announcements, in-app deadline reminders and WhatsApp reminder text (copy only).
- PWA manifest and offline demo shell. Real trial operations require internet; private API responses are never cached by the service worker.

## Trial backend

- Server-side Google RSA signature / nonce / audience / issuer / time validation.
- Hashed opaque login sessions, immediate logout revocation, short-lived single-use sign-in challenges.
- Strict CORS, authenticated membership/organizer checks, input limits and rate limits.
- Versioned D1 updates protect capacity against concurrent joins. Mutation IDs prevent duplicate financial writes on retries; stale fee previews fail explicitly.
- Separate public invite summaries and participant-only rosters/collections.
- Dedicated D1 schema with no Supabase dependency. Up to 64 KB QR images stored within the private session aggregate; no R2 needed initially.

## Development

Requires Node.js 24.15+.

```sh
npm ci
npm test
npm run check
npm run build
```

`dist/` is the static frontend. Production browser code has no npm runtime dependency; Wrangler and JSDOM are pinned development dependencies. The Worker is bundled independently from `worker/src.js`, sharing the core collection rules with the frontend. Do not put credentials in `config.js`.

Tests cover fee arithmetic, migration of old demo records, attendance, claims, role restrictions, waiting lists, concurrent joins, logout, CORS, request replay, cryptographic Google token checks and a DOM-based live UI flow. A Worker bundle dry run and local D1 migration are also supported. Real Google sign-in, multi-device behavior and real-device install/visual QA must still be completed after account configuration.

## Remaining beyond this trial

Automatic email/push reminders, receipt uploads, refund/credit ledger, multiple futsal teams, drag-and-drop player positions, auto badminton rotations, public discovery, monetization and account-deletion UI.
