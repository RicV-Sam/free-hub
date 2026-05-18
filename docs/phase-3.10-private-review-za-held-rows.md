# Phase 3.10 Private Review: ZA Held Rows

Date: 2026-05-18

## Executive summary

Phase 3.10 privately reviewed the four ZA Comp Engine held rows imported into Freehub after Phase 3.9A. No rows were published, approved, or moved out of held status. This review is docs-only: `data/competitions.json` was not changed and no private review fields were added.

All four rows remain suitable only for private handling in this phase:

| Row | Decision |
| --- | --- |
| Dis-Chem Garnier Pure Active | ready_for_publication_review_later |
| Makro Schweppes Icon Reimagined | ready_for_publication_review_later |
| SPAR Rewards Vaseline Winter Drive | ready_for_publication_review_later |
| SPAR Rewards Vaseline Cera Glow | ready_for_publication_review_later |

The decisions above do not publish or approve the rows. They mean the imported evidence is strong enough for a later public-review phase, while the rows remain private with `verificationStatus: needs-verification`, `publicationStatus: held`, and `doNotPublish: true`.

## Starting state

Before review:

| Check | Result |
| --- | --- |
| `git status --short` | Clean |
| `npm run validate:held-candidates` | Passed, 4 ZA held rows, 0 errors, 0 warnings |
| `npm run generate` | Passed |
| `npm run validate:held-candidates` after generate | Passed, 4 ZA held rows, 0 errors, 0 warnings |
| Total competitions | 159 |
| Published competitions | 76 |
| Held / needs-verification competitions | 83 |
| ZA held rows | 4 |

## Rows reviewed

The four reviewed rows are:

| Freehub id | Title | Brand | Closing date | Status |
| --- | --- | --- | --- | --- |
| `dis-chem-garnier-pure-active-june-2026-competition` | Garnier Pure Active June 2026 Competition | Dis-Chem | 2026-06-28 | Held/private |
| `makro-schweppes-icon-reimagined-transaction-driver-2026-competition` | Schweppes Icon Reimagined Transaction Driver 2026 Competition | Makro | 2026-05-31 | Held/private |
| `spar-rewards-vaseline-winter-drive-competition-2026` | SPAR Rewards Vaseline Winter Drive Competition | SPAR South Africa | 2026-08-02 | Held/private |
| `spar-rewards-vaseline-cera-glow-competition-2026` | SPAR Rewards Vaseline Cera Glow Competition | SPAR South Africa | 2026-08-02 | Held/private |

## Per-row evidence table

| Row | Source URL | Terms URL | Prize | Entry mechanic | Cost / purchase requirement | Eligibility | Image notes | Risk notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Dis-Chem Garnier Pure Active | `https://www.dischem.co.za/site-terms-and-conditions` | `https://www.dischem.co.za/garnier-pure-active-june-2026-competition` | 1 of 10 double tickets to a 2026 Springbok game in South Africa | Buy four specified Garnier Pure Active products in-store and swipe a Dis-Chem Better Rewards card | Purchase required; Better Rewards card required; qualifying products required | South African legal residents and/or citizens, valid ID, over 18; employee, related-party, and recent-winner exclusions | No campaign-specific official image confirmed; not a blocker for later review | Purchase, loyalty card, age limit, event ticket prize, publicity/privacy clauses, unresolved image |
| Makro Schweppes Icon Reimagined | `https://www.makro.co.za/pages/schweppes-competition` | `https://www.makro.co.za/pages/schweppes-competition` | VIP experience prizes, cash prizes, and instant money vouchers as defined in official terms | Buy participating Schweppes product, scan QR code or WhatsApp `Schweppes` to `087 133 0081`, register, upload till slip | Purchase required; till slip required; normal WhatsApp/data costs may apply | South African permanent residents and citizens aged 18+, living in South Africa, valid SA ID or passport; employee and related-party exclusions | No candidate-specific official image confirmed; not a blocker for later review | Purchase, WhatsApp/data, till-slip upload, personal information processing, multiple prize tiers |
| SPAR Vaseline Winter Drive | `https://www.spar.co.za/SPAR-Rewards-Vaseline-Competition` | `https://www.spar.co.za/SPAR-Rewards-Vaseline-Competition` | 20 SPAR digital shopping vouchers valued at R2,500 each, total prize pool R50,000 | Buy any 2 Vaseline products from SPAR stores nationally and swipe a SPAR Rewards card for automatic entry | Purchase required; SPAR Rewards card required; normal shopping, rewards-card, SMS, and data/contact costs may apply | South African citizens with valid ID, 18+; promoter, co-promoter, SPAR Guild, Build it Guild, supplier, employee, agent, consultant, partner, and immediate-family exclusions | Official SPAR campaign image URL captured; reviewer should confirm reuse suitability before public use | Purchase, loyalty card, age restriction, SMS/contact, voucher prize, personal information, publicity clause |
| SPAR Vaseline Cera Glow | `https://www.spar.co.za/SPAR-Rewards-Cera-Glow-Competition` | `https://www.spar.co.za/SPAR-Rewards-Cera-Glow-Competition` | 1 of 10 Vaseline Cera Glow hampers | Buy any 2 Vaseline Cera Glow products from SPAR stores nationally and swipe a SPAR Rewards card for automatic entry | Purchase required; SPAR Rewards card required; normal shopping, rewards-card, SMS, data/contact, and delivery-contact costs may apply | South African citizens with valid ID, 18+; promoter, co-promoter, SPAR Guild, Build it Guild, supplier, employee, agent, consultant, partner, and immediate-family exclusions | Official SPAR campaign image URL captured; reviewer should confirm reuse suitability before public use | Purchase, loyalty card, age restriction, SMS/phone contact, courier delivery address, personal information, publicity clause |

