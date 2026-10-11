# Source access review — 11 October 2026

This supporting maintenance review accompanies the 16-action editorial release. Researcher verification labels were not used as proof. Official pages, terms and the referenced Spur PDF were read directly. No entry, quote, account registration or redemption was submitted.

## Competition access exceptions

The strict checker reported five expired manual-access exceptions and eight current HTTP 429 responses. The five existing exceptions were refreshed only after current official content was read. The eight additional exceptions are pinned to the exact competition ID and official URL in the checker allowlist. They retain the existing 30-day recheck requirement and domain checks; no HTTP, expiry, publication or cost rule was removed.

| Competition | Official route reviewed | Evidence route |
| --- | --- | --- |
| 1Life funeral quote | https://www.1life.co.za/competitions/be-the-1-to-win-sept-funeral | Official page and embedded terms |
| Capitec Tactical Flexi Voucher | https://www.capitecbank.co.za/competitions-and-conditions/ | Linked official 2026 Tactical PDF |
| Clicks BabyClub hamper | https://www.clicks.co.za/clubcard/competitions/babyclub-magazine-september-issue-of-2026 | Browser HTTP 200; linked https://woobox.com/f65xbp/rules separately HTTP 200 and read |
| Nedbank Appventure | https://personal.nedbank.co.za/legal/terms-and-conditions/appventure-map-your-future-competition.html | Official terms |
| Wanderlust Reader Travel Awards | https://wanderlusttravelawards.com/ | Official 2026 master terms on wanderlustmagazine.com |
| Ackermans lay-by | https://www.ackermans.co.za/blogs/financial-services/lay-by-win-a-samsung-a07-ts-cs | Browser HTTP 200; actual terms read |
| Burnt Horse Power | https://burnt.co.za/pages/terms-and-conditions | Browser HTTP 200; specific competition section read |
| De Grendel / HAUS | https://degrendel.co.za/blogs/news/r20000-giveaway-haus-wine-homeware | Browser HTTP 200; campaign conditions read |
| DeskStand | https://www.deskstand.com/pages/give-away-3-winners | Browser HTTP 200; https://www.deskstand.com/pages/competition-t-cs separately read |
| Edgars At Our School | https://www.edgars.co.za/pages/supersport-schools | Browser HTTP 200; https://www.edgars.co.za/pages/competition-terms-conditions also HTTP 200, specific campaign section read |
| Fox King of the Whip | https://www.foxracing.co.za/pages/fox-kotw-ticket-giveaway | Browser HTTP 200; campaign terms read |
| Glowming Cape Town | https://glowming.co.za/pages/win-cape-town | Browser HTTP 200; linked https://glowming.co.za/pages/competition-rules also HTTP 200 and read |
| Jockey 150 | https://jockey.co.za/pages/competition-terms-conditions | Browser HTTP 200; campaign terms read |

Existing competition entry facts, publication dates and closing dates were preserved. The Clicks authenticated submission remains untested and disclosed. The Wanderlust access refresh does not replace a full new review of each sponsor itinerary.

## Opportunity source ledger

Twenty-five exact source/terms entries were appended for 18 older published-status records after the actual referenced official content was read. The four Coloplast campaigns and their shared sample terms, Blind Designs, the attraction and birthday pages, Ster-Kinekor, McDonald's, Spur, Mugg & Bean and Ocean Basket were inspected. The current-entry validity window ends on 18 October 2026.

No old opportunity `lastVerifiedAt`, `reviewDueAt`, `publishedAt` or publication status was advanced by this supporting refresh. Overdue listings remain closed and excluded from promotion. Reading a source for access evidence does not approve an overdue listing for republication. Cape Wheel's 30-day versus one-month wording and Spur's marketing versus PDF meal description remain full-publication-review issues.

## Free resource outcomes

The exact TransUnion, ClearScore, Coloplast directory and gov.za municipal guidance were read through the official-source research reader. Their manual-access evidence was refreshed; broader editorial review timestamps were preserved.

Brand Advisor could not be read: both the real browser and direct request returned HTTP 403. Its resource is now `verification_due` and withheld. ReviewClub was already withheld and remains so; its certificate failed again. Neither failure was described as proof of expiry or closure.

The Spur app route returned HTTP 403. Its already referenced official July 2025 PDF was retrieved successfully, SHA256 `f05ae10f3ff093978226dabf1476688245d0c2f6520a5775585eaf9018b2b137`. Section 5 supports the existing spend-linked R50 birthday voucher description. The durable resource now links directly to that accessible official PDF and has a 30-day editorial review window. Its stale access exception was removed.

## Release review correction

Independent release reviews identified the fuel-guide offers-collection link issue. The link now has `requiresOffers: true`, using the existing feature-gate convention. It must be present with offers enabled and absent with offers disabled; final build checks record both outcomes.

## Limits

The warning-baseline update retained fifteen newly observed archived URL/field failures, plus the second observed HTTP variant for one of those fields. Each exact record and URL was checked against the competition registry and had a closing date before 11 October. The update also recorded gov.za's observed HTTP 500 as a manual-access warning after its official content was read. Existing entries were preserved. No active competition failure was added to the warning baseline. The rendered resource count checks now expect 31 durable resources and five sample resources and explicitly check that withheld Brand Advisor is absent.

Source availability checks are not proof of authenticated submission, product availability, winner selection or redemption. Manual exceptions are narrowly evidenced access workarounds. Archived broken URLs remain warnings where existing policy allows them; active broken URLs still fail. Build, test, deployment and live validation results are recorded separately in the release receipt.

## Browser regression comparison

The initial 87-test browser run had 30 failures, 56 passes and one skip. A clean checkout of current main (`75560b072c20dbcc4b57ccc8cd6b5b1f6d020d4e`), built for the same date and feature settings, had 26 failures, 60 passes and one skip. The four additional failures were enlarged-text reflow on the free-stuff page, two Spur source-review date assertions, and a handoff-module cache-version assertion reached by the renewed Starbucks opportunity.

Resource and opportunity grid tracks now shrink and wrap at 200% text size. Offer fact values also wrap; this resolves the next enlarged-text failure revealed by the same test. Spur assertions use the verified 11 October review, accessible PDF and spend condition, and explicitly exclude withheld Brand Advisor. The opportunity test counts the same handoff modules independently of their version query strings, retaining its robots, tracking, authentication, manual and automatic handoff checks.

All four enlarged-text/source-review tests and the measured opportunity detail/exit test passed after these repairs. The complete browser suite was not represented as passing: unchanged main also fails legacy advertising, dated fixture and external-consent checks. The release preserves the existing advertising and authentication implementation. Exact logs and the baseline comparison are retained with the release evidence.
