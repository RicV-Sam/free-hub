# Weekly competition publication — 1 November 2026

The owner authorised proceeding with the reviewed weekly batch and clarified the publication split: verification-watchlist leads belong in the separate unverified collection; Add now belongs in the official/verified collection. The automation was updated through the app's supported tool, retaining its Sunday 08:00 schedule, model, reasoning effort and project.

## Scoped records

- Verified: `beds-r-us-golden-ticket-2026`, purchase-required capped refund; no guaranteed refund, random-draw or nationwide-delivery claim.
- Unverified: `1voucher-birthday-video-2026`, `fastjet-matobo-hills-2026`, `nedbank-xtratime-november-2026`, `mtn-formal-retail-october-january-2026`, `superbalist-payjustnow-november-2026`.
- Every unverified record retains `doNotPublish: true`, `verificationStatus: not-verified`, `publicationStatus: public-under-review`, explicit gaps and a review deadline of 8 November. The records must remain absent from verified routes, redirects and feeds.

Existing campaign identities were screened across production, pinned remote main, local collections, held rows and nine private review files. No second public identity was created for an existing campaign. The original checkout's untracked files are excluded from this isolated release. Base: `dcffa816324eb030e14e487516350facedf1f75e`.

## Current evidence and material gaps

Official pages/rules were rechecked on 1 November; private direct-fetch receipts include UTC timestamps, URLs and hashes. No entry, payment, login, email, social action or crawler approval occurred.

Artwork inspection found another Superbalist inconsistency: its official banner says R1,500+ spend, while recovered competition rules omit that threshold. The public under-review copy discloses this alongside full-payment versus instalment uncertainty and mandatory marketing consent. Direct and actual-browser access returned 403; official content was readable through web retrieval. This is recorded as an access gap, not passed off as a successful browser source check.

The other unverified records retain their age/claim, exact-post/prompt, tariff, targeting and wording uncertainties. No headline converts a reported prize into a verified offer.

Source URLs:
- https://bedsrus.co.za/golden-ticket-rules/ and https://bedsrus.co.za/policies/
- https://www.1voucher.co.za/competition-terms-conditions
- https://www.fastjet.com/competitions/
- https://www.nedbankcup.co.za/news/xtratime-you-know-ball-competition-ts-and-cs/
- https://www.mtn.co.za/home/terms-and-conditions/content/mtn-pay-as-you-go-formal-retail-october-2026-to-january-2027
- https://superbalist.com/competitions and https://payjustnow.com/terms-and-conditions/

## Artwork provenance

Official campaign pages were inspected before generation. The fastjet, Nedbank XtraTime and Superbalist banners were obtained from their linked official assets and inspected. Optimised WebPs preserve their full aspect ratios, without cropping or redrawing. Source image URLs and dimensions are in `data/listing-images.json`.

Beds R Us exposed icons/logos rather than suitable campaign-specific hero artwork. The 1Voucher page did not expose usable birthday-campaign artwork; the MTN rules exposed none. Three subject-specific illustrations were generated with the built-in image-generation tool, inspected and optimised to 1536×864 WebP. All include the editorial label, and the page renderers add the appropriate disclosure. They depict neither a confirmed product model nor an eligible entry. No API/CLI image fallback was used.

Exact prompts:

### Beds R Us
Create a polished landscape 16:9 editorial illustration for South African consumer website FreeHub about an online bed-shop purchase-refund promotion. A calm modern bedroom with an unbranded bed, folded linen, a plain golden ticket and a small abstract receipt on a bedside surface; warm sunlight, teal and cream accents, sophisticated editorial 3D-paper illustration, generous negative space. Do not depict any exact product model, brand logo, cash, prize amount, date or guarantee; bed is illustrative only. The only visible words, small but readable along the bottom: 'FreeHub editorial illustration'. No other text.

### 1Voucher
Create a polished landscape 16:9 editorial illustration for FreeHub's NOT VERIFIED competition discovery page about a birthday-song video challenge. Show an anonymous adult creator singing in front of a smartphone on a tripod, a small unbranded birthday cake with candles and subtle music-note shapes. Friendly South African editorial feel, teal, coral and warm cream palette, elegant 3D-paper illustration, adult fully clothed, no specific resemblance. No brand logo, voucher value, dates, prize promise, app interface or social-platform logo. The only visible words along bottom: 'FreeHub editorial illustration'. This is a conceptual editorial image, never a competition entry.

### MTN
Create a polished landscape 16:9 editorial illustration for FreeHub's NOT VERIFIED discovery page about a mobile airtime-recharge grocery-voucher promotion. Compose a generic smartphone with blank screen, an unbranded grocery bag with bread and vegetables, a plain yellow voucher-shaped card without writing and an abstract receipt on a clean tabletop. Sophisticated tactile editorial illustration in teal, yellow and warm cream. Do not depict a branded app, real redemption code, any logo, money amount, tariff, date, guaranteed benefit or actual prize. The only visible words along the bottom: 'FreeHub editorial illustration'.

## Validation

The production-flag build passed. `npm test` passed: all 178 lifecycle tests, SEO/performance and held checks, plus 30 Airtime Dash tests with one documented emulator skip. The existing under-review and general smoke browser suites passed all 48 checks. Maintenance validation and the scoped route/feed boundary validation passed. All 502 pre-existing primary records remain equal to the base; the new verified identity appears once in both 95-record competition feeds, and the five unverified identities appear in neither.

Twelve desktop/mobile preview views returned HTTP 200, loaded the six new images and had no horizontal overflow. Screenshots were inspected after decoding images. For local artwork preview only, requests for the new production asset URLs were served from the local preview; third-party scripts were blocked for unobscured layout inspection. This is local visual QA, not a claim of live deployment or consent-provider testing.

Full lint was run and remains nonzero: an unchanged Outdoorphoto terms URL returned HTTP 429, and existing Fountains Mall and Water Filter Factory archive URLs produced new warnings. The original records, validators and warning baseline are unchanged. The new Beds R Us official URL returned HTTP 200. No network issue was relabelled as a passing result and no unrelated review date was advanced.

The fixed generated-file expectation increases by exactly one for the additional verified detail page; under-review details and the verified exit are already counted dynamically. The new purchase-required label is reviewed in its own dated fixture and excluded from the untouched historical cost-label hash. Warning baselines remain unchanged.

Private evidence and final release receipts: automation `weekly-new-competition-scan`, `2026-11-01/publication/`. The final deployment/production result is recorded there; preparation alone does not assert live publication.
