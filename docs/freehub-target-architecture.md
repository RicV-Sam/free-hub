# Freehub Target Architecture

**Status:** Proposed repository-specific target

**Decision date:** 14 July 2026
**Constraint:** Preserve competition behavior and existing canonical URLs while adding a separately governed free-opportunity pillar.

## Architecture decision

Keep the existing competition model and lifecycle intact. Add two explicit non-competition concepts rather than forcing all current and future content into one table:

1. **FreeResource** - a durable official programme, provider, directory, guide, public service, or platform. Examples include Book Dash, a credit bureau, or a product-testing panel.
2. **Opportunity** - a claimable or time-sensitive item such as a live sample, birthday benefit, free course intake, ticket allocation, trial, data offer, or reward.
3. **DiscoverySummary** - a small read-only adapter used only where different content types must appear together, such as the future homepage, analytics, search results, or Club.

Competitions remain in `data/competitions.json` and continue using competition-specific helpers and templates. `FreeResource` does not imply that a current offer is available. `Opportunity` cannot imply publication merely because a source exists or the ZA Comp Engine supplied evidence.

## Target data flow

```text
Manual research / company submission / private handoff
                         |
                         v
                Private editorial review
                         |
             +-----------+-----------+
             |                       |
             v                       v
     FreeResource registry     Opportunity registry
      durable references      claimable/current items
             |                       |
             +-----------+-----------+
                         |
                validators and adapters
                         |
             +-----------+-----------+
             |                       |
             v                       v
     existing evergreen hubs    future opportunity detail
       and resource cards       `/opportunity/{slug}/`
             |
             v
     sitemap/schema/internal links only after publication gates
```

The ZA Comp Engine stays outside this publishing flow. Its crawler candidates, local approvals, reviewed registry rows, and Freehub handoff rows are evidence inputs only. Freehub editorial review must set all Freehub-controlled publication fields.

## Proposed repository boundaries

| Concern | Target location/responsibility |
|---|---|
| Existing competition source | Keep `data/competitions.json` unchanged |
| Durable resources | Keep `data/free-resources.json`; add stable IDs and explicit resource classification through a backward-compatible migration |
| Time-sensitive opportunities | Add `data/opportunities.json` only after validators and fixtures exist |
| Contracts | Add JSON schemas under `data/schemas/` and JSDoc types in `shared/opportunity-data.js` |
| Opportunity lifecycle/filtering | `shared/opportunity-data.js`, usable from Node and browser like `shared/page-data.js` |
| Generator integration | Extract opportunity-specific readers/renderers under `scripts/lib/`; call them from `generate-pages.js` without changing competition rendering |
| Feature control | Build-time `FREEHUB_ENABLE_OPPORTUNITIES`; enabled only by the public launch PR and false when absent |
| Validation | Dedicated opportunity/resource validator plus existing generator SEO/lifecycle gates |
| User state | Future `users/{uid}/savedOpportunities/{opportunityId}`; existing competition collections unchanged |

This extraction is incremental. It is not a framework migration and must not require rewriting stable competition templates.

## Data contracts

### FreeResource

Existing fields remain readable during migration. New records use this contract:

```js
/**
 * @typedef {Object} FreeResource
 * @property {string} id
 * @property {string} name
 * @property {'programme'|'platform'|'directory'|'public_service'|'guide'} resourceType
 * @property {string} category
 * @property {string} categoryLabel
 * @property {string} officialUrl
 * @property {string} bestFor
 * @property {string} freeDetails
 * @property {string} requirements
 * @property {string} watchOut
 * @property {'active'|'manual_check'|'retired'} availability
 * @property {'verified'|'verification_due'|'source_changed'|'rejected'} verificationStatus
 * @property {string} datePublished
 * @property {string} lastReviewed
 * @property {string} reviewDueAt
 * @property {string} dateModified
 */
```

A FreeResource may describe where opportunities are commonly found, but it is not rendered as a current offer unless a separate published Opportunity points to it.

### Opportunity

