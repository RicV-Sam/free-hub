# Freehub Expansion Implementation Backlog

**Prepared:** 14 July 2026
**Ordering rule:** Complete audit/baseline gates before changing public behavior. Every public PR must be independently reversible.

## Priority and sizing

- **P0:** Required to protect current behavior or unblock all later work.
- **P1:** Required for the minimum valuable public release.
- **P2:** Follow-up after the pilot proves operationally stable.
- **P3:** Explicitly deferred exploration.
- **Effort:** XS/S/M/L/XL.

## Epic 0 - Audit and regression baseline

| Task | User value | Technical scope | Dependencies | Acceptance criteria and tests | SEO impact / rollback | Effort | Priority |
|---|---|---|---|---|---|---:|---:|
| Commit five audit documents | Makes risks, boundaries, and delivery decisions reviewable | Current state, SEO, target, gaps, backlog | None | All required sections, route families, lifecycle/Club traces, missing evidence, no-change list | Documentation only; revert commit | M | P0 |
| Add metadata/sitemap baseline test | Prevents silent SEO regressions | Script checks one H1, title, description, canonical, robots, schema parse, sitemap/private exclusions | Audit docs | Test passes on current 145 URLs and fails fixtures for each rule | No output change; remove script | M | P0 |
| Add lifecycle unit fixtures | Protects cost, visibility, expiry, and sitemap decisions | Extract/test pure helpers without changing behavior | Baseline test harness | Current competition fixtures reproduce active/noindex/expired/free/purchase states | No output change; revert extraction | M | P0 |
| Add browser smoke harness | Makes visible defects reproducible | Local static server plus browser tests for navigation, collection controls, details, 404, mobile | Test harness | Runs in CI or documented local command; screenshots/traces on failure | No public change | L | P0 |
| Record performance baseline | Gives the pilot a transfer/DOM budget | Measure key HTML/assets and Lighthouse where available | Browser harness | Store reproducible report; no fabricated field data | No public change | S | P0 |

## Epic 1 - Safe opportunity foundations behind a disabled flag

| Task | User value | Technical scope | Dependencies | Acceptance criteria and tests | SEO impact / rollback | Effort | Priority |
|---|---|---|---|---|---|---:|---:|
| Make cost classification exhaustive | Prevents misleading “free” labels | Preserve known competition labels; unknown values return `unclear`; add non-competition enum/labels | Lifecycle fixtures | Existing 85 active labels unchanged; missing/unrecognised fixture never returns free | No intended SEO change; revert helper if snapshots differ | M | P0 |
| Add FreeResource schema | Clarifies whether a source is a programme, panel, directory, service, or guide | Stable IDs, resource type, availability, verification and review due fields; backward-compatible migration | Baseline tests | All 18 rows validate; duplicate IDs/names and overdue invalid states fail | Existing pages remain identical with flag off | M | P0 |
| Add Opportunity schema and fixtures | Creates a safe future content contract | JSON Schema/JSDoc, type-specific detail validation, fixtures for active/draft/expired/recurring/unclear | Cost helper | No production rows required; invalid/publication-leak fixtures fail | No public output; remove registry/flag | L | P0 |
| Add central publication eligibility | Keeps non-public content out of all surfaces | One pure `isPublicOpportunity` gate used by cards/schema/sitemap | Opportunity schema | Draft, held, rejected, overdue, expired, source-changed, and unclear strict-free fixtures excluded | Flag remains off; revert module | M | P0 |
| Add disabled build-time flag | Allows zero-risk integration and instant rollback | `FREEHUB_ENABLE_OPPORTUNITIES`, false when absent; both-mode build tests | Eligibility helper | Flag-off output has no Opportunity cards/routes/schema/sitemap changes | Disable variable and redeploy | S | P0 |
| Add DiscoverySummary adapter | Supports bounded mixed modules without competition coercion | Competition/resource/opportunity adapters with explicit entity/type labels | Contracts | Adapters omit unknown facts and never synthesize cost/expiry | Internal only while flag off | M | P1 |
| Fix collection search/filter controls | Restores current promised functionality before heterogeneous search | Activate current controls on collection routes; preserve static fallback | Browser harness | Keyboard/search/category tests on `/competitions/` and one hub; no JS still shows full list | No route/canonical change; revert client patch | M | P0 |

## Epic 2 - Existing Free Stuff parent pilot

