# Student guide validation — 7 September 2026

**Artwork/polish follow-up:** Local campus artwork replaces the generic article/social image. A responsive 640 px export serves small screens; the 1200 px export serves desktop and social metadata. Visible FreeHub attribution, article social metadata and cleaned Table Mountain copy are implemented. Build and all 93 lifecycle tests passed again; all five student browser tests passed with added image-loading, metadata, attribution and unsupported-price assertions. Desktop/mobile artwork screenshots were inspected. The existing sitemap-count failure remains. See `student-guide-artwork.md` for saved assets and generation prompts.

Local implementation complete at `/student-freebies-discounts-south-africa/`. Not deployed. The guide contains 22 selected benefits and links to the evidence recorded in `student-guide-research.md` and `data/student-guide.json`.

## Delivered

- Dedicated structured content, renderer/validator and page-only stylesheet; no new dependency or application service.
- Existing site shell, navigation links, footer, consent, authentication and social links retained. On this long page, navigation scrolls normally so it does not obscure anchor targets at large text sizes.
- Classification key, four free picks, eight category sections, claim steps, restrictions, charges, source links and check dates.
- Article and breadcrumb metadata, canonical URL, sitemap entry, Free Stuff/Guides/Blog discovery and birthday/course cross-links.
- Monthly editorial review documented; no automated monitor created. Comparison review is due 7 October 2026. Known provider deadlines are tracked separately from editorial review dates.

## Checks performed

| Check | Result |
| --- | --- |
| Default build, 7 September 2026 | Passed |
| Lifecycle suite | **93 passed**, including 15 student-guide checks |
| Student browser suite | **5 passed** in Chromium |
| Responsive and visual inspection | 320, 768 and 1440 px; hero and detailed offer screenshots inspected |
| Enlarged content | 200% text at 640 px and 200% CSS page scaling at 1280 px passed overflow checks; screenshots inspected. This is a scaling/reflow check, not an OS browser-menu zoom test. |
| Keyboard and no-JavaScript operation | Focus outline, tab movement, anchor navigation, all 22 entries and material costs passed |
| Student metadata and internal links | Canonical, heading, publication/review dates, unique IDs, internal destinations, discovery links and Article/BreadcrumbList checks passed |
| Expiry and evidence protection | Missing sources, unsafe/spoofed URLs, missing region/renewal/account costs, invalid dates, duplicate anchors, expired offers, expired comparisons and overdue comparison reviews rejected |
| Performance baseline | No hard failures; existing shared CSS size warning remains (+12.2% against its older baseline). Shared stylesheet is unchanged by this task. |
| Diff whitespace check | Passed |

Provider terms were read through the web reader, direct official HTML retrieval or the browser as recorded in the ledger. HTTP blocking was not accepted as verification. No student application or purchase was submitted. Account-specific approval and merchant redemption have not been tested. No South African VPN was needed.

## Existing site-wide failures remain

`npm test` stops at the fixed sitemap-count assertion: **96 actual, 99 expected**. A separate copy using the pre-change generator and SEO baseline produces **95 actual, 98 expected**, the same three-route shortfall. The student change adds exactly one route. The new route's individual SEO checks pass.

The Free Stuff and Free Samples validators retain their pre-existing count mismatches: **352 generated files versus 354 expected**, **37 competition cards versus 39 expected**, and **96 sitemap URLs versus 99 expected**. Free Stuff also reports **39 active records versus 41 expected**. Only the intentional new-page increments and the sixth Free Stuff navigation link were added to these expectations; unrelated protections were not relaxed.

Maintenance validation fails because `hadeco-80th-birthday-competition-2026` and `mukango-safaris-kruger-living-nyati-giveaway-2026` are now expired but missing from the archive. The same failure reproduces with the pre-change generator. No expired competition remains in the newly built public listings or sitemap according to that check.

Strict lint was run and failed on existing competition/opportunity sources and exception records: the competition report includes 7 errors and 26 warnings, and the opportunity check includes blocked/failed destinations. Examples include HTTP 403/404/429 responses, redirects, stale manual exceptions and changed warning records. These are not verified source failures for the student guide, which has its own evidence ledger. No network exception baseline was weakened.

The full browser run returned **32 passed, 2 skipped and 4 failed**. All four failing tests were subsequently reproduced against the pre-change implementation:

- Free Stuff resource count: 26 current cards versus an expectation of 25.
- Voucher hub empty-state expectation disagrees with current content.
- Voucher reward analytics test cannot find its expected resource and times out.
- Opportunity tombstone test cannot find its expected Free Samples link.

The five student browser tests were rerun after final content and layout changes and all passed. The existing Free Stuff browser navigation expectation was updated from five links to six for the new guide; its unrelated resource-count expectation remains unchanged.

The documented legacy CI date combination (build 31 July / lifecycle 6 August) was also tried; it does not match today's competition data and produced additional baseline mismatches. It was not used to disguise current-date failures.

## Change isolation and handoff