```js
/**
 * @typedef {Object} Opportunity
 * @property {string} id
 * @property {string} slug
 * @property {'free_sample'|'birthday_freebie'|'product_testing'|'free_course'|'free_ticket'|'free_trial'|'free_data_airtime'|'reward'|'cashback'|'other_freebie'} type
 * @property {string} title
 * @property {string} summary
 * @property {string} provider
 * @property {string} sourceUrl
 * @property {string=} termsUrl
 * @property {string=} imageUrl
 * @property {'draft'|'review'|'published'|'held'|'expired'|'rejected'} publicationStatus
 * @property {'unverified'|'source_found'|'requirements_checked'|'verified'|'verification_due'|'source_changed'|'expired'|'rejected'} verificationStatus
 * @property {'ZA'} country
 * @property {string[]} regions
 * @property {string=} startsAt
 * @property {string=} expiresAt
 * @property {string} lastVerifiedAt
 * @property {string} reviewDueAt
 * @property {string=} publishedAt
 * @property {string} updatedAt
 * @property {'fixed_window'|'stock_limited'|'recurring'|'ongoing'} availabilityKind
 * @property {CostClassification} costClassification
 * @property {Requirement[]} requirements
 * @property {Object=} eligibility
 * @property {string[]} categories
 * @property {string[]} tags
 * @property {Object} details
 */
```

`details` is validated according to `type`; it is not an unrestricted dumping field. Sample details cover delivery/collection, delivery fee, stock limits, household limits, selection, and fulfilment. Birthday details cover signup lead time, birthday window, membership/app, ID, branch availability, recurrence, and voucher delivery. Course details cover provider, duration, access mode, certificate cost, language, difficulty, dates, and geographic restrictions.

### Cost classification

```js
/** @typedef {
 * 'completely_free'|
 * 'free_entry'|
 * 'standard_data_may_apply'|
 * 'account_required'|
 * 'membership_required'|
 * 'app_required'|
 * 'purchase_required'|
 * 'delivery_fee'|
 * 'refundable_deposit'|
 * 'paid_trial_after_free_period'|
 * 'card_required'|
 * 'paid_entry'|
 * 'unclear'
 * } CostClassification */
```

`free_entry` remains competition terminology. Non-competition items use `completely_free` only when there is no purchase, delivery payment, paid membership, card, deposit, premium communication charge, or hidden recurring payment. Standard internet access is disclosed separately.

### Requirement

```js
/**
 * @typedef {Object} Requirement
 * @property {'account'|'app'|'membership'|'purchase'|'delivery'|'card'|'location'|'age'|'identity'|'questionnaire'|'review'|'social_post'|'other'} kind
 * @property {boolean} required
 * @property {string} label
 * @property {string=} detail
 */
```

### DiscoverySummary

```js
/**
 * @typedef {Object} DiscoverySummary
 * @property {string} id
 * @property {'competition'|'resource'|'opportunity'} entityKind
 * @property {string} contentType
 * @property {string} title
 * @property {string} summary
 * @property {string} path
 * @property {string=} imageUrl
 * @property {string[]} labels
 * @property {string=} expiresAt
 * @property {string=} lastVerifiedAt
 */
```

Adapters may omit unsupported fields but must not invent them. Mixed UI always displays `contentType` so a competition, panel, course, and sample cannot be confused.

## Fail-closed publication rules

An Opportunity is public only when all of the following are true:

1. `publicationStatus === "published"`.
2. `verificationStatus === "verified"`.
3. `sourceUrl` is an allowed HTTP(S) official source and is not a preview, aggregator, affiliate redirect, or shortener.
4. Provider, title, summary, country, type, cost classification, requirements, `lastVerifiedAt`, `reviewDueAt`, and meaningful availability are present.
5. `reviewDueAt` has not passed.
6. Fixed-window and stock-limited items have not expired or been withdrawn.
7. `costClassification !== "unclear"` for strict free-only modules.
8. Type-specific schema validation passes.

Missing or unknown cost data returns `unclear`, never `completely_free` or `free_entry`. A verification-due item leaves active cards and sitemap but remains in the private registry. An ongoing or recurring record becomes verification due instead of automatically expiring.

## Verification cadence

