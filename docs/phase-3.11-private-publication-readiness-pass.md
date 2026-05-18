# Phase 3.11 Private Publication-Readiness Pass

Date: 2026-05-18

## Executive summary

Phase 3.11 reviewed the four ZA Comp Engine held rows for private publication readiness. This phase did not publish anything and did not change `data/competitions.json`. No private fields were added because no existing private publication-readiness field convention was found in Freehub.

Final private classifications:

| Row | Classification | Short reason |
| --- | --- | --- |
| Dis-Chem Garnier Pure Active | `needs_content_or_image_work` | Evidence is strong, but campaign image remains unresolved. |
| Makro Schweppes Icon Reimagined | `reject_or_archive` | Appears to duplicate an existing published Schweppes Icon Reimagined listing and has content/image cleanup gaps. |
| SPAR Rewards Vaseline Winter Drive | `ready_to_publish_after_explicit_approval` | Evidence, content, risks, image reference, and public-safe fields are strong enough for a later explicit approval phase. |
| SPAR Rewards Vaseline Cera Glow | `ready_to_publish_after_explicit_approval` | Evidence, content, risks, image reference, and public-safe fields are strong enough for a later explicit approval phase. |

These classifications are private review outcomes only. All four rows remain held/private.

## Starting state

Phase 3.10 prerequisite was satisfied:

| Check | Result |
| --- | --- |
| Latest commit | `057f9f0 Review ZA held candidates privately` |
| HEAD tag | `phase-3.10-private-review-za-held-rows` |
| Phase 3.10 report | Tracked in git |
| Starting working tree | Clean |

Starting validation:

| Command | Result |
| --- | --- |
| `git status` | Clean working tree; `main` ahead of `origin/main` by 2 commits |
| `npm test` | Passed, 4 ZA held rows, 0 errors, 0 warnings |
| `npm run generate` | Passed |
| `npm run validate:held-candidates` | Passed, 4 ZA held rows, 0 errors, 0 warnings |

Starting counts:

| Count | Value |
| --- | ---: |
| Total competitions | 159 |
| Published competitions | 76 |
| Held / needs-verification competitions | 83 |
| ZA held rows | 4 |

## Rows reviewed

| Freehub id | Title | Brand | Category | Tags | Closing date |
| --- | --- | --- | --- | --- | --- |
| `dis-chem-garnier-pure-active-june-2026-competition` | Garnier Pure Active June 2026 Competition | Dis-Chem | Vouchers | `experience`, `purchase-required`, `qualifying-products`, `loyalty-required`, `age-18-plus`, `image-unresolved`, `in-store-entry` | 2026-06-28 |
| `makro-schweppes-icon-reimagined-transaction-driver-2026-competition` | Schweppes Icon Reimagined Transaction Driver 2026 Competition | Makro | Vouchers | `vouchers`, `purchase-required`, `age-18-plus` | 2026-05-31 |
| `spar-rewards-vaseline-winter-drive-competition-2026` | SPAR Rewards Vaseline Winter Drive Competition | SPAR South Africa | Vouchers | `vouchers`, `purchase-required`, `loyalty-required`, `in-store-entry` | 2026-08-02 |
| `spar-rewards-vaseline-cera-glow-competition-2026` | SPAR Rewards Vaseline Cera Glow Competition | SPAR South Africa | Tech | `purchase-required`, `loyalty-required`, `in-store-entry` | 2026-08-02 |

## Per-row readiness table

| Row | Evidence | Content | Image | Safety | Classification |
| --- | --- | --- | --- | --- | --- |
| Dis-Chem Garnier Pure Active | Official Dis-Chem domain, campaign terms URL, future close date, clear prize, entry, purchase, loyalty, and eligibility | Public-friendly enough; summary is accurate and not over-promotional | Missing; image note says no reusable campaign-specific official image confirmed | Purchase, loyalty, 18+, event ticket, publicity/privacy risks are represented | `needs_content_or_image_work` |
| Makro Schweppes Icon Reimagined | Official Makro domain and imported terms evidence are strong; future close date as of 2026-05-18 | Summary is usable, but `entryChannel` is truncated after `087 ` | Missing; image note says no reusable candidate-specific official image confirmed | Purchase, WhatsApp/data, till slip, personal-info risks are represented; duplicate concern with existing published Schweppes listing | `reject_or_archive` |
| SPAR Rewards Vaseline Winter Drive | Official SPAR source/terms URL, future close date, clear voucher prize, entry, purchase, loyalty, and eligibility | Public-friendly and accurate; cost label is transparent | Official SPAR image URL captured, with reuse suitability note | Purchase, loyalty, SMS/contact, voucher, personal-info, and publicity risks are represented | `ready_to_publish_after_explicit_approval` |
| SPAR Rewards Vaseline Cera Glow | Official SPAR source/terms URL, future close date, clear hamper prize, entry, purchase, loyalty, and eligibility | Public-friendly and accurate; cost label is transparent. Category `Tech` should be checked, but it does not block private readiness | Official SPAR image URL captured, with reuse suitability note | Purchase, loyalty, SMS/phone, courier address, personal-info, and publicity risks are represented | `ready_to_publish_after_explicit_approval` |

