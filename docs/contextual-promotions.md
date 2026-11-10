# DataCost contextual promotions

The reviewed rollout was authorised for publication on 10 November 2026. Both deployment and daily maintenance workflows now default `FREEHUB_ENABLE_PROMOTIONS` to `true`; setting the repository variable to the string `false` disables it on the next build. Local builds still require the exact string `true`; unset or any other value preserves the existing output.

## Scope and placement

| Page | Format | Position replacing the existing lower banner | DataCost destination |
| --- | --- | --- | --- |
| `/` | Contextual card | After Browse by prize, before practical guides | `/guides/cheapest-data-south-africa/` |
| `/win-data-competitions-south-africa/` | Category support | After the competition listings, before explanatory guidance | `/tools/data-bundle-selector/` |
| `/win-airtime-competitions-south-africa/` | Category support | After the competition listings, before explanatory guidance | `/guides/convert-airtime-to-data-south-africa/` |
| `/student-freebies-discounts-south-africa/` | Compact | After the benefit definitions, before guide navigation | `/guides/airtime-data-saving-tips-south-africa/` |
| `/free-stuff-south-africa/` | Compact | After the early guide navigation, before resources | `/ussd-codes-south-africa/` |

There is one primary campaign module per page. The older banner is suppressed on these routes whenever the new system is enabled, including when no campaign qualifies. Existing text links, editorial content, FreeHub game promotions, account behaviour and advertising integrations are preserved. All other pages keep their current behaviour. No placements are inserted into competition cards, structured data, app feeds, outbound pages or account pages.

The category format uses “Supported by DataCost” with an explicit “House promotion · FreeHub’s sister site” disclosure. It is an internal promotion, not an activated paid sponsorship. All links name DataCost as the destination and use an ordinary same-tab anchor. No carousel, auto-refresh, overlay, remote artwork, new tracking provider or advertiser pixel is installed.

## Configuration and lifecycle

`data/promotions.json` is the single campaign/placement/destination source. `scripts/lib/promotion-renderer.js` validates the schema and references, selects one eligible campaign and renders all three formats. Styling lives in `assets/promotions.css`. Only pages with a selected module load the runtime and analytics files.

Each placement has an exact canonical path, format and page type. Each campaign references a sponsor, reviewed destination, placement IDs and a versioned creative. Selection is deterministic: highest priority, then campaign ID. There is no rotation or experiment in this first release.

An eligible campaign must be active, a house promotion, linked to an owned-site sponsor and within its schedule and destination review window. The independent approved house host is `datacost.co.za`; configuration cannot silently add another house host. HTTPS destinations cannot contain credentials, custom ports, query strings or fragments. UTMs are appended by the renderer. Unknown fields, invalid dates, duplicate IDs/paths and dangling references fail the build before page generation.

Review dates refer to the destination's suitability and reachability, not a claim that every operator price was freshly verified. All five destinations were opened on 10 November 2026. Recheck them before 11 December 2026; the current window ends at midnight SAST after 10 December. The saving-tips page's own scheduled review was 30 October; the compact copy promises general tips only and does not restate prices, eligibility or a fresh provider verification. Its editorial freshness should be reviewed on DataCost separately.

Review windows include the whole `reviewDueAt` date in South African time. Optional campaign `startsAt` is inclusive and `endsAt` is exclusive, with explicit time zones. The browser independently checks the generated window before layout, when returning to a page, and before activation. A cached expired module becomes hidden and cannot navigate. Missing JavaScript leaves the optional promotion hidden; the rest of the page remains usable. No blank reserved slot is left behind.

Set a campaign to `paused` and rebuild to remove it. To reverse the public rollout, set the repository variable `FREEHUB_ENABLE_PROMOTIONS` to `false` and rebuild through the normal release process: the original banners return. Omitting the variable disables local builds only; the publishing workflows default it to `true`. Further public changes still require the normal release approval.

The schema distinguishes `house`, `paid` and `affiliate` campaigns and owned/external sponsors. Draft records can describe future commercial inventory. Active paid, affiliate or external campaigns are rejected, and the selector independently refuses them. Billing, advertiser management, external targeting, commercial rotation and third-party pixels are not implemented. Before a future paid rollout, check FreeHub's actual Mediavine agreement/account terms and design the commercial and disclosure policy separately.

## Measurement

