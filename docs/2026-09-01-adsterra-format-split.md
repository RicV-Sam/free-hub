# Adsterra format split

## Decision

Freehub keeps Adsterra as a controlled secondary monetisation layer instead of using aggressive formats across the public site.

- Homepage and indexable competition collection pages: one clearly labelled, lazy-loaded Native Banner placement.
- Free Stuff, Birthday Freebies and Free Courses: one clearly labelled, lazy-loaded Native Banner each.
- Student guide: one native unit after software and one separate 320x50 display unit before attractions, both lazy-loaded.
- Closed, noindex competition archive pages: legacy Popunder and Social Bar formats may load for signed-out visitors.
- Active competition details, outbound handoffs, other trust/editorial pages, Club/account pages and other pages without an explicit placement: no external Adsterra unit.
- Signed-in Freehub Club members: no Adsterra formats on any page.

## Adsterra dashboard

The original three units remain; the student display banner was added on 7 September 2026:

- `Browse_Native_1x1`: Native Banner, one-card 1:1 layout, adult ads disabled.
- `Archive_Popunder`: legacy Popunder retained for archive pages only.
- `Archive_SocialBar`: legacy Social Bar retained for archive pages only.
- Student display banner: approved 320x50 unit, key `d6fbe29ea96be9bee8e66b507c1f3d55`; adult ads were disabled when requesting it.

The dashboard does not enforce page scope. `shared/guest-ads.js` owns that routing and must remain the only place containing provider URLs.

## Safety and trust rules

- Firebase auth must resolve before any external Adsterra script is requested.
- A missing or failed Firebase configuration fails closed.
- Native Banner requires an explicit `data-freehub-ad-slot` container.
- Legacy formats require `data-freehub-ad-surface="archive"` on a closed competition page.
- Generated HTML must not contain raw Adsterra provider URLs.
- A guest-to-member transition reloads only when an external ad script has already run, producing a clean member document.

## Validation

Run:

```powershell
npm run build
npm test
npx playwright test tests/browser/freehub-smoke.spec.js --grep "native banner|archive pages|signed-in members|guest-to-member|provider sign-in|advertising cookies"
```

The browser coverage verifies the format split, fail-closed auth behaviour and protected pages.

## Content-page expansion — 7 September 2026

Native units now load when a confirmed guest approaches the placement (200 px preload margin). One native unit per page remains the limit. The display banner remains exclusive to the student guide. Protected entry, account and safety pages have no placements. The privacy disclosure names the expanded content pages and the separate display format. Existing archive-only formats are unchanged.

Validation for this expansion: build passed; all 17 selected browser tests passed (three new content pages, competition browsing, existing student flows, member suppression, guest-to-member cleanup and disclosure). All 30 generated native placements have lazy-loading markers, with no duplicate native units on a page; only the student guide has a display placement. Broader checks retain the pre-existing competition snapshot failure (97 lifecycle tests pass) and the two existing SEO failures (sitemap baseline count and Free Samples description). No baseline expectations were relaxed for this change.

## Longer editorial guides — 7 September 2026

The separate 320x50 display placement now also appears on Free Stuff, Birthday Freebies, Free Courses, Free Samples and the monthly competition guide. Each has exactly one labelled display placement between content blocks. This supersedes the student-only display scope above. The existing student placement and native units are unchanged.

The shared loader waits for confirmed guest status and proximity to the placement. The banner is hidden when its content container is too narrow for the fixed 320px creative. Safety, children’s, credit-report, account and outbound pages remain outside this explicit allowlist.

Validation: production-flag build passed; all 15 selected browser tests passed, covering all five new placements, student regressions and privacy disclosure. The new cases check 320/390/768/1440px layouts, 200% zoom, one request per placement and member cleanup. A mobile screenshot was visually inspected. Existing broader baseline failures documented above were not altered.