## Source validation

This phase validated the rows from existing Freehub data and imported ZA evidence fields. No new crawler or browser logic was introduced.

| Row | Source assessment |
| --- | --- |
| Dis-Chem Garnier Pure Active | Source and terms domains are official Dis-Chem domains. Terms URL is campaign-specific. The source URL is the official Dis-Chem terms-and-conditions page, so it is official but less specific than the terms URL. Imported evidence clearly covers closing date, prize, entry, Better Rewards requirement, eligibility, and random draw. |
| Makro Schweppes Icon Reimagined | Source and terms URL are the same official Makro page. Imported evidence states that saved official Makro terms identify promoters, campaign period, QR/WhatsApp/till-slip entry, eligibility, and prize tiers. |
| SPAR Vaseline Winter Drive | Source and terms URL are the same official SPAR page. Imported evidence states that the official SPAR page contains the full information schedule and terms. |
| SPAR Vaseline Cera Glow | Source and terms URL are the same official SPAR page. Imported evidence states that the official SPAR page contains the full information schedule and terms. |

No competitor or aggregator source URLs are used by the four rows.

## Per-row decisions

### Dis-Chem Garnier Pure Active

Decision: `ready_for_publication_review_later`

Reason: The official Dis-Chem campaign terms URL and imported evidence are sufficient for a later public-review phase. The row has a future closing date, clear prize, clear purchase and Better Rewards mechanics, clear eligibility, and explicit risk flags. The missing campaign image should be noted but should not block later review by itself.

Missing evidence: No clearly reusable campaign-specific official image confirmed.

### Makro Schweppes Icon Reimagined

Decision: `ready_for_publication_review_later`

Reason: The official Makro source/terms URL and imported evidence are sufficient for a later public-review phase. The row has a future closing date as of 2026-05-18, clear prize categories, QR/WhatsApp/till-slip entry mechanics, purchase/data risks, and eligibility. One data-quality note remains: `entryChannel` is truncated after `087 `, although the full WhatsApp number is present in `entrySteps` and evidence notes.

Missing evidence: No clearly reusable candidate-specific official image confirmed. Review `entryChannel` text before any later publication step.

### SPAR Rewards Vaseline Winter Drive

Decision: `ready_for_publication_review_later`

Reason: The official SPAR source/terms URL and imported evidence are sufficient for a later public-review phase. The row has a future closing date, clear prize value and quantity, clear purchase plus SPAR Rewards automatic-entry mechanics, clear eligibility, and risk flags for purchase, loyalty, SMS/contact, voucher prize, personal information, and publicity.

Missing evidence: None blocking. Image reuse suitability should be confirmed before public use.

### SPAR Rewards Vaseline Cera Glow

Decision: `ready_for_publication_review_later`

Reason: The official SPAR source/terms URL and imported evidence are sufficient for a later public-review phase. The row has a future closing date, clear hamper prize, clear purchase plus SPAR Rewards automatic-entry mechanics, clear eligibility, and risk flags for purchase, loyalty, SMS/phone contact, courier delivery address, personal information, and publicity.

Missing evidence: None blocking. Image reuse suitability should be confirmed before public use.

## Public/private status confirmation

All reviewed rows remain:

| Row | verificationStatus | publicationStatus | doNotPublish |
| --- | --- | --- | --- |
| Dis-Chem Garnier Pure Active | `needs-verification` | `held` | `true` |
| Makro Schweppes Icon Reimagined | `needs-verification` | `held` | `true` |
| SPAR Vaseline Winter Drive | `needs-verification` | `held` | `true` |
| SPAR Vaseline Cera Glow | `needs-verification` | `held` | `true` |

No row was published, approved, or marked public.

## Public exclusion proof

After `npm run generate`, each held row was checked for generated public artifacts:

| Row | Detail page exists | `/out` redirect exists | Sitemap entry exists |
| --- | --- | --- | --- |
| Dis-Chem Garnier Pure Active | No | No | No |
| Makro Schweppes Icon Reimagined | No | No | No |
| SPAR Vaseline Winter Drive | No | No | No |
| SPAR Vaseline Cera Glow | No | No | No |

`npm run validate:held-candidates` also scans generated public HTML, detail pages, `/out` redirects, and `sitemap.xml` for the four imported held rows. It passed with 0 errors and 0 warnings.

## Validation results

Required validation commands:

| Command | Result |
| --- | --- |
| `git status --short` before changes | Clean |
| `npm run validate:held-candidates` before generate | Passed, 0 errors, 0 warnings |
| `npm run generate` before review | Passed |
| `npm run validate:held-candidates` after generate | Passed, 0 errors, 0 warnings |

Final validation commands:

| Command | Result |
| --- | --- |
| `npm test` | Passed |
| `npm run generate` | Passed |
| `npm run validate:held-candidates` | Passed, 0 errors, 0 warnings |

Final counts:

| Count | Before | After |
| --- | ---: | ---: |
| Total competitions | 159 | 159 |
| Published competitions | 76 | 76 |
| Held / needs-verification competitions | 83 | 83 |
| ZA held rows | 4 | 4 |

## Recommended next phase

Recommended next Freehub phase: Phase 3.11 private publication-readiness pass.

Suggested scope:

1. Keep all four rows held at the start of the phase.
2. Resolve the Makro `entryChannel` truncation before any public review decision.
3. Decide whether to add or omit public images for the four rows.
4. Reconfirm official pages shortly before any publication-review action, because Makro closes on 2026-05-31 and Dis-Chem closes on 2026-06-28.
5. Only after a separate explicit approval phase, consider whether any row should move from private held review to public publication workflow.

