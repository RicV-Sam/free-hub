# Phase 3.14 Explicit Publication Approval: Selected Held Rows

Date: 2026-05-18

## Executive summary

Phase 3.14 explicitly published only the two Phase 3.13-eligible SPAR held rows:

- SPAR Rewards Vaseline Winter Drive
- SPAR Rewards Vaseline Cera Glow

No other held rows were published. Dis-Chem Garnier Pure Active and Makro Schweppes Icon Reimagined remain held/private. ZA Comp Engine was not touched.

## Rows approved and published

| Row | Slug | Source / terms URL | Closing date |
| --- | --- | --- | --- |
| SPAR Rewards Vaseline Winter Drive | `spar-rewards-vaseline-winter-drive-competition-2026` | `https://www.spar.co.za/SPAR-Rewards-Vaseline-Competition` | 2026-08-02 |
| SPAR Rewards Vaseline Cera Glow | `spar-rewards-vaseline-cera-glow-competition-2026` | `https://www.spar.co.za/SPAR-Rewards-Cera-Glow-Competition` | 2026-08-02 |

Both official SPAR URLs returned HTTP 200 in lightweight live checks before publication.

## Rows explicitly not published

| Row | Status after Phase 3.14 | Reason |
| --- | --- | --- |
| Dis-Chem Garnier Pure Active | Held/private | Phase 3.13 disposition was `needs_image_or_content_before_approval`. |
| Makro Schweppes Icon Reimagined | Held/private | Phase 3.13 disposition was `reject_or_archive`. |

## Starting counts

| Count | Before |
| --- | ---: |
| Total competitions | 159 |
| Published competitions | 76 |
| Held / needs-verification competitions | 83 |
| ZA held rows | 4 |
| Expired published rows | 0 |

## Final counts

| Count | After |
| --- | ---: |
| Total competitions | 159 |
| Published competitions | 78 |
| Held / needs-verification competitions | 81 |
| ZA held rows | 2 |
| Expired published rows | 0 |

## Exact data fields changed

Only the two selected SPAR rows were changed in `data/competitions.json`.

| Row | Field | Before | After |
| --- | --- | --- | --- |
| SPAR Rewards Vaseline Winter Drive | `verificationStatus` | `needs-verification` | `published` |
| SPAR Rewards Vaseline Winter Drive | `publicationStatus` | `held` | `published` |
| SPAR Rewards Vaseline Winter Drive | `doNotPublish` | `true` | `false` |
| SPAR Rewards Vaseline Winter Drive | `sourceReviewStatus` | `manual-review-required` | `approved-for-publication` |
| SPAR Rewards Vaseline Winter Drive | `verificationNote` | Imported held-review note ending with "Do not publish until manually reviewed in Freehub." | Phase 3.14 publication note preserving imported evidence and removing the no-publish instruction. |
| SPAR Rewards Vaseline Cera Glow | `verificationStatus` | `needs-verification` | `published` |
| SPAR Rewards Vaseline Cera Glow | `publicationStatus` | `held` | `published` |
| SPAR Rewards Vaseline Cera Glow | `doNotPublish` | `true` | `false` |
| SPAR Rewards Vaseline Cera Glow | `sourceReviewStatus` | `manual-review-required` | `approved-for-publication` |
| SPAR Rewards Vaseline Cera Glow | `verificationNote` | Imported held-review note ending with "Do not publish until manually reviewed in Freehub." | Phase 3.14 publication note preserving imported evidence and removing the no-publish instruction. |

Preserved for both rows:

- `sourceUrl`
- `termsUrl`
- `closingDate`
- `prizeName`
- `entryType`
- `entryChannel`
- `entryCostType`
- `entryFeeLabel`
- `purchaseRequired`
- `requiredProduct`
- `costOrPurchaseRequirement`
- `eligibility`
- `riskFlags`
- `image`
- `imageReviewNote`
- `evidenceNotes`
- `sourceSystem`
- `sourceHandoffId`

## Public page URLs generated

| Row | Public detail URL | Local artifact |
| --- | --- | --- |
| SPAR Rewards Vaseline Winter Drive | `https://freehub.co.za/competition/spar-rewards-vaseline-winter-drive-competition-2026/` | `competition/spar-rewards-vaseline-winter-drive-competition-2026/index.html` exists |
| SPAR Rewards Vaseline Cera Glow | `https://freehub.co.za/competition/spar-rewards-vaseline-cera-glow-competition-2026/` | `competition/spar-rewards-vaseline-cera-glow-competition-2026/index.html` exists |

## `/out` redirect confirmation

| Row | `/out` URL | Local artifact |
| --- | --- | --- |
| SPAR Rewards Vaseline Winter Drive | `https://freehub.co.za/out/spar-rewards-vaseline-winter-drive-competition-2026/` | `out/spar-rewards-vaseline-winter-drive-competition-2026/index.html` exists |
| SPAR Rewards Vaseline Cera Glow | `https://freehub.co.za/out/spar-rewards-vaseline-cera-glow-competition-2026/` | `out/spar-rewards-vaseline-cera-glow-competition-2026/index.html` exists |

## Sitemap confirmation

`sitemap.xml` includes both new public detail URLs:

- `https://freehub.co.za/competition/spar-rewards-vaseline-winter-drive-competition-2026/`
- `https://freehub.co.za/competition/spar-rewards-vaseline-cera-glow-competition-2026/`

No `/out` URLs were added to the sitemap.

## Held-row exclusion proof

The remaining ZA held rows stay excluded:

| Row | Detail page exists | `/out` redirect exists | Sitemap entry exists |
| --- | --- | --- | --- |
| Dis-Chem Garnier Pure Active | No | No | No |
| Makro Schweppes Icon Reimagined | No | No | No |

A broader held-row scan checked 81 held/private rows and found no generated detail-page, `/out`, or sitemap leaks.

## Validation results

| Command | Result |
| --- | --- |
| `npm test` | Passed, 2 ZA held rows, 0 errors, 0 warnings |
| `npm run generate` | Passed |
| `npm run validate:held-candidates` | Passed, 2 ZA held rows, 0 errors, 0 warnings |

The final held validator reported only:

- `dis-chem-garnier-pure-active-june-2026-competition`
- `makro-schweppes-icon-reimagined-transaction-driver-2026-competition`

## Rollback instructions

To roll back Phase 3.14 before commit:

1. Restore `data/competitions.json` from git.
2. Run `npm run generate`.
3. Run `npm run validate:held-candidates`.
4. Confirm the SPAR detail pages and `/out` redirects are removed.
5. Confirm `sitemap.xml` no longer includes the two SPAR detail URLs.

To roll back after commit:

1. Revert the Phase 3.14 commit.
2. Run `npm run generate`.
3. Run `npm run validate:held-candidates`.
4. Confirm counts return to 76 published, 83 held / needs-verification, 159 total, and 4 ZA held rows.
5. Confirm no held rows leak into detail pages, `/out`, or `sitemap.xml`.

## ZA Comp Engine

ZA Comp Engine was not touched. A status check against `C:\Users\ricca\Desktop\Za Comp Engine` returned no changes.

## Recommended next phase

Recommended next Freehub phase: Phase 3.15 publish audit and optional commit.

Suggested scope:

1. Review the generated SPAR public pages.
2. Confirm the two new public entries appear in category/listing surfaces as expected.
3. If satisfactory, commit `data/competitions.json`, generated public artifacts, and this report.
4. Leave Dis-Chem and Makro held/private unless a later explicit phase resolves their blockers.

