# Phase 3.12 Held-Row Content Cleanup

Date: 2026-05-18

## Executive summary

Phase 3.12 performed a narrow private content cleanup for the four ZA Comp Engine held rows. This phase made minimal row-level changes in `data/competitions.json` to remove private hold wording from public-safe content fields, repair one truncated Makro entry channel from existing evidence, and align the SPAR Cera Glow hamper row with the existing voucher-category pattern.

No rows were published. All four rows remain `verificationStatus: "needs-verification"`, `publicationStatus: "held"`, and `doNotPublish: true`.

## Starting state

Phase 3.11 prerequisite was satisfied:

| Check | Result |
| --- | --- |
| Latest commit | `49bd432 Review ZA held rows for publication readiness` |
| HEAD tag | `phase-3.11-private-publication-readiness-pass` |
| Phase 3.11 report | Tracked in git |
| Starting working tree | Clean |

Starting validation:

| Command | Result |
| --- | --- |
| `git status` | Clean working tree; `main` ahead of `origin/main` by 3 commits |
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

| Row | Phase 3.11 decision | Phase 3.12 action |
| --- | --- | --- |
| Dis-Chem Garnier Pure Active | `needs_content_or_image_work` | Removed private hold wording from `entrySteps`; image remains unresolved. |
| Makro Schweppes Icon Reimagined | `reject_or_archive` | Kept held/private; repaired truncated `entryChannel`; removed private hold wording from `entrySteps`; documented reject/archive decision. |
| SPAR Rewards Vaseline Winter Drive | `ready_to_publish_after_explicit_approval` | Removed private hold wording from `entrySteps`; kept all status fields held/private. |
| SPAR Rewards Vaseline Cera Glow | `ready_to_publish_after_explicit_approval` | Removed private hold wording from `entrySteps`; changed category/prize type from Tech to Vouchers to match a beauty hamper pattern; kept all status fields held/private. |

## Data changes made

`data/competitions.json` was changed only for the four ZA held rows:

| Row | Field | Change |
| --- | --- | --- |
| Dis-Chem Garnier Pure Active | `entrySteps` | Removed the private-only instruction: "Keep this row held until a reviewer confirms purchase, loyalty-card, product and prize caveats." |
| Makro Schweppes Icon Reimagined | `entrySteps` | Removed the private-only instruction: "Keep this row held until a reviewer confirms all official terms and cost notes." |
| Makro Schweppes Icon Reimagined | `entryChannel` | Repaired the truncated WhatsApp entry channel using the full number and mechanic already present in `entrySteps` and evidence notes. |
| SPAR Rewards Vaseline Winter Drive | `entrySteps` | Removed the private-only instruction: "Keep this row held until a reviewer confirms all official terms and cost notes." |
| SPAR Rewards Vaseline Cera Glow | `entrySteps` | Removed the private-only instruction: "Keep this row held until a reviewer confirms all official terms and cost notes." |
| SPAR Rewards Vaseline Cera Glow | `category` | Changed from `Tech` to `Vouchers`, consistent with comparable beauty-hamper rows in the current dataset. |
| SPAR Rewards Vaseline Cera Glow | `prizeType` | Changed from `tech` to `voucher`, matching the revised category. |

No source URLs, terms URLs, evidence notes, risk flags, purchase requirements, eligibility text, image URLs, or held/private status fields were changed.

## Row-level cleanup decisions

### Dis-Chem Garnier Pure Active

Action: content cleanup only; still `needs_content_or_image_work`.

The row already had a clear title, summary, prize, official Dis-Chem source/terms fields, purchase requirement, Better Rewards requirement, eligibility, and risk flags. The only data cleanup applied was removing private hold wording from `entrySteps` so the field is public-safe if a later explicit phase considers publication.

Remaining gap: no clearly reusable official campaign image is confirmed. The row keeps `imageReviewNote` and the `image-unresolved` tag. No image was added or assumed.

### Makro Schweppes Icon Reimagined

Action: leave held/private with reject/archive decision documented; minimal content repair only.