## Evidence, content, and image checklists

### Dis-Chem Garnier Pure Active

| Check | Result |
| --- | --- |
| Official source / terms | Official Dis-Chem domain. `termsUrl` is campaign-specific; `sourceUrl` is the official Dis-Chem terms-and-conditions page. |
| Closing date | Future/current as of 2026-05-18: 2026-06-28. |
| Prize | Clear: 1 of 10 double tickets to a 2026 Springbok game in South Africa. |
| Entry method | Clear: in-store purchase and Better Rewards card swipe. |
| Cost / loyalty / SMS | Purchase, qualifying products, and loyalty-card requirement are clear. No SMS entry mechanic is exposed in the public-facing row content. |
| Eligibility | Clear enough: South African legal residents/citizens, valid ID, over 18, with employee/related-party/recent-winner exclusions. |
| Source dependency | No competitor or aggregator URL. |
| Public summary | Accurate and restrained. |
| Entry instructions | Understandable, though final public copy should remove private hold wording from `entrySteps` before publication. |
| Image | Missing; `imageReviewNote` explicitly says no reusable official campaign image is confirmed. |
| Safety | Purchase, loyalty, age, event ticket, publicity/privacy, and unresolved image risks are documented. |

Classification: `needs_content_or_image_work`

Blockers before explicit publication approval:

- Choose to publish without an image or select official campaign art.
- Remove private hold wording from entry instructions before any public page is generated.

### Makro Schweppes Icon Reimagined

| Check | Result |
| --- | --- |
| Official source / terms | Official Makro URL appears valid from imported evidence. Source and terms URL are both `https://www.makro.co.za/pages/schweppes-competition`. |
| Closing date | Future/current as of 2026-05-18: 2026-05-31. |
| Prize | Clear enough but broad: VIP experience prizes, cash prizes, and instant money vouchers as defined in official terms. |
| Entry method | Evidence and `entrySteps` are clear, but `entryChannel` is truncated after `087 `. |
| Cost / loyalty / SMS | Purchase, WhatsApp/data, and till-slip requirements are clear. |
| Eligibility | Clear enough: South African permanent residents/citizens aged 18+, living in South Africa, valid SA ID or passport, with exclusions. |
| Source dependency | No competitor or aggregator URL in this held row. |
| Public summary | Generally accurate. |
| Entry instructions | Understandable in `entrySteps`; `entryChannel` needs repair before any public use. |
| Image | Missing; no reusable official campaign image confirmed. |
| Safety | Purchase, WhatsApp, till-slip upload, personal information, and multiple prize-tier risks are documented. |
| Duplicate check | Existing published row found: `schweppes-icon-reimagined-2026`, titled "Schweppes The Icon Reimagined 2026 Competition", closing 2026-05-31, official Coca-Cola terms URL. |

Classification: `reject_or_archive`

Blockers before any future reconsideration:

- Resolve duplicate relationship with the existing published Schweppes listing.
- Repair truncated `entryChannel`.
- Decide whether the Makro page represents a distinct retailer-specific campaign or should be archived as a duplicate/source variant.
- Resolve missing campaign image only if the row is retained.

### SPAR Rewards Vaseline Winter Drive

| Check | Result |
| --- | --- |
| Official source / terms | Official SPAR URL: `https://www.spar.co.za/SPAR-Rewards-Vaseline-Competition`. |
| Closing date | Future/current as of 2026-05-18: 2026-08-02. |
| Prize | Clear: 20 SPAR digital shopping vouchers valued at R2,500 each, total prize pool R50,000. |
| Entry method | Clear: buy any 2 Vaseline products from SPAR stores nationally and swipe a SPAR Rewards card for automatic entry. |
| Cost / loyalty / SMS | Purchase, SPAR Rewards, SMS, data/contact, and shopping costs are represented. |
| Eligibility | Clear enough: South African citizens, valid ID, 18+, with promoter/co-promoter/SPAR/supplier/employee/family exclusions. |
| Source dependency | No competitor or aggregator URL. |
| Public summary | Accurate and not over-promotional. |
| Entry instructions | Understandable; final public copy should remove private hold wording from `entrySteps` before publication. |
| Image | Official SPAR campaign image URL is present; reviewer should confirm reuse suitability before public use. |
| Safety | Purchase, loyalty, SMS/contact, voucher, personal information, and publicity risks are documented. |

