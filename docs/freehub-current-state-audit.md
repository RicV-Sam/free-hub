# Freehub Current-State Audit

**Audit date:** 14 July 2026

**Repository:** `free-hub`

**Production origin:** `https://freehub.co.za`
**Scope:** Repository and generated output inspection, production response checks, current data validation, and existing operational documentation. No public behavior was changed during this audit.

## Executive finding

Freehub is a production static site with a strong competition-specific publishing pipeline, not a general content platform yet. Its main strengths are fail-closed publication filtering, durable competition URLs, official-source transparency, explicit cost labels, retained expired detail pages, automated expiry maintenance, and a usable optional Club layer. These systems should remain intact.

The safest expansion is a parallel opportunity model rather than turning every record into a competition or refactoring the existing competition lifecycle in place. The repository already contains a useful evergreen foundation: 18 verified resources, a broad `/free-stuff-south-africa/` page, and four narrower free-resource pages. Those URLs should be developed rather than duplicated.

The main constraints are the 9,898-line generator, competition-only shared/client abstractions, very limited automated test coverage, a collection search UI that is currently inactive, and Firebase security/deletion behavior that is documented but not version-controlled or verifiable from this repository.

## Verified baseline

| Measure | Current value |
|---|---:|
| Competition source rows | 259 |
| Active public competitions | 85 |
| Active noindex competitions | 5 |
| Expired archive-eligible published competitions | 75 |
| Rows in the expired archive ledger | 100 |
| Generated competition detail directories | 186 |
| Generated active `/out/` directories | 90 |
| Evergreen free resources | 18 |
| Evergreen resource categories | 5 |
| URLs in the generated sitemap | 145 |
| Indexable competition detail URLs in the sitemap | 85 |

The five free-resource categories are `online-courses`, `childrens-books`, `credit-report`, `samples`, and `consumer-support`. The samples category has seven source records.

## Stack and dependencies

| Concern | Current implementation |
|---|---|
| Framework | No application framework; custom Node.js static-site generator |
| Language | JavaScript, HTML, CSS, JSON |
| Package manager | npm |
| Runtime | Node 24 in GitHub Actions; local audit used Node 24.11.0 |
| Public data | Tracked JSON files under `data/` |
| Database | Firestore for optional accounts, submissions, referral data, alerts, and private user state |
| Authentication | Firebase client SDK; Google and email-link are configured defaults, with Facebook support present in code |
| Styling | One shared `styles.css` file, 102,431 bytes |
| Components | String-rendering helper functions in `scripts/generate-pages.js`; browser modules under `shared/` |
| Deployment | GitHub Pages behind Cloudflare, custom domain from `CNAME` |
| Analytics | Google Tag Manager, `gtag` events, and Meta Pixel |
| Advertising | AdSense script and reserved ad placements |
| Email | Firebase Trigger Email-compatible `mail` collection, queued by an Admin SDK script |
| Scheduling | GitHub Actions daily maintenance cron; no application queue service |
| Admin/CMS | Firebase Console plus a static noindex referral admin page; no public CMS |
| Tests | Validation scripts; no unit-test framework or browser-test suite |

The only npm runtime dependency is `firebase-admin`. Firebase's browser SDK is imported at runtime from Google's CDN.

## Repository and rendering architecture

### Primary sources

- `data/competitions.json` is the current and review-stage competition source.
- `data/archive/competitions-expired.json` is the historical archive ledger.
- `data/free-resources.json` contains durable external resources used by the evergreen free-content pages.
- `shared/page-data.js` owns competition routing, filtering, visibility, cost labels, card labels, sorting, canonical copy, and lifecycle helpers for both Node and the browser.
- `scripts/generate-pages.js` owns route definitions, page templates, structured data, sitemap/robots output, static validation, and file generation.
- `app.js` owns client search/filter rendering and analytics for competition pages.
- `shared/firebase-client.js`, `shared/auth-ui.js`, `shared/club-ui.js`, and `shared/club-tools.js` own optional authenticated and local Club behavior.

### Rendering model

All public content is pre-rendered HTML. Collection pages include all matching competition cards in the document, which makes their content crawlable without JavaScript. JavaScript adds analytics, optional account actions, and intended client filtering.

