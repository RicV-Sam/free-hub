# Cadbury Made to Share publication review — 20 September 2026

The user reported completing online entry without a receipt request and approved publication. The official FAQ independently confirms that the website route requires no purchase and enters the weekly cash draw. Publish one campaign record with the online route as its primary entry method; describe the separate in-store route and its costs explicitly.

## Official evidence

- Campaign: https://cadbury-made-to-share.co.za/
- Terms: https://www.cadbury.co.za/terms/terms-and-conditions-made-share
- FAQ: https://www.cadbury.co.za/terms/faq-made-share
- Official artwork linked by campaign og:image: https://cadburywinter2026.ogilvyexperience.co.za//social-share.png

All pages opened on 20 September and returned HTTP 200. Browser-rendered campaign shows Slab Settler, R20,000 weekly cash draw and direct links to terms/FAQ. No entry was submitted by Freehub. Campaign period is 1 August–31 October 2026; no exact closing time is supplied, so date-only SAST interpretation is disclosed. Adult SA citizenship/residency, presence during draws/fulfilment, own RICA number, related-party exclusions and marketing opt-out conditions are recorded.

Terms 4.10–4.16 describe online entry separately. FAQ explicitly confirms purchase-free website entry. General prize clause 6.2 still refers to proof-of-purchase validation; visible content preserves that winner-verification qualification without describing it as an online submission requirement. FAQ mentions address/selfie prompts beyond core terms: instructions defer to the current form. Terms’ specific USSD charge of 20c per 20 seconds and WhatsApp rates take precedence over FAQ’s broad purchase-route cost summary. No unsupported remaining prize count or instant-prize promise.

Duplicate search found no Made to Share or Slab Settler identity in local primary/archive/held/unverified data, latest remote main (8d13d417b98d9fcddb9a68742fda4b3e62b4437d, matching local HEAD before edits), or live competition feed. Historical unrelated Cadbury campaigns are distinct.

## Artwork and checks

Inspected official artwork and saved a 1200×630 WebP (94,980 bytes), with provenance in listing-images.json. Promoter terms disclose AI-enhanced imagery; caption reflects that. No generic logo used as hero.

Build, SEO/performance gates, held validation and all 121 lifecycle tests passed. Maintenance validation passed with no expired or non-public leakage. The new record increases the dated public feed from 82 to 83. Updated only the generated-detail count and free-entry label snapshot. Existing unrelated JSON formatting was preserved.

Desktop (1440px) and mobile (390px) screenshots inspected after rejecting optional cookie consent. Correct image and heading, no horizontal overflow. Local preview mapped the new production image URL to the exact local asset; separate post-deployment asset checks are required. Browser reported an unrelated third-party favicon 404 and existing unused advertising preload warnings.

The broad lint run initially flagged the campaign microsite because its URL is a domain root. The existing per-record `linkValidationAllowGenericUrl` exception now documents that this is a dedicated campaign microsite, with exact allowlisted URL and dated evidence. No global validator rule was relaxed. Unrelated existing source-access and Opportunity evidence failures remain outside this change.
