# Chrome source review - 8 September 2026

Browser observations supplement automated checks. A working page is not, by itself, approval to reactivate an old campaign.

## Current listings

- McDonald's Nazo airtime/data terms: https://www.mcdonalds.co.za/airtime-data-rewards-ts-cs opened in Chrome and displayed the promoter's page-not-found screen. The current https://www.mcdonalds.co.za/deals-our-app page did not establish a replacement for this campaign. Set the saved competition to held/needs-verification and disable publication. Historical July evidence and previously stated dates are preserved, without claiming the campaign has expired.
- Review Club: https://reviewclub.co.za/how-it-works/ failed Chrome's certificate check with ERR_CERT_DATE_INVALID. Search-index content was readable but does not resolve live secure access. Mark the resource source_changed and withhold it from public directories and metadata. Keep its previous successful verification date as history. No certificate warning was bypassed.
- Spur: https://www.spursteakranches.com/view-document/9 completed its automatic browser security verification and redirected to the official PDF at https://res.cloudinary.com/spur-group/image/upload/uploads/documents/policies/Spur-Loyalty-Programme-and-App-Terms-and-Conditions-clean-July-2025-002-oOH.pdf. Page 5, section 5 confirms the R1,000 qualifying spend in the preceding 12 months, R50 voucher loaded on the birthday, 31-day validity, non-transferability and redemption by the registered member. Browser access and PDF text/render were verified. Renew the existing exact-domain manual exception to 8 September, with review due 8 October 2026.

## Other destinations checked in Chrome

| Saved URL | Browser result | Implication |
| --- | --- | --- |
| https://www.tablemountain.net/plan-your-visit/specials/ | Redirects to the same path without the trailing slash; working official Specials page with Birthday Special control. | Redirect is not proof of a missing page. Full offer conditions were not reapproved. |
| https://muggandbean.co.za/rewards/loyalty-app-faqs/ | Redirects to www.muggandbean.co.za; working official FAQ page with birthday-voucher questions. | Redirect is not proof of a missing page. Full offer conditions were not reapproved. |
| https://lionandsafaripark.com/lets-go-wild-on-your-birthday/ | Official page-not-found screen. | Source genuinely unavailable at this URL. Existing closed opportunity must remain closed. |
| https://www.blinddesigns.co.za/view-blind-type/ | Working fabric-sample page: up to five pieces per delivery, free delivery to an address in South Africa. | Earlier timeout was not reproduced in Chrome. No request/order was submitted. |
| https://www.waterfront.co.za/articles/free-birthday-celebrations | Working official article dated 5 May 2026, including complimentary pedal-boat rides before noon on the birthday or during birthday week, with valid ID. | Automated rate-limit response does not establish a broken destination. No booking was submitted. |

## Publishing correction and remaining audit

Directory selection previously included records regardless of explicit verification state. The generator now excludes source_changed, verification_due, rejected and retired resources from public cards, structured data and mobile catalog inputs while retaining established legacy directory behavior. Full registry validation remains in place.

The strict external-link audit has not been weakened. It still checks retained records, including the withheld Review Club record and older closed opportunities. On the local rerun there were zero competition hard errors, one retained-resource error and 30 opportunity source/terms failures. Six previously observed archived-competition warning changes also remain for review. These are not 30 newly broken public offers, nor an all-clear for the source backlog.