| Entity | Review rule |
|---|---|
| Active competition | Existing closing-date lifecycle; unchanged |
| Direct or stock-limited sample | Review every 7 days and immediately after a reported issue |
| Product-testing/sample platform resource | Review every 30 days |
| Birthday freebie | Review every 90 days and before annual campaign changes |
| Ongoing free course/resource | Review every 90 days |
| Fixed/cohort course opportunity | Review every 30 days and at cohort close |
| Product-testing campaign | Review every 14 days |
| Free trial | Review every 30 days |
| Rewards programme resource | Review every 90 days |
| Cashback campaign | Defer; eventual cadence follows campaign dates |

The validator calculates whether review is due from explicit dates; it never updates `lastVerifiedAt` during a build.

## Route and canonical architecture

### Preserve

- `/`
- `/competitions/`
- `/competition/{slug}/`
- `/free-competitions/`
- All current category, tag, hub, brand, guide, Club, submission, report, legal, and trust routes
- `/free-stuff-south-africa/`
- `/free-samples-south-africa/`
- `/free-online-courses-south-africa/`
- `/free-childrens-books-south-africa/`
- `/free-credit-report-south-africa/`

### First release

No route migration and no new aliases. `/free-stuff-south-africa/` becomes the hybrid parent through richer sections and navigation. `/free-samples-south-africa/` is the first deep vertical and distinguishes direct samples, testing panels, and directories.

Pilot Opportunity records render in those existing hubs. The first public release does not require individual Opportunity detail pages.

### Later routes

- New intent pages remain root-level, for example `/birthday-freebies/`, only after at least five verified useful records and unique editorial content exist.
- Individual details use `/opportunity/{slug}/` after the detail template and lifecycle have passed a separate launch review.
- No generated alias enters sitemap.
- Every indexable page self-canonicalises.
- Existing routes are not normalised merely for visual consistency.

Keep the single sitemap for the first release. Segment it only when public URLs exceed 1,000 or operational diagnosis requires separate content-type reporting. Future segments would be pages, competitions, opportunities, guides, and brands under a sitemap index.

## Page templates and components

### Shared without over-generalising

- Site navigation and footer shell.
- Hero shell, trust row, breadcrumbs, guide cards, FAQ rendering, internal-link blocks, auth panel, and DataCost placement.
- Card frame elements: image/provider/title/labels/verification/CTA.
- Metadata/canonical/schema utilities after they are extracted behind tests.

### Type-specific

- `CompetitionCardContent`: prize, closing date, entry method, purchase/ticket rules.
- `SampleCardContent`: direct/panel classification, delivery/collection, stock, household and selection rules.
- `BirthdayFreebieCardContent`: signup lead time, birthday window, app/membership/ID/location.
- `CourseCardContent`: access duration, certificate cost, provider, cohort/ongoing status.
- `OpportunityDetailContent`: selected by type only after detail pages launch.

The target pattern is a small `OpportunityCardShell` with explicit content renderers, not one component with dozens of optional fields.

## Evergreen parent and sample pilot

### `/free-stuff-south-africa/`

The page is a hybrid editorial and discovery hub. It must:

- Define “free” and distinguish Free Stuff from free-entry competitions.
- Link prominently to the existing competition pillar.
- Show permanent category navigation.
- Show bounded verified Opportunity cards when the pilot flag is enabled.
- Continue showing durable FreeResource recommendations separately.
- Display cost, requirements, source, and verification information.
- Avoid claiming every linked programme has a currently available item.

### `/free-samples-south-africa/`

The pilot explicitly labels:

- **Direct current sample:** a claimable, verified Opportunity subject to a seven-day review cadence.
- **Product-testing panel:** a durable FreeResource where selection is not guaranteed.
- **Sample directory/platform:** a durable FreeResource that may list changing campaigns.

It answers delivery/collection, delivery cost, stock/selection, account/data sharing, official source, and last verification. If no direct samples are verified, the page remains an honest editorial/resource guide and does not render an empty “current samples” archive.

## Homepage transition

Phase 1 leaves title, H1, hero, and primary competition modules unchanged. The pilot may add one contextual Free Stuff link outside the primary competition flow only after both evergreen pages pass SEO and content checks.

Full repositioning happens after at least eight weeks of stable pilot operations or two completed verification cycles, whichever is longer. It retains a competition entry point in primary navigation and a substantial competition module near the fold. Mixed cards are type-labelled and bounded; the homepage does not become a complete inventory page.

