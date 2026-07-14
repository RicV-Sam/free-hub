# Freehub Expansion Gap Analysis

**Assessment date:** 14 July 2026
**Scale:** Effort XS/S/M/L/XL; Risk Low/Medium/High. Effort is relative engineering/editorial scope, not a calendar estimate.

## Classification key

- **Reusable:** Exists and can be used with little or no behavioral change.
- **Refactor:** Exists but is too competition-specific or unsafe for broader use.
- **Partial:** Some required behavior/data exists.
- **Missing:** No adequate implementation exists.
- **Deferred:** Deliberately excluded from the first release.

## Capability matrix

| Capability | Classification | Evidence and required change | Effort | Risk |
|---|---|---|---:|---:|
| Static generation and deployment | Reusable | Mature Node generator and GitHub Pages workflows; add isolated modules rather than replace the stack | S | Low |
| Competition source model | Reusable | 259-row model supports current competition needs; keep unchanged | XS | Low |
| Competition publication gate | Reusable | Published/held/do-not-publish/visibility rules fail closed for current records | XS | Low |
| Competition expiry/archive | Reusable | Daily archive, current-hub removal, retained detail, sitemap and `/out/` checks exist | XS | Low |
| Strict free-competition hub | Reusable | Established route and no-purchase intent must stay competition-only | XS | Low |
| Official source and terms display | Reusable | Present on details and resources; extract presentation helper for future opportunities | S | Low |
| Competition cost labels | Refactor | Current known values work, but unknown/missing values fall through to `Free entry` | S | High |
| Generic cost classification | Missing | Needs explicit enum, fail-closed helper, labels, and tests | M | High |
| FreeResource model | Partial | 18 records and validation exist; stable IDs, resource type, availability, review due, and verification state are missing | M | Medium |
| Opportunity model | Missing | No distinct registry, schema, lifecycle, validator, or type-specific details | L | High |
| Mixed discovery adapter | Missing | Homepage/cards/search assume competitions | M | Medium |
| Parent Free Stuff hub | Partial | Existing canonical editorial/resource page is strong but lacks current Opportunity modules and pillar navigation | M | Medium |
| Free samples vertical | Partial | Existing route, seven sources, copy, schema, and link checks; direct samples and panels are not distinguished | M | Medium |
| Birthday freebies vertical | Missing | No verified dataset, route, template, or editorial workflow | L | Medium |
| Free courses vertical | Partial | Existing route and three resources; course/certificate/access semantics are not structured | M | Medium |
| Product-testing vertical | Partial | Sources are mixed into samples; separate route would currently risk overlap/thin content | M | Medium |
| Free tickets/trials/data/rewards | Missing | No dedicated non-competition data or route behavior | L each | Medium |
| Cashback aggregation | Deferred | High commercial/trust complexity and no source model | XL | High |
| Broad rewards database | Deferred | Requires sustained verification and provider data | XL | High |
| Homepage umbrella positioning | Partial | Reusable sections exist, but current copy/data are competition-only | L | High |
| Primary navigation for Free Stuff | Partial | Shared nav exists; route label/link change is simple but should follow pilot readiness | S | Medium |
| Shared card shell | Partial | Reusable markup/styles exist inside competition renderers; needs extraction without over-generalising | M | Medium |
| Opportunity detail pages | Missing | No route, lifecycle, metadata, schema, or expired template | L | High |
| Canonical helpers | Partial | Correct output exists in several templates but logic is repeated in the generator | M | Medium |
| Metadata/schema helpers | Partial | Strong output but monolithic/repeated; add tests before extraction | M | Medium |
| Sitemap filtering | Reusable/Refactor | Competition exclusions are strong; opportunity-specific rules are missing | M | High |
| Robots behavior | Partial | Repository output is simple; Cloudflare prepends externally managed policy | S | Medium |
| Internal linking | Partial | Competition graph has no sitemap orphans; evergreen pillar hierarchy is not prominent in primary navigation | M | Medium |
| Collection search/filter | Refactor | Controls render on collections but client code only activates home, where controls do not exist | M | Medium |
| Heterogeneous search | Missing | Requires summary adapter and type-scoped filters after current defect is fixed | L | Medium |
| Brand/provider pages | Partial | Competition brand pages exist; providers for other types have no model or thresholds | L | Medium |
| Verification due workflow | Missing | Resources have dates but no due-state queue or publication exclusion | M | High |
| Broken-source validation | Reusable/Refactor | Link validators exist; cadence and opportunity status transitions are missing | M | Medium |
| Duplicate detection | Partial | Duplicate competition slugs/resource names are checked; cross-type source/offer duplicates are not | M | Medium |
| Opportunity submission | Missing | Competition submission exists but is tightly shaped and must remain separate initially | L | High |
| Human publication approval | Reusable | Competition and ZA handoff guardrails establish the correct boundary | S | Low |
| Automated discovery | Partial | Bing research and ZA Comp Engine exist privately; no opportunity sources or safe import contract | L | High |
| Automated publication | Deferred | Conflicts with editorial/trust requirements | XL | High |
| Club competition save/hide | Reusable | Existing collections and statuses work for competitions | XS | Low |
| Club opportunity states | Missing | Requires additive collection, state allowlist, rules, deletion/export, privacy, and tests | L | High |
| Account deletion/export | Missing | No repository implementation found | L | High |
| Versioned Firestore rules | Missing | Only documentation examples exist; production state cannot be audited | M | High |
| Alerts by type/category | Partial | Competition alert preference exists; no type/category/frequency model | L | High |
| Birthday reminders | Deferred | Avoid date-of-birth collection; privacy and reminder design unresolved | L | High |
| Analytics foundation | Reusable/Refactor | GTM/Meta and many events exist; dimensions are competition-specific and production reports unavailable | M | Medium |
| Content-health metrics | Partial | Validation reports exist; no opportunity overdue/unclear/thin dashboard | M | Medium |
| Accessibility foundation | Partial | Semantic static markup is good; no automated or assistive-technology suite | M | Medium |
| Performance monitoring | Missing | Static sizes can be measured; no Lighthouse history or RUM baseline | M | Medium |
| Segmented sitemaps | Deferred | 145 URLs do not justify immediate segmentation; reconsider after 1,000 public URLs | M | Low |
| Route normalisation/migration | Deferred | Existing ranked/indexed roots should be preserved | XL | High |
| Framework migration | Deferred | Current static stack can support the pilot; migration adds unrelated risk | XL | High |
| Recommendation algorithms | Deferred | Insufficient heterogeneous behavior and data | XL | High |
| Paid membership | Deferred | Outside current proposition and privacy/payment readiness | XL | High |
| Native mobile apps | Deferred | No validated need; web remains the public product | XL | High |

