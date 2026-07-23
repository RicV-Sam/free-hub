# Free Samples and product-testing editorial runbook

## Publication boundary

Freehub publishes two distinct opportunity types:

- direct sample requests, where the provider may approve and fulfil a sample;
- product-testing applications, where the provider selects participants and may require social content or a review.

Neither type is a guaranteed giveaway. Product-testing applications must never be labelled as direct free samples, and Freehub must state the required account, audience, questionnaire, and content obligations before a visitor leaves the site.

Publication follows one route only:

`registry + reviewed evidence -> strict validation -> isPublicOpportunity() -> approved surface list -> renderer`

The renderer cannot approve a record. ZA Comp Engine and held-candidate output remain evidence-only and cannot edit the Opportunity registry, evidence ledger, verification state, or publication state.

## Weekly opportunity review

Recheck every published sample or product-testing application within seven days of `lastVerifiedAt`. Never publish a record beyond `reviewDueAt`.

For the Coloplast sample, confirm on the exact official URLs:

- the campaign still displays a free SpeediCath Short sample request;
- requests are qualified or reviewed for product suitability;
- the request is intended for people who use, or have been prescribed, an intermittent catheter;
- approved sample requests receive free South African delivery;
- the sample-specific dispatch wording remains supported;
- no age, stock, purchase, payment, or guaranteed-fulfilment claim has been introduced;
- the source and terms URLs have not redirected or become a 404, 410, or soft-404.

Paid-order clauses on the Terms of Sale page must not be used to classify the free sample. Use only clauses that explicitly concern approved sample requests.

For every Brand Advisor product-testing application, confirm:

- the exact official application page still has an active apply action;
- the gifted product or hamper is still described;
- the required social platform, account state, and follower threshold remain accurate;
- every required post, reel, video, questionnaire, or review is stated on Freehub;
- selection is still controlled by the provider and is not guaranteed;
- no purchase, entry fee, or payment requirement has appeared;
- the campaign has not moved to a past or completed state.

Append one reviewed entry to `data/opportunity-source-evidence.json` for each source check. Use `official_source_manually_reviewed` for a normal manual review. Use `official_source_verified_despite_automated_access_block` only when automated access is blocked but the exact page has been visibly checked.

Never edit or remove older evidence rows. Each entry must match the record, field, hostname, and exact URL, and must expire no later than seven days after verification. Manual evidence cannot override a 404, 410, soft-404, redirect, mismatched URL, stale review, or any other publication failure.

## Monthly durable-resource review

Recheck all seven durable resources on `/free-samples-south-africa/` within 30 days. Confirm the stable ID, subtype, official URL, availability, verification state, review dates, and visible description. Product-testing resources must retain the no-guarantee distinction; the international ReviewClub guide must not be presented as a current South African offer.

## Privacy and medical boundary

Freehub must never collect, store, proxy, pre-fill, or receive application answers, health information, prescription details, catheter-use information, or social-account credentials. Visitors apply directly with the provider.

For Coloplast, the provider alone assesses suitability. Freehub provides no medical efficacy or suitability advice. Recheck Coloplast's consent page at `https://www.coloplast.co.za/global/declaration-of-consent/` during the weekly campaign review. Never copy, proxy, or recreate the application form.

## Activation and rollback

When `FREEHUB_ENABLE_OPPORTUNITIES=true`, every current opportunity must produce:

- one card on the Free Samples hub;
- one matching `Thing` entry in the appropriate ItemList;
- one indexable detail page with an official outbound handoff;
- one sitemap URL.

Exit pages must remain `noindex` and outside the sitemap. If any record fails validation, becomes stale, or loses current source support, it must disappear from every public surface.

For immediate rollback, remove the variable or set it to `false`, redeploy, and confirm that current opportunity cards, ItemLists, detail pages, and sitemap entries disappear while the seven durable resources remain.

## User reports

Treat reports about unavailable forms, changed costs, redirects, privacy concerns, eligibility changes, or unsupported claims as a verification event. Disable the flag for urgent cross-surface removal. Otherwise move the record out of `published` or `verified`, document the finding, and rerun the full validation suite before republishing.