No runtime server route or server action exists. Firebase operations are client-side Firestore calls or separate local/Admin SDK scripts. Changes to public content require static regeneration and deployment.

### Generator coupling

The generator is 9,898 lines and contains route configuration, marketing copy, templates, form markup, analytics setup, validation, deletion of stale generated directories, and content-specific business rules. `shared/page-data.js` is 1,823 lines and assumes the primary discoverable entity has a competition slug, closing date, prize/category, entry method, and competition detail URL.

Reusable primitives exist, but they are functions rather than isolated components. Reusable candidates include the top navigation, footer, hero shell, trust row, breadcrumbs, FAQ rendering, internal link blocks, official-source presentation, auth panel, DataCost block, and generic card shell styles. Competition card content, prize logic, urgency logic, and entry mechanics should remain competition-specific.

## Public route inventory

| Route family | Source/rendering | Data source | Canonical/indexing | Sitemap/schema | Purpose |
|---|---|---|---|---|---|
| `/` | `renderHomepage()` | Active public competitions | Self-canonical, indexable | Sitemap; `ItemList` | Competition-led brand homepage |
| `/competitions/` and root competition hubs | `renderPage()` | Filtered active competitions | Self-canonical when useful | Sitemap; `CollectionPage`, `BreadcrumbList`, `FAQPage`, `ItemList` | Primary competition discovery |
| `/category/{slug}/` | `renderPage()` | Category filter | Self-canonical; noindex if thin | Sitemap only when indexable; collection schemas | Prize category hubs |
| `/tag/{slug}/` | `renderPage()` | Tag filter | Duplicate intent tags canonicalise to the established hub and are noindex | Canonical aliases excluded; collection schemas | Entry/intent taxonomies |
| Competition vertical root routes | `renderPage()` | Rule-based matching | Generated only with at least three active matches | Sitemap; collection schemas | WhatsApp, till-slip, online, airtime, data, grocery, supermarket |
| `/brands/` and `/brand/{slug}/` | brand renderers | Active competition clusters | Brand pages require minimum inventory | Sitemap when indexable; collection schemas | Brand competition discovery |
| `/competition/{slug}/` | `renderCompetitionPage()` | Current and archive data | Self-canonical; active public indexable, expired/grey states follow lifecycle rules | Active public pages in sitemap; `WebPage`, `BreadcrumbList`, visible FAQ schema | Competition detail and historical reference |
| `/out/{slug}/` | `renderOutPage()` | Active public/noindex competitions | Self-canonical, `noindex,nofollow` | Never in sitemap | Measured two-second handoff to official source |
| Trust and policy root routes | `renderTrustPage()` | Hard-coded page definitions | Self-canonical, indexable | Sitemap; page/breadcrumb/article/FAQ/service as applicable | Trust, safety, policies, contact, submission |
| Existing free-resource root routes | `renderTrustPage()` | Page definitions plus `free-resources.json` | Self-canonical, indexable | Sitemap; `WebPage`, `Article`, `BreadcrumbList`, `ItemList`, visible FAQ | Evergreen free-content foundation |
| `/guides/`, `/blog/`, monthly guide | content renderers | Static definitions plus active competition data | Self-canonical, indexable | Sitemap; article/collection schemas as applicable | Editorial navigation and roundups |
| `/club/` | Club landing renderer | Static content | Self-canonical, indexable | Sitemap; `WebPage`/FAQ | Optional retention landing page |
| `/club/dashboard/`, `/club/account/` | Club shell plus client Firestore | Embedded active summaries and private Firestore data | Self-canonical, `noindex,follow` | Excluded | Private user tools |
| `/refer-and-win/` and `/refer-and-win/terms/` | Refer & Win renderers | Static config plus private Firestore | Self-canonical, indexable | Sitemap; page/FAQ schemas | Referral campaign |
| `/admin/referrals/` | Static shell plus client admin checks | Private Firestore | `noindex,nofollow` | Excluded | Manual referral review |
| `/404.html` | not-found renderer | None | Canonical points to home; noindex | Excluded | Static-host fallback |

The sitemap currently contains one homepage, five category routes, nine tag routes, 39 other static/root routes, three brand pages, the Club landing page, two Refer & Win pages, and 85 competition detail pages.

## Competition lifecycle trace

