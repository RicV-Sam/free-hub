# Freehub Testing and Regression Harness

## Purpose

PR 1B established the repository-grounded Freehub baseline. PR 2 adds fail-closed cost and Opportunity contract tests without changing public routes, generated markup, competition data, Firebase collections or publication behavior. The current reviewed snapshot uses build date `2026-07-18`, when the generated sitemap contained 141 URLs, the main competition collection contained 82 static cards and its ItemList contained 82 structured-data items.

ZA Comp Engine exports remain private review evidence. Passing these tests cannot approve a handoff row, change Freehub publication state or create a public page.

## Commands

Run the generator before tests when working from a fresh checkout:

```powershell
$env:FREEHUB_BUILD_DATE = "2026-07-18"
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
- `npm run lint:ci`: CI-only live-link mode. It reports runner access blocks and transient network failures as inconclusive without changing the strict local `npm run lint` contract.

## SEO and generated-page baseline

`tests/baselines/seo-baseline.json` fixes the audited origin, snapshot date, 141-URL sitemap count, canonical aliases, forbidden aliases and reviewed link-graph exceptions. `tests/baselines/generated-pages.json` records representative outputs for the homepage, collection hubs, taxonomy routes, active and expired detail pages, outbound redirect, evergreen pillars, Club, admin and 404.

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

The GitHub-hosted live-link job uses `npm run lint:ci` because some official sites block cloud-runner IPs or return transient 5xx responses. Only HTTP 401, 403, 429, 5xx and transport/time-out failures are reported in a separate inconclusive section; they are never written to the warning baseline. Confirmed HTTP 404/410 responses, other hard HTTP failures, soft 404s, redirects to error pages, metadata defects and lifecycle/output leakage remain failures. Local `npm run lint` stays strict and is the merge-time evidence for the complete live-link warning counts.

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

Missing, explicit `unknown` and unrecognized cost fixtures now fail closed to `unclear` / `Entry requirements unclear`. A missing type may classify only from affirmative evidence such as a purchase boolean, paid amount, standard-rate tag, exact free-entry tag or explicit fee label; absence never implies free. The active `{id, label}` inventory is protected by a compact hash covering all 85 public competitions.

Fifteen retained expired records predate `entryCostType`. `data/archive/legacy-cost-classifications.json` records their reviewed display compatibility. The generator applies those values through a non-serializable archive-only marker, so it cannot modify source data, active filtering, `/out/` eligibility, sitemap inclusion or generated attributes. Tests require the manifest to match exactly the current published expired records with missing types; a new record is never added automatically.

## Opportunity foundations

`shared/opportunity-data.js` is a dependency-free Node/browser module containing the FreeResource, Requirement, Opportunity and DiscoverySummary validators. JSON Schemas under `data/schemas/` are compiled against the same fixtures with Ajv during tests. The 18 current resources remain unchanged and validate through explicit legacy mode; new resources use the strict contract.

The pure `isPublicOpportunity()` gate requires an explicit `asOfDate` and official-source host allowlist. It rejects non-published, non-verified, future, overdue, expired, unsupported-type, invalid-source, unclear-cost and requirement-mismatch records. Strict free-only use accepts only `completely_free`. Supported type-specific details are currently limited to direct samples, product-testing campaigns, birthday freebies and free courses; other declared types may be stored as drafts but cannot become public.

`FREEHUB_ENABLE_OPPORTUNITIES` is false unless its exact value is `true`. PR 4 adds one reviewed pilot record, while absent and explicit-false builds still produce no Opportunity cards or schema. No flag state creates routes, sitemap entries or Club state.

PR 3 upgrades the existing Free Stuff parent independently of the flag. The generator owns the publication boundary and passes only approved records to renderers. PR 4 replaces the empty test safeguard with the single reviewed exact host `products.coloplast.co.za`; registry contents must never be used to infer or silently permit source hosts.

Generated-output parity permits only the exact shared Free Stuff navigation fragment at its exact position and the one-time `data-free-stuff-parent-version="2"` transition. Once that marker exists in the PR base, later parent changes are compared normally.

Browser tests preserve two named expected defects:

- `PR2-collection-controls`: controls render on collection pages but are not activated there.
- `PR2-mobile-navigation`: the current mobile nav scrolls horizontally and has no open/close control.

Playwright treats an unexpected pass as a failure so the expected-defect marker must be removed when the behavior is intentionally fixed.

## CI and evidence limits

The pull-request workflow separates deterministic baseline tests, live link checks and Chromium smoke tests. It builds base and candidate revisions with the same snapshot date and compares SHA-256 inventories of generated HTML and sitemap output. Browser tests serve local generated files and force Firebase configuration requests to return 404, so no deployed credentials or authenticated account are required.

The harness does not estimate Lighthouse history, Core Web Vitals, Search Console, GA4, deployed Firestore rules or Cloudflare configuration. Those remain unavailable external evidence and require separate access and review.

## PR 4 Free Samples pilot

The Samples pilot adds a deterministic two-state check. With `FREEHUB_ENABLE_OPPORTUNITIES` absent or set to any value other than the exact string `true`, both approved pages contain zero Opportunity cards and zero Opportunity ItemLists. With the flag set to `true`, the same reviewed Coloplast record appears once as a full card on `/free-samples-south-africa/` and once as a compact card on `/free-stuff-south-africa/`. No detail route or sitemap entry is permitted in either state.

`node scripts/validate-free-samples-pilot.js` checks the canonical, title, H1, seven classified resources, six visible/schema-matched FAQs, card/schema equality, section order, stable ID, card variants, privacy boundary, route exclusion, and unchanged competition counts. The script reads the exact same fail-closed flag value as the build.

`node scripts/validate-opportunity-links.js` validates the Opportunity source and terms independently of the ordinary warning baseline. A current exact manual-evidence entry can cover an automated access block. It cannot cover a 404, 410, redirect, confirmed soft-404, mismatched URL, or stale evidence.

The pull-request workflow builds and tests Chromium once with the flag disabled and again with the flag enabled. Flag-absent and explicit-false HTML must be byte-identical. The enabled comparison permits only the exact Coloplast section and matching JSON-LD script on the Samples and Free Stuff pages. The one-time Samples v2 parity exception stops applying as soon as the base branch contains its marker.

Editorial review, activation, rollback, privacy, and evidence-retention procedures are in `docs/free-samples-editorial-runbook.md`.