Events go through the existing `gtag` function to the primary FreeHub property `G-23P37R20FY` only. This code does not initialise or modify GTM, Journey's GA stream, Google advertising, Meta, or the CMP.

| Event | Meaning |
| --- | --- |
| `promotion_view` | At least 50% of the module is geometrically in the viewport for a continuous second while the document is visible and analytics permission is available. Once per campaign/placement/creative per document, including a back-forward-cache return. |
| `promotion_click` | A real link activation by mouse, keyboard or middle-click, with analytics permission. `was_viewable` indicates a preceding qualified impression. `first_click` distinguishes the first recorded activation in that document from repeat clicks. Navigation is never delayed for analytics. |

Both events include `campaign_id`, `sponsor_id`, `creative_id`, `placement_id`, `promotion_kind`, `page_type`, `format`, `destination_id`, `destination_host`, `destination_path`, `source_path` and `config_version`. No user ID, email, search query, full referrer, cookie or browser storage is added by this module. The inherited analytics configuration may apply its own normal behaviour after permission.

Unknown or denied consent produces no new promotion events and no stored pre-consent queue. Reading the existing public consentmanager API requires an actual choice plus Google Analytics vendor `s26` consent. If no usable API state exists, the adapter can read its documented `cmpEvent` / `cmpConsentVendors` signal or a global `analytics_storage` consent command in the existing data layer. Regional defaults are not interpreted without knowing the visitor's region. Known conflicting signals fail closed. Legitimate interest alone is not accepted. The code never sets consent or patches a provider's functions.

The interval checks consent and visibility every 250 ms while the document is visible; impression timing restarts after leaving the viewport, changing document visibility or observing revoked consent. This is viewport-based measurement, not an independently audited viewability service: another opaque element covering the module is not fully measurable through IntersectionObserver. Browsers without IntersectionObserver do not emit impressions. Blockers and denied/unknown consent reduce recorded totals.

UTM contract: `utm_source=freehub`, `utm_medium=house_banner`, `utm_campaign=<campaign-id>`, `utm_content=<placement-id>__<creative-id>`. These identify the campaign and position without personal data. Destination links carry UTMs even when event measurement is unavailable. DataCost can group its acquired sessions by this contract.

For an approximate comparable click rate, divide first clicks with `was_viewable=1` by qualified views within the same campaign/placement/creative and date range. Keep total activations and clicks before a qualified view separate. This is document-level attribution, not unique-person reach. DataCost engagement and any associated AdSense revenue remain measured outcomes; no return is promised. Register the useful event parameters as event-scoped custom dimensions in the intended GA4 property before reporting. Property configuration and live event receipt require account verification and have not been changed by this implementation.