1. **Discovery and handoff:** Candidates may come from manual research, submission, or the separate ZA Comp Engine. Engine output is private evidence only and cannot set Freehub publication fields or write Freehub public rows.
2. **Private import/review:** Import and held-candidate scripts validate candidate shape. Firestore competition submissions enter `competitionSubmissions` with `pending-review` and do not publish automatically.
3. **Editorial publication:** A competition becomes eligible only when `verificationStatus` is `published`, it is not held or archived-low-value, and `doNotPublish` is not true. Visibility and risk rules can still make it noindex or Club-only.
4. **Static generation:** Active public records enter homepage, hub, category, tag, vertical, brand, detail, and `/out/` generation. Noindex active records receive detail and `/out/` pages but are excluded from public collections and sitemap.
5. **User interaction:** A user can browse anonymously, open a Freehub detail page, follow `/out/` to the official source, save a competition, mark it interested/entered/skipped, or hide it.
6. **Expiry:** Daily maintenance archives expired records, regeneration removes them from active collections, `/out/`, and sitemap, and lifecycle validation fails if leakage remains.
7. **Historical page:** Published expired records with sufficient source evidence retain a closed detail page. Low-value legacy records use a noindex reference template. Expired pages do not redirect to the homepage.
8. **Automation:** The daily GitHub workflow commits regenerated maintenance output only after lifecycle validation passes, deploys the Pages artifact, and optionally submits sitemap URLs to Bing and IndexNow.

At audit time, lifecycle validation found no expired, noindex, Club-only, or non-public leakage into public listings or the sitemap.

## Homepage dependencies

The homepage is fully competition-led. It depends on active competition sorting/scoring, top-pick selection, latest checked records, competition intent tiles, trust blocks, DataCost placements, Club/auth prompts, guide links, GTM, Meta Pixel, AdSense, the shared footer, and current build date.

The home title is `South African Competitions Worth Entering Today | Freehub` and its H1 is `Find South African competitions worth entering today`. No mixed opportunity data source or type label system exists. The page is therefore safe to leave unchanged until an evergreen pilot has reliable inventory.

## Club and authentication model

### Public and private surfaces

Browsing and outbound links remain public. `/club/` is an indexable explanation page. Dashboard and account pages are noindex but are statically reachable shells; authentication controls what private data can be loaded or written.

### Firestore model used by the client

- `users/{uid}` stores identity, provider, privacy acceptance, marketing consent, referral participation, and optional mobile fields.
- `users/{uid}/savedCompetitions/{competitionId}` stores competition snapshots and `interested`, `entered`, or `skipped` status.
- `users/{uid}/ignoredCompetitions/{competitionId}` stores hidden competition snapshots.
- `users/{uid}/alertPreferences/main` stores competition and marketing choices.
- `signupEvents`, referral collections, `competitionSubmissions`, `mail`, and `emailCampaigns` support analytics, referrals, submissions, and email operations.

Local browser storage supports unauthenticated saved/hidden behavior and Club tools such as proof notes and reminders. Signed-in state is synchronised through Firestore where helpers exist.

### Club gaps

- Saved entities and UI labels are competition-specific.
- The only supported saved statuses are `interested`, `entered`, and `skipped`.
- No account deletion implementation, data export workflow, or retention schedule is present in the repository.
- Firestore security rules appear only as documentation examples; no deployable rules or index configuration is version-controlled here.
- Production rules and configuration cannot be verified from repository access.
- Birthday data should not be collected for the initial content pilot.

## SEO implementation

- `https://freehub.co.za` is the canonical origin.
- Every sitemap page checked has one H1, a non-empty unique title and description, and a matching self-canonical.
- Thin category/tag/brand pages are noindexed or not generated according to inventory thresholds.
- Duplicate tag intents use canonical overrides to established hubs.
- Active public competition pages enter the sitemap; `/out/`, private Club, admin, held, noindex, and expired pages do not.
- Sitemap `lastmod` uses the most recent relevant checked/modified date, with build date as a fallback.
- Visible structured data currently uses `ItemList`, `CollectionPage`, `BreadcrumbList`, `FAQPage`, `WebPage`, `Article`, and one `Service` page.
- The free-resource pages use `WebSite` items inside `ItemList`; they do not claim that every linked site is a product or offer.
- Open Graph and Twitter metadata are rendered for main public templates.

