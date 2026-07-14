# Freehub Testing and Regression Harness

## Purpose

PR 1B protects the repository-grounded Freehub baseline without changing public routes, generated markup, competition data, Firebase collections or publication behavior. The deterministic snapshot uses build date `2026-07-13`, when the generated sitemap contained 145 URLs, the main competition collection contained 85 static cards and its ItemList contained 85 structured-data items.

ZA Comp Engine exports remain private review evidence. Passing these tests cannot approve a handoff row, change Freehub publication state or create a public page.

## Commands

Run the generator before tests when working from a fresh checkout:

```powershell
$env:FREEHUB_BUILD_DATE = "2026-07-13"
npm run build
npm test
npm run lint
node scripts/validate-maintenance-state.js
npm run test:browser
```

The npm interfaces are:

- `npm test`: existing held-candidate protection plus deterministic SEO, performance and lifecycle checks.
- `npm run test:seo`: sitemap, metadata, canonical, schema, representative-page and performance baselines.
- `npm run test:lifecycle`: unit fixtures for publication, visibility, expiry, archive and entry-cost behavior.
- `npm run test:browser`: Chromium smoke tests. Reports, traces, screenshots and videos are written under ignored `output/playwright/`.
- `npm run test:baseline`: deterministic SEO and lifecycle checks without live external-link requests.
- `npm run validate:all`: deterministic tests, live link validation and maintenance-state validation. Browser tests remain separate.

## SEO and generated-page baseline

`tests/baselines/seo-baseline.json` fixes the audited origin, snapshot date, 145-URL sitemap count, canonical aliases, forbidden aliases and reviewed link-graph exceptions. `tests/baselines/generated-pages.json` records representative outputs for the homepage, collection hubs, taxonomy routes, active and expired detail pages, outbound redirect, evergreen pillars, Club, admin and 404.

Hard failures include:

- missing generated sitemap files;
- empty or duplicate sitemap titles and descriptions;
- missing or multiple H1 elements;
- canonical mismatch or a non-Freehub canonical origin;
- noindex, private, outbound, expired, held, rejected or `doNotPublish` sitemap leakage;
- invalid JSON-LD or non-canonical breadcrumb URLs;
- unexpected canonical aliases or the invented `/free-stuff/`, `/free-samples/` and `/free-courses/` routes;
- a new sitemap route without a cross-page anchor.

The strict anchor crawl excludes self-canonicals and other non-anchor `href` values. It therefore records eight existing exceptions that the earlier broad audit did not expose: `/blog/`, `/tag/win-a-car/`, `/tag/online-entry/`, `/tag/in-store-entry/`, `/tag/ussd-entry/`, `/tag/whatsapp-entry/`, `/tag/football/` and `/tag/rugby/`. Resolved exceptions pass and are reported; new exceptions fail.

The performance baseline is informational until growth exceeds the reviewed thresholds. An increase above 10% warns, an increase above 25% fails, and decreases pass. Competition card count and ItemList size may move with verified inventory, but they must remain equal.

## Link-warning baseline

`tests/baselines/link-warnings.json` stores warnings by stable `{recordId, field, reason}` identity and retains source type, lifecycle and URL as review context. The reviewed merge-time state contains ten expired-archive warning identities and five accepted free-resource manual-check warnings. A temporarily recovered archived source is reported as resolved without removing its reviewed identity, while a different record, field, reason, URL or lifecycle is surfaced.

Active competition failures, active non-manual free-resource failures, invalid manual-exception evidence and lifecycle/output leakage remain hard failures. New or changed warnings also return a non-zero result until reviewed; a lower warning count does not fail.

To refresh the baseline intentionally:

1. Run `npm run lint` and inspect known, resolved, new, changed and hard-failure sections.
2. Verify each warning against the official source and lifecycle record.
3. Do not update while any hard failure exists.
4. Run `npm run baseline:update:warnings`. This preserves reviewed entries that happen to resolve during the live check.
5. Use `node scripts/update-link-warning-baseline.js --update --prune-resolved` only after confirming a recovery is durable and intentionally removing the entry.
6. Review the sorted JSON diff and rerun `npm run lint` before committing.

The update command performs live requests and intentionally contains no generated timestamp, so unchanged output remains reviewable.

## Lifecycle and known defects

Fixtures cover active public, active noindex, Club-only, expired published, missing archive evidence, archived low-value, held, rejected/`doNotPublish`, free, purchase-required, paid, explicit unknown, missing and unrecognized cost states.

The missing and unrecognized cost fixtures deliberately assert the current unsafe fallback to `Free entry`. This is a documented PR 2 defect, not approval of the behavior. PR 1B must not change the cost contract or public labels.

Browser tests preserve two named expected defects:

- `PR2-collection-controls`: controls render on collection pages but are not activated there.
- `PR2-mobile-navigation`: the current mobile nav scrolls horizontally and has no open/close control.

Playwright treats an unexpected pass as a failure so the expected-defect marker must be removed when the behavior is intentionally fixed.

## CI and evidence limits

The pull-request workflow separates deterministic baseline tests, live link checks and Chromium smoke tests. It builds base and candidate revisions with the same snapshot date and compares SHA-256 inventories of generated HTML and sitemap output. Browser tests serve local generated files and force Firebase configuration requests to return 404, so no deployed credentials or authenticated account are required.

The harness does not estimate Lighthouse history, Core Web Vitals, Search Console, GA4, deployed Firestore rules or Cloudflare configuration. Those remain unavailable external evidence and require separate access and review.
