# Extensive Online Competition Validation — South Africa

**Research date:** 11 July 2026

**Scope:** Validate the supplied pasted-text list, find additional currently open opportunities, and identify results that can safely enter Freehub's private review workflow.

**Publication status:** Research only. No rows were published or added to `data/competitions.json`.

## Validation method

A result is **validated open** only when an official promoter, government, university, organizer, or official terms page confirms a closing date after 11 July 2026. Search snippets, aggregators, media summaries, generic company homepages, and event-directory pages are not sufficient by themselves.

Confidence labels:

- **A — terms verified:** official rules/terms confirm period, eligibility, entry mechanic and prize.
- **B — official page verified:** official page confirms the opportunity and closing date, but one or more publication fields still need a linked rulebook or category-specific detail.
- **C — lead only:** plausible result, but not safe to import until the missing official evidence is obtained.

## Validated open consumer competitions — strongest new Freehub candidates

The repository comparison covered both `data/competitions.json` and `data/archive/competitions-expired.json`.

| Confidence | Competition | Closes | Entry and eligibility | Prize | Official evidence | Repo result |
| --- | --- | --- | --- | --- | --- | --- |
| A | aQuellé Pause & Win | 31 Jul 2026, 23:59 | South African residents; under-18s need guardian assistance. Pause the official Facebook/Instagram video and comment with the visible drink. One entry per platform. | 1 aQuellé hamper | https://aquelle.co.za/wp-content/uploads/2026/06/aQuelle-Pause-Win-Competition-TCs_June-2026.pdf | New campaign; existing aQuellé record is a different, expired Mzansi Mango promotion. |
| A | Dr. Oetker Taste the Upgrade | 31 Aug 2026 | Residents of SA, Eswatini and Namibia, 18+. Buy 2 participating Ital Pizza Classic/Familia pizzas, then enter on WhatsApp with a unique till slip. | 3 hosting kits worth R14,196 each and 50 weekly R1,000 prizes | https://www.oetker.co.za/taste-the-upgrade-competition | No repo match. |
| A | Ultra Mel Christmas in July | 30 Aug 2026 | SA residents, 18+. Xtra Savings membership and qualifying Ultra Mel purchases at Checkers, selected Shoprite regions, or Sixty60. | 150 UNIQ vouchers worth R1,500 each | https://corporate.danone.co.za/content/dam/corp/local/zaf/2025/2026-new-images-/UltraMel_15.05.26%20.pdf | No repo match. |
| A | Castle Lager FIFA World Cup 26 Cans | 31 Aug 2026 | SA residents, 18+. Buy, scan and physically collect all 26 limited-edition 500ml Castle Lager cans; earliest verified completion wins. | R1,000,000 cash; 1 prize | https://www.castlelager.co.za/sites/g/files/seuoyk1831/files/2026-05/FIFA_World_Cup_26_Castle_Lager_Cans_Competition_Rules.pdf | No exact match. Two other Castle campaigns exist; do not merge them. |
| A | First Battery Centre Win a Car | 31 Aug 2026 | SA citizens/permanent residents, 18+. Buy any automotive battery at an official participating store and register its warranty in-store. | 1 car; model is not identified in the opened rules text | https://firstbatterycentre.co.za/competition_terms_and_conditions/First-Battery-Centre-Win-a-Car-Terms-and-conditions.pdf | No repo match. Hold until the exact vehicle is verified from official campaign material. |
| A | Hadeco 80th Birthday Competition | 1 Sep 2026, 23:59 | SA residents, 18+. Follow Hadeco and Black Horse Brewery, like the post, share a public garden memory/photo/story, tag seven guests and answer the question. | Hadeco Flowering Fields experience for winner + 7, with guided walk, gifts, tasting and light food; travel/accommodation excluded | https://hadeco.co.za/pages/hadeco-80th-birthday-competition-terms-conditions | No repo match. |
| A | The Witness Cape Town Trip for Two | 30 Aug 2026 | SA residents, 18+. New 12-month debit-order newspaper subscription at R255/month; qualifying existing paid-up subscribers enter automatically. | Flights for 2, 3 hotel nights with breakfast, sightseeing and car rental | https://witness.co.za/ts-cs/ | No repo match. Clearly subscription-required. |
| A | Kampi / Multi Risk Refer and Escape | 16 Jul 2026 | SA residents, 18+. Refer someone for a no-obligation insurance quote; no purchase necessary. | Bushveld weekend for 2 on 7–10 Aug plus a conditional R100 shop discount for entrants | https://kampi.co.za/blog/refer-escape-win-bushveld-weekend | No repo match. Short deadline; prioritize immediately. |
| A | NCWSA Refurbished Dell Laptop Giveaway | 31 Jul 2026, 23:59 | SA residents, 18+. Follow official Facebook/Instagram accounts, tag 2 friends and share the post. No purchase. | Refurbished Dell Core i5 laptop, 8GB RAM, 256GB SSD, Windows 11 | https://www.ncwsa.co.za/competitions/ | No repo match. Validate the official social post remains live before publication. |
| B | Hyundai Host a Bok | 31 Jul 2026 | Book a Hyundai service through the official campaign page before closing. | Host rugby personalities John Smit and a mystery Springbok at the winner's home | https://www.hyundai.co.za/book-a-service | No exact match. Linked detailed terms must be captured before publication. |
| B | Nu Metro Max the Experience | 21 Jul 2026 | SA residents, 18+. Official terms say the campaign runs from the first show on 19 Jun to the last show on 21 Jul; ticket purchase conditions apply. | Campaign-specific prize detail needs extraction from the correct section of the large rolling terms page | https://numetro.co.za/terms-and-conditions/ | No exact match identified. Hold until the complete campaign section is isolated. |
| B | Everest Wealth SPCA Adoption Day Competition | 17 Jul 2026, 17:00 | SA residents, 15+. One entry per person and winner must attend the SPCA Adoption Day on 25 Jul. | Prize detail requires the downloadable official rules/campaign post | https://everestwealth.co.za/csr/everest-wealth-gives-back-rebuilding-hope-at-the-spca/ | No repo match. Not publication-ready until prize and entry mechanic are complete. |

