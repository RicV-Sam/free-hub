# Phase 3.6A Freehub Private Import Script

Generated: 2026-05-15

## Executive summary

Phase 3.6A added a Freehub-side workflow for importing ZA Comp Engine held-review rows without publishing them.

The current import brings in two rows:

- Capitec MoneyUp Academy Competition
- Dis-Chem Garnier Pure Active June 2026 Competition

Both rows remain `verificationStatus: "needs-verification"`, `publicationStatus: "held"`, `sourceReviewStatus: "manual-review-required"`, and `doNotPublish: true`.

No rows were marked published.

## What was implemented

Added npm scripts:

- `npm run import:held-candidates`
- `npm run validate:held-candidates`
- `npm run generate`
- `npm test`

Added scripts:

- `scripts/import-held-candidates.js`
- `scripts/validate-held-candidates.js`

Strengthened public generation in `scripts/generate-pages.js` so current non-published rows are no longer used to generate public `/competition/{slug}/` detail pages or `/out/{slug}/` redirect pages.

Added `data/backups/` to `.gitignore` so import backups stay local.

## Import command

Default import:

```bash
npm run import:held-candidates
```

Dry run:

```bash
npm run import:held-candidates -- --dry-run
```

The default input path is:

```text
C:\Users\ricca\Desktop\Za Comp Engine\storage\exports\freehub-handoff-candidates.json
```

The default validation path is:

```text
C:\Users\ricca\Desktop\Za Comp Engine\storage\exports\freehub-handoff-validation.json
```

The script validates that the ZA handoff validation passed with zero errors before importing.

## Validator command

```bash
npm run validate:held-candidates
```

The validator checks that ZA-held rows:

- remain `needs-verification`
- are not `published`
- preserve `publicationStatus: "held"`
- preserve `sourceReviewStatus: "manual-review-required"`
- preserve `doNotPublish: true`
- preserve source URL, terms URL, eligibility, risk flags, evidence notes, image review notes, and validation warnings
- do not have generated public detail pages
- do not have generated `/out/` redirect pages
- do not appear in `sitemap.xml`
- do not collide with duplicate IDs

## Backup behaviour

Before a real import writes to `data/competitions.json`, the importer creates a timestamped backup under:

```text
data/backups/
```

Current backup created:

```text
C:\Users\ricca\Desktop\free-hub\data\backups\competitions-before-held-import-20260515T190605Z.json
```

Backups are intentionally ignored by git.

## Dry-run behaviour

Dry run validates the ZA handoff and prints the import plan without writing `data/competitions.json` or creating a backup.

Current dry-run result:

| Metric | Result |
| --- | ---: |
| Rows read | 2 |
| Rows to import | 2 |
| Rows to update | 0 |
| Rows to skip | 0 |
| Errors | 0 |

## Field mapping summary

| ZA handoff field | Freehub field |
| --- | --- |
| `proposedSlug` | `id` |
| `proposedId` | `sourceHandoffId` |
| `brand` | `brand` |
| `title` | `title` |
| `summary` | `summary` |
| `prize` | `prizeName`, `prizeType`, `numberOfPrizes` where clear |
| `sourceUrl` | `sourceUrl`, `sourceDomain`, and sometimes `url` |
| `termsUrl` | `termsUrl` and sometimes `url` |
| `closingDate` | `closingDate` |
| `entryMethod` | `entryType`, `entrySteps`, `entryChannel` |
| `costOrPurchaseRequirement` | `entryCostType`, `entryFeeLabel`, `purchaseRequired`, `requiredProduct` where clear |
| `eligibility` | `eligibility`, `region` |
| `riskFlags` | `riskFlags`, `tags` |
| `imageUrl` / `imageNotes` | `image`, `imageReviewNote` |
| `evidenceNotes` | `evidenceNotes`, `verificationNote` |
| `sourceReport` | `sourceReport` |
| `verificationStatus` | `verificationStatus` |
| `publicationStatus` | `publicationStatus` |
| `sourceReviewStatus` | `sourceReviewStatus` |
| `doNotPublish` | `doNotPublish` |

## Public exclusion proof

After import and generation:

| Row | Detail page generated? | `/out/` redirect generated? | Sitemap entry? |
| --- | --- | --- | --- |
| `capitec-moneyup-academy-competition-2026` | No | No | No |
| `dis-chem-garnier-pure-active-june-2026-competition` | No | No | No |

The validator also checks that at least one existing active published row still has a generated detail page, `/out/` page, and sitemap entry.

## Current import result

Real import result:

| Metric | Result |
| --- | ---: |
| Rows read | 2 |
| Rows imported | 2 |
| Rows updated | 0 |
| Rows skipped | 0 |
| Errors | 0 |
| Warnings | 0 |

Imported rows:

| Brand | ID | Verification status | Publication status | Do not publish |
| --- | --- | --- | --- | --- |
| Capitec | `capitec-moneyup-academy-competition-2026` | `needs-verification` | `held` | `true` |
| Dis-Chem | `dis-chem-garnier-pure-active-june-2026-competition` | `needs-verification` | `held` | `true` |

## Warnings

The ZA handoff contains six documented held-review warnings:

- Capitec: `risk_age_restriction`, `risk_account_required`, `risk_sms`
- Dis-Chem: `risk_age_restriction`, `risk_purchase_required`, `risk_loyalty_required`

These warnings are preserved on the imported rows in `validationWarnings` and summarized in `verificationNote`.

## Rollback instructions

To roll back the import:

1. Restore `data/competitions.json` from the backup in `data/backups/`.
2. Run `npm run generate`.
3. Run `npm run validate:held-candidates -- --allow-missing` if the held rows were removed.
4. Confirm the held IDs do not appear in `competition/`, `out/`, or `sitemap.xml`.

If using git rollback instead:

```bash
git restore data/competitions.json
npm run generate
```

## Validation run

Commands run:

- `npm test`
- `npm run generate`
- `npm run import:held-candidates -- --dry-run`
- `npm run import:held-candidates`
- `npm run generate`
- `npm run validate:held-candidates`

Final held validator result:

| Metric | Result |
| --- | ---: |
| Held rows | 2 |
| Errors | 0 |
| Warnings | 0 |

## Safety confirmation

No rows were marked published.

No public competition pages were generated for held rows.

No public `/out/` redirects were generated for held rows.

No sitemap entries were generated for held rows.

ZA Comp Engine was untouched.
