# Phase 3.13 Held-Row Disposition and Approval Gate

Date: 2026-05-18

## Executive summary

Phase 3.13 defines private disposition decisions for the four ZA Comp Engine held rows and documents the explicit approval gate required before any future publication phase. This phase is docs-only: `data/competitions.json` was not changed and no private disposition fields were added because no safe existing private disposition convention was found in Freehub.

No rows were published. All four rows remain `verificationStatus: "needs-verification"`, `publicationStatus: "held"`, and `doNotPublish: true`.

Final private dispositions:

| Row | Disposition |
| --- | --- |
| Dis-Chem Garnier Pure Active | `needs_image_or_content_before_approval` |
| Makro Schweppes Icon Reimagined | `reject_or_archive` |
| SPAR Rewards Vaseline Winter Drive | `approve_for_explicit_publish_phase` |
| SPAR Rewards Vaseline Cera Glow | `approve_for_explicit_publish_phase` |

`approve_for_explicit_publish_phase` does not publish a row. It only means the row may be considered in a later, separate, explicitly requested publication phase.

## Starting state

Phase 3.12 prerequisite was satisfied:

| Check | Result |
| --- | --- |
| Latest commit | `884d6d6 Clean up ZA held row content` |
| HEAD tag | `phase-3.12-held-row-content-cleanup` |
| Phase 3.12 report | Tracked in git |
| Starting working tree | Clean |

Starting validation:

| Command | Result |
| --- | --- |
| `git status` | Clean working tree; `main` ahead of `origin/main` by 4 commits |
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

| Row | Title | Brand | Category | Closing date | Status |
| --- | --- | --- | --- | --- | --- |
| Dis-Chem Garnier Pure Active | Garnier Pure Active June 2026 Competition | Dis-Chem | Vouchers | 2026-06-28 | Held/private |
| Makro Schweppes Icon Reimagined | Schweppes Icon Reimagined Transaction Driver 2026 Competition | Makro | Vouchers | 2026-05-31 | Held/private |
| SPAR Rewards Vaseline Winter Drive | SPAR Rewards Vaseline Winter Drive Competition | SPAR South Africa | Vouchers | 2026-08-02 | Held/private |
| SPAR Rewards Vaseline Cera Glow | SPAR Rewards Vaseline Cera Glow Competition | SPAR South Africa | Vouchers | 2026-08-02 | Held/private |

## Private disposition decisions

| Row | Disposition | Reason |
| --- | --- | --- |
| Dis-Chem Garnier Pure Active | `needs_image_or_content_before_approval` | Evidence, source, prize, entry, purchase, loyalty, and eligibility are clear, and Phase 3.12 cleaned public-safe entry steps. The image remains unresolved and has not been explicitly accepted as a non-blocker for publication. |
| Makro Schweppes Icon Reimagined | `reject_or_archive` | Prior phases identified a duplicate/superseded risk with existing published row `schweppes-icon-reimagined-2026`. Phase 3.12 repaired content but did not resolve the duplicate relationship or image gap. |
| SPAR Rewards Vaseline Winter Drive | `approve_for_explicit_publish_phase` | Evidence and content are complete enough for a later explicit publication phase: official SPAR source/terms URL, future closing date, clear voucher prize, clear purchase plus SPAR Rewards mechanic, transparent cost label, clear eligibility, risk notes, and official SPAR image URL with reuse-suitability caution. |
| SPAR Rewards Vaseline Cera Glow | `approve_for_explicit_publish_phase` | Evidence and content are complete enough for a later explicit publication phase after Phase 3.12 category cleanup: official SPAR source/terms URL, future closing date, clear hamper prize, clear purchase plus SPAR Rewards mechanic, transparent cost label, clear eligibility, risk notes, and official SPAR image URL with reuse-suitability caution. |

## Row detail

### Dis-Chem Garnier Pure Active

Disposition: `needs_image_or_content_before_approval`

Evidence summary:

- Official Dis-Chem source/terms domains are present.
- `termsUrl` is campaign-specific.
- Closing date is 2026-06-28, future/current as of 2026-05-18.
- Prize is clear: 1 of 10 double tickets to a 2026 Springbok game in South Africa.
- Entry method is clear: buy four specified Garnier Pure Active products in-store and swipe a Dis-Chem Better Rewards card.
- Cost and loyalty requirements are explicit.
- Eligibility is clear enough for later review.

Blocker:

- No clearly reusable campaign-specific official image is confirmed. The row has `imageReviewNote` and the `image-unresolved` tag. A future approval phase must either resolve the image or explicitly accept a no-image publication path.

### Makro Schweppes Icon Reimagined

Disposition: `reject_or_archive`

Evidence summary:

- Official Makro source/terms URL is present.
- Closing date is 2026-05-31, future/current as of 2026-05-18.
- Prize categories, entry method, purchase requirement, till-slip requirement, WhatsApp/data risks, and eligibility are represented.
- Phase 3.12 repaired the truncated `entryChannel`.

Rejection/archive reason:

- Existing published row `schweppes-icon-reimagined-2026` already covers "Schweppes The Icon Reimagined 2026 Competition" with closing date 2026-05-31 and an official Coca-Cola terms URL.
- The Makro held row appears to be a duplicate or source variant rather than a distinct publishable listing.
- No rejected-held-import status convention was found, so the row remains held/private rather than being deleted or moved to an unsupported archive status.

