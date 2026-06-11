# FreeHub

FreeHub is a static, data-driven South African competition discovery site.

## Current Architecture
- Static HTML generation via `scripts/generate-pages.js`
- Shared routing/content logic in `shared/page-data.js`
- Source data in `data/competitions.json`
- Expired archive in `data/archive/competitions-expired.json`
- Client enhancements/tracking in `app.js`

## Status
Active production site on `https://freehub.co.za`.

## Operational Commands
- Dry-run maintenance audit:
  - `node scripts/competition-maintenance.js`
- Archive expired competitions:
  - `node scripts/competition-maintenance.js --archive-expired`
- Discover image candidates for published competitions without explicit images:
  - `node scripts/find-competition-images.js`
  - `node scripts/find-competition-images.js --apply`
- Discover new competition leads from a Bing Search compatible endpoint:
  - Set `BING_SEARCH_API_KEY` in your local environment or `.env`
  - `npm run discover:bing`
  - Output is written to `.research/bing-competition-leads.json` for manual review
- Regenerate all static pages:
  - `node scripts/generate-pages.js`

## Public Generation Rule
- Only records with `verificationStatus: "published"` are public.
- Held/unverified/non-published records are private review data only and must not generate:
  - `/competition/*` pages
  - `/out/*` redirect pages
  - listing/category/hub cards
  - sitemap URLs
  - public ItemList entries
- Held review workflows remain in private/admin tooling and are not part of the public static site output.

## Image Strategy (Current)
Visual fallback order for cards/heroes:
1. `competition.image` (if present)
2. Brand/domain-associated image from other known competition entries
3. Category fallback photo (`Cars`, `Cash`, `Holidays`, `Tech`, `Vouchers`)

Metadata fallback (`og:image`, `twitter:image`) may still use the global default image when no explicit/brand image exists.

## Build Guardrails
`scripts/generate-pages.js` now enforces image QA checks:
- fails build if rendered HTML includes SVG data-URI hero/card images
- catches regressions before deploy

## Deploy Note
After data/code changes, always run:
1. `node scripts/generate-pages.js`
2. verify output locally
3. commit and push `main`

Canonical domain guard: `freehub.co.za` is the only production domain for indexable pages. The old `freehub.datacost.co.za` host must be redirected or noindexed outside this repo; see `docs/deployment-canonical-domain.md`.

## Bing Search Discovery
`scripts/bing-search-discovery.js` is a private research tool for finding possible new South African competition pages. It never writes to public data and does not publish anything automatically.

The script reads:
- `BING_SEARCH_API_KEY`, `BING_SUBSCRIPTION_KEY`, or `AZURE_BING_SEARCH_KEY`
- optional `BING_SEARCH_ENDPOINT`
- optional `BING_SEARCH_MKT`, defaulting to `en-ZA`

Run:
- `npm run discover:bing`
- `node scripts/bing-search-discovery.js --query "site:.co.za competition closing date prize"`
- `node scripts/bing-search-discovery.js --dry-run`

Microsoft announced that the old Bing Search APIs retired on 2025-08-11, so this script is endpoint-configurable and intended for any legacy-compatible Bing Search endpoint/key that is still available to the project. Review every lead before importing or publishing.
