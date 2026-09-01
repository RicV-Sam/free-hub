# Adsterra format split

## Decision

Freehub keeps Adsterra as a controlled secondary monetisation layer instead of using aggressive formats across the public site.

- Homepage and indexable competition collection pages: one clearly labelled Native Banner placement.
- Closed, noindex competition archive pages: legacy Popunder and Social Bar formats may load for signed-out visitors.
- Active competition details, outbound handoffs, trust/editorial pages, Club/account pages and other pages without an explicit placement: no external Adsterra unit.
- Signed-in Freehub Club members: no Adsterra formats on any page.

## Adsterra dashboard

The `freehub.co.za` website has three active units:

- `Browse_Native_1x1`: Native Banner, one-card 1:1 layout, adult ads disabled.
- `Archive_Popunder`: legacy Popunder retained for archive pages only.
- `Archive_SocialBar`: legacy Social Bar retained for archive pages only.

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
