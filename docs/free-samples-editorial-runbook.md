# Free Samples pilot editorial runbook

## Publication boundary

The Coloplast SpeediCath Short record is a free, suitability-reviewed medical-product sample request. It is not a guaranteed consumer giveaway and Freehub does not assess whether the product is suitable for a visitor.

Publication follows one route only:

`registry + reviewed evidence → strict validation → isPublicOpportunity() → approved surface list → renderer`

The renderer cannot approve a record. ZA Comp Engine and held-candidate output remain evidence-only and cannot edit the Opportunity registry, evidence ledger, verification state, or publication state.

## Weekly Opportunity review

Recheck every published free sample within seven days of `lastVerifiedAt` and never publish beyond `reviewDueAt`.

For the Coloplast pilot, confirm on the exact official URLs:

- the campaign still displays a free SpeediCath Short sample request;
- requests are qualified or reviewed for product suitability;
- the request is intended for people who use, or have been prescribed, an intermittent catheter;
- approved sample requests receive free South African delivery;
- the sample-specific dispatch wording remains supported;
- no age, stock, purchase, payment, or guaranteed-fulfilment claim has been introduced;
- the source and terms URLs have not redirected or become a 404, 410, or soft-404.

Paid-order clauses on the Terms of Sale page must not be used to classify the free sample. Use only the clauses that explicitly concern approved sample requests.

If automated access is blocked but the page is visibly verified, append a reviewed entry to `data/opportunity-source-evidence.json`. Never edit or remove older evidence rows. The entry must match the record, field, hostname and exact URL, and must expire no later than seven days after verification. Manual evidence cannot override a 404, 410, soft-404, redirect, mismatched URL, stale review, or any other publication failure.

## Monthly durable-resource review

Recheck all seven resources on `/free-samples-south-africa/` within 30 days. Confirm the stable ID, subtype, official URL, availability, verification state, review dates, and visible description. Product-testing panels must retain the no-guarantee distinction; the international ReviewClub guide must not be presented as a South African current offer.

## Privacy and medical boundary

Freehub must never collect, store, proxy, pre-fill, or receive health information, prescription details, catheter-use information, or application answers. Visitors go directly to Coloplast. Coloplast, not Freehub, assesses suitability. Freehub provides no medical efficacy or suitability advice.

The final review confirmed Coloplast's stable consent page at `https://www.coloplast.co.za/global/declaration-of-consent/`; the cards link directly to it. Recheck that link with the weekly campaign review. Never copy, proxy, or recreate the application form.

## Activation and rollback

Merge and deploy with `FREEHUB_ENABLE_OPPORTUNITIES` absent or false. After the resource-only page is live, perform a same-day source review and append current evidence through a reviewed change. Then set the repository variable to the exact string `true` and rerun both the main deployment and daily-maintenance deployment path.

Activation is complete only when one card and one matching `Thing` ItemList entry appear on each approved page, with no Opportunity route or sitemap URL.

For immediate rollback, remove the variable or set it to `false`, redeploy, and confirm that both cards and both Opportunity ItemLists disappear while both editorial pages and all seven sample resources remain.

## User reports

Treat reports about unavailable forms, changed costs, redirects, privacy concerns, eligibility changes, or unsupported claims as a verification event. Disable the flag for urgent cross-surface removal. Otherwise move the record out of `published` or `verified`, document the finding, and rerun the full validation suite before republishing.
