# Unverified competition discovery policy

Freehub's public under-review page is a discovery surface for current South African competition leads that have not passed the normal verification gate. It exists to help users see what is online without presenting incomplete evidence as a verified listing.

## Publication boundary

Only records in `data/unverified-competitions.json` with all of the following may appear:

- `publicationStatus: "public-under-review"`
- `verificationStatus: "not-verified"`
- `doNotPublish: true`
- a valid HTTPS source outside Freehub
- complete display fields, including the unresolved evidence gap and last-checked date
- a closing date on or after the build's lifecycle reference date

`doNotPublish: true` continues to block the record from the verified competition pipeline. The generator uses a separate reader and renderer for this one collection page.

Under-review records must never produce individual `/competition/` pages, `/out/` redirects, verified cards, ItemList competition schema, mobile-app feed entries, category/tag/brand listings or verified sitemap URLs. The collection page is indexable and included in the sitemap only while at least three current records provide substantial consumer value.

## Required editorial content

Each record must state the promoter or brand, title, prize shown, stated closing date, apparent entry route, cost uncertainty, source URL, last-checked date and a specific reason Freehub has not verified it. Do not use generic wording where the evidence gap is known.

Use a direct promoter or campaign source. Do not add affiliate parameters, tracking redirects or third-party competition aggregators. The public link is marked `nofollow` and opens the source directly.

## Moving a record to verified

1. Recheck the official source and complete terms.
2. Resolve every material evidence gap, especially eligibility, entry mechanics, cost, dates, prize detail and privacy implications.
3. Add a complete record to `data/competitions.json` using the normal published verification state.
4. Remove the lead from `data/unverified-competitions.json` in the same change.
5. Regenerate the site and run the lifecycle, SEO and maintenance checks.
6. Confirm there is one verified detail page and redirect, with no duplicate under-review card.

If the evidence remains contradictory, incomplete or inaccessible, leave the lead under review or remove it. Do not weaken the verified standard to preserve inventory.
