# FreeHub project instructions

## Purpose and implementation
- FreeHub helps South African consumers find competitions, free resources, rewards and verified offers. Prioritise accurate eligibility, entry costs, official sources and current availability over inventory size.
- This is a static HTML site generated with Node.js, with plain browser JavaScript/CSS and optional Firebase account features; there is no application framework or bundler.
- Edit sources, then regenerate affected output; do not fix generated HTML or mobile feeds directly. Some generated files are tracked and others ignored; review the diff without force-adding ignored output.
- Preserve existing uncommitted work. Inspect current source code and workflows when dated audits or proposed architecture documents disagree with implementation.

## Source map
- `scripts/generate-pages.js`: page templates, routes, metadata, sitemap and publication orchestration. `scripts/lib/`: focused renderers and build helpers.
- `shared/page-data.js`: shared competition classification, lifecycle, routing and display logic used by Node and the browser. `shared/opportunity-data.js` and `shared/offer-data.js`: separate content contracts and gates.
- `data/competitions.json`: competition registry; `data/archive/competitions-expired.json`: expired archive. Keep the archive lifecycle intact.
- `data/free-resources.json`: durable resources; `data/opportunities.json` plus `data/opportunity-source-evidence.json`: time-sensitive benefits and reviewed evidence; `data/offers.json`: coupons/deals; `data/student-guide.json`: student guide content. Contracts live in `data/schemas/`.
- `data/unverified-competitions.json`: explicitly curated under-review discovery, separate from held competition imports.
- `app.js`, `styles.css`, `shared/`: client behaviour, styling, auth, analytics and outbound handoff modules. Reuse existing helpers and classes.
- `assets/`: repository-owned artwork; `data/listing-images.json`: reviewed listing-image metadata. `app-data/competitions.json` and `app-data/catalog.json` are generated ad-free app feeds.
- `tests/lifecycle/`, `tests/browser/`, `tests/baselines/`: lifecycle fixtures, Chromium smoke tests and reviewed output/SEO baselines.
- `.research/`, `storage/exports/`, `data/backups/`: ignored private research/export/backup material; never commit private handoffs or correspondence.

## Setup, preview and validation
- Use Node 24; exact regression manifests use Node 24.19.0. Install locked dependencies with `npm ci --ignore-scripts` (deployment workflow command).
- `npm run build` (alias `npm run generate`) runs `node scripts/generate-pages.js`, writing pages, feeds and reports. It is a mutating build, not a read-only check.
- Preview generated files with `node tests/browser/server.js` at `http://127.0.0.1:4318/`. This test server intentionally returns 404 for `firebase-config.json`; it cannot validate real login.
- `npm test`: held-candidate, SEO/performance and lifecycle checks. `npm run test:seo` and `npm run test:lifecycle` are narrower alternatives.
- `npm run lint`: held-candidate and live-link validation; needs network access. `npm run lint:ci` permits only documented runner/network inconclusive results; do not substitute it to hide a confirmed broken link.
- `node scripts/validate-maintenance-state.js`: public lifecycle/archive validation. `node scripts/competition-maintenance.js` audits; adding `--archive-expired` changes registries.
- `npm run test:browser`: Chromium tests; Playwright starts the local server. Install Chromium with `npx playwright install chromium` if needed.
- For deterministic regression work, mirror `.github/workflows/regression.yml` in a dedicated shell (PowerShell):
  ```powershell
  $env:TZ = "UTC"
  $env:FREEHUB_BUILD_DATE = "2026-09-08"
  $env:FREEHUB_AS_OF_DATE = "2026-09-08"
  $env:NODE_OPTIONS = "--require=./scripts/lib/fixed-date-register.js"
  npm run build
  npm test
  ```
- Snapshot dates are test fixtures, never evidence of present availability. Use actual dates for production/editorial checks; do not leave snapshot overrides set for release builds.
- Before completing content/code changes, regenerate, run relevant checks above, inspect desktop/mobile output and `git diff --check`, and review route/sitemap/feed changes. Report failures separately from unavailable network/browser evidence.
- See [testing and regression](docs/testing-and-regression.md) for flag matrices, exact-output parity and baseline updates. Never refresh warning/hash baselines merely to make tests pass.

