# Coupons and Deals Editorial Runbook

## Scope

Freehub separates offers that require a real coupon code from ordinary deals:

- `type: "coupon"` requires `couponCode` and publishes under `/coupons/` and `/coupon/`.
- `type: "deal"` must not contain `couponCode` and publishes under `/deals/` and `/deal/`.
- `/offers/` is the central discovery portal. Shared category pages live under `/offers/category/` and shared brand pages under `/offers/brand/`.

Do not copy codes from voucher aggregators or invent development offers in `data/offers.json`. Use only a retailer, brand, network or campaign source that the editor has manually checked.

## Category policy

Use the controlled taxonomy in `shared/offer-data.js`: Groceries; Restaurants & Takeaways; Fashion & Accessories; Beauty & Health; Electronics & Appliances; Home & Garden; Baby & Kids; Pets; Travel & Accommodation; Entertainment & Experiences; Mobile & Data; Banking & Rewards; Sports & Outdoors; and Other.

Add a new category only when several verified offers have a distinct user need that the existing taxonomy cannot describe. The generator creates category and brand pages only from current public records. A landing page with one offer remains `noindex` and outside the sitemap until a second verified offer supports it. Do not publish empty, speculative or keyword-only category pages. `other` is a temporary classification and its page is always `noindex`.

## Record workflow

1. Create the record as `publicationStatus: "draft"` and `verificationStatus: "unverified"`.
2. Check the destination, source, code (for coupons), South African eligibility, start/expiry dates, exclusions and terms.
3. Record `lastChecked`, a near-term `reviewDueAt`, and an honest plain-language `terms` summary.
4. Record commercial metadata:
   - `affiliate: true` requires the internal `affiliateNetwork` label.
   - `sponsored: true` displays a sponsored disclosure.
   - The network name is operational metadata and is not displayed publicly.
5. Only after editorial approval, set both `publicationStatus: "published"` and `verificationStatus: "verified"`, with `publishedAt` and `updatedAt`.
6. Build with `FREEHUB_ENABLE_OFFERS=true` and inspect the hub, detail page, outbound handoff, sitemap and related competition links.

## Fail-closed rules

A record stays private if it is malformed, unpublished, unverified, not started, expired, published in the future, or past `reviewDueAt`. Empty offer/coupon/deal hubs use `noindex, follow` and are excluded from the sitemap. Exit routes always use `noindex, nofollow`.

Collection pages use `CollectionPage`, `BreadcrumbList` and, when populated, `ItemList` structured data. Detail pages use `WebPage` and `BreadcrumbList`. Do not add `Product` or `Offer` rich-result markup unless the page has the real product and price fields required by Google's current documentation.

When an offer ends, change the lifecycle fields promptly. Expired/withdrawn tombstone pages are not part of this first release; the generator removes public detail and exit routes when a record stops qualifying.

## Required fields

The full contract is in `data/schemas/offer.schema.json`. It includes brand, offer title and summary, coupon code when applicable, destination and source URLs, category, start/expiry dates, last-checked and review dates, terms, publication and verification states, South African country scope, and affiliate/sponsored metadata.

## Checks

```powershell
$env:FREEHUB_ENABLE_OFFERS = "true"
npm run build
npm test
npm run lint
Remove-Item Env:FREEHUB_ENABLE_OFFERS
```

Also inspect at mobile and desktop widths. Confirm the code/deal distinction, expiry copy, commercial disclosure, official terms, canonical, JSON-LD and outbound destination. A successful build is not editorial approval.