The live `robots.txt` contains Cloudflare-managed content signals and AI-crawler exclusions before the repository-generated allow/sitemap block. This behavior is controlled outside the repository and must be included in deployment documentation.

## Search and filtering

Collection pages render a search field, category filter container, results summary, and full card grid. However, `app.js` only calls `loadCompetitions()` and binds search input when the resolved route type is `home`. The homepage does not render the collection search controls. Consequently, the visible search and dynamic category controls on `/competitions/` and other collection pages are inactive.

This is a current defect, not an opportunity-model requirement. It should receive an isolated regression test and fix before a global heterogeneous search experience is designed.

## Content operations and ingestion

- Competition rows are curated in tracked JSON and validated during generation.
- The held-candidate workflow has explicit import/export validators and guards against public detail, `/out/`, listing, and sitemap leakage.
- Company submissions are written anonymously to a private Firestore review collection after browser validation and rule-shape validation.
- The ZA Comp Engine is a separate local crawler/review/handoff system. Its candidate, approval, reviewed-registry, and handoff states are not equivalent to Freehub publication.
- Free resources are manually maintained in one tracked JSON file and checked for required fields, dates, unique names, category coverage, and reachable official URLs.
- Images may be explicit, inferred from known brand images, or replaced by category fallbacks. Generated SVG data-URI card/hero images fail the build.
- There is no reusable opportunity submission flow, editorial dashboard for free resources, verification-due queue, duplicate detector across content types, or automatic stale-source alert.

## Expiry, redirects, and canonicals

Competition expiry is date-driven. Active pages disappear from current collections and `/out/`; useful expired detail pages remain available with a closed state. The generator removes stale managed directories during a build.

No general redirect configuration exists in the repository. The old `freehub.datacost.co.za` host requires an external host-level redirect or noindex policy. Existing root-level evergreen routes have no aliases and should remain canonical. Adding `/free-stuff/` or `/free-samples/` now would create avoidable duplicate intent unless backed by a deliberate redirect and external search evidence.

## Analytics and conversion tracking

GTM and Meta Pixel are present across primary templates. `app.js` emits events for card clicks, detail views, outbound/entry clicks, category filters, search, ads, and engagement. Club, auth, referral, and submission modules emit additional events through the shared analytics interface.

Analytics events use competition-specific keys such as `competition_slug` and `competition_category`. A future mixed-content layer needs additive `content_type` and `opportunity_id` fields while preserving existing competition dimensions. No GA4 or Meta reporting export was available, so event receipt, attribution quality, and production volumes were not verified.

## Performance observations

| Asset/page | Uncompressed size |
|---|---:|
| Homepage HTML | 71,188 bytes |
| `/competitions/` HTML | 463,307 bytes |
| `/free-stuff-south-africa/` HTML | 53,237 bytes |
| Shared CSS | 102,431 bytes |
| `app.js` | 24,882 bytes |
| Auth UI module | 27,883 bytes |
| Club UI module | 30,588 bytes |
| Firebase client module | 24,056 bytes |

The all-competitions page embeds all 85 cards plus a full structured-data list, producing the largest current document. Static rendering is fast and cacheable, but scaling mixed inventory in the same document will increase transfer, parse, DOM, and schema costs. Client Firebase modules are loaded only where referenced, but the base CSS and generator remain monolithic. Production responses were successful and Cloudflare returned a ten-minute cache policy for HTML during the audit. No reproducible Lighthouse history was available.

## Accessibility observations

Positive patterns include skip links, semantic headings, labelled navigation, explicit button types, `aria-live` status regions, visible form labels, link safety attributes, and one H1 on every sitemap page checked. Cards expose detail links and images generally receive contextual alt text or a fallback visual.

Risks requiring browser/assistive testing include the inactive search/filter controls, very long collection pages, multiple clickable affordances within cards, modal focus handling, authenticated error recovery, status badge verbosity, mobile navigation, keyboard access to all Club tools, and color contrast. No automated axe or equivalent suite is configured.

## Security and privacy observations