## Editorial and publication boundaries
- Before adding a listing or page, search existing registries, archive and generated routes for duplicate campaigns or overlapping search intent. Preserve established slugs and URLs unless a justified migration includes redirects/canonical handling.
- Verify the exact official campaign/provider page and terms before publishing or refreshing: South African eligibility, dates, prizes, entry steps, purchase/account/app/loyalty requirements, fees and exclusions. Discovery results and imported summaries are leads, not approval.
- Record truthful source URLs and review dates. Do not advance verification dates without checking sources, infer free entry from missing cost fields, or resolve contradictions by guessing.
- Public competitions require `verificationStatus: "published"` and the shared visibility/lifecycle gates. Held/rejected/`doNotPublish` records must not leak into detail pages, redirects, cards, sitemap, schema or app feeds.
- ZA Comp Engine imports remain private evidence. Passing validation or marking a row ready does not approve publication; promote held rows only within explicit user-authorised publication scope. See [held-row approval gate](docs/phase-3.13-held-row-disposition-approval-gate.md); historical no-image exceptions do not replace the artwork standard below.
- Under-review leads may appear only through their separate collection policy, never as verified listings: [unverified competition policy](docs/unverified-competition-editorial-policy.md).
- Discovery must cover both verified competitions and identifiable unverified leads; incomplete verification alone is not a reason to discard a useful lead. Develop source-backed under-review records with as much relevant information as available, explicitly separating reported claims, confirmed facts, missing evidence and contradictions. Follow the separate under-review publication gates and review windows; this does not authorise bulk publication of private held imports. Broader search coverage is an objective, not proof or a promise of SEO uplift.
- Opportunities and offers enable only when their respective `FREEHUB_ENABLE_OPPORTUNITIES` / `FREEHUB_ENABLE_OFFERS` values equal `true`. Local unset flags disable them; deployment workflows default offers to `true`. Test the flag states relevant to your change.
- Opportunity publication requires current evidence for each source/terms URL and reviewed host allowlists, not domains inferred from the registry. Append evidence; preserve historical rows. Never extend stale records just to keep cards visible. Follow [samples and opportunity runbook](docs/free-samples-editorial-runbook.md).
- Keep durable provider resources distinct from current claimable opportunities, direct samples distinct from selected product tests, and conditional rewards distinct from unrestricted freebies. Visitors apply with providers; do not collect their application, medical, delivery or credential data.
- Coupons require a real verified code; deals have no code. Offers fail closed outside their review window. Follow the controlled taxonomy, commercial disclosures and two-offer category/brand indexing threshold in the [offers runbook](docs/coupons-and-deals-editorial-runbook.md).

## Artwork standard (user requirement, 17 September 2026)
For every new competition, reward or offer listing:
1. Inspect the actual official campaign/provider page for suitable hero artwork first. Prefer relevant official artwork; a generic site logo is not a completed hero image.
2. If suitable official artwork is unavailable or cannot be obtained, use the image-generation tool for a subject-specific image. Do not invent prizes, models, amounts, mechanics or endorsements, or present generated design artwork as an eligible competition entry.
3. Visibly identify generated artwork as a FreeHub editorial illustration. Record official source URLs or generation prompts and provenance; preserve factual content and entry requirements.
4. Save optimized assets in the repository, provide descriptive alt text, inspect desktop/mobile rendering before release and verify the deployed image loads after an authorised release.
5. Use existing competition image fields, including `imageReviewStatus: "editorial-generated"` where applicable, and `data/listing-images.json` for reviewed metadata and reward/offer hero rendering. Keep metadata consistent with the saved asset.
See [editorial image policy](docs/editorial-competition-image-policy.md). Generic/brand/category fallbacks are temporary, not completed listing artwork.

## SEO and page contracts
- Canonical production origin is `https://freehub.co.za`. Preserve established evergreen paths; do not introduce `/free-stuff/`, `/free-samples/` or `/free-courses/` aliases. Legacy-host redirects require hosting changes: [canonical domain guard](docs/deployment-canonical-domain.md).
- Indexable pages need unique title/description, one H1, matching canonical, valid JSON-LD and an incoming contextual link. Schema and ItemLists must match visible, eligible content; FAQ markup requires visible FAQs and promises no rich result.
- Exclude private, noindex and outbound routes from sitemap/indexable collections. Expired competitions lose entry CTAs and exits. Public, published archive-eligible competitions remain indexable with clear closure messaging, homepage and WhatsApp prompts, and existing advertising eligibility. Restricted, held, rejected and doNotPublish records stay excluded. Official evidence is still required before claiming a confirmed result. Do not redirect expired pages wholesale to the homepage.
- Use `renderSiteFooter()` for public content pages: shared WhatsApp/Facebook links, global auth panel and auth script are generator-enforced. `/out/*` is the minimal noindex/nofollow exception. See [new-page checklist](docs/new-page-checklist.md).

## Deployment and external effects
- `.github/workflows/deploy.yml` deploys GitHub Pages on pushes to `main` or manual dispatch; publishing the root artifact also submits sitemap URLs to Bing/IndexNow when configured. Treat pushes to `main` as releases.
- `.github/workflows/daily-competition-maintenance.yml` archives expired records, regenerates, validates maintenance state, and commits/deploys changes. `.github/workflows/regression.yml` supplies PR baseline, link and browser checks; the deploy workflow itself does not run the full regression suite.
- Keep real `firebase-config.json`, `.env` and credentials out of commits. Deployment creates optional Firebase web config from repository variables; use the checked-in example files for local setup.
- Email alerts are dry-run unless explicitly sent with `--send`; see [email alerts](docs/firebase-email-alerts.md). Source review/build/test success does not authorise sending mail or publishing.
