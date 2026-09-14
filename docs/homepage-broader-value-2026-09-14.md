# Freehub homepage: broader customer value

Prepared 14 September 2026 against published commit c8af007 in the isolated codex/homepage-broader-value checkout. The original free-hub checkout and its unrelated unfinished changes were preserved.

## Purpose and scope

The homepage now introduces Free Stuff, Coupons & Deals and Competitions. It explains the difference between a usable resource, a conditional discount and a prize draw. Existing competition discovery remains available through three featured cards and compact links to free entry, closing soon, cars, cash, recent additions and the monthly guide.

A small non-competition selection precedes those cards: Book Dash reading resources and a currently public coupon/deal. Offers come from the existing publicOffers lifecycle filter. Hidden, expired, unverified and overdue offers cannot be selected through this path; when offers are disabled or unavailable, the section adapts. Book Dash is shown only while present in the published free-resource collection. No catalogue records, eligibility, pricing or source-review timestamps were changed.

Permanent links cover courses, reading, samples and the existing student guide. About, footer and homepage metadata describe the broader purpose. Club remains explicitly a competition-saving service. Existing advertising eligibility, archive exclusions, privacy disclosures, consent and authentication code remain intact.

Homepage competition ItemList schema now describes exactly the three visible featured cards rather than all catalogue records. The brand's existing default social image replaces the competition-led social image selection. No new routes or indexing rules are introduced.

The existing analytics helper receives homepage_discovery_click with destination_path and placement (hero, start_here or content). No personal information or URL queries are sent by this event. Existing provider/outbound events remain unchanged.

## Validation

- Build and full npm test passed with production offers/opportunities enabled: 107 lifecycle tests, SEO and performance checks.
- Build and full npm test also passed with both optional surfaces disabled.
- Seven Chromium checks passed: homepage canonical routes, mobile discovery and click event, About content/events, guest ads, signed-in exclusion, archive protection, membership transition and privacy disclosure (some checks share a test).
- npm run lint passed: zero hard failures; existing source-access blocks remain documented by the current evidence policy; no new/changed warnings.
- Rendered desktop and mobile screenshots reviewed; 320, 390, 768 and 1440 CSS pixel widths have no horizontal page overflow after layout settles. Tablet hero stacks to support enlarged text; 200 percent root text at 768px also has no page overflow.
- Core content and three pillar links render without JavaScript. Keyboard skip navigation and reduced-motion mode exercised.
- Same-day sitemap is byte-identical before/after. All 62 distinct root-relative homepage destinations/assets checked exist locally. Homepage canonical stays https://freehub.co.za/.
- Initial comparison: homepage HTML decreased from 54,182 to 30,584 bytes before the final small copy/mobile adjustments. This is an HTML-size observation, not a Core Web Vitals measurement.
- Existing stylesheet size warning remains relative to the older performance baseline; no full WCAG or field performance claim is made.
- Local preview intentionally lacks firebase-config.json; external favicon services returned two 404s with existing visual fallbacks. These are not new homepage runtime failures.

## AdSense context

The prior task confirms that a review was requested on 13 September, with Getting ready / Review requested shown then. This task does not request a second review or claim approval. Broader navigation and useful original explanatory content align with Google's guidance, but a homepage change does not establish site-wide approval readiness or guarantee Google's decision.

Official guidance reviewed on 14 September:
- https://support.google.com/adsense/answer/7299563?hl=en
- https://support.google.com/adsense/answer/81904?hl=en

Featured source spot-checks on 14 September:
- https://bookdash.org/ — free online/downloadable picture books; ordinary printing/data costs are qualified in homepage copy.
- https://www.capitecbank.co.za/rewards/spend-better/snappi/ — extra 15 percent, CAPITEC15, account, one voucher per person per month, single purchase and liquor exclusion confirmed. No checkout or redemption performed.

## Search measurement and release

The fresh Analytics Hub handoff and release outcome are recorded below once complete. Review homepage-to-pillar clicks and existing official-source journeys alongside GSC homepage and competition-hub clicks over a comparable 28-day period. Keep Bing separate from GSC/GA4. Changes in these metrics will not establish causality by themselves.


### Fresh query evidence

Analytics Hub's GSC query-page export was collected on 14 September at 11:39:36 local time, covering 16 August–12 September (28 days). The 3,277 Freehub current-window rows were checked for the exact site/window and same-day collection timestamp. These are reported query rows, not complete page totals: anonymised queries can be absent.

- Homepage: 1,083 reported query clicks and 10,989 reported query impressions; leading query "competitions south africa" contributes 123 clicks.
- Competition hub: 23 reported query clicks and 507 impressions.
- Free Stuff: 173 reported query clicks and 31,173 impressions.
- Offers hub: zero reported query clicks and 99 impressions.

Evidence: output/homepage-review/fresh-gsc-query-baseline.json, captured from Analytics Hub data/gsc_query_pages.csv. No Bing totals were mixed into this evidence.

Decision: retain "South African Competitions" at the start of the search title and keep featured competitions near the top, while widening the visible H1, browsing routes, original explanations and evergreen links. This is a cautious positioning change, not a prediction of rankings or approval. The first complete portfolio refresh attempt failed only on Nature Budget Holidays GA4 90-day collection (504); a retry is running. The granular query evidence above is fresh, but does not falsely certify that failed portfolio handoff as complete.