## Validated open awards, academic and creative opportunities

These are valid, but most do not fit Freehub's current consumer-prize categories (`Cars`, `Cash`, `Holidays`, `Tech`, `Vouchers`, `Sports`, `Lifestyle`) cleanly. Add them only if Freehub deliberately supports awards/academic opportunities.

| Confidence | Opportunity | Closes / opens | Verified facts | Official source | Freehub decision |
| --- | --- | --- | --- | --- | --- |
| B | National Arts and Culture Awards 2026 | 17 Jul 2026, 23:59 | Official DSAC site confirms nominations opened 19 Jun, nomination process and deadline. | https://naca.dsac.gov.za/ | Valid. Obtain rulebook/category and recognition details before a held row. |
| A | JOMBA! Digital Open Horizons | 20 Jul 2026 | 5–10 minute dance-film submissions; local, African and international choreographers; R2,500 jury award. The separate live platform closed 29 Jun. | https://jomba.ukzn.ac.za/applications-now-open-for-the-2026-jomba-open-horizons-platforms-live-and-digital/ | Valid digital opportunity only. Do not describe the live platform as open. |
| A | SALRC Legal Essay Writing Competition | 31 Jul 2026, midnight | Registered LLB/LLM students at SA institutions; 4,000–6,000 English words; email submission; Incredible Connection and Juta prizes. | https://www.justice.gov.za/salrc/LegalEssayComp.html | Valid but hold: official page inconsistently calls it the “2025 season” while published in 2026 and contains prize-year wording that needs clarification. |
| B | Schock Foundation Prize for Singing | 21 Aug 2026 | Full-time UCT South African College of Music classical voice students; at least second year and good standing; R55,000 total prizes. | https://humanities.uct.ac.za/college-music/2025-schock-foundation-prize-singing | Valid but hold: URL says 2025 and body contains stale “24th” wording alongside 2026/25th details. |
| B | iPendoring Awards 2026 | 1 Aug early; 21 Aug regular; 28 Aug extended | Indigenous-language creative awards; entries must be at least 70% in an eligible SA language and include an English translation. | https://www.pendoring.co.za/ | Valid, likely paid. Capture fee/category rules before listing. |
| B | South African Tertiary Mathematics Olympiad | Opens 13 Jul; online closes 7 Aug; event 15 Aug 2026 | Individual two-hour tertiary competition; students usually write at home universities. | https://www.samf.ac.za/en/tertiary-olympiad | Valid but **not yet open on 11 Jul**. Recheck and import from 13 Jul onward. |
| B | SA Olympiads school registration | Schools close 28 Jul 2026 | Official site says independent-candidate registration closed 30 Jun, while school registration remains open to 28 Jul. | https://saolympiads.co.za/ | Valid only for school registrations; not an open individual-entry listing. |
| B | PRISM Awards 2026 | 2 Aug 2026, 23:59 | Official entry portal confirms entries opened May and final submission deadline. | https://entries.prisms.co.za/Submission | Valid professional award; capture fees, eligibility and prizes/recognition. |
| B | CapeBPO Awards 2026 | Opens 13 Jul; closes 31 Jul 2026 | Official page/info pack confirms future opening and closing date. | https://capebpo.org.za/capebpo-awards-2026/ | Valid but future-opening on the research date. |
| B | SAICE National Awards 2026 | 24 Jul 2026 | Official SAICE awards page gives the closing date and award context. | https://saice.org.za/awards-2-2/ | Valid professional award; rule/category evidence still needed. |
| B | Veritas Awards 2026 | 7 Aug; late entries 19 Aug 2026 | Current organizer/industry announcement confirms entries and dates for SA wine producers. | https://news.wine.co.za/News.aspx?CLIENTID=&NEWSID=47237&SPOTLIGHTID= | Valid industry competition; obtain the Veritas entry portal/rules as primary evidence before import. |
| B | SAMS Bronze Medal Award | 15 Sep 2026 | Universities may apply to award the medal to their top Honours Mathematics/Applied Mathematics student. | https://www.sams.ac.za/2026/03/06/call-to-universities-sams-bronze-medal-award/ | Valid institutional recognition, not a general public competition. |