Classification: `ready_to_publish_after_explicit_approval`

Publication blockers:

- No evidence blocker found.
- Before publication, remove private hold wording from entry instructions and confirm image reuse suitability.

### SPAR Rewards Vaseline Cera Glow

| Check | Result |
| --- | --- |
| Official source / terms | Official SPAR URL: `https://www.spar.co.za/SPAR-Rewards-Cera-Glow-Competition`. |
| Closing date | Future/current as of 2026-05-18: 2026-08-02. |
| Prize | Clear: 1 of 10 Vaseline Cera Glow hampers. |
| Entry method | Clear: buy any 2 Vaseline Cera Glow products from SPAR stores nationally and swipe a SPAR Rewards card for automatic entry. |
| Cost / loyalty / SMS | Purchase, SPAR Rewards, SMS/data/contact, and delivery-contact costs are represented. |
| Eligibility | Clear enough: South African citizens, valid ID, 18+, with promoter/co-promoter/SPAR/supplier/employee/family exclusions. |
| Source dependency | No competitor or aggregator URL. |
| Public summary | Accurate and not over-promotional. |
| Entry instructions | Understandable; final public copy should remove private hold wording from `entrySteps` before publication. |
| Image | Official SPAR campaign image URL is present; reviewer should confirm reuse suitability before public use. |
| Safety | Purchase, loyalty, SMS/phone contact, courier delivery address, personal information, and publicity risks are documented. |

Classification: `ready_to_publish_after_explicit_approval`

Publication blockers:

- No evidence blocker found.
- Before publication, remove private hold wording from entry instructions, confirm image reuse suitability, and check whether category `Tech` should be changed for a beauty hamper.

## Publication blockers and work required

| Row | Blocker or work item |
| --- | --- |
| Dis-Chem Garnier Pure Active | Image unresolved; remove private hold wording from `entrySteps` before public use. |
| Makro Schweppes Icon Reimagined | Duplicate with existing published Schweppes listing; truncated `entryChannel`; missing image; decide archive vs distinct retailer-specific listing. |
| SPAR Rewards Vaseline Winter Drive | Remove private hold wording from `entrySteps`; confirm image reuse suitability. |
| SPAR Rewards Vaseline Cera Glow | Remove private hold wording from `entrySteps`; confirm image reuse suitability; review category `Tech`. |

## Public/private status confirmation

All four rows remain unchanged:

| Row | verificationStatus | publicationStatus | doNotPublish |
| --- | --- | --- | --- |
| Dis-Chem Garnier Pure Active | `needs-verification` | `held` | `true` |
| Makro Schweppes Icon Reimagined | `needs-verification` | `held` | `true` |
| SPAR Rewards Vaseline Winter Drive | `needs-verification` | `held` | `true` |
| SPAR Rewards Vaseline Cera Glow | `needs-verification` | `held` | `true` |

No row was published, approved, marked public, assigned `doNotPublish: false`, or generated as a public page.

## Public exclusion proof

After generation, the four held slugs were checked for public artifacts:

| Row | Detail page exists | `/out` redirect exists | Sitemap entry exists |
| --- | --- | --- | --- |
| Dis-Chem Garnier Pure Active | No | No | No |
| Makro Schweppes Icon Reimagined | No | No | No |
| SPAR Rewards Vaseline Winter Drive | No | No | No |
| SPAR Rewards Vaseline Cera Glow | No | No | No |

`npm run validate:held-candidates` also passed with 0 errors and 0 warnings, including held-row public-artifact checks.

## Validation results

Final validation:

| Command | Result |
| --- | --- |
| `npm test` | Passed, 4 ZA held rows, 0 errors, 0 warnings |
| `npm run generate` | Passed |
| `npm run validate:held-candidates` | Passed, 4 ZA held rows, 0 errors, 0 warnings |

Final counts:

| Count | Before | After |
| --- | ---: | ---: |
| Total competitions | 159 | 159 |
| Published competitions | 76 | 76 |
| Held / needs-verification competitions | 83 | 83 |
| ZA held rows | 4 | 4 |

## ZA Comp Engine

ZA Comp Engine was not touched. A status check against `C:\Users\ricca\Desktop\Za Comp Engine` returned no changes.

## Recommended next phase

Recommended next Freehub phase: Phase 3.12 explicit held-row content cleanup, still private.

Suggested scope:

1. Keep all rows held at the start.
2. Archive or explicitly de-duplicate the Makro Schweppes held row against the existing published Schweppes listing.
3. Remove private hold wording from retained held rows' `entrySteps`.
4. Resolve the Dis-Chem image decision.
5. Confirm SPAR image reuse and review the SPAR Cera Glow category.
6. Run validation and public-exclusion proof again before any separate publication-approval phase.

