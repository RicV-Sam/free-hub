# Supplied Competition Data Review — 11 July 2026

## Outcome

The supplied pasted-text research is not safe to import directly into `data/competitions.json`. It mixes competitions, awards, events, paid promotions, loyalty benefits, birthday offers, and already-expired entries. Many rows do not contain an actual URL, and several dates contradict other parts of the same file.

No public Freehub data was changed during this review.

## Strong candidates not currently in Freehub

These candidates have a live official source, a closing date after 11 July 2026, and no title/brand match in either Freehub's active or expired competition data.

| Priority | Candidate | Closing date | What is confirmed | Official source | Recommended action |
| --- | --- | --- | --- | --- | --- |
| 1 | National Arts and Culture Awards 2026 | 17 July 2026, 23:59 | Nominations opened 19 June; official nomination process and deadline are present. | https://naca.dsac.gov.za/ | Capture full rulebook, eligible nominators/categories, prize/recognition wording and entry-cost position, then add as a held candidate. |
| 1 | JOMBA! Digital Open Horizons 2026 | 20 July 2026 | Digital dance-film submissions of 5–10 minutes; R2,500 jury award; local, African and international choreographers; application form linked by UKZN. The live platform closed 29 June and must not be included. | https://jomba.ukzn.ac.za/applications-now-open-for-the-2026-jomba-open-horizons-platforms-live-and-digital/ | Add only the digital platform as a held candidate after confirming application-form terms and whether Freehub wants opportunities open beyond South Africa but available to South Africans. |
| 1 | SALRC Legal Essay Writing Competition | 31 July 2026, midnight | Official Justice page confirms LLB/LLM eligibility at South African institutions, 4,000–6,000 words, email entry and Incredible Connection/Juta prizes. | https://www.justice.gov.za/salrc/LegalEssayComp.html | Strong publication candidate after resolving the official page's inconsistent season/prize-year wording and verifying the linked rules. |
| 2 | Schock Foundation Prize for Singing 2026 | 21 August 2026 | Official UCT page confirms full-time SACM student eligibility, repertoire requirements and R55,000 prize pool. | https://humanities.uct.ac.za/college-music/2025-schock-foundation-prize-singing | Add as a held candidate; flag the URL's `2025` path and the page's stale “24th” wording despite its 2026 dates and “25th” heading. |
| 2 | iPendoring Awards 2026 | Early bird 1 August; regular 21 August; extended 28 August 2026 | Official site confirms South African indigenous-language creative categories and deadlines. | https://www.pendoring.co.za/ | Review entry fees and category-specific rules first. This is likely paid entry and should not be presented as a free giveaway. |

## Plausible leads that still need an official-source check

Do not add these from the supplied text alone:

- South African Agricultural Awards — the supplied text claims 31 July 2026, but no official URL was supplied or confirmed in this review.
- Teksmark 2026 — claimed deadline of 17 July 2026; needs an official current call and rules.
- Connections Through Culture Grants — may be a grant opportunity rather than a competition; needs the official South Africa eligibility page and current deadline.
- Babel Music XP 2027 Showcase — needs current official eligibility, location, costs, and South African applicability.
- South African Tertiary Mathematics Olympiad — the supplied text says registration opens 13 July, so it was not open on the review date; recheck after opening.
- Kokkedoor: Klassiek — deadline is claimed as 12 July, but the supplied file gives no usable official URL or terms.

## Exclude from competition import

- Professional or invitational sports fixtures and leagues: SA20, Currie Cup, SA Cup, test series, youth weeks and similar events are not public prize-entry competitions.
- Entries with deadlines already before 11 July 2026, including Nedbank Business Ignite, Standard Bank Kasi SME Pitch Challenge, SA Women in Science Awards, CIPC IP Youth Awards, National Science Olympiad, 3MT, EDHE InnoVarsity, Content Creator Awards and the listed early-July promotions.
- Free events, markets, cashback, free gifts with purchase, birthday benefits and mobile-plan benefits. These may suit a separate deals/free-resources product, but they do not fit `data/competitions.json` without a deliberate taxonomy decision.
- Rows whose “URL” is only a publisher or company name, an aggregator, a media report, or “No direct link found.” Freehub should use an official promoter page or official terms.

## Data-quality issues in the supplied file

- “Currently open” rows include deadlines that had already passed on 11 July 2026.
- Nedbank Business Ignite appears with both 3 July and 9 July deadlines.
- The final consolidated section omits actual URLs and gives labels such as “Nedbank Personal” and “AllEvents.”
- Several items say “ongoing,” “2026,” “various,” or “check status,” which is insufficient for Freehub lifecycle automation.
- The text contains mojibake/encoding damage and should not be copied into production fields.
- It conflates free entry, purchase-required entry, paid awards, customer-only rewards, events, jobs/fellowships and grants.

## Recommended next pass

Create private held rows only for the five strong candidates, after collecting the official rules and completing Freehub's required fields: exact title, prize, closing timestamp, entry method, entry cost/purchase requirement, eligibility, official source and terms URLs, region, evidence notes, and image review. Publication should remain a separate explicit decision.