## Supplied-list claims disproved or corrected

| Supplied claim | Validated result |
| --- | --- |
| South African Agricultural Awards open until 31 Jul 2026 | **False/expired.** Official terms state entries closed 31 Mar 2026: https://agriawards.co.za/terms-and-conditions/ |
| SA Mathematics Olympiad currently open | **Closed.** Official registration deadline was 20 Feb 2026: https://www.samf.ac.za/en/online-entry-2026 |
| SA Mathematics Challenge / Kangaroo generally open | **Not supported as current open entry.** 2026 school-led competition dates are earlier; do not publish without a current registration route. |
| National Science Olympiad open with 10 Apr deadline | **Closed by the supplied date itself.** It cannot be described as open on 11 Jul. |
| Three Minute Thesis open until 2 Jul | **Closed by the supplied date itself.** |
| Nedbank Business Ignite open until 3 or 9 Jul | **Closed and internally contradictory.** Both dates precede the research date. |
| EDHE InnoVarsity open until 29 May | **Closed by the supplied date itself.** |
| Standard Bank Kasi SME, SAWISA, CIPC IP Youth Awards open | **Closed by the supplied dates.** |
| Youth Tech Expo G13 Hackathon open | **Not credible as open.** The supplied text says its provincial finale was 29–30 Jun and provides no official current application URL. |
| GCIP-SA closes 11 Jul | **Do not list as open on 11 Jul without an exact closing time and live official form.** It is at best closing-day/manual-check status. |
| Kokkedoor: Klassiek closes 12 Jul | **Unverified.** No usable official source or rules were established in this pass; media reports are insufficient. |
| Bonne Maman 2026 closes 31 Jul | **False positive from indexed text.** Opening the official page shows the promotion closes 31 Aug **2025**, not 2026: https://rialtofoods.co.za/bonne-maman-competition/ |
| Generic birthday freebies are current competitions | **Wrong content type.** They are loyalty/benefit claims and need separate current-program validation; they do not belong in competition data. |
| Shoprite scratch card, Wimpy, Vodacom #DankoVodacom, Nedbank Appventure and other early-July offers are active | **Expired by 11 Jul** according to the supplied deadlines. |

## Supplied entries that are events or benefits, not public competitions

Exclude from `data/competitions.json` unless Freehub creates a separate content model:

- Professional/invitational sport: SA20, Currie Cup, SA Cup, international test series, national championship fixtures and youth weeks.
- Paid race registrations without a prize draw: Absa RUN YOUR CITY and SPAR Women's Challenge.
- Markets, festivals, tours, film screenings and free-entry events.
- Cashback, preferential interest, free data, gifts with purchase, birthday rewards and loyalty vouchers when no draw or judged contest exists.
- Fellowships, jobs, grants, conference registration and calls for papers unless Freehub explicitly launches an opportunities directory.

## Additional valid result that should remain outside competitions

Standard Bank's Business Savings and Investments campaign runs 1 Jul–31 Aug 2026 and offers preferential interest rates, but it is a financial product promotion, not a prize competition. It should not be imported into Freehub competitions: https://www.standardbank.co.za/static_file/South%20Africa/PDF/Business%20Ts%20and%20Cs/2026/Promotional_Offer_T%26Cs-Business_Savings_%26_Investments.pdf

## Recommended import order

1. **Immediate held-candidate capture:** Kampi, National Arts and Culture Awards, JOMBA Digital, Everest SPCA (after prize verification).
2. **High-value consumer competitions:** Castle Lager R1m, First Battery Centre car, Ultra Mel, Dr. Oetker.
3. **Other strong consumer listings:** aQuellé, NCWSA, Hadeco, The Witness, Hyundai (after linked terms extraction), Nu Metro (after isolating full campaign terms).
4. **Separate taxonomy decision:** SALRC, SATMO, Schock, iPendoring, PRISM, CapeBPO, SAICE, Veritas and other professional/academic awards.

Every imported row should enter Freehub as private/held until its complete source and terms evidence has been mapped. This report is evidence for review, not publication approval.
