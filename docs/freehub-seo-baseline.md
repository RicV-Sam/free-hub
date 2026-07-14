# Freehub SEO Baseline

**Captured:** 14 July 2026

**Canonical origin:** `https://freehub.co.za`
**Evidence:** Generated repository output, production page responses, live `robots.txt`, `sitemap.xml`, data files, and generator code. No Search Console or analytics exports were available.

## Executive baseline

Freehub's current crawlable foundation is healthy. The generated sitemap has 145 URLs and every sitemap document inspected exists, is indexable, has exactly one H1, has a unique title and description, and self-canonicalises. No sitemap orphan, duplicate canonical target, or private/noindex route was found.

The expansion risk is therefore not basic crawlability. It is intent duplication, unverified use of “free,” stale evergreen listings, and weakening competition relevance through premature homepage or URL changes.

## Sitemap composition

| Family | Count | Indexing rule |
|---|---:|---|
| Homepage | 1 | Always indexable |
| Category pages | 5 | Included only when route is indexable |
| Tag pages | 9 | Duplicate-intent aliases excluded |
| Other root/static pages | 39 | Included when public/indexable |
| Brand pages | 3 | Require sufficient active inventory |
| Club landing | 1 | Public/indexable |
| Refer & Win pages | 2 | Public/indexable |
| Competition details | 85 | Active public only |
| **Total** | **145** | |

Generated-but-excluded families include `/out/*`, active noindex competition details, expired competition details, low-value legacy details, `/club/dashboard/`, `/club/account/`, `/admin/referrals/`, duplicate tag aliases, and 404 output.

## Route-family SEO inventory

| Route family | Rendering/data | Title and H1 pattern | Canonical | Robots/sitemap | Structured data | Primary intent |
|---|---|---|---|---|---|---|
| `/` | Active competition homepage | Competition-led fixed title/H1 | Self | Index; sitemap | `ItemList` | Brand plus competitions worth entering today |
| `/competitions/` | Active competition collection | “Competitions South Africa” / “Live Competitions in South Africa” | Self | Index; sitemap | `CollectionPage`, breadcrumb, FAQ, item list | All live competitions |
| `/free-competitions/` | Strict free-entry hub | “Free Competitions in South Africa” | Self | Index; sitemap | Collection schemas | No-purchase competitions |
| Other established hubs | Filtered active collections | Unique intent copy per hub | Self | Index when useful; sitemap | Collection schemas | Ending soon, new, purchase, paid, car |
| `/category/{slug}/` | Prize-category filter | Category-specific | Self | Noindex when thin; sitemap otherwise | Collection schemas | Prize category |
| `/tag/{slug}/` | Tag filter | Tag-specific | Self or established hub canonical | Duplicate/low inventory noindex; canonical aliases excluded | Collection schemas | Entry mechanic or topical tag |
| Competition vertical roots | Rule-derived filter | Vertical-specific | Self | Require three active records | Collection schemas | WhatsApp, till slip, online, telecom, grocery, supermarket |
| `/brands/`, `/brand/{slug}/` | Inventory-backed brand pages | Brand-specific | Self | Threshold-gated; sitemap | Collection schemas | Brand competitions |
| `/competition/{slug}/` active | Competition detail | Explicit SEO fields or generated competition title | Self | Index; sitemap | Web page, breadcrumb, FAQ | Individual current competition |
| `/competition/{slug}/` expired | Closed detail/reference | Closed/archive title | Self | Excluded; typically noindex where low-value, retained where useful | Visible historical schema only where template supports it | Historical verification and alternatives |
| `/out/{slug}/` | Static measured redirect | Redirect title | Self | `noindex,nofollow`; excluded | None needed | Official-source handoff |
| Trust/policy pages | Static definitions | Unique page-specific copy | Self | Public pages indexed/sitemapped | Web page, article, breadcrumb, FAQ/service when applicable | Trust, safety, legal, contact |
| `/free-stuff-south-africa/` | Hybrid editorial/resource page | “Free Stuff South Africa” | Self | Index; sitemap | Web page, breadcrumb, article, item list, FAQ | Broad non-competition free resources with clear distinctions |
| `/free-samples-south-africa/` | Editorial plus sample/testing sources | “Where to Get Free Samples in South Africa” | Self | Index; sitemap | Page/article/resource schemas | Samples and product-testing sources |
| `/free-online-courses-south-africa/` | Editorial plus course sources | “Free Online Courses in South Africa” | Self | Index; sitemap | Page/article/resource schemas | Free learning and certificate caveats |
| Other free-resource pages | Editorial plus official sources | Unique child intent | Self | Index; sitemap | Page/article/resource schemas | Children's books and credit reports |
| `/guides/`, `/blog/`, monthly guide | Editorial templates | Unique | Self | Index; sitemap | Collection/article | Competition guidance and roundups |
| `/club/` | Public Club landing | “Freehub Club” / save and track competitions | Self | Index; sitemap | Web page/FAQ | Optional retention/account benefits |
| Private Club/admin | Static shell plus Firestore | Page-specific | Self | Noindex; excluded | No public collection schema | Private user/admin utility |