| Task | User value | Technical scope | Dependencies | Acceptance criteria and tests | SEO impact / rollback | Effort | Priority |
|---|---|---|---|---|---|---:|---:|
| Refactor resource/opportunity renderers out of the generator | Reduces regression surface | Small scripts library; keep competition templates unchanged | Foundation tests | Flag-off generated competition files match approved snapshots | No URL change; revert extraction | M | P1 |
| Upgrade `/free-stuff-south-africa/` | Provides a true evergreen discovery parent | Definition of free, pillar cards, separate current opportunities/resources, trust and verification sections | Renderers; reviewed pilot data | Useful with zero active Opportunities; type labels and official sources visible; one H1/self-canonical | Existing canonical retained; disable flag to remove pilot cards | M | P1 |
| Add Free Stuff primary navigation entry | Makes the pillar discoverable | Add concise nav/footer link without mega-menu | Parent page acceptance | Mobile/keyboard nav passes; competitions remain primary and visible | Internal-link gain; revert link | S | P1 |
| Add parent analytics | Measures usage without breaking history | Generic card/source/pillar events with shared dimensions | Analytics contract | Events visible in data layer tests; existing competition events unchanged | No index impact; remove new listeners | S | P1 |
| Add parent metadata/schema tests | Protects distinct intent | Existing title/H1 retained initially; Collection/ItemList only for visible public items | SEO harness | No overlap with `/free-competitions/`; no empty/misleading ItemList | Disable flag/revert schema block | M | P1 |

## Epic 3 - Free samples deep vertical

| Task | User value | Technical scope | Dependencies | Acceptance criteria and tests | SEO impact / rollback | Effort | Priority |
|---|---|---|---|---|---|---:|---:|
| Classify seven existing sample resources | Users can distinguish panels/directories from live samples | Editorial review, resource type, requirements, review due, manual-OK evidence | FreeResource schema | Every resource has explicit classification and current review date; no “available sample” inference | Existing route retained; revert data migration | M | P1 |
| Create manually reviewed direct-sample fixtures/records | Adds current offers only when evidence supports them | Private review followed by explicit Opportunity publication fields | Opportunity gate | Each public record has official source, delivery/cost/stock/account facts and seven-day review due | Remove publication/disable flag | M | P1 |
| Upgrade `/free-samples-south-africa/` | Makes sample claims transparent and actionable | Separate direct samples, testing panels, and directories; requirements/verification UI | Classified data | Page remains useful with zero direct samples; no empty category; all current cards pass eligibility | Self-canonical retained; flag-off returns resource-only page | M | P1 |
| Add stale/withdrawn sample handling | Prevents unavailable offers lingering | Verification-due/expired removal from cards and schema; private registry retained | Sample records | Overdue/expired fixture absent from active page and sitemap data; resource panel remains | Re-verify and republish or disable flag | M | P1 |
| Add sample browser/SEO tests | Protects the first public vertical | Mobile, keyboard, official-source click, labels, H1/canonical/schema/noindex tests | Page implementation | All pilot acceptance cases pass | No separate rollback | M | P1 |
| Document weekly editorial runbook | Makes freshness operationally sustainable | Review queue, source check, issue report, expiry, and manual-OK procedure | Pilot workflow | Named owner/cadence and evidence fields documented before launch | Pause/disable pilot if cadence cannot be met | S | P1 |

## Epic 4 - Pilot launch and observation

| Task | User value | Technical scope | Dependencies | Acceptance criteria and tests | SEO impact / rollback | Effort | Priority |
|---|---|---|---|---|---|---:|---:|
| Run launch audit | Prevents route/schema/mobile regressions | Both flag builds, full generator, validators, browser suite, production preview | Epics 0-3 | Zero errors; warnings documented; competition output unchanged except approved navigation | Do not enable flag on failure | M | P1 |
| Enable pilot flag | Publishes reviewed content on existing URLs | Deployment variable/config and regenerated artifact | Launch audit/content sign-off | Parent and sample content live; sitemap/canonical unchanged | Disable flag and redeploy | XS | P1 |
| Monitor two verification cycles | Confirms editorial maintainability | Weekly source/review checks, issue log, analytics, HTML/performance budget | Pilot live | No overdue public samples, broken active sources, or competition regressions | Disable pilot cards while retaining pages | M | P1 |
| Decide next vertical | Uses evidence rather than page-count goals | Compare sample operations, page engagement, source clicks, reports, and content gaps | Observation period | Written go/no-go; birthday requires five verified records | No code change | S | P2 |

## Epic 5 - Club support after privacy and rules gate