Consent references: [Google's consent setup](https://developers.google.com/tag-platform/security/guides/consent), [consentmanager public API](https://www.consentmanager.net/en/help/developer-reference/javascript-api/), [consentmanager's Analytics vendor and GTM signals](https://www.consentmanager.net/en/help/how-to-guides/working-with-gtm-google-consent-mode-v2/).

## Development preview and checks

Use Node 24.19.0 for exact regression checks. In a dedicated PowerShell session:

```powershell
$env:FREEHUB_ENABLE_PROMOTIONS = 'true'
$env:FREEHUB_ENABLE_OFFERS = 'true'
npm run build
npm run test:promotions
$env:FREEHUB_TEST_PORT = '4319'
npm run test:promotions:browser
$env:PORT = '4319'
node tests/browser/server.js
```

The browser fixture suite expects the generated review window to cover 10 November 2026; use `FREEHUB_BUILD_DATE=2026-11-10`, `FREEHUB_AS_OF_DATE=2026-11-10`, `TZ=UTC` and the repository's fixed-date register for deterministic CI. Remove date overrides for current editorial previews. Never extend review dates just to make tests pass. Tests exercise all formats at 1440, 390 and 320 px, selection and activation gates, consent, continuous viewability, duplicate initialisation, attribution, keyboard/middle-click activation, cached expiry and existing filters. Provider network requests are blocked during automated tests; existing script installation is checked, not live ad delivery.

With the preview server running, `npm run preview:promotions -- --output-dir=<absolute-directory>` saves desktop/mobile page screenshots, viewport images around the actual modules and a review gallery. It does not publish. The gallery uses locally generated page content, not design mockups. The local server intentionally cannot validate real Firebase sign-in.

Also run the existing regression, maintenance, SEO/performance and browser checks. Compare generated HTML, sitemap and app feeds against a same-date, same-feature-state baseline. Flag-off output must remain identical; flag-on HTML changes are limited to the five routes above. Do not refresh existing baselines simply to make tests pass.

## Implementation validation — 10 November 2026

- Current-date `npm test`: passed (199 lifecycle tests, 30 Airtime Dash tests and 4 Firebase admin tests; 2 existing environment-dependent tests skipped). SEO/performance checks passed, including 7,472 SEO assertions.
- Existing browser smoke suite plus promotion tests: 66 passed; the disabled-build case was skipped in that run and passed separately against a disabled build. All three formats checked at 1440, 390 and 320 px. Desktop/mobile screenshots of all five actual pages were inspected.
- Offers/opportunities combinations: SEO checks passed with opportunities on / offers off and with both on. The final current-date preview uses offers on / opportunities off, matching the initial deployment defaults.
- Output comparison: 681 files in the current-date baseline and candidate. Exactly the five agreed HTML pages changed; no added/deleted routes, sitemap changes or app-feed changes. Disabled output matched both the current-date baseline and the September regression baseline exactly (789 files for the latter).
- All five DataCost destinations returned HTTP 200 at their configured canonical URLs. These checks establish reachable, relevant destinations, not guaranteed savings or future availability.
- `git diff --check`: passed. No listing registries, Google advertising setup, existing validation baselines or deployment configuration were changed. The main working directory's unrelated local changes were preserved in place; implementation and builds used an isolated development checkout.

Existing failures remain separate from the implementation:

1. The maintenance check identifies two expired records missing from the archive: `1up-mangia-vouchers-2026` and `cape-town-move-with-melody-2026`. Their active entry surfaces are already excluded by the existing lifecycle logic. This change does not alter the registries or archive them.
2. Strict live-link validation fails on existing content: six competition manual-review exceptions older than 30 days, one unavailable Department of Basic Education fetch, expired-archive warning changes (including actual 404 responses), and stale Opportunity evidence. Access failures are not proof that a source is broken; confirmed 404s remain distinct. No exceptions or warning baselines were relaxed. DataCost's five new destinations passed separately.
3. The September fixture's full test command reports 198/199 lifecycle passes. Its existing browser-feed size assertion fails: 1,042,657 bytes is slightly above half of the 2,062,443-byte registry. Feed equality passes, and generated HTML matches the pre-change September baseline exactly. The feed renderer, registry and size test are unchanged. The same test passes with current-date content.

Live GA4 receipt/custom dimensions, real Firebase sign-in and real provider ad delivery were not verified through account access. Browser tests capture the event calls and preserve provider installation while blocking remote scripts. Verify live receipt after an authorised release; do not interpret these local checks as measured referral performance.

## UX refinement — approved 10 November 2026

The recommended homepage position is **after Browse by prize**. The earlier position gives DataCost earlier exposure but interrupts the visitor before they choose a competition category. The revised position completes that choice first, then offers mobile savings as a clearly branded optional next step. Practical guides follow the card, separating it from the Airtime Dash and grocery promotions. This is a visual hierarchy recommendation; conversion impact needs real traffic after an authorised release.

At 390 px, the contextual card is 211 px tall, down from 344 px. The DataCost wordmark is visible on mobile; the copy is one short sentence pair and the single filled CTA reads “Compare data bundles.” Three format treatments share colours, typography, spacing, disclosure and accessible links: a mint contextual card with a filled button, a white compact guide card with a text link, and a flat category-support strip with a left rule and quieter link. Compact mobile cards omit the redundant supporting sentence; no eligibility or cost caveats are removed.

The mobile prize directory uses two columns of eight labelled links with 52 px minimum heights. Descriptive subtitles remain visible on desktop. WhatsApp is a quiet link after the reviewed shortlist; its destination and tracking attribute are preserved. Airtime Dash and Grocery Savings sit together after practical guides, with secondary actions. Game conditions remain visible. The trust section separates this group from the existing membership invitation and account functionality.

The two telecom hubs now start with the same concise discovery pattern as the existing competition catalogue. Their original long introductions remain accessible in “About these competitions”; all competition cards, cost labels, entry paths and guidance remain. The repeated hero/filter WhatsApp prompts are removed on these two pages; navigation and the existing later channel invitation remain. DataCost comes after every listing, and Airtime Dash follows the explanatory guide on the airtime hub. At 390 px, the first data listing starts around 801 px instead of 1,969 px; the first airtime listing starts around 805 px instead of 1,991 px. Measurements depend on current content, viewport and fonts.

Campaign IDs, sponsors, destination mapping, review dates, route allowlists, lifecycle gates, event names, payload fields and analytics/runtime code are unchanged. Creative IDs/config version advance to v2, and moved placement IDs are now `home-after-prizes`, `data-after-listings` and `airtime-after-listings`, so reports describe their actual location. No live experiment or audience allocation was added. The hierarchy stylesheet also loads on these routes when campaigns are paused or stale; analytics/runtime assets still require an eligible module.

The updated current-date suite passes, and 69 enabled browser checks pass. The disabled-build case is checked separately. Tests now protect discovery-before-promotion order, compact mobile heights, visible branding, tap targets, the retained introduction disclosure, one module per page and the existing consent/attribution behaviour. Previous content-maintenance and source-link findings above remain separate from this visual-only pass; no editorial review dates or warning baselines were advanced.

For the position comparison, run `node scripts/preview-promotion-layouts.cjs --output-dir=<absolute-directory>` alongside the local preview server. Both options use the actual generated page and identical refined component. Option A moves the existing node in the preview browser to its earlier position; option B reflects the implemented template. External scripts are blocked. The helper does not modify generated files, targeting or production settings.

## Approved release and two-week measurement

The release carries forward daily-maintenance commits through `f425f56` before applying the reviewed implementation and refinement. The two publishing workflows enable the five-route rollout; paid and external campaigns remain disabled. The maintenance changes belong to the existing live history, not to the promotion implementation. Earlier validation results above describe the development checkout at that time.

Release checks on Node 24.19.0: current-date build and `npm test` pass; maintenance validation now passes with no expired records missing from the archive. The focused browser run passes 91 checks with the disabled-build case skipped (previously tested separately). It covers promotions, the existing smoke suite, telecom inventory, WhatsApp, student pages and JavaScript-disabled flows. Existing telecom/WhatsApp assertions now recognise both the legacy layout and the approved compact layout. No production design or tracking code changed during release preparation.

The first broader browser run used current content with several older test clocks and a non-default preview port: 149 passed, 18 failed, one skipped. The focused rerun resolves the changed-layout assertions and student tests that hard-code port 4318. Remaining broad-suite findings include obsolete expired-campaign/under-review expectations, an old homepage link-count expectation, an archive advertising expectation that conflicts with the current archive policy, and a navigation timeout. These are not represented as a fully green broad suite. Previously recorded live-link and September fixture findings remain separate; no content dates or warning baselines were relaxed.

Treat 10 November 2026 as a partial launch day. Measure 14 complete days from **11–24 November**, compare available historical referral and organic metrics with **27 October–9 November**, and make the final readout on **27 November** to allow reporting delay. Preserve each service's reporting time zone and latest complete date in exports. Checkpoints on 13 and 20 November can identify missing tracking or major changes before the final review.

Use FreeHub GA4 `promotion_click` and `promotion_view` for placement performance; split mobile/desktop and campaign, placement, creative and destination. Report absolute counts and the qualified first-click rate defined above. In DataCost GA4, use session source/medium `freehub / house_banner`, with session campaign and manual ad content, to compare acquired sessions, engaged sessions, engagement rate and landing pages. Keep the new `dc-*` campaigns separate from older house-banner campaigns when attributing results, while comparing total FreeHub referrals on consistent definitions. These new promotion events have no pre-launch baseline; missing data is not zero, and this observational rollout cannot establish causal uplift by itself.

Search Console provides a secondary view of Google Search clicks, impressions and CTR for the five FreeHub source routes and the five DataCost destination pages. It does **not** measure clicks on the FreeHub promotional cards. Use the same search type, page and country filters across periods; record incomplete days and do not substitute organic search clicks for referral clicks. See [Google's Search performance definition](https://support.google.com/webmasters/answer/7576553) and [GA4 traffic-source dimensions](https://support.google.com/analytics/answer/11242870).

At release preparation, reporting-account baseline values and GA4 custom-dimension registration remain unverified. The Ahrefs connector returned insufficient plan access, and browser account access stopped before opening the reporting service. Check connected reporting access or use owner-exported reports before asserting performance. The shipped tracking code and UTM destinations can be verified independently of report access. Keep any private exports outside the published repository.
