# External-link review — 30 October 2026

## Scope and outcome

Reviewed the competition audit failures and all 19 overdue opportunities requested for possible restoration. Work is prepared on `codex/external-link-audit`; this document does not establish deployment.

- Removed invalid `manual-ok` overrides from 15 competition records after checking their exact official source/terms pages. The independent fetch covered 25 unique URLs, all returning HTTP 200 (Telkom uses its existing allowed official redirect). Historical review notes and dates were retained. The competition recheck reported 919 checks, 886 OK, 33 warnings and zero errors.
- Re-reviewed all 19 overdue opportunities. Restored 18, with verification on 30 October and review due 6 November. Added 25 exact source/terms evidence entries without rewriting historical evidence. Together with the existing Norval and Galileo listings, 20 opportunities are active.
- Mugg & Bean's old FAQ and slash-terminated terms URLs redirect. Replaced them with the reviewed final official URLs: https://www.muggandbean.co.za/rewards/loyalty-app and https://www.muggandbean.co.za/terms-and-conditions. Prior qualifying activity and 30-day reward validity remain disclosed.
- Robben Island's poster linked from https://www.robben-island.org.za/current-promotions/ requires South African ID and collection at Nelson Mandela Gateway. Added those restrictions; retained the FAQ's cancellation exception.
- Cape Wheel's standard-ride limitation and VIP/Sky Dining exclusions are now explicit. No photo-pack purchase is represented as free.
- Spur children's birthday meal remains withdrawn. https://www.spursteakranches.com/za/family-card-benefits-for-kids promises a free Kids meal and Chico ice cream, while the registry's official July 2025 PDF defines the birthday voucher inconsistently as a soda accompanying a meal and conflicts on on-premises/collection redemption. Both sources were inspected. No new verification deadline was assigned and no claim was made that the provider ended the benefit.

## Restoration coverage

Restored the four Coloplast samples, Blind Designs samples, Table Mountain, Two Oceans Aquarium, Cape Wheel, Zeitz MOCAA, Robben Island, City Sightseeing Young Explorers, UpCycles, V&A pedal boats, Ster-Kinekor, McDonald's, Mugg & Bean, Ocean Basket and Starbucks Gold.

Coloplast qualification, privacy and sample-delivery terms remain explicit. No medical advice, sample request, personal data submission or guaranteed fulfilment was introduced. Blind Designs' sample selection was inspected without placing an order. Official pages and terms support the birthday windows, identity, membership, app and prior-purchase conditions retained in the records. Evidence summaries are in `data/opportunity-source-evidence.json`.

## Historical external source unavailable

The Best Home & Electric Kelvinator campaign ended 31 July 2026. Its original source https://bestelectric.co.za/bhe-competition-landing.php repeatedly returned 404. No exact official replacement campaign page was verified. Retained the historical URL and added only its `expired_archive_404` identity to the reviewed warning baseline. This documents an unavailable archived source; it does not repair the provider's website or approve a current entry route. All existing warning identities remain intact.

## Validation and supporting changes

- Production-date build with Opportunities and Offers enabled.
- Full `npm test`: SEO and performance hard checks passed; 178 lifecycle tests passed; game tests 30 passed, one skipped.
- Four focused Chromium tests passed: Free Stuff, Free Samples, opportunity detail/exit analytics and tombstones.
- Opportunity health report passed both flag states with zero actionable errors; maintenance validation passed.
- Desktop/mobile visual review of Mugg & Bean detail and Free Stuff parent.
- Free Stuff HTML tag indentation was reduced to accommodate restored content within the existing size budget: 116,784 bytes against a 118,407.5-byte hard limit. No cards or visible content removed; exact navigation contract retained. Informational growth warnings remain.
- Historical-output test reconstructs prior reviewed URLs/dates and publication status from retained evidence, so current reviews and withdrawal do not rewrite the September snapshot. Saved output hashes were not refreshed.

Final `npm run lint` completed successfully (exit 0): no hard link failures or unreviewed warning changes; opportunity evidence/publication health passed. Reviewed automated-access blocks remain supported by the exact official-source checks. All 19 reviewed records passed final route/sitemap/exit parity: 18 restored and Spur held. `git diff --check` passed. This work has not been committed or deployed.


## Authorised release update

The owner subsequently directed publication of unresolved Spur under unverified and authorised commit/push. Added its separate under-review record with explicit reward wording, the conflicting source and terms, possible purchase cost and a 6 November review deadline. The original opportunity remains withdrawn from verified discovery and application exits. This supersedes the earlier local-only status above.
