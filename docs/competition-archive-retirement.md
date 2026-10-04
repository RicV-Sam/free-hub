# Reviewed competition archive retirement

Expired entries leave active listings on the day after their South African closing
date. Ordinary closed detail pages remain `noindex`; an expired date alone does not
approve their removal. Verified result pages remain a separate publication class.

This workflow screens archives at least 90 days old at the measurement cutoff. It
requires a complete, aligned 28-day period with no reported Google clicks or GA4
landing sessions, plus separate backlink, prize-use/claim and useful-results reviews.
Missing data means hold. A successful HTTP request, a reused terms URL, or an empty
Bing link response cannot clear the original campaign by themselves. A zero-traffic
screen is not evidence of an AdSense rejection cause.

Keep analytics exports, backlink exports, downloaded terms, source snapshots and
the review dossier in ignored `.research/` storage. Do not commit or deploy them.
The registry at `data/competition-retirements.json` contains only compact cleared
receipts, not these exports. The first batch was reviewed on 4 October 2026 using
the complete 2–29 September traffic window and Google/Bing external-link evidence.
Only individually cleared records enter the registry; unresolved candidates stay
available as closed archives. Google link reports are sampled, so an unreported
link is not proof that no backlink exists.

The private dossier is `{ "reviews": [...] }`. Each review has `id`, `sourceHash`,
`reviewedAt` and `effectiveAt` (ISO calendar dates). Obtain the fingerprint with
`sourceHash(records)` from `scripts/lib/competition-retirements.js`, passing every
raw copy with that ID from the primary and expired collections.

Every `traffic`, `backlinks`, `claims` and `results` review requires `status: "clear"`,
`reviewedAt`, a SHA-256 `evidenceHash` and a specific `note` of at least 20 characters.
Keep the referenced evidence with the private dossier so another reviewer can check
it. Do not set `clear` merely because no warning appeared in an automated scan.

- `traffic`: `startDate`, `endDate` (28 days inclusive), `complete: true`,
  `googleClicks: 0`, `landingSessions: 0`. Unknown values cannot be recorded as zero.
  The cutoff must be within seven days of the review; refresh lagged evidence first.
- `backlinks`: `preserve: false`, after checking available external-link evidence
  and recording its limits. Valuable links require a separate preservation decision.
- `claims`: official `sourceUrls`; optional `retainUntil` for prize use or claims.
  Unresolved dates or continuing obligations require a hold.
- `results`: official `sourceUrls`, `usefulResult: false`, after reviewing relevant
  result/winner sources. Any existing result fields automatically block retirement.

Run a review without changing publication:

```powershell
node scripts/review-competition-retirements.js --review=.research/archive-cleanup-2026-10-04/review-dossier.json --today=2026-10-04
```

Read the adjacent private `retirement-decisions.json`. For a cleared subset only,
use the same command with `--approve` to write compact registry receipts, then build
and validate. The command refuses a dossier containing any hold. Registry changes
remain local until a separately authorized release.

The generator filters both source collections before composing detail pages,
navigation, structured data, sitemap and feeds. Existing stale-route cleanup removes
generated detail and exit directories; source records remain unchanged. A retired
URL therefore returns the site's real HTTP 404 with helpful catalogue links on the
existing static host. Do not redirect unrelated retired campaigns to the homepage.
If a genuinely equivalent replacement exists, review that redirect separately.

Receipts have an effective date, so historical builds retain their original pages.
Any subsequent change to source facts, a reopened campaign or added result evidence
invalidates an effective approval and stops generation until re-reviewed. Maintenance
also checks for stale retired routes or links. Undoing a retirement requires removing
its receipt and regenerating; retained source records restore the archived page.

Validate the production-flag build, lifecycle/SEO tests and maintenance state, probe
HTTP statuses and public internal links, and inspect the custom 404 on mobile and
desktop. Google Search Console may continue reporting old 404 URLs after retirement;
a smaller exclusion count is not the acceptance criterion.