- Public content is static and exposes no server credentials.
- Real Firebase configuration is ignored and injected during deployment; the committed example documents expected keys.
- Admin SDK operations use environment/service-account configuration outside browser code.
- Submission and referral writes rely heavily on Firestore rules that are not version-controlled in this repository.
- Optional marketing consent is separated from required privacy/referral consent in the UI.
- Private identifiers are not intentionally rendered in public pages or the sitemap.
- No Content Security Policy, repository-managed Referrer-Policy, or complete security-header configuration was observed in production response checks.
- Account deletion, access/export requests, consent-versioning, and retention enforcement remain unresolved before Club stores new opportunity states or birthday reminders.

## Test coverage and baseline results

`npm test` runs only the held-candidate validator. `npm run lint` runs held validation, published competition link validation, and free-resource link validation. The generator contains substantial static checks, but the normal test script does not execute a build, unit tests, DOM tests, or browser tests.

Audit results:

- Held-candidate validation: passed; one private held row; zero errors and warnings.
- Maintenance/lifecycle validation: passed; zero lifecycle errors.
- Competition link validation initially returned ten expired-archive HTTP 404 warnings. The final acceptance rerun returned 359 checks, 350 OK, nine warnings, and zero errors after the Red Bull archive source recovered externally. All remaining warnings are expired-archive sources; no active competition URL failed.
- Free-resource link validation: 18 checks, 18 accepted, five manual-OK warnings, zero errors.
- Static sitemap inspection: zero missing files, duplicate titles, duplicate descriptions, canonical mismatches, missing/multiple H1s, sitemap noindex pages, or sitemap orphans.

## Deployment workflow and rollback

Pushes to `main` run the Pages deployment workflow, regenerate the site, optionally inject Firebase browser configuration, upload the repository as the Pages artifact, and optionally notify Bing and IndexNow. The daily maintenance workflow archives expired competitions, regenerates, validates, commits only when files changed, deploys, and pushes the maintenance commit.

Because generated output is ignored locally but produced in CI, a code or data rollback is a Git revert followed by regeneration/deployment. Public route removals require extra care because static hosting has no repository-level redirect map. The first expansion release should therefore avoid URL removal and database migration.

## Ranked technical debt and risk

1. **High - Free classification can fail open.** `getEntryCostLabel()` returns `Free entry` after unrecognised or missing values. Active rows are classified today, but a future type could be mislabeled.
2. **High - SEO route duplication.** Short aliases for existing evergreen URLs would compete with already indexable pages.
3. **High - Unversioned Firestore enforcement.** Rules are documented but not deployable or auditable from the repository.
4. **High - Monolithic generator coupling.** New entity types added directly to the generator would enlarge a fragile change surface.
5. **Medium - Inactive collection controls.** Search/filter UI is visible but not wired on collection routes.
6. **Medium - Performance scaling.** The 463 KB all-competitions page will grow if mixed inventory is appended without bounded sections or pagination.
7. **Medium - Limited automated coverage.** There are no true unit, integration, schema, accessibility, or browser tests.
8. **Medium - Club privacy completeness.** Account deletion/export and retention are missing.
9. **Low/Medium - External configuration drift.** Cloudflare robots/headers and production Firebase state are outside source control.

## Systems to preserve in Phase 1

- All existing competition and evergreen URLs and canonicals.
- `data/competitions.json` and competition lifecycle helpers.
- `/competitions/`, `/competition/*`, `/free-competitions/`, and `/out/*` behavior.
- Free-entry definitions and purchase/paid-entry separation.
- Active/expired/noindex publication gates and sitemap exclusions.
- Official-source and terms links, trust copy, entry cost labels, and report flow.
- Daily maintenance, GitHub Pages deployment, and current rollback path.
- Public unauthenticated browsing.
- Existing competition Club collections and state semantics.
- Private ZA Comp Engine review/handoff boundaries.
- Selective DataCost cross-promotion rather than sitewide expansion.

## Evidence unavailable from this audit

- Google Search Console query, page, indexation, and cannibalisation exports.
- GA4 and Meta event delivery or conversion reports.
- Historical Lighthouse/Core Web Vitals results and real-user monitoring.
- Production Firestore rules, indexes, data volumes, and deletion operations.
- Cloudflare dashboard settings beyond observable responses.
- Current email delivery, unsubscribe completion, and consent-retention evidence.
- Editorial staffing capacity and acceptable verification workload by vertical.
