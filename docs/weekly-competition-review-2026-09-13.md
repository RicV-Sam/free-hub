# Weekly competition publication review — 13 September 2026

The user authorised publication of Flight Centre and restoration of Wanta Fanta only if final verification passed.

## Flight Centre — publish

Added `flight-centre-new-york-flights-2026`, using the [official campaign and embedded terms](https://www.flightcentre.co.za/deals/spiderman-adventure). The qualifying holiday purchase, 30 September close, adult SA eligibility, two-flight prize and excluded travel expenses are explicit. The official campaign hero is stored locally. No match was found across local primary/archive/held, current remote primary/archive/unverified, or the live production feed at remote commit `42c71ba`.

The new detail route adds one file to the reviewed fixed detail count; the active count already accounts for its outbound route. The historical cost-label snapshot gains one purchase-required record. No generator or publication gate was weakened.

## Wanta Fanta — do not restore yet

The [current terms](https://www.coca-cola.com/za/en/legal/terms-and-conditions-wanta-fanta-gaming-2026-prize-draw) state two products, 160 prizes across the full campaign, a 30 September 23:59 South African close and draws through 1 October. The [campaign landing page](https://www.coca-cola.com/za/en/offerings/fanta/wanta-fanta) agrees on two packs; the [entry page](https://www.coca-cola.com/za/en/offerings/fanta/wanta-fanta/promo) displays a two-PIN requirement.

However, a browser check with necessary cookies only could not open registration. Clicking Enter Now resulted in `Could not sign in, login sdk not available.` The console showed a CORS failure loading the promoter's login SDK, and Enter Now became disabled. This is an observed failure in this environment, not proof that all entrants are affected. The currently linked promotional artwork also retains an August closing date. Specific updated terms provide stronger date evidence, but the entry-access failure remains unresolved.

The existing Wanta Fanta record and archive remain unchanged; no new duplicate or public restoration was made. Next verification should establish that the official login/entry route works and retain the revised campaign-specific conditions. Do not advertise 160 prizes as remaining.

## Validation

- Build and all 107 lifecycle tests passed, along with SEO, Free Stuff and Free Samples checks.
- Maintenance validation passed: no private, expired or outbound sitemap leakage.
- Desktop and 390px mobile page screenshots reviewed. The new image URL was mapped to its local asset for preview, because that URL is not deployed yet.
- Broad live-link lint exited nonzero for seven newly observed warnings on unrelated expired/archive sources (HTTP 429, HTTP 500 and fetch failure). Competition link validation itself reported zero errors, and Flight Centre's reviewed-source metadata passed. Resource and Opportunity checks reported no hard errors. No warning baseline was broadened.
- No promoter form was submitted and no personal details were entered.