## Search and filters

First fix the existing competition collection controls without changing their URL behavior. Opportunity search is then added by adapting published summaries, not by passing opportunities through competition filters.

Global filters may include entity type, completely free, no card, no purchase, account/app, online/in-store, location, expiry, provider, category, and last verified. Competition-only prize, entry-mechanic, till-slip, SMS/USSD, and high-value filters remain inside the competition pillar. Filter parameters are not added to sitemap and canonicalise to the base hub unless a future indexable landing page is explicitly defined.

## Structured data

- Retain current competition schema behavior.
- Parent/vertical pages use `CollectionPage`, `BreadcrumbList`, visible `FAQPage`, and `ItemList` when current public items exist.
- Durable resources remain `WebSite` or appropriate organisation/page references within an `ItemList`; they are not marked as current offers.
- A specific course may use `Course` only with accurate provider, access, and cost facts.
- `Offer` is allowed only for a real published opportunity with accurate availability/cost semantics.
- Do not add ratings, reviews, `Product`, `AggregateOffer`, or `Event` unless the actual page/entity supports them.

## Analytics contract

Preserve existing competition events and dimensions. Add generic events only when new public content launches:

- `discovery_card_click`
- `opportunity_detail_view`
- `official_source_click`
- `opportunity_save`
- `opportunity_state_change`
- `opportunity_report`
- `discovery_filter_apply`
- `discovery_search`

Required shared dimensions are `entity_kind`, `content_type`, `content_id`, `source_domain`, `page_type`, and `destination_path` where relevant. Competition events continue emitting existing `competition_*` fields for historical reporting.

## Club integration and privacy

Club expansion is not part of the first public release. Before it launches:

1. Version and test Firestore rules and required indexes.
2. Implement account deletion and data export/access paths.
3. Document retention, consent version, unsubscribe, and support handling.
4. Add `users/{uid}/savedOpportunities/{opportunityId}` with only the fields required for display and status.
5. Restrict allowed states by opportunity type in client code and Firestore rules.
6. Keep `savedCompetitions` and `ignoredCompetitions` unchanged.

Initial opportunity states are `saved`, `claimed`, `used`, `applied`, `started`, `completed`, `hidden`, and `not_interested`, with a type-to-state allowlist. Do not store a full date of birth. A later reminder may store a birthday month or private reminder date only after privacy review.

## Submission and editorial workflow

The current competition submission remains unchanged. A later `Submit an opportunity` form writes to a separate private `opportunitySubmissions` collection with a type discriminator and no auto-publication path. It must reject personal customer data, identity documents, banking information, and private winner/claim records.

Editorial workflow states are submission, source review, requirements/cost review, held/rejected, explicit publication, scheduled re-verification, source change, and expiry/retirement. Publication is always a human-controlled Freehub action.

## Migration and rollout

### Zero-database first release

1. Add contracts, fixtures, validators, and disabled feature flag.
2. Backfill stable IDs/classification/review-due dates in the tracked FreeResource registry through a reviewable data migration.
3. Add a small manually reviewed Opportunity pilot file.
4. Render the existing parent/sample routes only when the build-time flag is true.
5. Validate both flag-off and flag-on builds.
6. Enable the flag in the launch deployment after content sign-off.

No Firestore collection or production user data changes are required.

### Rollback

- Disable `FREEHUB_ENABLE_OPPORTUNITIES` and redeploy to remove Opportunity cards while retaining existing evergreen pages.
- Revert the pilot commit if metadata or navigation regresses.
- Preserve data files and review history for diagnosis; do not delete or redirect existing URLs.
- Remove new sitemap entries only by regeneration through the same publication rules.
- Club rollout, if later approved, uses an additive collection so it can be disabled without migrating existing competition state.

## Acceptance gates

- Flag-off output is functionally identical for all competition routes.
- Existing evergreen canonical URLs remain unchanged.
- Unknown cost or overdue verification cannot render as a public free offer.
- No Opportunity record can create a public page, card, schema item, or sitemap entry without explicit publication and verification.
- Parent and sample pages remain useful when zero direct samples are active.
- Competition tests, lifecycle validation, link validation, SEO checks, and browser journeys pass.
- No Club or Firestore change ships in the first release.
