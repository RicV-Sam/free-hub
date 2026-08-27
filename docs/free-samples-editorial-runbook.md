# Samples, product-testing and voucher editorial runbook

## Publication boundary

Freehub publishes two distinct opportunity types:

- direct sample requests, where the official provider states the request limit, delivery terms and any suitability review;
- product-testing applications, where the provider selects participants and may require social content or a review.

Direct requests remain subject to the provider's form, stock, limits and stated eligibility. Product-testing applications are not guaranteed and must never be labelled as direct free samples. Freehub must state the required account, audience, questionnaire and content obligations before a visitor leaves the site.

Publication follows one route only:

`registry + reviewed evidence -> strict validation -> isPublicOpportunity() -> approved surface list -> renderer`

The renderer cannot approve a record. ZA Comp Engine and held-candidate output remain evidence-only and cannot edit the Opportunity registry, evidence ledger, verification state, or publication state.

## Weekly opportunity review

Recheck every published sample or product-testing application within seven days of `lastVerifiedAt`. Never publish a record beyond `reviewDueAt`.

For the 31 July 2026 release, 18 existing records are due for a fresh editorial source review on 3 August 2026 and the three new TENA/Blind Designs records are due on 7 August 2026. Do not advance either date without completing the source checks and appending exact evidence rows; the public gate will remove overdue records automatically.

For all four Coloplast samples, confirm on each exact official URL:

- the page still displays the named free sample request;
- requests are qualified or reviewed for product suitability;
- the stated intended-use or prescription boundary remains accurate for that product;
- approved sample requests receive free South African delivery;
- the three-business-day dispatch wording is used only for SpeediCath Short while the official source supports it; do not invent a delivery window for the three ostomy-product samples;
- no age, stock, purchase, payment, or guaranteed-fulfilment claim has been introduced;
- the source and terms URLs have not redirected or become a 404, 410, or soft-404.

Paid-order clauses on the Terms of Sale page must not be used to classify the free sample. Use only clauses that explicitly concern approved sample requests.

For the two TENA sample packs, confirm on the exact Women and Men official pages:

- the chosen sample pack remains free with discreet delivery;
- delivery is still limited to a South African physical address and excludes PO boxes;
- the limit remains one pack per person, family or address every six months;
- the form has not introduced a purchase, delivery charge or unsupported delivery timeframe;
- Freehub's privacy copy still sends the visitor directly to TENA and does not imply that Freehub receives health or delivery details.

For Blind Designs, confirm on the official fabric-sample page:

- visitors can still choose up to five blind or curtain fabric pieces per delivery;
- delivery to a South African address remains free;
- no order value, delivery fee or unsupported delivery timeframe has been introduced;
- the exact page still provides a working sample-selection route and has not redirected or become a soft-404.

For all 14 Brand Advisor product-testing applications, confirm:

- the exact official application page still has an active apply action;
- the gifted product or hamper is still described;
- the required social platform, account state, and follower threshold remain accurate;
- every required post, reel, video, questionnaire, or review is stated on Freehub;
- selection is still controlled by the provider and is not guaranteed;
- no purchase, entry fee, or payment requirement has appeared;
- the campaign has not moved to a past or completed state.

The Sta-Soft and Simba voucher campaigns are creator trades, not no-strings-attached vouchers. Reconfirm the 1,000-follower account threshold, application survey, required social video and provider-controlled selection before every refresh.

Append one reviewed entry to `data/opportunity-source-evidence.json` for each source check. Use `official_source_manually_reviewed` for a normal manual review. Use `official_source_verified_despite_automated_access_block` only when automated access is blocked but the exact page has been visibly checked.

Never edit or remove older evidence rows. Each entry must match the record, field, hostname and exact URL, and must expire no later than seven days after verification. Current evidence is required separately for every present `sourceUrl` and `termsUrl`. Opportunity URLs may use only `brandadvisor.co.za`, `products.coloplast.co.za`, `www.blinddesigns.co.za` or `www.tena.co.za`; voucher-resource domains do not expand that allowlist. Manual evidence cannot override a 404, 410, soft-404, redirect, mismatched URL, stale review or any other publication failure.

## Analytics evidence

GA4 is supporting evidence only. It must not block an evidence refresh, route validation run, or publication rollback decision for Opportunities.

Use repository-grounded checks as the release bar:

