# FreeHub Discovery Engine Implementation Report

**Status:** Working specification and implementation ledger
**Prepared:** 10 August 2026
**Repositories reviewed:** `free-hub` and `Za Comp Engine`
**Decision owner:** FreeHub
**Primary objective:** Expand FreeHub across Competitions, Promotions/Deals, Vouchers/Coupons, and Free Samples/Freebies without regressing the existing competition product.

## Executive decision

FreeHub should become a multi-vertical discovery product, but it should not be rebuilt around one giant universal content record and the ZA Competition Engine should not be renamed or generalised in place.

The lowest-risk architecture is:

1. preserve each vertical's evidence and publication contract;
2. share source, merchant, discovery-summary, review, lifecycle, rendering, analytics and SEO primitives only where their meaning is genuinely the same;
3. keep all publication fail-closed and human-approved;
4. assemble approved records into a common Discovery layer for navigation, internal linking, reporting and future mixed search;
5. prioritise Promotions/Deals as the next SEO growth vertical while retaining `/deals/` as its stable canonical route.

This is an incremental extraction strategy, not a rewrite.

## Current-state findings

### FreeHub site

The production site is a custom Node.js static generator deployed through GitHub Pages. Public data is tracked JSON; optional member state uses Firebase. The reviewed 10 August 2026 repository contains:

| Inventory | Current repository count | Existing contract |
|---|---:|---|
| Competition source rows | 287 | `data/competitions.json` plus `shared/page-data.js` |
| Active published competitions at 10 August | 47 | Competition-specific publication and expiry rules |
| Verified offer rows | 23 | 4 coupons and 19 code-free deals/promotions |
| Current Opportunity rows | 21 | 7 direct samples and 14 product-testing opportunities |
| Durable free resources | 24 | Evergreen curated resources |
| Offer merchant/entities | 18 | Added as the first Discovery Engine implementation slice |

The competition lifecycle is mature and must be preserved: held rows fail closed, active and noindex records are separated, `/out/` is noindex, expiry removes current discovery exposure, useful closed detail pages can remain as historical references, and sitemap validation prevents leakage.

The newer offer and Opportunity foundations already prove the intended architecture. They use separate validators, explicit feature flags, official-source checks, review-due dates, current-only public gates, type-specific renderers and dedicated tests. These should be extended rather than replaced.

The main architectural constraint is `scripts/generate-pages.js`, which combines route generation, templates, sitemap generation and validation in one large file. Extraction is desirable, but changing unrelated competition paths while expanding other verticals would create needless regression risk.

### ZA Competition Engine

The crawler is a private TypeScript/SQLite discovery and review tool. It has reusable infrastructure for polite fetching, robots handling, browser recovery, evidence capture, source health, manual review, deduplication, expiry signals and private handoff. Its parser, candidate table, scoring and exporter are nevertheless competition-specific.

The engine's existing publication boundary is correct: local crawler candidates, local approvals, reviewed-registry rows and FreeHub handoff rows are different states, and none is public approval.

The safe extension is to add parallel vertical candidate contracts behind a shared source/fetch/evidence layer later. Renaming `competition_candidates`, weakening its rules or forcing coupons and samples through competition scoring would be an unnecessary rewrite.

## Target architecture

```text
Official and approved sources
        |
        v
Shared source registry, polite fetch, evidence snapshots and source health
        |
        +----------------+----------------+----------------+
        |                |                |                |
 Competition rules  Promotion rules  Coupon rules    Sample/freebie rules
        |                |                |                |
        v                v                v                v
Vertical candidate and review contracts (private, fail-closed)
        |
        v
Approved handoff / curated registries
        |
        +----------------+----------------+----------------+
        |                |                |                |
 Competitions        Promotions        Coupons        Opportunities
        |                |                |                |
        +----------------+----------------+----------------+
                         v
              Shared Discovery summaries
                         |
          SEO hubs, merchant pages, internal links,
          analytics, optional Club support and reporting
```

### Repository boundaries

