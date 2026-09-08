# Portfolio release link review - 8 September 2026

Later follow-up: [Chrome source review](chrome-source-review-2026-09-08.md) resolves the three current-listing decisions below: Spur reverified, McDonald's held after an official missing-page response, and Review Club withheld after Chrome's certificate error. This document preserves the earlier release snapshot.

The recovered code passes its deterministic, lifecycle and browser checks. The full live-link audit also checks older content; it is not an all-clear for that content. Its remaining failures must stay visible rather than receiving invented verification dates.

## Official sources rechecked

- [Astron GTI campaign](https://www.astronenergy.co.za/win-a-gti) and its linked terms support the qualifying R600 purchase, three GTI prizes and 31 October 2026 closing date.
- [IMANA Polofields terms](https://www.imana.co.za/superspar-polofields-potjie-dash-competition) support the R500 single-store transaction including two sachets, R5,000 grocery limit and 25 September closing date.
- [SPAR Tinkies terms](https://www.spar.co.za/My-SPAR/Competitions/View/Tinkies-Distraction-Levels-Competition) confirm the 24 August to 19 October 2026 promotion. The campaign URL is now in the validator's exact allowlist.
- [Capitec Tactical Flexi Voucher terms](https://www.capitecbank.co.za/globalassets/pages/competition-and-conditions/competitions/2026/capitec-tactical-flexi-voucher-competition-tcs.pdf) support the existing voucher range, adult Capitec client eligibility and 31 December 2026 end date.
- [TransUnion](https://www.transunion.co.za/product/annual-free-credit-report), [ClearScore](https://www.clearscore.com/za/), the [Coloplast ZA directory](https://products.coloplast.co.za/) and [government municipal-services guidance](https://www.gov.za/services/place-live/municipal-services) support the existing durable directory descriptions. Individual Coloplast sample applications were not reverified.

## Unresolved external checks

- McDonald's Nazo terms returned HTTP 403 to the local check; the web fetch also failed. Its July manual exception was not renewed.
- Review Club South Africa's direct HTTPS request failed certificate validation because the certificate had expired. A search index had readable content, but that is insufficient to certify the live destination; its July exception was not renewed.
- Spur's linked app terms returned HTTP 403 and the web fetch failed. Its July exception was not renewed.
- The Opportunity health report identifies 41 missing/expired evidence checks. The publication gates leave 34 detail pages closed/noindex and permit only one current opportunity exit on this snapshot. No stale source date was automatically renewed.
- Six newly observed competition warnings concern already-expired archive records (Nivea, two OFM records, Penguin Post 43, SPAR Melrose and Sunlight). Their old destinations return missing/error pages. They have no active entry route.

The strict live-link check remains a separate unresolved content audit. Do not describe its result as passed, or use these notes to approve or reactivate records. The release changes neither the three unresolved active/durable destinations nor their last successful evidence dates.