## Key page metadata baseline

| Route | Title | H1 | Intent |
|---|---|---|---|
| `/` | South African Competitions Worth Entering Today \| Freehub | Find South African competitions worth entering today | Competition-led umbrella today |
| `/competitions/` | Competitions South Africa - Live Giveaways & Prize Draws \| Freehub | Live Competitions in South Africa | All active competitions |
| `/free-competitions/` | Free Competitions in South Africa \| No Purchase Required Giveaways | Free Competitions in South Africa | Strict free-entry competition intent |
| `/free-stuff-south-africa/` | Free Stuff South Africa \| Legit Freebies, Samples, Competitions | Free Stuff South Africa | Broad free resources, not a strict offer archive |
| `/free-samples-south-africa/` | Where to Get Free Samples in South Africa \| Official Offers Guide | Where to Get Free Samples in South Africa | Samples/testing panels and safety checks |
| `/free-online-courses-south-africa/` | Free Online Courses South Africa \| Digital Skills & Certificates | Free Online Courses in South Africa | Course/provider intent |
| `/club/` | Freehub Club \| Save and Track South African Competitions | Save and track South African competitions | Optional competition retention |

## Automated static findings

Across all 145 sitemap pages:

- Missing generated files: 0.
- Duplicate titles: 0.
- Duplicate meta descriptions: 0.
- Canonical mismatches: 0.
- Pages without exactly one H1: 0.
- Noindex pages in sitemap: 0.
- Sitemap pages with zero internal incoming links: 0.

Structured-data usage in sitemap pages:

| Type | Pages containing type |
|---|---:|
| `BreadcrumbList` | 138 |
| `FAQPage` | 113 |
| `WebPage` | 109 |
| `ItemList` | 37 |
| `CollectionPage` | 33 |
| `Article` | 14 |
| `Service` | 1 |

FAQ schema is emitted only with matching visible FAQ content in the audited templates. It should not be treated as a guaranteed rich-result feature.

## Canonical and alias rules

- `freehub.co.za` is the only repository canonical origin.
- Existing competition, hub, guide, and evergreen routes self-canonicalise.
- `/tag/free-entry/`, `/tag/purchase-required/`, and `/tag/paid-entry/` canonicalise to the established hub equivalents and are noindex/excluded where duplicated.
- The old `freehub.datacost.co.za` domain requires an external host-level 301 or noindex control; it cannot be solved safely in the shared static artifact.
- No short aliases exist for the current evergreen pages.

Default expansion rule: retain `/free-stuff-south-africa/`, `/free-samples-south-africa/`, `/free-online-courses-south-africa/`, `/free-childrens-books-south-africa/`, and `/free-credit-report-south-africa/` as their own canonicals. Do not add `/free-stuff/`, `/free-samples/`, or `/free-courses/` without a measured migration, redirects, and Search Console evidence.

## Indexing and expiry behavior

### Competitions

- Only active records that pass publication and public-visibility checks enter active hubs and sitemap.
- Noindex active records can retain detail and outbound pages but do not enter public collections or sitemap.
- Expired records leave active collections, `/out/`, and sitemap.
- Useful expired details remain accessible with a closed state; low-value legacy references are noindex.
- Expired details are not automatically redirected to the homepage.

### Evergreen resources and future opportunities

Current free-resource pages are durable editorial pages and do not expire with individual competitions. Their `lastmod` derives from explicit page/resource modification and review dates. Future sample offers must be removed from active modules as soon as stock/source expiry is known. Recurring birthday offers should enter `verification_due`, not competition-style expiry.

## `robots.txt` baseline

The repository generates:

```text
User-agent: *
Allow: /

Sitemap: https://freehub.co.za/sitemap.xml
```

Production prepends Cloudflare Managed Content Signals. During the audit, general search was allowed, AI training was disallowed, use was limited to reference, and several AI crawlers were explicitly blocked. The final repository block and sitemap remained present. This production difference must be monitored in Cloudflare and documented alongside deploy configuration.

## Internal linking and depth

All sitemap URLs had at least one internal incoming link in the static graph. Competition pages link upward through breadcrumbs, category/brand/current alternatives, safety guides, and related competitions. Hubs link among categories, popular intents, verticals, trust content, Club, WhatsApp, and current details.

The footer currently links to many competition trust pages plus four evergreen free-resource pages. Expansion should replace an ever-growing footer keyword list with a concise Free Stuff pillar link and contextual child links. New opportunity details should link to their type parent, category, brand/provider, applicable requirements guide, and current related items.

## Cannibalisation assessment

### Existing separations to preserve