The initial dirty checkout was inspected before editing. A pre-change generator/HTML snapshot is retained outside the repository at `C:/Users/ricca/.codex/tmp/freehub-student-guide-20260907-before`. The independent comparison copy is at `C:/Users/ricca/.codex/tmp/freehub-student-guide-baseline`.

Comparing builds of the pre-change and final generators against identical current input data shows:

- One added HTML page and one added sitemap URL; no removed routes.
- Only three existing HTML pages differ: Free Stuff, Guides and Blog, for student-guide discovery.
- Mobile catalog/feed, 404 page and vertical coverage report match the pre-change generator's output.
- Existing competition, opportunity, archive, shared-data and unrelated validation source edits were retained. Normal builds refreshed ignored generated output for the current date; the original output snapshot remains available.

Detailed local logs and screenshots are in `output/playwright/student-*`. Baseline comparison logs are in the separate comparison directory. The generated HTML is intentionally ignored, consistent with the repository's build-output convention; the structured content and renderer reproduce it.

## Detailed provider notices — 7 September 2026

The guide now links to 22 detailed notice pages under `/out/student/<offer-id>/`. Each notice renders the same structured offer record as the guide: benefit, eligibility, claim steps, limitations, renewal or account costs, applicable expiry, official evidence and check date. Evidence and terms links remain direct. The explicit Continue to provider link uses a reviewed destination recorded in the offer; generation rejects a destination that is absent from its evidence sources.

There is no automatic redirect or countdown. The destination hostname and full URL are visible, and a return link leads to the original guide entry. Notices use the shared site shell and consent/authentication behaviour, have no ad placement, carry `noindex, nofollow`, and are excluded from the sitemap. They do not collect applications or student documents.

After this addition, generation passed, all **95 lifecycle tests** passed and all **7 focused browser tests** passed. Browser checks cover every notice's disclosures, canonical, indexing exclusion and fixed destination, including an attempted query-string destination override. The 320 px no-JavaScript flow passes from guide to notice to a mocked provider destination; this does not establish successful provider redemption. The mobile screenshot is `output/playwright/student-notice-mobile.png`.

The added notices intentionally increase generated output by 22 files without adding sitemap URLs. The latest Free Stuff validation reports **374 generated files versus 376 expected**, preserving the existing two-file mismatch. SEO still reports **96 sitemap URLs versus 99 expected**. Earlier baseline comparison figures above describe the guide before these notice pages were added. Existing unrelated failures remain unresolved; no protection was relaxed to hide them.

This is a local review handoff, not a claim that all repository checks are green. Publication requires the user's separate deployment request. Reconfirm publication date and expiring terms if deployment happens on a later date.

## Release verification against current production code — 7 September 2026

Publication was explicitly authorised by the user. The release was assembled in an isolated worktree from production commit `f14fe6d`, retaining its newer competition features and excluding unrelated dirty-checkout work. Production opportunity and offer flags were enabled during validation.

- Build passed; all 17 student lifecycle tests and all 7 student browser tests passed. The broader lifecycle run returned 97 passed and one existing competition snapshot failure; the unchanged production baseline returned 80 passed and the same failure.
- SEO returned two existing failures: sitemap count (116 actual versus 117 expected after the one new guide route) and a Free Samples description mismatch. The unchanged baseline reproduces both (115 versus 116 sitemap URLs).
- Maintenance reports the same pre-existing expired Ackermans record missing from the archive in both builds. It reports no expired sitemap entries and no outbound URLs in the sitemap.
- A generated-output comparison adds exactly 23 HTML pages (guide plus 22 notices), changes only Free Stuff, Guides and Blog discovery pages, and removes none. Catalog/feed, 404, robots and the vertical report match the unchanged production build.
- Baseline increments cover only the new guide, 22 notices and one discovery link. Existing failures were not hidden by relaxing expectations.

The earlier local-checkout results above remain historical evidence; these release checks apply to the current production branch. Live availability will be checked after the deployment workflow completes.

## Two advertising placements — 7 September 2026

Following Adsterra support's recommendation against multiple native units, this update adds one existing 1x1 native placement after software/AI and a separate 320x50 display banner before attractions. The display code was obtained from FreeHub's Adsterra dashboard and independently supplied by the user. Adult ads were disabled when requesting the unit.

Both placements are labelled and load near the viewport only after Firebase confirms a guest. Signed-in, pending-authentication and unavailable-authentication states remain ad-free. Member sign-in removes the display frame and reloads into the existing clean member document. The fixed-width banner is hidden when the guide's available width cannot fit it. The banner snippet runs in a sandboxed frame so document-writing code cannot replace the guide. No additional ads were added to provider notices.

Validation: build and 17 student lifecycle tests passed; 11 selected browser checks passed, including all seven editorial checks, both new ad tests, the homepage native-ad check and guest-to-member cleanup. Two older competition-ad tests failed on both this build and the unchanged production baseline. Performance validation had no hard failures and retained the existing shared-CSS warning. Provider network responses are stubbed in regression tests; those tests verify integration and authentication boundaries, not paid impressions or revenue.
