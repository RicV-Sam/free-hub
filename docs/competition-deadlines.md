# Competition deadlines

Competition expiry is owned by `shared/page-data.js` and used by page generation, active listings, archive maintenance, mobile feeds and email-alert selection.

## Record contract

- Keep `closingDate` as the South African calendar date shown to readers.
- Where the official source confirms a precise deadline, add optional `closingAt` as an ISO timestamp with seconds and an explicit timezone, for example `2026-10-31T23:59:00Z`. Record source evidence; do not infer this value from an ambiguous time or advance a review date without checking the source.
- A competition is closed at or after that instant. Without `closingAt`, the existing date-only convention remains: entry stays open through `closingDate` in SAST and closes at the start of the next day.
- An earlier `editorialActiveUntil` still ends promotion. An explicit timestamp cannot extend a date-only or editorial cutoff.
- Invalid supplied timestamps fail closed in the shared helper and stop generation before output is written. Omit an unknown timestamp rather than supplying an empty value.

STAEDTLER's 2026 creative challenge is the first migrated record: its [official campaign](https://www.staedtler.com/intl/en/discover/staedtler-international-creative-challenge-2026/) gives a 31 October 23:59 UTC deadline, which is 1 November 01:59 SAST, so its South African `closingDate` remains `2026-11-01`. Source rechecked on 1 November 2026; the stored editorial review date was not advanced.

## Browser and static output

Browser listings, promoted cards, detail entry controls, Club's active list and competition outbound handoffs recheck deadlines. Timers, returning to a tab and entry-link actions trigger checks. Club's saved/entered history is retained.

Precisely timed detail and outbound entry links start disabled until JavaScript verifies the deadline. With JavaScript disabled, these pages explain the restriction and keep reference/navigation links. Legacy date-only pages retain their existing manual fallback.

Static HTML, sitemaps and JSON feeds are build snapshots: normal regeneration and archive maintenance are still required. Browser protection uses the visitor's clock; it is not a replacement for a promoter's entry validation. Feed consumers must respect `closingAt` and `editorialActiveUntil` when present, or refresh their snapshot.

## Test clocks

Production captures the actual time once at generator startup, so all pages and feeds agree even if a deadline passes during the build. Browser checks continue using the current time. `FREEHUB_AS_OF_TIME` supports a precise zoned timestamp for lifecycle audits; it takes precedence over `FREEHUB_AS_OF_DATE`. A date-only fixture uses noon SAST on that date. Clear both overrides before a current build. The established September regression date remains a fixture, not evidence of current availability.

Relevant coverage lives in `tests/lifecycle/page-data.test.js`, `mobile-feed.test.js`, `editorial-picks.test.js`, and browser tests `competition-expiry.spec.js` and `club-expiry.spec.js`.