## Highest-risk gaps

1. **Fail-open “free” fallback:** new or malformed records could be mislabeled unless cost classification is made exhaustive and defaults to `unclear`.
2. **Opportunity publication lifecycle:** cards, schema, and sitemap require one central fail-closed eligibility function before any public pilot.
3. **Route cannibalisation:** creating short aliases for existing evergreen pages would introduce duplicate intent without evidence.
4. **Firestore enforcement/privacy:** non-competition Club state cannot safely launch until rules, deletion, export, consent, and retention are implementable and testable.
5. **Generator change surface:** direct additions to the monolith increase regression risk across every generated page.
6. **Operational freshness:** direct samples need a seven-day cadence; the current sample resources are mostly durable panels and directories, not live sample inventory.

## Recommended first pilot

Use `/free-samples-south-africa/` as the first deep vertical while retaining its canonical. It has the strongest existing repository support: seven source records, dedicated editorial content, resource cards, schema, sitemap inclusion, and link validation.

The pilot must not claim that all seven resources are live samples. It separates direct sample Opportunities from testing panels and directories. Birthday freebies follow only after at least five verified recurring offers and a 90-day review workflow exist.

## What can ship without a database migration

- Data contracts, JSON schemas, fixtures, and validators.
- A tracked Opportunity registry and build-time disabled feature flag.
- Backward-compatible FreeResource field additions.
- Parent and sample page modules on existing URLs.
- Cost/requirements/verification labels.
- Metadata, schema, analytics, internal links, navigation, and sitemap tests.
- A homepage teaser after pilot acceptance.

## What must not change in the first release

- Competition URL, data, visibility, expiry, archive, `/out/`, and sitemap behavior.
- Existing `savedCompetitions` and `ignoredCompetitions` collections.
- The `/free-competitions/` definition or taxonomy.
- Public anonymous browsing.
- ZA Comp Engine private-review and evidence-only handoff semantics.
- Existing evergreen canonicals.
- Homepage title/H1 before pilot acceptance.
