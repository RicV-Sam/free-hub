# Five new FreeHub competitions — 14 September 2026

Prepared for a scoped release from production base 2855da4. All 349 pre-existing production records are preserved. The original workspace contains separate uncommitted work and is not the release source.

## New competition URLs

1. https://freehub.co.za/competition/nescafe-gold-rush-spar-2026/
2. https://freehub.co.za/competition/heinz-heritage-spar-2026/
3. https://freehub.co.za/competition/huletts-heritage-2026/
4. https://freehub.co.za/competition/nedbank-moyaapp-consumer-education-2026/
5. https://freehub.co.za/competition/sasol-magpie-2026/

## Evidence and editorial decisions

| Listing | Evidence | Decision |
| --- | --- | --- |
| NESCAFÉ Gold Rush | [SPAR campaign and full terms](https://www.spar.co.za/Nescafe-Gold-Rush-SPAR-Rewards-Competition) | Five R100,000 travel vouchers; qualifying purchase and Rewards swipe; 8 November close. Keep original receipts. Midnight wording is ambiguous and the schedule and detailed rules disagree on draw/contact timing; no exact draw or claim deadline is invented. |
| Heinz Heritage | [SPAR campaign and full terms](https://www.spar.co.za/Heinz-Heritage-SPAR-Rewards-Competition) | One R15,000 Outback braai; two participating products and Rewards swipe; 14 September–25 October. Corrected the crawler's mistaken start-date extraction. |
| Huletts Heritage | [Campaign](https://www.hulettssugar.co.za/competitions/huletts-heritage-2026/) and [rules](https://www.hulettssugar.co.za/competitions/huletts-heritage-2026-competition-rules/) | Ten R5,000 prizes; unique recipe-and-story comments; 3 October close. The campaign directly links the Facebook and Instagram entry posts. No new purchase or receipt requirement is specified. Guardian assistance and consent apply to minors. Social submission was not tested. |
| Nedbank MoyaApp | [Official rules](https://personal.nedbank.co.za/legal/terms-and-conditions/consumer-education-competition-with-money-app.html) | Twenty R250 AVO vouchers; complete NedFinHealth survey and email; 5 November close. Use MoyaApp as stated in the rules, despite Money app in the URL/metadata. One entry per person, age/ID and prior-winner exclusions included. In-app entry was not tested. |
| Sasol Delight/Magpie | [Campaign](https://www.sasol.com/our-businesses/energy/mobility/sasol-competitions/spring-into-a-classic-bite-with-sasol-delight-and-magpie) and [four-page rules](https://www.sasol.com/sites/default/files/2026-09/Sasol%20Delight%20Terms%20%26%20Conditions%20-%20MagPie%20Competition.pdf) | Fifty R1,000 rewards-point prizes; qualifying pie, Rewards swipe and receipt upload; 21 October close. Campaign says vouchers, PDF says rewards points: public copy explicitly explains both. Citizenship/residence documentation, prior-winner exclusions and participating-store limits are included. |

Four campaign images were downloaded from official pages and visually checked. Nedbank uses the existing neutral FreeHub logo because its terms page supplies no campaign-specific raster artwork.

The generator accepts `officialDestinationType: "terms"` or `"instructions"` for the new records so button labels describe the actual linked destination. Existing records retain their previous CTA selection logic.

## Not added

- Clicks/TRESemmé: accessible page confirms 36 R1,500 mall gift cards and 5 October close, but does not establish complete entry and eligibility rules. Remains a research lead, with no public or held-data mutation.
- Airlink and Kaya/Bob: campaign closing dates remain unverified.
- Tafelberg: closes on 14 September; omitted from this durable batch.
- Vodacom Prime Video: selected-customer reward, not an open prize draw; not added to competitions.

## Validation and scope

Build, SEO, performance, Free Stuff/Samples checks, lifecycle tests and maintenance validation pass on the current production base. Mobile and desktop checks at 390px and 1440px pass for all five pages. The two new regression checks cover truthful CTA labels and exclusion of the travel voucher from the grocery-voucher collection.

The entry-cost snapshot and fixed detail-page count were advanced only for this five-record batch. Heinz uses the established Lifestyle category. A narrow holiday-prize guard prevents the SPAR travel voucher from falsely activating the grocery-voucher collection; the five competition detail URLs are the only added sitemap URLs.

Strict link checks report zero competition hard errors and pass Opportunity evidence/publication health. Strict lint remains non-green because older archived URL warning identities changed (primarily HTTP 429/timeouts); no warning baseline was weakened and no new batch URL failed.

The earlier failures reported from the old dirty workspace are not the production release validation result. No ads, Student Guide or unrelated listing changes are included.

## Search engines

The five URLs above are the exact GSC URL Inspection targets after deployment. They have not been submitted manually. The sitemap is regenerated with these five additions; no GSC sitemap resubmission has been performed. Deployment workflow IndexNow/Bing outcomes must be checked separately. IndexNow is not GSC submission or indexing proof.