No rejected-held-import status field was found in the current Freehub data model, and the archive convention appears targeted at expired competitions. The row was therefore not deleted, archived, or given a new unsupported private field. It remains held/private.

Cleanup applied:

- Removed private hold wording from `entrySteps`.
- Repaired the truncated `entryChannel` using the full WhatsApp entry detail already present in the row's `entrySteps` and imported evidence.

Reject/archive reason remains: the row appears to duplicate the existing published `schweppes-icon-reimagined-2026` listing, and it has no confirmed reusable image. It should not proceed to public publication unless a later phase explicitly proves it is a distinct retailer-specific listing worth retaining.

### SPAR Rewards Vaseline Winter Drive

Action: publication-prep cleanup; still held/private.

The row already had clear official SPAR source/terms fields, title, summary, voucher prize, entry method, cost label, eligibility, risk notes, and official SPAR image URL with a reuse-suitability caution. The only data cleanup applied was removing private hold wording from `entrySteps`.

Status: remains suitable for future explicit publication approval, subject to image reuse confirmation and a separate publication phase.

### SPAR Rewards Vaseline Cera Glow

Action: publication-prep cleanup; still held/private.

The row already had clear official SPAR source/terms fields, title, summary, hamper prize, entry method, cost label, eligibility, risk notes, and official SPAR image URL with a reuse-suitability caution.

Cleanup applied:

- Removed private hold wording from `entrySteps`.
- Changed `category` from `Tech` to `Vouchers`.
- Changed `prizeType` from `tech` to `voucher`.

Reason: current Freehub categories are Cash, Cars, Holidays, Tech, and Vouchers. Comparable beauty-hamper rows in the dataset use `Vouchers`, and this row is not a tech/gadget/electronics prize.

Status: remains suitable for future explicit publication approval, subject to image reuse confirmation and a separate publication phase.

## Rows left unchanged

No unrelated competitions were changed. Existing published rows were not altered.

Within the four ZA held rows, these fields were intentionally preserved:

- `verificationStatus`
- `publicationStatus`
- `doNotPublish`
- `sourceUrl`
- `termsUrl`
- `sourceSystem`
- `sourceReviewStatus`
- `sourceHandoffId`
- `verificationNote`
- `evidenceNotes`
- `riskFlags`
- `validationWarnings`
- `purchaseRequired`
- `entryFeeLabel`
- `requiredProduct`
- `costOrPurchaseRequirement`
- `eligibility`
- `image` and `imageReviewNote`

## Public/private status confirmation

All four rows remain:

| Row | verificationStatus | publicationStatus | doNotPublish |
| --- | --- | --- | --- |
| Dis-Chem Garnier Pure Active | `needs-verification` | `held` | `true` |
| Makro Schweppes Icon Reimagined | `needs-verification` | `held` | `true` |
| SPAR Rewards Vaseline Winter Drive | `needs-verification` | `held` | `true` |
| SPAR Rewards Vaseline Cera Glow | `needs-verification` | `held` | `true` |

No row was published, marked public, or given `doNotPublish: false`.

## Public exclusion proof

After generation, all four held rows were checked for public artifacts:

| Row | Detail page exists | `/out` redirect exists | Sitemap entry exists |
| --- | --- | --- | --- |
| Dis-Chem Garnier Pure Active | No | No | No |
| Makro Schweppes Icon Reimagined | No | No | No |
| SPAR Rewards Vaseline Winter Drive | No | No | No |
| SPAR Rewards Vaseline Cera Glow | No | No | No |

`npm run validate:held-candidates` also passed with 0 errors and 0 warnings, including public-artifact checks for held rows.

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

Recommended next Freehub phase: Phase 3.13 private held-row disposition and explicit approval gate.

Suggested scope:

1. Keep all rows held at the start.
2. Decide whether to archive the Makro duplicate using an explicit, repo-supported convention or leave it held as a duplicate rejection.
3. Confirm SPAR image reuse suitability before any publication.
4. Decide whether Dis-Chem should proceed without an image or wait for official campaign art.
5. If publication is requested, do it in a separate explicit phase with row-by-row approval and validation.