| Boundary | Owns | Must not own |
|---|---|---|
| ZA Competition Engine | Crawling, snapshots, source health, competition classification, private review and evidence handoff | Public status, sitemap, FreeHub canonicals or publication decisions |
| Future vertical discovery modules | Promotion/coupon/sample classifiers and candidate review contracts | Competition-specific prize and entry assumptions |
| FreeHub vertical data modules | Validation, lifecycle, route identity and public eligibility for one vertical | Network crawling or silent publication |
| Shared Discovery layer | Normalised summaries, merchant identity, cross-vertical navigation, analytics dimensions and reporting | Type-specific truth or lifecycle overrides |
| Static generator | Public rendering, route generation, schema, sitemap and build validation | Candidate approval or source discovery |

## Data model

### Shared Discovery summary

Every approved public item may be projected into a small read-only summary:

```json
{
  "id": "deal:mr-price-current-multi-buy-promotions",
  "contentType": "promotion",
  "title": "Current Mr Price multi-buy and marked-down promotions",
  "summary": "...",
  "path": "/deal/mr-price-current-multi-buy-promotions/",
  "merchantId": "mr-price",
  "category": "fashion",
  "startsAt": null,
  "expiresAt": null,
  "lastVerifiedAt": "2026-08-07",
  "labels": ["Verified", "No code needed"]
}
```

This is a projection, not a source of truth. It must never be able to make a private or expired vertical record public.

### Vertical records

Competition, offer and Opportunity records retain their current schemas. Shared fields should converge gradually around:

- stable ID and slug;
- vertical/content type;
- merchant or promoter entity ID;
- title and factual summary;
- canonical source, terms and destination URLs;
- ZA eligibility;
- start, end, checked, review-due and updated dates;
- publication and verification status;
- cost/claim requirements;
- affiliate and sponsorship disclosure;
- evidence identity and reviewer history.

Type-specific fields remain local. Examples include prize and entry mechanics for competitions; coupon code, minimum spend and discount mechanics for offers; and stock, selection, delivery, privacy or medical boundaries for samples.

### Merchant entities

Merchant identity must not be inferred independently on every page. `data/merchants.json` is the initial canonical entity registry. The current offer `brandSlug` is used as its stable foreign key, which avoids rewriting published offer records or URLs.

The first contract stores:

- `id`;
- display `name`;
- entity `kind`;
- `officialUrl`;
- country;
- active status.

The build fails if a current offer references a missing, inactive or differently named merchant entity. Future additions can include aliases, parent organisations, logo evidence, official domains and relationships between a loyalty programme and redemption merchants. Those fields require a reviewed migration rather than ad hoc JSON additions.

### Deduplication identity

Deduplication should use vertical-aware durable evidence:

1. exact normalised official or terms URL;
2. merchant/promoter plus campaign identifier or coupon code;
3. merchant/promoter plus normalised title and overlapping validity period;
4. destination and materially identical terms as a warning-level match.

Titles alone are insufficient. A cross-vertical match should normally create a relationship, not delete a record: a competition may legitimately coexist with a retailer promotion, and a free sample may be funded by a merchant offer.

## SEO and URL strategy

### Route policy

| Vertical | Canonical collection | Detail pattern | Decision |
|---|---|---|---|
| Competitions | `/competitions/` plus established verticals | `/competition/{slug}/` | Preserve unchanged |
| Promotions/Deals | `/deals/` | `/deal/{slug}/` | Retain stable URLs; make Promotions the primary visible and metadata language |
| Vouchers/Coupons | `/coupons/` | `/coupon/{slug}/` | Preserve distinct code-based intent |
| Offers portal | `/offers/` | n/a | Cross-links promotion and coupon verticals |
| Free Samples/Freebies | `/free-samples-south-africa/` | `/opportunity/{slug}/` for current actionable records | Preserve existing South African evergreen authority |
| Free Stuff parent | `/free-stuff-south-africa/` | mixed approved links | Preserve as the evergreen parent |

Creating new aliases such as `/promotions/`, `/free-samples/` or `/free-stuff/` now would split intent and add redirect/canonical complexity. Search Console evidence can justify a future migration. Until then, the established `/deals/` route should target “South African promotions and deals” in its title, H1, description, navigation and internal anchors.

### Promotions SEO priority

