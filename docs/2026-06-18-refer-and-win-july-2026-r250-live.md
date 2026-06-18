# 2026-06-18 Refer & Win First Campaign R250 Airtime Live Setup

## Summary

This sprint moves Freehub Refer & Win from a coming-soon foundation to a first live campaign configuration.

The campaign is free to enter, has a R250 airtime prize, requires Freehub Club sign-in, and keeps admin review mandatory before referrals count.

## Campaign mechanic

- Campaign name: Freehub Refer & Win.
- Promoter: Stura Consulting, operating Freehub.
- Territory: South Africa.
- First campaign period: 18 June 2026 to 31 July 2026, ending at 23:59 SAST on 31 July 2026.
- Next campaign period: 1 August 2026 to 31 August 2026, ending at 23:59 SAST on 31 August 2026.
- Prize: R250 airtime.
- Fulfilment: airtime top-up or airtime voucher to a supported South African mobile number.
- Winner mechanic: most approved referrals in the active campaign period, subject to manual review and final admin confirmation.
- Tie-breaker: if eligible participants tie on approved referrals, the winner is the tied participant who first reached that approved count. If that cannot be determined reliably, Freehub may run a random draw among tied eligible participants after manual review.
- Winner notification: Freehub contacts the selected winner using account email and/or supplied South African mobile number within seven business days after monthly review is complete. If the winner cannot be verified or contacted within five business days, Freehub may select the next eligible participant.

No winner is selected automatically by the site.

## Config status

`FREEHUB_REFER_WIN_CONFIG` is now configured as:

```js
referWinCampaignEnabled: true
referWinLiveReady: true
referWinPrototypeEnabled: false
campaignStatusLabel: "Live: 18 June to 31 July 2026"
campaignMonth: "2026-07"
campaignStartDate: "2026-06-18"
campaignEndDate: "2026-07-31"
campaignPeriodLabel: "18 June 2026 to 31 July 2026, ending at 23:59 SAST on 31 July 2026"
nextCampaignPeriodLabel: "1 August 2026 to 31 August 2026, ending at 23:59 SAST on 31 August 2026"
monthlyPrizeLabel: "R250 airtime"
publicLeaderboardEnabled: false
adminReviewRequired: true
marketingConsentRequired: false
mobileNumberRequiredForParticipation: true
noPurchaseRequired: true
```

Public leaderboard, winner automation, SMS billing and shortcode entry remain disabled.

## Why the campaign is free to enter

Refer & Win is a Freehub Club referral campaign, not a paid SMS campaign. Users do not need to buy anything, send a paid SMS, pay for access or enter through a shortcode to participate.

Marketing consent is optional and is not required to join the campaign.

## Mobile number requirement

A user can join Freehub Club without a mobile number.

A South African mobile number is required only for Refer & Win participation because the prize is airtime and Freehub needs a valid number for prize fulfilment.

Accepted UI formats:

- `0821234567`
- `+27821234567`
- `27821234567`

Stored format:

- `27821234567`

Account UI displays the number masked, for example:

- `2782****567`

## Firestore user fields

Refer & Win participation is stored on `users/{uid}`:

```json
{
  "referWinParticipant": true,
  "referWinJoinedAt": "serverTimestamp",
  "referWinTermsAccepted": true,
  "referWinTermsAcceptedAt": "serverTimestamp",
  "referWinPrizeMobileConsent": true,
  "referWinPrizeMobileConsentAt": "serverTimestamp",
  "mobileNumber": "27821234567",
  "mobileCountry": "ZA",
  "mobileNetwork": "Vodacom",
  "mobileNumberUpdatedAt": "serverTimestamp",
  "mobileNumberVerified": false,
  "marketingConsent": false,
  "marketingConsentUpdatedAt": "serverTimestamp"
}
```

`mobileNetwork` is optional and may be one of:

- Vodacom
- MTN
- Telkom
- Cell C
- Rain
- Other / not sure

## Consent model

Required campaign consent:

- The user accepts the Freehub Refer & Win rules and understands referrals only count after review.
- The user understands Freehub may use the South African mobile number to administer Refer & Win, prevent abuse, contact them if needed, and fulfil airtime prizes where applicable.

Optional consent:

- Freehub competition updates and marketing messages.

Marketing consent is not required for participation.

## Rules page

`/refer-and-win/terms/` now includes:

1. Promoter
2. Campaign name
3. Territory
4. Eligibility
5. Campaign period
6. Prize
7. No purchase required
8. How to participate
9. Referral link mechanic
10. Approved referral definition
11. What does not count
12. Manual review
13. Winner selection
14. Tie-breaker
15. Winner notification
16. Prize fulfilment
17. Mobile number use
18. Publicity
19. Data protection and privacy
20. Marketing consent
21. Changes, suspension or cancellation
22. Contact/support
23. Record keeping

The terms page is indexable and included in the sitemap because promoter, prize, campaign dates, tie-breaker, notification and fulfilment wording are now filled in.

## Public page

`/refer-and-win/` now uses first-campaign live wording:

- Free to enter.
- No purchase required.
- R250 airtime first campaign prize.
- Manual referral review required.
- No public leaderboard.
- No automatic winner selection.
- No SMS billing or shortcode entry.

## Admin review requirements

`/admin/referrals/` remains private, noindex and admin-only.

The admin page now shows:

- First campaign status: 18 June 2026 to 31 July 2026, ending at 23:59 SAST.
- Next campaign period: 1 August 2026 to 31 August 2026, ending at 23:59 SAST.
- R250 airtime prize.
- Monthly pending/approved/rejected counts.
- Refer & Win participant readiness counts.
- Provisional top-referrer summary with readiness notes.

An approved referral is not enough by itself. A referral should be treated as prize-eligible only when:

- referral is approved by admin;
- referrer has opted into Refer & Win;
- referrer accepted the Refer & Win rules;
- referrer supplied a valid South African mobile number;
- referred user is not the same person;
- referral belongs to the active campaign period;
- no fraud or rejection condition applies.

## SEO and sitemap

Indexable and in sitemap:

- `/refer-and-win/`
- `/refer-and-win/terms/`

Still noindex and excluded from sitemap:

- `/club/dashboard/`
- `/club/account/`
- `/admin/referrals/`
- `/out/*`

## Future shortcode/content portal separation

The shortcode/content portal concept is separate from Refer & Win.

Suggested future product name:

- Freehub Extras

Possible future content:

- radio links
- casual games
- competition tools
- checklists
- entertainment links
- simple mobile utilities

For this Refer & Win campaign:

- no shortcode portal is built;
- no paid access is added;
- shortcode access does not improve Refer & Win chances;
- paid SMS is not a campaign entry route;
- SMS billing is not added.

## Remaining operational checks

Before announcing winners or fulfilling prizes, confirm:

- Firestore rules with mobile participation fields are published.
- Mobile number collection has been tested in production.
- Admin referral approval has been tested in production.
- Record-keeping process is followed.
- Any required legal/privacy review is complete.
- Prize fulfilment route works for the selected winner's network.

## Validation checklist

- `/refer-and-win/` is indexable and in the sitemap.
- `/refer-and-win/terms/` is indexable and in the sitemap.
- `/club/dashboard/`, `/club/account/`, and `/admin/referrals/` remain noindex and excluded from sitemap.
- `referWinCampaignEnabled` is true.
- `adminReviewRequired` is true.
- `publicLeaderboardEnabled` is false.
- Marketing consent is optional.
- No SMS billing, live shortcode, public leaderboard or winner automation is enabled.
