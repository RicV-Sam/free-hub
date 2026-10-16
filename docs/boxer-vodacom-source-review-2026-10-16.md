# Boxer and Vodacom source review — 16 October 2026

The user authorised adding these two opportunities with suitable images and clear entry conditions, then publishing them. This release uses an isolated checkout of current `origin/main`; unrelated primary-checkout changes are excluded.

## Boxer & Colgate tablet draw

- Record: `boxer-colgate-lenovo-tablets-2026` in `data/competitions.json`.
- Official campaign/instructions: https://www.boxer.co.za/page/competitions
- Complete official rules: https://www.boxer.co.za/storage/web/source/2026/Competition%20T%26Cs/Sep%20ME/Boxer%20%26%20Colgate%20Ts%26Cs.pdf?_t=1789977723
- Card setup: https://www.boxer.co.za/page/boxerrewardsclub
- Original poster: https://www.boxer.co.za/storage/web/source/1/3oGz-a-XFqkWEb40Ura6gCDAMFHpLRhH.jpg

The current index, complete two-page rules and poster agree on the two-product purchase, Rewards Club card swipe, 20 Lenovo Idea Tablets and 8 November close. The valid registered/activated card requirement is corroborated by the official Rewards Club material. Entry is automatic at the till; the website is an instruction/source destination. Separate qualifying transactions permit repeat entries.

South African legal residents aged 18+ need valid South African ID/Smart Card. Promoter-connected and three-month prior Boxer-winner exclusions, random draw by 27 November, entered-store collection, substitution, privacy and optional publicity conditions are visible on the detail page. The rules specify 00:01 on 21 September through 23:59 on 8 November without a named timezone; treating those as South African local times is an explicit implementation assumption, disclosed on the page. No tablet valuation, model or accessories are inferred from the poster.

The complete official portrait was resized without cropping to 1200×1552 WebP, 198,994 bytes. SHA-256: `2bffdf6f98f76e22029875d2cdcd17ac624a5a480046262055a2d76c56563a41`. The image registry records source, dimensions, alt text, review date and official-art caption.

## Vodacom Summer Scratch & Win Daily

- Record: `vodacom-summer-scratch-win-2026` in `data/offers.json`, as a conditional mobile-data deal.
- Official campaign and outbound destination: https://www.vodacom.co.za/vodacom/shopping/summer
- Full terms: https://www.vodacom.co.za/vodacom/terms/promotions/summer-2026
- Official focused artwork: https://www.vodacom.co.za/sites/vodacomcoza/files/2026-10/summer26-stepper-image.webp

The full terms are repeated twice in the source HTML. The 110 numbered clauses in each copy were compared; the only difference was a punctuation mark in support clause 17.7. No substantive conflict was found. The campaign page corroborates three free daily plays, while the terms specify the combined cross-channel limit and the one-play USSD maximum.

The page explains Vodacom service/SIM eligibility, VodaBucks opt-in and automatic enrolment, VodaPay/USSD routes, combined daily limits, same-day play expiry, variable reward types and validity, VodaBucks claiming/banking deadlines, South African redemption, optional paid plays and Upsize, normal connectivity/usage costs, opt-out and separate marketing-SMS opt-out. It does not invent an 18+ rule or promise a cash value or win. The separate spend-based promotion is distinguished from daily free plays.

The existing deal renderer and editorial-sections registry carry these conditions without adding a new opportunity type or changing publication gates. The original focused 461×520 WebP is retained byte-for-byte, 44,778 bytes, SHA-256 `5fbd14aa9c1f47987bb93a215aac5034df935891c875c11b7a8cebd6b6a527f4`. The shared listing-hero style preserves intrinsic image size up to the responsive container width to avoid enlarging this provider asset beyond its supplied resolution; larger assets still scale down on narrow screens.

## Review boundary and validation

Local current, archive, held/unverified, offers, opportunities, free resources and student-guide records were checked along with current remote and production snapshots during discovery. Neither exact campaign was already listed. This release changes these two listings, their editorial conditions, official image registry/assets, intrinsic-size hero styling and the inventory/count baselines needed for the additions, plus normal generated outputs. Removing the new Boxer row reproduces the prior compact cost-label hash exactly; all prior labels remain unchanged.

No purchase, competition entry, card registration, VodaBucks opt-in or reward claim was performed. Raw source downloads, timestamps, hashes, screenshots, checks and deployment receipts are retained privately under the dated Boxer/Vodacom release evidence directory in ZA Comp Engine storage. Source verification establishes the published instructions, not individual account eligibility, store stock, a guaranteed win or reward availability.

Local validation passed with the production flags (opportunities enabled; offers enabled): build, 160 lifecycle tests, 30 game tests with one existing skipped test, link/lint checks and maintenance validation. Browser checks at 1440px, 390px and 320px confirmed loaded official images, expected canonicals, one H1, indexable metadata, key conditions and no horizontal overflow. Desktop/mobile artwork screenshots were inspected; the original poster is contained without cropping and Vodacom's small asset is not enlarged beyond its intrinsic width. An existing MTN deal image was also checked after the shared sizing adjustment. Layout checks blocked third-party requests; production runtime and live deployment verification are separate checks recorded in the private release receipt.