Promotions is the first growth vertical because the current registry already contains 19 verified records and covers recurring retailer, loyalty, travel, food, mobile and financial-benefit intent. The rollout order is:

1. make `/deals/` the clear Promotions and Deals hub without changing its canonical;
2. grow verified inventory by merchant and controlled category;
3. index category and merchant pages only after the existing two-record threshold is met;
4. publish durable explanatory content for common mechanics such as app-only, loyalty, cashback, multi-buy, first-order and member-only promotions;
5. use Search Console and engagement evidence before introducing new URL families;
6. avoid price/availability claims that cannot be rechecked on a suitable cadence.

### Indexing and schema

- Only active, published, verified and within-review-window records enter indexable collections or the sitemap.
- Empty hubs remain useful to people but are `noindex` and excluded from the sitemap.
- Thin merchant/category pages stay `noindex` until the inventory threshold is met.
- Outbound handoff pages remain `noindex,nofollow` and outside the sitemap.
- Closed or withdrawn handling remains vertical-specific.
- Use `CollectionPage`, `ItemList`, `WebPage`, `BreadcrumbList` and visible FAQ schema conservatively.
- Do not emit `Offer` or `Product` structured data unless price, seller, availability and validity facts satisfy the schema and remain operationally maintainable.

## Lifecycle and expiry

The common conceptual lifecycle is:

```text
discovered -> source_found -> reviewed -> approved -> published
                                      |             |
                                      v             v
                                held/rejected   verification_due
                                                    |
                                      +-------------+-------------+
                                      |                           |
                                  reverified                 expired/withdrawn
```

Implementations retain their current status vocabularies until a deliberate migration. Shared reporting may map them to these concepts, but cannot write back a weaker status.

Rules:

- Known start and end dates are inclusive in South African date context.
- Review-due is a hard public gate for offers and Opportunities.
- No-expiry promotions require a short recheck cadence appropriate to price and stock volatility.
- Source changes, redirects, code failures or material term changes remove or hold the item until reviewed.
- Expired competitions can retain useful historical pages under existing rules.
- Expired promotions and coupons should leave collections and `/out/`; any future tombstone must be supported by proof that it was previously public.
- Evergreen free resources use a verification cadence rather than invented expiry.

## Verification, safety and scam controls

Publication requires manual approval and evidence from an official promoter, merchant, programme or authorised campaign source. Aggregators, affiliate redirects, URL shorteners and search snippets may provide leads but never final public evidence.

Required controls:

- exact official-source and terms URLs;
- host allowlists where a vertical needs them;
- ZA applicability and eligibility check;
- start/end/review dates;
- material terms, minimum spend, membership, app, purchase, delivery and renewal conditions;
- code verification where practical;
- affiliate/sponsored disclosure independent of verification;
- duplicate and recurring-campaign checks;
- sensitive-category review;
- privacy and medical boundaries for samples;
- community reports routed to recheck, never automatic status changes;
- no login, form submission, CAPTCHA solving, personal-data collection or access-control bypass by discovery tooling.

## Source strategy

Source priority should be:

1. known official merchant/promoter hubs and sitemaps;
2. official terms pages and PDFs;
3. official feeds;
4. registered official social accounts as lead evidence;
5. bounded search as discovery only;
6. user or merchant submissions as private review leads.

The existing crawler's fetcher, robots policy, evidence snapshots, browser recovery and source-health reporting are candidates for reuse. Parser, scoring, candidate database and exporter rules should stay vertical-specific until parallel contracts exist.

Promotion discovery should begin with a small reviewed set of high-yield official sources. Broad crawling is not a launch requirement. Initial source categories are retailer promotion hubs, loyalty/rewards benefit directories, app offer pages, restaurant/takeaway promotion pages, mobile/data promotions and travel-provider specials.

## Review and publishing workflow

1. Discover or receive a lead.
2. Capture immutable source evidence and source identity.
3. Classify the vertical before parsing type-specific fields.
4. Run vertical validation and deduplication.
5. Place the candidate in a private review queue with pass/warning/fail reasons.
6. Record a human decision in an append-only ledger.
7. Export only the vertical's approved handoff fields.
8. Import into a private FreeHub registry state.
9. Apply a separate FreeHub editorial publication decision.
10. Generate and validate public routes, canonicals, schema and sitemap.
11. Recheck on the assigned cadence; fail closed when overdue.

