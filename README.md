# Sukan Rakyat
**Ajak gang main.**

Phase 1: a mobile-first, vibrant sports-lobby PWA prototype. Static, dependency-free JavaScript; deploy `dist/` to any static HTTPS host. This repository contains a working frontend demo, **not a production multi-user service**.

## Run
Requires Node.js 20+.

```sh
npm test
npm run check
npm run build
```

Serve `dist/` using a static HTTP server. A direct file URL cannot load ES modules or install the PWA. Use HTTPS (or localhost) for service workers. Fonts are optional Google Fonts; system fonts work offline. First successful online visit caches the app shell. Browser installation support varies; use the browser's install / add-to-home-screen option where available.

## Included
- Football: 11-a-side / 9-a-side, futsal: 5-a-side, badminton: singles / doubles.
- Organizer defines total participant capacity independently of on-field team size; no fixed capacity presets.
- Create and duplicate sessions, filter lobby, personal sessions, invite-demo link, waiting list and cancellation of unpaid participation.
- Session dashboard: confirmed collections, active-participant target, outstanding payments, booking cost and capacity.
- Participant claim: unpaid → pending. Only session organizer can mark verified or correct records. Explicit verification confirmation; verification timestamp stored. QR image + bank details are organizer-editable; QR download and account copy. No gateway or bank integration.
- Manual team assignment, shuffle, formation presets, first lineup + bench. Badminton pair limits, court display and shuffled pairs; court rotation remains manual.
- Announcement editing and persistent local demo data. Explicit reset confirmation.
- PWA manifest, PNG icons and same-origin offline app-shell service worker.
- Responsive layout, keyboard focus states, semantic form labels and reduced-motion support.

## Demo identities
Use the profile button to switch between Mamu (organizes futsal), Aiman (organizes football), a new player, and a visitor. Join a session to reveal its dashboard. Waiting-list members do not see dashboard data in the demo UI. The organizer is initially included in the roster, with their own contribution unpaid in newly created sessions.

**All access rules in this phase are illustrative client-side behavior, not security boundaries.** The entire seeded dataset is public demo content in the frontend and localStorage. Do not put real participant/payment data into this version.

## Not yet implemented (Phase 2)
- Google OAuth, server-verified identity and server-side membership/organizer authorization.
- Shared database, atomic slot reservation / waiting-list promotion, real invite links across devices.
- Durable payment audit history, private upload storage, receipt upload / access controls, manual refund ledger.
- Manual position-slot placement, multiple futsal teams and automatic badminton rotation.
- Push notifications, public discovery and match scoring.

No Google login button pretends to authenticate. No demo QR pretends to accept money. Invite dialog states local-only limitations. New session IDs use UUIDs; URLs use hash routes for static-host compatibility.

## Verification
`npm test` checks collection arithmetic, capacity and waiting lists, membership visibility, payment transitions and role restrictions, variable sports capacities, team balance and persistence. `npm run check` checks JavaScript syntax; `npm run build` packages static assets. Browser/device visual and install QA remains outstanding where browser preview is unavailable.

## V1 additions — Maps and flexible collections
Google Maps HTTPS links can be set on creation or edited under Payments. Supported known Maps domains only; external links open in a new tab.

Fee modes: manual, cost / maximum capacity, or cost / actual attendance. New automatic sessions initially estimate using maximum capacity. Actual-attendance recalculation requires all active attendees marked present or absent and at least one present. Organizer previews and explicitly confirms new assessments. Attendance edits alone never change fees. Absent participants are assessed RM0 on actual-attendance confirmation. Costs are integer cents; per-person amounts round up to the nearest cent and the preview discloses rounding surplus.

Local payment ledgers preserve confirmed amounts across fee changes, with partial payments, outstanding balances and overpayment display. Pending claims retain their original amount when rates change. Organizers enter the actual amount received for each confirmation. Corrections append a negative ledger entry; no funds are transferred or refunded. Old demo records migrate without resetting their data.

Deadlines are optional, editable, and may be before or after the session. In-app reminders show near the selected deadline (24/48 hours) and when overdue. Organizer can copy a WhatsApp reminder; no message is automatically sent. Email / push scheduling and true cross-device reminders require the Phase 2 backend.