| Task | User value | Technical scope | Dependencies | Acceptance criteria and tests | SEO impact / rollback | Effort | Priority |
|---|---|---|---|---|---|---:|---:|
| Version Firestore rules/indexes | Makes access control reviewable | Add deployable configuration and emulator tests for existing/new collections | Production rules access | Owner/private/admin/anonymous tests pass; no current access regression | Do not deploy or revert rules | M | P2 |
| Implement account deletion/export | Gives users meaningful privacy control | Delete/auth profile/private subcollections; export/access response; audit logging policy | Rules and legal review | End-to-end deletion/export tests and support runbook | Disable Club expansion; existing public pages unaffected | L | P2 |
| Add `savedOpportunities` | Lets members save/claim/use relevant items | Additive collection, minimal snapshots, type-state allowlist, UI adapter | Privacy gate | Owner-only rules; invalid state/type rejected; competitions unchanged | Disable UI/rules; no competition migration | L | P2 |
| Add opportunity alert preferences | Gives users control by type/category/frequency | New additive preference document/version | Saved opportunities | Opt-in, unsubscribe, frequency, and private-data tests | Disable sends; retain preference record | L | P2 |
| Evaluate birthday reminders | Avoids unnecessary birth-date collection | Month/private reminder design and DPIA-style privacy review | Birthday dataset and deletion/export | No full DOB in initial design; explicit consent and removal | Defer feature | M | P3 |

## Epic 6 - Homepage repositioning

| Task | User value | Technical scope | Dependencies | Acceptance criteria and tests | SEO impact / rollback | Effort | Priority |
|---|---|---|---|---|---|---:|---:|
| Define evidence-backed homepage copy | Explains broader value without hiding competitions | Compare existing and proposed title/H1; content/SEO review | Stable pilot and external search evidence if available | Unique umbrella intent; competition relevance retained | Keep current copy until approved | M | P2 |
| Build bounded mixed modules | Surfaces current opportunities clearly | DiscoverySummary cards with visible content-type labels | Adapter and stable inventory | Competitions near fold; no unlabeled mixing; empty types omitted | Disable module | L | P2 |
| Broaden trust and Club copy | Extends transparency across types | Cost/source/verification language; Club remains optional | Approved product behavior | No claim that purchase-required competitions are free; public browsing explicit | Revert copy | M | P2 |
| Launch homepage with regression monitoring | Evolves the brand safely | Metadata/schema/nav/performance/mobile tests and staged deploy | All homepage gates | Competition hub links remain strong; guardrail metrics monitored | Revert homepage commit | M | P2 |

## Deferred epics

The following stay out of the first two public releases: cashback aggregation, broad coupon feeds, automated scraping/publication, a large rewards-programme database, mass route restructuring, segmented sitemaps, personalised recommendations, paid membership, and native apps.

## Minimum public release definition

The first public release consists of:

- Existing `/free-stuff-south-africa/` upgraded as a hybrid parent.
- Existing `/free-samples-south-africa/` upgraded as the first deep vertical.
- Explicit FreeResource/direct-sample distinctions.
- Fail-closed cost and verification rules.
- Official source, requirements, and verified/review dates.
- Navigation/internal links, analytics, metadata, schema, sitemap checks, and editorial runbook.
- No individual Opportunity detail routes, Firestore migration, Club opportunity state, homepage title/H1 change, or competition behavior change.

## Pull request sequence

1. **PR 1A - Expansion audit and implementation blueprint**

   The five repository-grounded audit documents only; no public output or test-infrastructure changes.

2. **PR 1B - SEO, lifecycle, and browser regression harness**

   Metadata/sitemap/lifecycle fixtures, browser harness, and reproducible baseline metrics with zero intended public-output changes.

3. **PR 2 - Fail-closed opportunity foundations**

   Cost fix, FreeResource/Opportunity schemas, publication gate, fixtures, disabled flag, summary adapter, current search-control fix.

4. **PR 3 - Free Stuff parent on the existing canonical**

   Extracted renderers, hybrid parent sections, navigation, analytics, metadata/schema tests.

5. **PR 4 - Free samples pilot and editorial workflow**

   Resource classification, reviewed direct samples, stale handling, page/browser tests, weekly runbook.

6. **PR 5 - Pilot launch configuration**

   Launch audit, flag enablement, monitoring hooks; no unrelated changes.

7. **PR 6 - Club opportunity support**

   Only after rules, deletion/export, privacy, and emulator gates.

8. **PR 7 - Homepage repositioning**

   Only after stable pilot evidence and a separate metadata/SEO review.

## Release-wide no-change list

- Preserve competition records, URLs, taxonomies, free-entry definition, detail templates, `/out/`, expiry/archive, sitemap rules, and daily automation.
- Preserve current evergreen canonical URLs.
- Preserve anonymous browsing and official-source transparency.
- Preserve existing competition Club collections and status behavior.
- Keep ZA Comp Engine output private, evidence-only, and incapable of publication approval.