No stage may collapse crawler approval and FreeHub publication into one status.

## Shared product behavior

### Analytics

Add dimensions without removing existing competition events:

- `content_type`: `competition`, `promotion`, `coupon`, `free_sample`, `product_testing`, `free_resource`;
- `content_id`;
- `merchant_id` or `promoter_id`;
- `category`;
- `verification_age_days` where computed server-side at build time;
- `affiliate` and `sponsored` booleans;
- `page_type` and collection context.

Measure discovery-card clicks, detail views, copy-code actions, outbound clicks, community reports, saves and return visits. Analytics never changes verification automatically. Define activation, outbound click-through, report rate, stale-item rate, indexed landing count and organic landing growth as the main vertical KPIs.

### Club and advertising

Existing signed-in Adsterra suppression and footer/auth contracts must be reused on new eligible public templates. Initial Promotions, Coupons and Samples launches do not require a Firestore migration or Club saving.

Future Club support should use a generic saved-content envelope containing `contentType` and `contentId`, while preserving existing competition statuses and data. It should ship only with version-controlled Firestore rules, deletion/export behavior, privacy review and regression tests.

### Internal linking

Cross-vertical linking is additive and relevance-based:

- competition pages may link to current promotions/coupons from the same merchant or compatible category;
- merchant pages can group multiple content types after sufficient verified inventory exists;
- sample pages may link to evergreen safety guidance;
- expired pages link to current category/merchant discovery rather than redirecting to the homepage.

The shared Discovery summary should power these relationships once implemented. Until then, existing conservative vertical helpers remain valid.

## Phased rollout

### Phase 0 - Baseline and working specification

**Status: complete.**

- Review both repositories and existing architecture documents.
- Record current inventory and publication boundaries.
- Preserve unrelated local changes.
- Adopt parallel vertical contracts plus a shared Discovery projection.
- Establish this report as the implementation and decision ledger.

### Phase 1 - Promotions foundation and merchant identity

**Status: implementation started.**

- Keep `/deals/` and `/deal/{slug}/` stable.
- Position the collection as “Promotions and Deals in South Africa”.
- Add a validated merchant/entity registry and require every offer brand to resolve to it.
- Keep offer publication fail-closed and feature-flagged.
- Add merchant-contract unit tests and Promotions browser assertions.

Completed in the second implementation slice:

- emit shared analytics `content_type: promotion`, `content_id`, `merchant_id` and category dimensions across offer collection, card, detail, feedback and outbound flows;
- add a reusable Discovery-summary adapter for public offers;

Remaining:

- add promotion-specific editorial fields only where evidence supports them, such as discount type/value, minimum spend, channel, membership and new-customer restrictions;
- grow verified inventory and observe SEO/indexation before route expansion.

### Phase 2 - Shared Discovery projection

**Status: foundation complete.**

- Implemented a dependency-free shared summary contract and matching JSON Schema.
- Added read-only adapters for public competition, offer and Opportunity records. Durable resources remain on their existing contract until a strict non-legacy adapter is justified.
- Proved with tests that private, held, expired and overdue records cannot enter the projection.
- Integrated projection validation into every build after the existing vertical gates run.
- Kept the projection read-only: it currently validates future reporting/internal-link inputs and does not drive global rendering or publication.

Remaining:

- Add cross-type duplicate/relationship warnings without deleting valid vertical records.

### Phase 3 - Promotions discovery pilot

**Status: private foundation complete; bounded exact-page official-source pilot active.**

- Added a parallel typed Promotion candidate contract with a mandatory `vertical: promotion` discriminator; `competition_candidates` remains unchanged.
- Added strict private-field validation that explicitly rejects FreeHub-controlled publication fields.
- Added conservative duplicate identity using official URLs or merchant/title plus overlapping validity windows; title alone is insufficient.
- Added isolated shared Discovery candidate and action tables, a validated repository, dry-run-first import/review commands and a private evidence handoff.
- Preserved the existing competition tables, review flow and handoff exporter unchanged.
- Added a robots-aware exact-page Promotions pilot using Mr Price's official Promotions page; broad or recursive crawling remains disabled.
- The first private write run created five `needs_review` Promotion candidates and an HTML evidence snapshot.

