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
- Regenerate all static pages:
  - `node scripts/generate-pages.js`

## 404 and Legacy URL Handling
- Competition and out routes are generated for:
  - published competitions
  - non-published legacy entries
  - archived expired entries
- This prevents hard 404s for previously crawled URLs and preserves redirect pages.

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
