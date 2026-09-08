# Freehub Testing and Regression Harness

## Purpose

PR 1B established the repository-grounded Freehub baseline. The September recovery uses build and lifecycle date `2026-09-08` for repeatable CI output. Counts are calculated from the current source records and publication gates; old campaign counts are not treated as permanently active.

ZA Comp Engine exports remain private review evidence. Passing these tests cannot approve a handoff row, change Freehub publication state or create a public page.

## Commands

Run the generator before tests when working from a fresh checkout:

```powershell
$env:FREEHUB_BUILD_DATE = "2026-09-08"
$env:FREEHUB_AS_OF_DATE = "2026-09-08"
$env:TZ = "UTC"
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

`tests/baselines/seo-baseline.json` fixes the audited origin, snapshot date, reviewed flag-disabled sitemap count, canonical aliases, forbidden aliases and link-graph exceptions. The validator adds only lifecycle-eligible Opportunity and offer detail or collection routes when their exact feature flags are enabled; offer category and brand additions must also meet the two-record indexability threshold. `tests/baselines/generated-pages.json` records representative outputs for the homepage, voucher hub, collection hubs, taxonomy routes, active and expired detail pages, outbound redirect, evergreen pillars, Club, admin and 404. `tests/baselines/adsterra-evergreen-generated-output.json` pins every exact base-to-candidate hash for the Adsterra and evergreen-category release. The older discovery manifest remains a review record for its release, while `tests/baselines/opportunity-generated-output.json` pins every reviewed flag-enabled detail, exit, discovery-surface and sitemap hash against the current shared templates.

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

The performance baseline covers the homepage, competition index, Free Stuff, vouchers, Samples, CSS and JavaScript. It is informational until growth exceeds the reviewed thresholds. An increase above 10% warns, an increase above 25% fails, and decreases pass. Competition card count and ItemList size may move with verified inventory, but they must remain equal.

## Link-warning baseline

`tests/baselines/link-warnings.json` stores warnings by stable `{recordId, field, reason}` identity and retains source type, lifecycle and URL as review context. The reviewed merge-time state contains 15 competition warning identities (13 archived 404s, one archived 403 and one retained timeout) and six accepted free-resource manual-check warnings. A temporarily recovered archived source is reported as resolved without removing its reviewed identity, while a different record, field, reason, URL or lifecycle is surfaced.

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

Fixtures cover active public, active noindex, Club-only, expired published, confirmed-result evidence, missing archive evidence, archived low-value, held, rejected/`doNotPublish`, free, purchase-required, paid, explicit unknown, missing and unrecognized cost states. Closed pages remain noindex unless a complete result record uses the same official promoter domain and supplies a result check date, substantive summary, public winner wording, confirmed prize and explicit announcement-versus-fulfilment status.

Missing, explicit `unknown` and unrecognized cost fixtures fail closed to `unclear` / `Entry requirements unclear`. A missing type may classify only from affirmative evidence such as a purchase boolean, paid amount, standard-rate tag, exact free-entry tag or explicit fee label; absence never implies free. The reviewed active cost-label inventory remains fixed to the 6 September 2026 snapshot (54 records) so routine expiry cannot silently change those assertions.

Fifteen retained expired records predate `entryCostType`. `data/archive/legacy-cost-classifications.json` records their reviewed display compatibility. The generator applies those values through a non-serializable archive-only marker, so it cannot modify source data, active filtering, `/out/` eligibility, sitemap inclusion or generated attributes. Tests require the manifest to match exactly the current published expired records with missing types; a new record is never added automatically.

## Opportunity foundations

`shared/opportunity-data.js` is a dependency-free Node/browser module containing the FreeResource, Requirement, Opportunity and DiscoverySummary validators. JSON Schemas under `data/schemas/` are compiled against the same fixtures with Ajv during tests. The 24 current durable resources validate through explicit legacy mode; new resources use the strict contract.

The pure `isPublicOpportunity()` gate requires an explicit `asOfDate` and official-source host allowlist. It rejects non-published, non-verified, future, overdue, expired, unsupported-type, invalid-source, unclear-cost and requirement-mismatch records. Strict free-only use accepts only `completely_free`. Supported type-specific details are currently limited to direct samples, product-testing campaigns, birthday freebies and free courses; other declared types may be stored as drafts but cannot become public.

`FREEHUB_ENABLE_OPPORTUNITIES` is false unless its exact value is `true`. On the reviewed 8 September snapshot, 17 opportunities have renewed source evidence and active exits; 18 documented withdrawals retain closed noindex detail pages. Two drafts remain private. Absent and explicit-false builds produce no Opportunity cards, details, exits or Opportunity schema. No flag state creates Club state.

The generator owns the publication boundary and passes only approved records to renderers. The explicit official-source allowlist is maintained in `tests/baselines/seo-baseline.json`; registry contents must never silently permit source hosts. Current opportunities create matching cards, structured data, detail routes and sitemap entries. Exit routes remain outside the sitemap and carry `noindex`. Stale and otherwise ineligible records never retain an active exit.

Generated-output parity permits only exact reviewed hashes. This release uses `--allow-portfolio-recovery` for the confirmed-result page, competition-hub link and sitemap entry; all other flag-off HTML matches the PR base. The Opportunity transition uses `--allow-opportunity-detail-flow` with the 8 September manifest. Version markers alone approve nothing. Unreviewed or tampered output fails.

Browser tests preserve two named expected defects:

- `PR2-collection-controls`: controls render on collection pages but are not activated there.
- `PR2-mobile-navigation`: the current mobile nav scrolls horizontally and has no open/close control.

Playwright treats an unexpected pass as a failure so the expected-defect marker must be removed when the behavior is intentionally fixed.

## CI and evidence limits

The pull-request workflow separates deterministic baseline tests, live link checks and Chromium smoke tests. Both build and lifecycle dates are `2026-09-08`, with the fixed-date register pinning legacy Date-based rendering. It compares SHA-256 inventories of generated HTML and sitemap output. Browser tests serve local generated files and force Firebase configuration requests to return 404, so no deployed credentials or authenticated account are required. Production builds continue to use the actual date.

The harness does not estimate Lighthouse history, Core Web Vitals, Search Console, GA4, deployed Firestore rules or Cloudflare configuration. Those remain unavailable external evidence and require separate access and review.

GA4 review is intentionally non-blocking for repository validation. Event receipt in GA4 can be hidden by saved-date windows, same-day processing lag, exploration filter drift or missing property-side custom definitions even when local event wiring and browser flow are correct. Use GA4 as corroborating evidence, not as a merge or refresh gate.

## Samples and vouchers discovery release

The Samples inventory checks absent/false and enabled flag states. Current publication gates determine which records appear; expired evidence is never refreshed by a test. Samples and product-testing groups can honestly be empty while durable editorial resources remain available.

In the 8 September snapshot, five sample requests and twelve birthday opportunities have current evidence; no individual product-testing campaign is currently published. The Free Stuff directory retains 25 public resources; Review Club remains withheld. The voucher hub has two checked reward resources, one unrestricted airtime prize, and two account-linked draws. Birthday vouchers are excluded from the creator-exchange section.

`node scripts/validate-free-samples-pilot.js` checks the canonical, title, H1, seven classified durable resources, six visible/schema-matched FAQs, current Opportunity IDs, direct-versus-selected grouping, card/schema equality, section order, privacy boundary and route inclusion. The script reads the same fail-closed flag value as the build; the reviewed static sitemap count and current source records determine expected totals.

`node scripts/validate-opportunity-links.js` validates the Opportunity source and terms independently of the ordinary warning baseline. A current exact manual-evidence entry can cover an automated access block. It cannot cover a 404, 410, redirect, confirmed soft-404, mismatched URL, or stale evidence.

The pull-request workflow tests Chromium with opportunities disabled, enabled, and with the offers portal enabled. Browser assertions cover current active or empty states and retain isolated active-fixture checks where live records have expired. Flag-absent and explicit-false HTML must be byte-identical. Enabled output permits only the exact reviewed 52 detail/exit files, three discovery surfaces and sitemap.

Editorial review, activation, rollback, privacy, and evidence-retention procedures are in `docs/free-samples-editorial-runbook.md`.

## Opportunity health evidence

Exact generated-output manifests use Node 24.19.0 and `TZ=UTC`, matching the hosted runner. The timezone matters to legacy date-only urgency arithmetic; use the same timezone for both base and candidate rather than accepting broad hash exceptions.

`npm run report:opportunity-health` checks both flag states, restores the caller's original flag state, writes ignored JSON/Markdown artifacts, and exits unsuccessfully when source evidence requires review. `--deployment-check` checks publication boundaries while retaining every evidence issue in the artifacts and keeping `ok: false`. This allows deployment of safely closed pages without treating stale evidence as verified. CI retains these artifacts; source verification dates are not changed automatically.

A dated withdrawal with a recorded reason resolves an active-source alert only when the listing is absent from discovery, feeds, exits and the sitemap and any retained detail page is noindex without its claim link. Historical evidence is retained and cannot authorize republication. Private drafts are reported as unpublished; stale evidence on any published opportunity remains a hard failure. The full link audit now includes these evidence and publication checks.