Remaining:

- Add Promotion-specific review UI filters and cross-source relationship warnings.
- Measure first-run yield and false positives before adding another official source; broad crawling remains out of scope.

### Phase 4 - Coupons and free-sample discovery

**Status: private foundation complete; bounded exact-page official-source pilots active.**

- Added a typed Coupon candidate contract covering codes, discount type/value, minimum spend, customer/member/channel restrictions, expiry and verification evidence.
- Added distinct Free Sample and Product Testing candidate contracts covering stock, selection, fulfilment, delivery cost, privacy and medical sensitivity.
- Added shared vertical dispatch, isolated Discovery persistence and append-only review actions without altering `competition_candidates`.
- Added a private approved-evidence handoff that rejects FreeHub publication fields and treats `approved_for_handoff` as evidence readiness only.
- Reused the existing Opportunity boundary in the design; no crawler row can publish a FreeHub page.
- Added exact-page pilots for Mr Price's official app coupon, TENA South Africa's official sample page and Brand Advisor's official project listing.
- The first private write run created one Coupon, one Free Sample and five Product Testing candidates, all in `needs_review`, with one HTML evidence snapshot per source.
- The coupon remains `merchant_stated`, not transaction-tested; the sample form was detected but not read or submitted; selection-based Product Testing remains explicitly non-guaranteed.
- A sensitive alcohol-related Product Testing project was skipped automatically and recorded as a warning.

Remaining:

- Add source-quality and false-positive measurement before expanding crawl coverage.
- Keep samples and selection-based product testing visibly distinct through review and public projection.
- Manually review the first 12 private candidates before any `approved_for_handoff` decision.

### Phase 5 - Mixed discovery and Club

**Status: deferred.**

- Merchant entity pages across verticals after sufficient inventory.
- Mixed homepage modules based on evidence rather than a full homepage rewrite.
- Cross-vertical search/filtering after the existing collection-control defect is fixed.
- Generic Club saves only after privacy, Firestore rules and migration gates pass.

## Constraints and non-goals

- No unnecessary generator rewrite.
- No competition URL, data-model or lifecycle migration in the initial phases.
- No automatic publication from crawler or submissions.
- No inferred “verified” status.
- No public use of aggregator or affiliate URLs as official evidence.
- No invented expiry, price, availability, product or schema facts.
- No new database required for the first public slices.
- No homepage repositioning until inventory, analytics and search evidence support it.
- No alias route proliferation without a redirect/canonical plan and search evidence.
- No change to signed-in advertising suppression or existing Club data in the initial release.

## Testing and regression requirements

Every implementation slice must run the narrowest relevant tests and then the full deterministic suite before release.

Required gates include:

- schema and runtime-validator parity;
- merchant/entity referential integrity;
- duplicate ID, slug and canonical-route detection;
- publication, verification, start/end and review-due boundaries;
- official-source and link-policy validation;
- no private, noindex, expired, held or rejected sitemap leakage;
- `/out/` noindex/nofollow and sitemap exclusion;
- one H1, unique title/description and self-canonical for indexable pages;
- structured-data parse and visible-content parity;
- feature-flag disabled parity;
- generated-output review for intentional template changes;
- competition active-count, route and lifecycle regressions;
- browser checks for navigation, mobile behavior, outbound handoff and Club ad suppression.

Release commands remain documented in `docs/testing-and-regression.md`. Live link checks are evidence-sensitive and must distinguish a confirmed failure from a cloud-runner access block.

## Deployment and rollback

