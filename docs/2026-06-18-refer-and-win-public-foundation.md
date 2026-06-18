# 2026-06-18 Refer & Win Public Foundation

Historical implementation note. Superseded for launch configuration by `docs/2026-06-18-refer-and-win-july-2026-r250-live.md`.

Current status: the first Refer & Win campaign is live from 18 June 2026 to 31 July 2026, ending at 23:59 SAST on 31 July 2026, with a R250 airtime prize. The next campaign is planned from 1 August 2026 to 31 August 2026, ending at 23:59 SAST on 31 August 2026. The public terms page is now indexable because promoter, prize, dates, fulfilment, tie-breaker and winner notification details have been filled in.

## Summary

This sprint adds the public coming-soon layer for Freehub Refer & Win. It creates an SEO-safe landing page and a draft rules page for the planned monthly referral challenge, while keeping the campaign disabled.

## Pages Added

```text
/refer-and-win/
/refer-and-win/terms/
```

`/refer-and-win/` is public and indexable because the copy is useful, transparent and clearly marked as not live.

`/refer-and-win/terms/` is public and accessible from the landing page, Club dashboard and admin review page, but is `noindex` and excluded from the sitemap while it still contains promoter placeholder/TODO wording and before final launch details are confirmed.

## Campaign Status

The campaign is not currently live.

The config remains:

```js
referWinCampaignEnabled: false
```

The public pages use coming-soon wording throughout:

- `Coming soon - not currently live`
- `Planned monthly challenge`
- `Approved referrals`
- `Subject to manual review`
- `Marketing consent is optional`

No public prize, winner, leaderboard or automated reward logic was launched.

## Landing Page Positioning

`/refer-and-win/` explains the planned Freehub Refer & Win concept:

- Freehub Club members will be able to share their referral links once the campaign is live.
- The planned prize is `R1,000 airtime or data`.
- Only approved referrals may count.
- Referral approval is subject to manual review.
- The campaign has not launched.

The page includes:

- Hero with coming-soon status.
- Join Freehub Club CTA.
- Club dashboard CTA.
- Planned rules CTA.
- Five-step "how it will work" section.
- Prize preview.
- Approved referral criteria.
- Exclusion examples.
- Fairness and manual review section.
- Example-only, not-live leaderboard.
- Privacy and POPIA-friendly wording.
- FAQ with FAQ structured data.

## Rules Page Structure

`/refer-and-win/terms/` is a draft/coming-soon rules page.

It includes:

1. Promoter placeholder
2. Campaign name
3. Territory
4. Eligibility
5. Campaign period
6. Prize
7. How to enter
8. Referral link mechanic
9. Approved referral definition
10. What does not count
11. Manual review
12. Winner selection
13. Tie-breaker
14. Winner notification
15. Prize fulfilment
16. Publicity
17. Data protection and privacy
18. Marketing consent
19. Changes, suspension and cancellation
20. Contact and support

Promoter details are not invented. The page includes the visible placeholder:

```text
Promoter details will be confirmed before launch.
```

It also includes the launch-blocking TODO:

```text
TODO: Confirm official promoter/legal entity before enabling referWinCampaignEnabled.
```

## Club and Admin Integration

Updated Freehub Club surfaces:

- `/club/` links to `/refer-and-win/` and `/refer-and-win/terms/`.
- `/club/dashboard/` referral card links to the public page and planned rules.
- Dashboard copy states that referrals may be captured now, but the monthly prize campaign is not live.
- Dashboard shows `Approved referrals: coming soon.`

Updated admin surface:

- `/admin/referrals/` displays `Refer & Win campaign: disabled / coming soon`.
- Admin page links to the public page and planned rules.
- No browser control was added to launch or toggle the campaign.

## SEO, Sitemap and Noindex Handling

Included in sitemap:

- `/refer-and-win/`

Noindex and excluded from sitemap until launch details are final:

- `/refer-and-win/terms/`

Still excluded from sitemap:

- `/club/dashboard/`
- `/club/account/`
- `/admin/referrals/`
- `/out/*`

`/admin/referrals/` remains `noindex, nofollow`.

## Launch Blockers

Before the campaign can go live:

- Confirm official promoter/legal entity.
- Confirm final prize fulfilment process and supported mobile networks.
- Confirm campaign period dates.
- Confirm final tie-breaker.
- Confirm winner notification and response period.
- Review POPIA/privacy wording.
- Decide whether a public anonymised leaderboard should exist.
- Only then consider changing `referWinCampaignEnabled` from `false`.

## Manual QA Checklist

- `/refer-and-win/` clearly says coming soon / not live.
- `/refer-and-win/terms/` clearly says draft / not live.
- `/refer-and-win/terms/` remains noindex and excluded from sitemap until promoter/legal entity, prize fulfilment, campaign dates, tie-breaker and winner notification process are final.
- `referWinCampaignEnabled` remains false.
- No live public leaderboard exists.
- No winner logic exists.
- No SMS billing or shortcode exists.
- Marketing consent remains optional.
- Club landing and dashboard links work.
- Admin page still requires admin access and remains noindex.
- Sitemap includes only intended public pages.
- Private/account/admin pages remain excluded from sitemap.
- `/out/` URLs remain excluded from sitemap.
- Build, test and lint pass.
