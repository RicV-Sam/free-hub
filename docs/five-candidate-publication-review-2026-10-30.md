# Five competition drafts — 30 October 2026

Reviewed by the owner and approved for commit and publication on 30 October 2026. This release contains the five listings below, their artwork and supporting rendering/validation changes. A push to main triggers deployment.

## Proposed placement

| Candidate | Prepared route | Editorial decision |
| --- | --- | --- |
| Virgin Active Ultimate Getaway | `/competition/virgin-active-ultimate-getaway-2026/` | Verified source terms; membership required, random app reward allocation, holiday value capped at R200,000. Member-only app not accessed. |
| Lucozade / SPAR | `/unverified-competitions/lucozade-spar-franchise-vouchers-2026/` | Pending: minimum age, weekly draw schedule and QR destination need clarification. |
| Scentemy perfume giveaway | `/unverified-competitions/scentemy-perfume-giveaway-november-2026/` | Opens **2 November 2026**. Pending a launch/checkout check, not described as currently open. Review due 2 November; no automatic promotion to verified. |
| Fossil Free SA community journey | `/unverified-competitions/fossil-free-sa-community-journey-2026/` | Pending: invalid reported deadline, remaining events and fulfilment details. Deadline remains unknown. |
| Aqua Atlantis KAKU POT | `/unverified-competitions/aqua-atlantis-ada-kaku-pot-giveaway-2026/` | Pending: event attendance costs R750; exact giveaway cutoff, selection and collection rules unknown. |

Other pending records have a 6 November review deadline. Expired review windows remove them from the collection and sitemap. Official source links, eligibility, costs, mechanics and evidence gaps are included on the detail pages. The opening date now appears on cards as well as detail pages. Pending records retain `doNotPublish: true` in their separate registry and cannot enter verified routes, exits or app feeds.

## Sources and artwork

- [Virgin Active terms](https://hello.virginactive.co.za/support/solutions/articles/201000133030-terms-and-conditions-the-ultimate-getaway-competition): no campaign hero found on the terms page. Labelled FreeHub fitness/travel illustration used.
- [Lucozade terms](https://lucozade.co.za/faq/spar-competition-terms/): page has generic brand assets only. Labelled FreeHub grocery/voucher illustration used.
- [Scentemy rules](https://scentemy.co.za/pages/win-a-year-s-worth-of-perfume-how-to-enter-competition-rules): official campaign artwork used. An earlier generated alternative was not added to the project.
- [Fossil Free SA campaign](https://www.fossilfreesa.org.za/community-journey-2026): official community illustration used, with transparency preserved.
- [Aqua Atlantis event](https://aquaatlantis.co.za/ada-seminar-2026/): official ADA display photograph used. Copy explicitly says this is not the final creation to be scaped at the event.

Five optimised WebP files are stored under `assets/listings/followup-2026-10-30/`. Alt text, source page/image URLs and the two generation prompts are recorded in `data/listing-images.json`.

## Validation

- Full deterministic `npm test` passed using Node 24.19.0: 178 lifecycle tests and 30 Airtime Dash tests passed; one emulator-dependent test skipped. SEO/performance checks passed.
- Current-date build with offers/opportunities enabled, seven under-review tests and maintenance validation passed.
- The route baseline adds exactly one verified detail page; the cost-label additions explicitly assert Membership required. Historical hash/warning baselines were not refreshed.
- Focused browser review: all five pages returned 200, their new images loaded and there was no horizontal overflow at 1440px or 390px with external providers blocked for layout inspection. Screenshots are under `output/playwright/`.
- Direct assertions passed for pending/verified sitemap, route and app-feed separation.
- Scentemy card check passed: the opening date is visible and clicking the card opens its separate detail page.
- Final live-link check did not pass: the existing `nedbank-old-mutual-budget-speech-2026` entry and terms URLs returned HTTP 503 after redirecting to an installation/error path. No new or changed warning-baseline entries were reported. These failures are outside the five new candidates and were not suppressed.
- Final full browser run against this checkout with matching enabled offers/opportunities: 104 passed, five failed. Failures concern the existing editorial and mascot layouts at 390px, the 200% text/accessibility scenario, provider connections on protected pages and the Hyatt competition test. No clean pre-change comparison was performed, so their prior status is not claimed. Logs are `.research/five-candidates-20261030/browser-final.log` and `lint-final.log`; browser traces are in `output/playwright/test-results/`.
- Initial runs with a historical build, a different preview server or mismatched feature flags are not release evidence. Final generated output uses the current date and preserves enabled offers/opportunities. `git diff --check` passed.

## Release boundary

The owner approved publication of these five listings, retaining their separate verification states and Scentemy's 2 November opening date. Preserve the pre-existing AGENTS.md/policy changes and unrelated draft artwork/output outside this commit. Recheck sources and review windows if release is delayed. Deployment and live-image checks follow the push; the validation above describes pre-release evidence.