- deterministic Opportunity, SEO, lifecycle, maintenance, parity, and browser tests;
- raw event-name coverage in code and smoke tests for `discovery_card_click`, `opportunity_detail_view`, `opportunity_exit_click`, `opportunity_exit_view`, and `opportunity_exit_handoff`;
- current official-source and terms evidence in the Opportunity ledger.

If GA4 review is needed, treat it as a manual follow-up. Prefer Realtime, DebugView, or an exploration date range that explicitly includes the current review date. A saved exploration window that excludes the current day, delayed processing, missing custom-dimension registration, or UI filter drift must be recorded as an analytics review limitation, not as a publication blocker by itself.

## Monthly durable-resource review

Recheck all seven durable resources on `/free-samples-south-africa/` within 30 days. Confirm the stable ID, subtype, official URL, availability, verification state, review dates and visible description. Product-testing resources must retain the no-guarantee distinction; the international ReviewClub guide must not be presented as a current South African offer. Kalley must disclose the current R69 delivery charge and must not be counted as completely free.

The Free Stuff parent contains 24 durable resources in total; that count is separate from the seven Samples resources and the flag-controlled Opportunity registry.

## Voucher resource review

Keep direct rewards, public-service support, no-purchase prize draws, creator exchanges and spend-linked promotions visibly separate. Recheck the four voucher-resource routes against their official sources and retain these boundaries:

- Western Cape Jobseeker Travel Voucher: six off-peak trips in Cape Town or George, with unemployment, South African ID, portal-registration and weekday 09:00–15:00 requirements; disclose any replacement-card cost.
- Absa Advantage: personalised in-app challenge for a qualifying account with the current app and NotifyMe; the reviewed terms allow five days to choose a reward and 14 days to use the meal voucher, while value and regional availability can vary.
- Kauai birthday reward: tier-based benefit for an adult app member with a completed profile and linked card; disclose the reversed R1 verification transaction and tell readers to check the app because the public expiry window is not stated.
- Spur birthday voucher: R1,000 prior 12-month spend, R50 voucher, 31-day validity and non-transferability; retain exact official-PDF evidence when automation receives the reviewed 403 response.

Competition shortlists must use the strict voucher-value predicate. A hamper, fragrance set or other physical prize must not appear merely because its source category is Vouchers. Keep unrestricted free-entry draws separate from no-purchase draws that still require an account, app or membership. If no verified unrestricted free-entry voucher, gift-card, store-credit, cashback, airtime or data prize qualifies, publish the honest empty state while retaining any clearly labelled account-linked tier.

## Privacy and medical boundary

Freehub must never collect, store, proxy, pre-fill or receive application answers, health or incontinence information, prescription details, catheter-use information, contact or delivery addresses, or social-account credentials. Visitors apply directly with the provider, including TENA and Blind Designs.

For Coloplast, the provider alone assesses suitability. Freehub provides no medical efficacy or suitability advice. Recheck Coloplast's consent page at `https://www.coloplast.co.za/global/declaration-of-consent/` during the weekly campaign review. Never copy, proxy, or recreate the application form.

## Activation and rollback

When `FREEHUB_ENABLE_OPPORTUNITIES=true`, every one of the 21 current opportunities must produce:

- one card on the Free Samples hub, with seven direct requests and 14 selected product tests kept in separate sections;
- one matching `Thing` entry in the appropriate ItemList;
- one indexable detail page with an official outbound handoff;
- one sitemap URL.

The Free Stuff parent features two of those records, and the voucher hub shows the two creator voucher exchanges only while the flag is enabled. Exit pages must remain `noindex` and outside the sitemap. Both flag states must retain `data-free-samples-page-version="4"`, `data-free-stuff-parent-version="3"` and `data-voucher-hub-version="2"`. If any record fails validation, becomes stale or loses current source support, it must disappear from every public surface.

GitHub Pages receives this flag from the repository/environment variable of the same name. Before launch, verify that its deployed value is the exact string `true`; an unset or differently cased value intentionally publishes the durable seven-route Samples fallback without the 21 current Opportunity records.

For immediate rollback, remove the variable or set it to `false`, redeploy, and confirm that current Opportunity cards, ItemLists, detail pages and sitemap entries disappear while the seven durable sample resources and four checked voucher-resource routes remain.

## User reports

Treat reports about unavailable forms, changed costs, redirects, privacy concerns, eligibility changes, or unsupported claims as a verification event. Disable the flag for urgent cross-surface removal. Otherwise move the record out of `published` or `verified`, document the finding, and rerun the full validation suite before republishing.