1. Use deterministic `FREEHUB_BUILD_DATE` and `FREEHUB_AS_OF_DATE` values for reviewed builds.
2. Generate with new vertical flags disabled and confirm output parity.
3. Generate with only the intended flag enabled.
4. Review changed routes, sitemap, robots, canonicals, schema, internal links, ad loaders and output counts.
5. Run deterministic tests, lifecycle validation, browser smoke tests and strict local link checks.
6. Commit only reviewed source and generated output.
7. Deploy through the existing GitHub Pages workflow.
8. Verify the canonical production host, representative pages, sitemap and analytics receipt.
9. Roll back by disabling the relevant feature flag and redeploying the last reviewed build; do not delete source records to perform a rollback.

Crawler changes deploy independently and must preserve a private handoff. A crawler rollout cannot be coupled to a public site deployment.

## Implementation ledger

### Completed in the initial slice

- Added this working specification.
- Added `data/merchants.json` with 18 current offer entities.
- Added a strict merchant JSON Schema and dependency-free runtime validator.
- Added fail-closed offer-to-merchant referential validation in the FreeHub build.
- Added merchant contract unit tests.
- Repositioned the stable `/deals/` hub in visible and metadata copy as Promotions and Deals.
- Preserved `deal` storage values, `/deals/` collection URLs and `/deal/{slug}/` detail URLs.
- Left all competition files, routes and lifecycle rules unchanged.

### Completed in the second slice

- Added `shared/discovery-data.js` and a strict cross-vertical Discovery JSON Schema.
- Added gated adapters for competitions, Promotions/Coupons and Opportunities.
- Added build-time validation of the combined public projection.
- Added duplicate ID/path protection across vertical summaries.
- Added Promotions analytics dimensions to collection context, cards, detail pages, community feedback and outbound handoffs.
- Added browser coverage for Promotions analytics and outbound tracking.
- Preserved all vertical publication gates, URLs, sitemap rules and competition behavior.

### Completed in the private crawler foundation

- Added the typed Promotion candidate contract in ZA Competition Engine.
- Added typed Coupon, Free Sample and Product Testing contracts with vertical-specific validation and conservative controls.
- Added a shared private Discovery candidate union and validator while keeping the competition contract separate.
- Added isolated `discovery_candidates` and append-only `discovery_candidate_actions` tables; the local migration created empty tables and inserted no candidate records.
- Added validated repository, dry-run-first import/review commands, private summary reporting and versioned evidence-handoff generation/validation.
- Explicitly prohibited FreeHub publication fields from all private Discovery candidates and handoff payloads.
- Kept the existing competition candidate table, review flow and handoff exporter unchanged.
- Added a four-source, dry-run-first pilot that fetches only configured official pages, respects robots policy and supports an opt-in non-interactive exact-page browser fallback.
- Passed ZA Competition Engine typechecking, health checks, targeted contract/repository/handoff/pilot tests and all 368 tests.
- Completed the first private write run on 10 August 2026: 12 `needs_review` records (5 Promotions, 1 Coupon, 1 Free Sample and 5 Product Testing) plus four HTML snapshots.
- Confirmed no candidates were approved for handoff, no handoff was generated, no forms were submitted and no FreeHub publication state changed.

### Next implementation slice

1. Add cross-type duplicate and relationship warnings to the Discovery projection.
2. Extract offer route/render helpers from the monolithic generator only where tests make the move mechanical.
3. Manually review the 12 first-run candidates and record false positives, missing evidence and editorial effort.
4. Add sources one at a time only after the first-run quality review, retaining exact-page dry-run and private-review boundaries.

## Final deliverables

The complete programme is done when FreeHub has:

- preserved, regression-tested competition discovery and publishing;
- reviewed private discovery pipelines for all four verticals;
- separate type-safe candidate and public data contracts;
- a shared merchant/source identity layer;
- a read-only cross-vertical Discovery projection;
- explicit review, evidence, dedupe, expiry and scam controls;
- indexable, inventory-supported SEO hubs with stable canonicals;
- sitemap and schema validation across every public type;
- cross-vertical analytics and operational KPIs;
- documented editorial, deployment, rollback and incident workflows;
- incremental commits with deterministic tests and no silent publication path.

This report is the authority for sequencing and risk decisions. The more detailed historical audit, target architecture, backlog and editorial runbooks remain supporting evidence; conflicts should be resolved in favour of the newer explicit decision recorded here and then reflected in this ledger.
