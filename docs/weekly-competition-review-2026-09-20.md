# Approved competition publication — 20 September 2026

The user approved the weekly scan's three Add now recommendations, expiry maintenance, commit and live deployment. Watchlist records remain unchanged.

## Published records

- `penguin-random-house-terbodore-100k-2026`: one R2,000 Terbodore hamper plus Penguin books; free online entry; 30 September 23:59 SAST close. The 100K milestone is explicitly not a cash prize.
- `penguin-random-house-art-of-hosting-2026`: The Art of Hosting and Cape Island hamper, together worth over R2,700; free online entry; 31 October 23:59 SAST close. Written prize wording takes precedence over rounded artwork wording; no individual hamper products are promised from the image.
- `penguin-random-house-penguin-post-44-2026`: one R1,500 issue 44 book hamper; free online entry; 31 October 23:59 SAST close. The tablet pictured in official artwork is not a prize. This is distinct from issues 42 and 43.

All require South African residency and age 18+, one personal entry, and the promoter-related exclusions. Marketing preferences can be declined. Campaign-specific source and terms URLs, source-review dates and detailed prize/claim conditions are recorded in each record.

The same-day scan checked local primary/archive/held/unverified data, remote main at `1456c526ba84adf0f1dede4116ed274e3a9a663d` and the production competition feed. No matching identity was found. All six campaign/terms pages returned HTTP 200. The remote branch was rechecked before release.

## Artwork

Inspected the actual official campaign pages and their campaign-specific artwork. Downloaded each page's official square `og:image`, visually checked it and saved a 500px WebP (approximately 35–39 KB) without changing content. `data/listing-images.json` records source page, original image URL, dimensions, alt text and official-source provenance. Competition image fields use the same local assets. No generated artwork was needed.

## Expiry maintenance

Ran `node scripts/competition-maintenance.js --archive-expired --today=2026-09-20`. Newly archived Samsung/SuperSport Rugby's Greatest Rivalry, which closed 19 September. The existing lifecycle intentionally retains primary records for historical rendering while removing expired records from active feeds, lists, sitemap and outbound entry routes; records were not destructively deleted.

The rugby tag also falls below the existing minimum of two active records and becomes noindex. Comparing the previous production sitemap with the new one shows only three new competition URLs and removal of that expired competition and `/tag/rugby/`. Updated the reviewed static sitemap count from 65 to 64, and the fixed generated detail count by three. The historical cost-label snapshot adds three free-entry records; other cost categories are unchanged.

## Validation

- Production feature flags retained for local build: Opportunities and Offers enabled.
- Build, SEO/performance gates, Free Stuff and Free Samples gates passed. Existing CSS growth remains a warning, not a new style change.
- All 121 lifecycle tests passed.
- Maintenance validation passed: no expired record missing from archive, no expired entries in public listings/sitemap/homepage/outbound routes, and no held/private leakage.
- Browser screenshots reviewed at 1440px and 390px for all three pages. Correct official artwork loaded, one expected page heading and no horizontal overflow. During preview, new production asset URLs were mapped to the exact local WebP assets; deployed assets require separate live checks. The local optional Firebase config was copied only into an ignored file for preview.
- New records occur once each in the generated feed, link to the matching official terms, and reference their intended images. Generated feed has 82 public records on 20 September; the expired Samsung record is absent.
- Full link lint did not pass: an unrelated existing Goldi source returned HTTP 421; opportunity checks reported existing Coloplast HTTP 403, Waterfront HTTP 429 and stale/unusable opportunity evidence. The three new PRH listings were not among the failures. Warning/evidence thresholds were not relaxed and unrelated records were not changed.

The user’s primary checkout and untracked artifacts were preserved using an isolated publication worktree. No competition entry or promoter contact was submitted.
