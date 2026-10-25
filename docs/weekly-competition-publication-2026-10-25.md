# Weekly competition publication review — 25 October 2026

The user authorised publishing the two Add now recommendations from the weekly scan. Scope is only `everest-wealth-holiday-2026` and `first-choice-moms-got-the-power-2026`. Existing private IDs are reused; no other held candidate is approved. Publication uses an isolated worktree based on remote `21cae4ea8953ee91a3ed0de02da75852db2165cf`; the user's dirty primary checkout is preserved.

## Official evidence and material conditions

Everest Wealth:

- Campaign: https://everestwealth.co.za/holiday-giveaway/
- Exact entry post: https://www.facebook.com/reel/1629086925671821/
- Terms: https://everestwealth.co.za/wp-content/uploads/2026/08/Everest_Wealth_Holiday_Giveaway_TCs_v1.pdf

The official site links the same Everest Wealth accounts. The public reel is dated 14 October and repeats the follow/tag mechanic, inclusive R15,000 cap and 31 October 23:59 close. The full rules, version 1.1, were reviewed; the PDF was freshly retrieved with SHA256 `460163e3b41f360c3bfab809f338e416a92faba766ba0ecb894ec0c0379da7b3`. Entry has opened and closes 31 October 2026 at 23:59 SAST. Eligible entrants are adult SA residents with valid SA ID. Free entry excludes normal data costs. One entry per platform, at most two; tag a real consenting friend and remain following through draw. No investment or client relationship is required. The agent is paid directly; the prize is not cash. The R15,000 cap includes VAT, agent and administration fees. Travel extras/excess, six-month booking and twelve-month travel limits, a 48-hour winner response and optional publicity are disclosed.

First Choice:

- Exact entry post: https://www.facebook.com/FirstChoiceSA/videos/moms-dont-do-small-moves-they-do-power-moves-the-kind-nobody-sees-but-everybody-/2199509164780452/
- Terms: https://www.firstchoice.co.za/terms-and-conditions/first-choice-power-cup-mom-s-got-the-power-competition-2026

The official brand website links FirstChoiceSA. The exact public video and its full caption, and the full promoter-domain rules, were freshly inspected in a real unauthenticated browser. Rules run 16 October–30 November 2026. The closing hour/timezone is unstated; the listing discloses the South African date assumption and recommends entering before the final day. Twenty hampers are each worth over R1,000; the post specifies a R300 Dis-Chem voucher and a 12-pack Power Cup. Rules also list a cooler bag, children's stationery and apron, with availability variations. They require age 18+, SA residence, acceptable identification and a valid SA WhatsApp number. Like, original mom-power-move comment, tag and #MomsGotThePower agree between rules and caption. No extra motherhood eligibility rule is invented. The complete stated mechanic includes no purchase/payment step. The listing uses **Account required**, with social/data costs explained, rather than claiming a completely cost-free route. Winner announcement is 7 December; claim-response time is set by the promoter. South African delivery, entry-comment reuse, winner-handle publication, voucher terms and no payment/banking/password request to claim are disclosed.

## Duplicate and artwork review

The current local active/archive/unverified and held export, latest commit-pinned remote active/archive/unverified, production feed/catalogue, sixteen-row private queue and five prepared private drafts were checked. Production has 118 competitions dated 25 October. Both identities exist only as private drafts. The expired BabyYumYum First Choice custard/LEGO competition is distinct. No public duplicate was found. No crawler records or private source artifacts are modified.

Both suitable official images were recovered from `og:image` on the verified campaign posts and visually inspected. First Choice is 405 x 720, Everest 720 x 900. Optimized WebPs preserve the full portrait composition without cropping; the image fields and listing-image metadata contain matching dimensions, descriptive alt text, source page and original source-image URL. First Choice's decorative school/sport objects are not extra prizes. Everest scenery illustrates choice, not a guaranteed specific destination. No generated artwork or generic logo substitute is used.

The two social URLs have exact-ID, dated exceptions under the existing 30-day link recheck policy because automated social retrieval is inconsistent. The complete evidence above and browser inspection support these exact exceptions. No general link policy or warning baseline is relaxed.

## Validation and release evidence

The production-feature build (opportunities and offers enabled), held validation, SEO/performance and Free Stuff/Free Samples gates, all 171 lifecycle tests, 30 Airtime Dash tests and maintenance validation pass. One emulator-only Airtime Dash test is skipped. The main deterministic suite was also run with Node 24.19.0. Only the two reviewed detail counts and their cost-label pairs were added to baselines: the entire old cost-label hash matched before the update. No warning baseline changed.

The full Chromium run passed 96 checks and exposed three existing failures: the 390px first-content position on the competition page, the homepage mascot position, and an expected three versus actual four homepage links. All three reproduce with identical values on untouched remote `21cae4e` in a separate worktree. Two further no-JavaScript student tests initially targeted a hardcoded unused port 4318 instead of the chosen preview port; both pass when rerun with the expected test server. The new competition pages independently pass no-JavaScript status, heading, entry-action and overflow checks.

Broad strict lint is not green: it reports 15 unrelated competition errors (stale or missing manual exception entries among them), existing resource warnings and Opportunity link/evidence failures. The new IDs have valid exact-URL exceptions checked 25 October, recheck due 24 November, and no reported errors. No unrelated verification date, policy or baseline was advanced to suppress those failures. A byte-for-byte comparison confirms all 491 pre-existing competition objects remain unchanged, with exactly these two additions.

Desktop and mobile artwork/content were inspected. Both local assets load at their recorded natural sizes, preserve the complete portrait composition and fit without horizontal overflow. A separate visual pass blocked third-party scripts in the preview browser to inspect layout clearly; site advertising and consent configuration are unchanged. The normal advertising/consent preview was also viewed. The release diff is limited to records, assets, metadata, existing link-exception/baseline conventions, generated feeds/report and this review. No blocking scoped review finding remains. Deployment and live verification follow after push; these local checks alone do not prove publication. No entry, follow, like, comment or promoter contact was submitted.

The generator uses `sourceUrl` for the outbound handoff. Both records therefore set `sourceUrl` and `url` to the exact verified social entry post, while `termsUrl` points to the official campaign rules. Generated `/out/` pages were inspected and checked against those destinations. Campaign landing-page evidence remains documented above. All page titles, H1s, canonicals, visible cost labels, sitemap entries and both generated feeds were checked; each new ID appears once.