### SPAR Rewards Vaseline Winter Drive

Disposition: `approve_for_explicit_publish_phase`

Evidence summary:

- Official SPAR source/terms URL is present.
- Closing date is 2026-08-02, future/current as of 2026-05-18.
- Prize is clear: 20 SPAR digital shopping vouchers valued at R2,500 each.
- Entry method is clear: buy any 2 Vaseline products from SPAR stores nationally and swipe a SPAR Rewards card.
- Cost, purchase, loyalty-card, SMS/contact, and eligibility requirements are explicit.
- Phase 3.12 removed private hold wording from entry steps.
- Official SPAR image URL is present, with a note requiring reuse suitability confirmation.

Gate caveat:

- Before publication, confirm image reuse suitability or explicitly publish without relying on the image.

### SPAR Rewards Vaseline Cera Glow

Disposition: `approve_for_explicit_publish_phase`

Evidence summary:

- Official SPAR source/terms URL is present.
- Closing date is 2026-08-02, future/current as of 2026-05-18.
- Prize is clear: 1 of 10 Vaseline Cera Glow hampers.
- Entry method is clear: buy any 2 Vaseline Cera Glow products from SPAR stores nationally and swipe a SPAR Rewards card.
- Cost, purchase, loyalty-card, SMS/phone/courier contact, and eligibility requirements are explicit.
- Phase 3.12 removed private hold wording and corrected the row to `category: "Vouchers"` and `prizeType: "voucher"`.
- Official SPAR image URL is present, with a note requiring reuse suitability confirmation.

Gate caveat:

- Before publication, confirm image reuse suitability or explicitly publish without relying on the image.

## Explicit approval gate

A future publication phase must satisfy all of these conditions before publishing any held row:

1. The user explicitly asks to publish or approve specific row(s).
2. The row has Phase 3.13 disposition `approve_for_explicit_publish_phase`.
3. The source URL and terms URL are still live/valid at the time of publication.
4. The closing date is still future/current at the time of publication.
5. Title, summary, prize, entry method, cost/purchase/loyalty/SMS requirements, and eligibility are public-safe.
6. Image handling is resolved, or the user explicitly accepts a no-image path.
7. The row is not a duplicate of an existing published row.
8. Pre-generation validation passes.
9. Publication changes are row-specific and do not alter unrelated competitions or existing published rows.
10. After generation, public detail pages exist only for rows explicitly published in that future phase.
11. After generation, `/out` redirects exist only for rows explicitly published in that future phase.
12. After generation, `sitemap.xml` includes only published detail pages and excludes held rows.
13. Remaining held rows stay excluded from public HTML, `/out` redirects, and sitemap entries.
14. Final `npm test`, `npm run generate`, and `npm run validate:held-candidates` pass.

## Eligibility for future explicit publish phase

Eligible for future explicit publication consideration:

| Row | Gate status |
| --- | --- |
| SPAR Rewards Vaseline Winter Drive | Eligible, subject to the explicit approval gate and image handling confirmation. |
| SPAR Rewards Vaseline Cera Glow | Eligible, subject to the explicit approval gate and image handling confirmation. |

Not eligible yet:

| Row | Reason |
| --- | --- |
| Dis-Chem Garnier Pure Active | Needs image resolution or explicit no-image acceptance before approval. |
| Makro Schweppes Icon Reimagined | Recommended reject/archive due to duplicate/superseded risk with an existing published Schweppes listing. |

## Public/private status confirmation

All four rows remain:

| Row | verificationStatus | publicationStatus | doNotPublish |
| --- | --- | --- | --- |
| Dis-Chem Garnier Pure Active | `needs-verification` | `held` | `true` |
| Makro Schweppes Icon Reimagined | `needs-verification` | `held` | `true` |
| SPAR Rewards Vaseline Winter Drive | `needs-verification` | `held` | `true` |
| SPAR Rewards Vaseline Cera Glow | `needs-verification` | `held` | `true` |

No row was published, marked public, approved, or given `doNotPublish: false`.

## Public exclusion proof

After generation, all four held rows were checked for public artifacts:

| Row | Detail page exists | `/out` redirect exists | Sitemap entry exists |
| --- | --- | --- | --- |
| Dis-Chem Garnier Pure Active | No | No | No |
| Makro Schweppes Icon Reimagined | No | No | No |
| SPAR Rewards Vaseline Winter Drive | No | No | No |
| SPAR Rewards Vaseline Cera Glow | No | No | No |

`npm run validate:held-candidates` passed with 0 errors and 0 warnings, including held-row public-artifact checks.

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

Recommended next Freehub phase: Phase 3.14 explicit publication approval, only if the user explicitly asks to publish specific eligible row(s).

Suggested scope:

1. Keep all rows held at the start.
2. Re-check official URLs and closing dates live for the specific rows requested.
3. Apply the explicit approval gate row by row.
4. Publish only rows explicitly approved by the user.
5. Keep Dis-Chem and Makro held unless the user explicitly resolves their blockers in a separate instruction.

