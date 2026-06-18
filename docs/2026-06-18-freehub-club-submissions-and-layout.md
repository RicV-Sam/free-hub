# 2026-06-18 Freehub Club, Submissions and Layout Update

## Summary

This update added the first usable Freehub Club foundation, a company competition submission route, Cloudflare Email Routing for `freehub.co.za`, and a shared navigation/layout polish pass.

The work keeps Freehub as a static generated site, using Firebase client-side auth and Firestore writes only where needed. No Cloud Functions or paid Firebase backend features are required for this sprint.

## Production Domain and Email

- `freehub.co.za` was added to Cloudflare and verified after the registrar nameservers were changed to Cloudflare.
- Cloudflare Email Routing was enabled for the domain.
- `hello@freehub.co.za` was routed to the verified Gmail destination.
- DNS and email routing are now managed in Cloudflare for `freehub.co.za`.

## Company Competition Submission Page

Added `/submit-a-competition/` for companies or promoters to submit public competition information for Freehub review.

Implemented behavior:

- Public, indexable SEO page for companies submitting competitions.
- Explains what Freehub can validate before publishing.
- Clarifies that Freehub does not collect consumer entries or private winner information.
- Saves submissions to Firestore collection `competitionSubmissions`.
- Shows a reference ID after successful submission.
- Requires a confirmation checkbox that only public campaign information is being submitted.

Firestore behavior:

- Anonymous users can create `competitionSubmissions` documents only when the submitted shape matches the allowed fields.
- Reads, updates and deletes are blocked client-side by Firestore rules.
- Review happens manually inside the Firebase Console.

## Firebase Project Separation

Confirmed that the active Freehub Firebase project is:

```text
freehub-3206e
```

Important operational note:

- Publish Freehub Firestore rules in the Freehub Firebase project, not the older DataCost project.
- Local `firebase-config.json` must point to Freehub for local testing.
- The real Firebase config remains uncommitted; GitHub Pages injects runtime config from repository variables.

## Freehub Club V1

Added the Freehub Club foundation using the existing Firebase auth stack.

Pages:

- `/club/`
  - Public, indexable landing page.
  - SEO-focused copy and FAQ/schema.
  - Google-focused CTA.
  - Privacy reassurance.
  - Save/track value proposition.
  - Referral link teaser.
  - Refer & Win shown as coming soon.
- `/club/dashboard/`
  - Noindex member dashboard.
  - Excluded from sitemap.
  - Shows tracked competitions and all active competitions.
- `/club/account/`
  - Noindex member account page.
  - Excluded from sitemap.
  - Shows profile, referral code/link, saved count and consent status.

Client modules:

- `shared/firebase-client.js`
  - Creates and loads Club profiles.
  - Generates stable referral codes using a Firestore transaction.
  - Reads and writes saved competitions.
  - Reads ignored competitions.
  - Creates pending referral attribution after sign-in.
- `shared/club-ui.js`
  - Handles Google sign-in CTA.
  - Handles logged-in and logged-out Club states.
  - Stores local saved competitions before sign-in.
  - Imports local saves after sign-in.
  - Captures incoming `?ref=FHXXXXX` links for 30 days.
  - Blocks self-referrals.
  - Copies and shares referral links.

## Club Competition Tracking

The dashboard now gives members a practical checklist-style view.

Tracked competition statuses:

- `interested`
- `entered`
- `skipped`

UI labels:

- `Need to review`
- `Interested`
- `Entered`
- `Not relevant`

Behavior:

- Logged-out users can save locally in `localStorage`.
- Logged-in users save to Firestore under `users/{uid}/savedCompetitions/{competitionId}`.
- Skipped competitions are stored under `users/{uid}/ignoredCompetitions/{competitionId}`.
- Local saves are imported to Firestore after sign-in.
- All active competitions are listed by nearest closing date on the dashboard.
- `Tracked competitions` and `All active competitions` are collapsible sections.

## Referral Foundation

Refer & Win is intentionally not live yet.

Implemented only:

- Stable member referral codes.
- Shareable referral links.
- Pending-only referral attribution.
- Firestore reverse lookup in `referralCodes/{code}`.
- Referral attribution records in `referralAttribution/{id}` with `status: "pending_verification"`.

Not implemented:

- Reward payouts.
- Verified referral counts.
- Automated winner/reward logic.
- Cloud Functions.

## Global Navigation and Layout

Added a shared top navigation across generated pages.

Navigation behavior:

- Brand link goes to `/`.
- `Home` goes to `/`.
- `Competitions` goes to `/competitions/`.
- `Ending soon` goes to `/competitions-ending-soon/`.
- `Club` goes to the public `/club/` landing page.
- Dark `Account` button goes to `/club/dashboard/`.

Accessibility/layout improvements:

- Added active nav state with `aria-current="page"`.
- Added keyboard-visible `Skip to content`.
- Added consistent `id="main-content"` landmarks.
- Added a clear `Back to dashboard` button on `/club/account/`.
- Updated `404.html` to match the shared navigation pattern.

## Desktop Layout Polish

Adjusted desktop hero layout after visual review.

Changes:

- Reduced hero top padding on desktop collection pages.
- Capped large desktop headline sizes.
- Tightened the right-side prize preview card layout.
- Improved text contrast in the Club preview panel.

Reason:

- The home and listing hero sections were visually strong but too tall on desktop.
- Listing pages started too low in the viewport.
- Some preview-card text could collide or appear low-contrast.

## Firestore Rules and Schema

The Firestore schema and rules reference lives in:

```text
docs/migrations/firestore-structure.md
```

Important collections now documented there:

- `users/{userId}`
- `users/{userId}/savedCompetitions/{competitionId}`
- `users/{userId}/ignoredCompetitions/{competitionId}`
- `users/{userId}/alertPreferences/main`
- `referralCodes/{code}`
- `referralAttribution/{attributionId}`
- `signupEvents/{eventId}`
- `competitionSubmissions/{submissionId}`

## Validation

Validation commands run during the sprint:

```powershell
npm run build
npm test
npm run lint
```

Known lint state:

- No build errors.
- No failing active competition URLs.
- Existing warnings are for expired/archive external URLs or manually accepted external resources.

## Deployment Commits

Key commits pushed to `main`:

```text
1f23d17 Add competition submission page
a0e7a68 Add Freehub Club account foundation
6682b37 Add Club competition checklist
5aab3d2 Add global account navigation
0f2c781 Make Club dashboard sections collapsible
ab1ce44 Update Club account CTA copy
1abed07 Add Club account back button
2d777f1 Improve shared page navigation layout
ea800f7 Polish desktop hero layouts
```

## Current Next-Best Improvements

- Add an admin/review workflow for `competitionSubmissions` so review does not rely only on Firebase Console.
- Add optional notification/email planning for closing competitions, likely starting with Firebase Trigger Email or an export-driven manual email process.
- Improve dashboard filtering by status and closing date as saved competition volume grows.
- Decide final Refer & Win rules before enabling any verified referral or reward UI.