- `/` owns the current brand/competition discovery promise.
- `/competitions/` owns complete active inventory.
- `/free-competitions/` owns no-purchase competition intent.
- `/free-stuff-south-africa/` owns broad free item/service/resource intent.
- `/free-samples-south-africa/` owns sample and product-testing source intent.
- `/free-online-courses-south-africa/` owns learning intent.
- Trust guides own safety/verification questions rather than listing intent.

### Current overlap risks

- Homepage/default copy sometimes uses “giveaways” broadly while remaining competition-only.
- The Free Stuff parent includes competitions in title/body links; it must continue to explain that free competitions are a separate pillar.
- The sample page mixes direct samples, product-testing panels, and safety guidance. Pilot work must label these subtypes rather than create a competing product-testing page immediately.
- Voucher competition pages must not be repurposed as free-stuff or cashback pages.
- Broad homepage repositioning before non-competition inventory exists would create an intent/content mismatch.

No measured search-query cannibalisation conclusion can be made without Search Console page/query exports.

## Parameterised URL risks

- Referral pages accept `?ref=`. Canonicals remain parameter-free, and these URLs should not enter sitemap.
- Campaign links use UTM parameters externally; they do not generate internal indexable variants.
- Client search is not query-string backed today.
- Email-link authentication parameters are cleaned after sign-in.
- No faceted internal filter URLs are generated.

Future search/filter implementation should keep non-canonical parameter combinations out of sitemap and either canonicalise to the base page or use noindex when crawlable output is introduced.

## Thin, duplicate, and orphan risks

- Category and tag pages already use inventory thresholds/noindex behavior.
- Brand pages require a minimum active cluster.
- Competition vertical pages require at least three active matches.
- Existing free-resource child pages contain editorial copy, checklists, FAQs, links, and official resources rather than empty archives.
- The sample pilot must not publish empty subcategories or duplicate introductory copy.
- A future opportunity detail should require enough source, eligibility, requirement, cost, verification, and update information to be useful.

The static graph found no sitemap orphans, but this does not measure click depth from the homepage. A browser crawl should record depth by pillar after navigation changes.

## Structured-data rules for expansion

Retain current accurate schemas. For new pages:

- Use `CollectionPage`, `ItemList`, `BreadcrumbList`, and `WebPage` for hubs where visible content supports them.
- Use `Article` for genuine editorial guides.
- Use `Course` only when a page represents a specific course and all relevant facts are sourced.
- Use `Offer` only for a real, current offer whose price/availability semantics are accurate.
- Do not add `Product`, `AggregateOffer`, `Review`, rating, or `Event` schema as keyword decoration.
- Exclude draft, held, rejected, verification-due, expired, private, and canonical-alias records from opportunity item lists and sitemap unless a documented type-specific rule says otherwise.

## Content freshness baseline

All 85 active public competitions have a source URL, terms URL, last-checked date, entry steps, and evidence notes. Current gaps include eight without full eligibility text, 17 without a quick answer, and 50 without a dedicated image. These are quality gaps rather than indexing failures.

The 18 free resources passed link validation. Five require manual-OK treatment because automated requests were blocked or failed. Sample resources were last reviewed between 27 May and 27 June 2026, which is too old for a proposed 3-7 day live-sample cadence. The pilot must distinguish durable panels/directories from currently claimable samples and apply different review windows.

## Performance and crawl observations

The all-competitions HTML is 463,307 uncompressed bytes and includes 85 visible cards plus the matching structured-data list. This is crawlable but should not become the template for unbounded mixed opportunity inventory. Bounded featured modules, type-specific hubs, and eventually pagination are safer than appending all new entities to one page.

Production returned 200 for the homepage, competitions page, current Free Stuff parent, Club, sitemap, and robots file during the audit. HTML responses exposed a ten-minute Cloudflare cache policy. No lab or field Core Web Vitals evidence was available.

## Baseline acceptance checks for every release

1. Exactly one H1 per indexable page.
2. Unique non-empty title and meta description.
3. Self-canonical unless the page is an intentional alias.
4. Correct robots directive for lifecycle and privacy state.
5. Canonical, indexable public page present in sitemap; private/alias/inactive page absent.
6. Structured data parses and matches visible content.
7. Breadcrumb URLs match canonical hierarchy.
8. No draft, held, rejected, noindex, private, or expired active card leaks.
9. No internal links to missing or non-canonical aliases.
10. Meaningful `lastmod`, never a fabricated update date.

## Missing evidence

- Search Console query/page exports, coverage reports, and removal history.
- GA4 landing-page, click, conversion, and retention data.
- Production backlink profile and external canonical signals.
- Historical or field Core Web Vitals.
- Cloudflare redirect, cache, bot, and security configuration beyond observable output.
- Current production Firestore rules and private-route access tests.

These gaps do not block the documentation or a route-preserving pilot. They do block claims about rankings, conversion uplift, or which alternate URL would perform better.
