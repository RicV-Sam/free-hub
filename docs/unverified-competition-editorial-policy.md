# Unverified competition discovery policy

Freehub's public under-review page is a discovery surface for current South African competition leads that have not passed the normal verification gate. It exists to help users see what is online without presenting incomplete evidence as a verified listing.

## Ongoing discovery direction

The owner's direction on 30 October 2026 is to continue developing both verified competition coverage and unverified discovery. Do not limit research to campaigns that already have complete verification evidence, or discard an identifiable, useful lead solely because checks remain unresolved.

Capture as much relevant information as the available sources support: promoter, reported prizes and dates, eligibility, entry steps, purchase/account/app requirements, costs, exclusions and source links. Distinguish confirmed facts from reported claims, missing information and conflicting sources. Preserve source provenance and truthful review dates; do not fill gaps with assumptions or copy entire source pages. Unverified does not mean proven legitimate, proven fraudulent or endorsed by FreeHub.

Use the separate under-review cards and detail pages for leads that meet the publication boundary below. Missing official sources require the existing explicit disclosure and no entry link. Keep review windows, duplicate checks, expiry rules and publication approval requirements intact. Broader useful search coverage is an objective; indexing, traffic and SEO uplift must be measured rather than assumed from adding pages.

## Publication boundary

Only records in `data/unverified-competitions.json` with all of the following may appear:

- `publicationStatus: "public-under-review"`
- `verificationStatus: "not-verified"`
- `doNotPublish: true`
- a valid HTTPS source outside Freehub, or explicit `sourceCheckStatus: "not-located"` with a truthful `sourceNote` identifying the supplied research lead
- complete display fields, including the unresolved evidence gap and last-checked date
- a closing date on or after the build's lifecycle reference date, or an explicitly unknown deadline with a valid `reviewDueAt`
- no future `listedAt` date or overdue `reviewDueAt`

`doNotPublish: true` continues to block the record from the verified competition pipeline. The generator uses a separate reader and renderer for the collection and its individual `/unverified-competitions/{id}/` pages. This follows the owner's 30 October 2026 direction to make identifiable unverified leads discoverable with their evidence gaps clearly explained.

Under-review records must never produce individual `/competition/` pages, `/out/` redirects, verified cards, ItemList competition schema, mobile-app feed entries, category/tag/brand listings or verified sitemap URLs. Each current individual under-review page is indexable, self-canonical, linked from the collection and included in the sitemap. The collection is indexable while at least three current records provide substantial consumer value. Expired or overdue leads leave the collection and sitemap, and their generated detail files are removed. Indexable does not guarantee search-engine indexing.

## Required editorial content

Each record must state the promoter or brand, title, prize shown, stated closing date, apparent entry route, cost uncertainty, source URL, last-checked date and a specific reason Freehub has not verified it. Do not use generic wording where the evidence gap is known.

The collection presents compact, clickable preview cards with a Not verified badge, reported prize/date, cost summary and an unresolved-checks excerpt. Each card opens its separate under-review detail page, where the complete evidence gap, entry information, review date and available promoter sources remain visible. Preview cards must not use verified badges or imply that a reported prize or deadline has been confirmed. Label generated artwork and missing official sources on the preview as well as the detail page.

Use a direct promoter or campaign source. Do not add affiliate parameters, tracking redirects or third-party competition aggregators. The public link is marked `nofollow` and opens the source directly.

To fulfil the owner's all-leads coverage direction, an identified research lead may have a source-missing page. Label the claimed prize, dates and promoter as reported, explain that no official campaign source was located, and omit the entry/source CTA entirely. Do not invent a URL or link an aggregator as if it were official. Such records still require a bounded review window and remain separate from verified listings.

## Moving a record to verified

1. Recheck the official source and complete terms.
2. Resolve every material evidence gap, especially eligibility, entry mechanics, cost, dates, prize detail and privacy implications.
3. Add a complete record to `data/competitions.json` using the normal published verification state.
4. Remove the lead from `data/unverified-competitions.json` in the same change.
5. Regenerate the site and run the lifecycle, SEO and maintenance checks.
6. Confirm there is one verified detail page and redirect, with no duplicate under-review card.

If the evidence remains contradictory, incomplete or inaccessible, leave the lead under review or remove it. Do not weaken the verified standard to preserve inventory.

## Explicitly requested reward reviews

On 30 October 2026 the owner directed that the unresolved Spur children's birthday reward be published under unverified. An existing reward may be reclassified here with `listingType: "reward"`, retaining its original official sources and a bounded review date. Describe it as a loyalty reward, not a prize draw; disclose the exact conflicting benefit/cost conditions. The original opportunity remains excluded from verified cards, application exits and app feeds. This does not waive the verified publication gate or establish that the provider ended the reward.
