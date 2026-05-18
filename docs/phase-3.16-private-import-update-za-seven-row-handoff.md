# Phase 3.16 - Private Import/Update of ZA Seven-Row Handoff

## Executive summary

Freehub imported the ZA Comp Engine seven-row reviewed handoff into private held review only. Existing published matches were skipped and not demoted. Existing held ZA rows were updated. The new SPAR Community School Support row was imported as held/private.

No rows were published, and no published rows were demoted.

## Source handoff

- Source: `C:\Users\ricca\Desktop\Za Comp Engine\storage\exports\freehub-handoff-candidates.json`
- Validation source: `C:\Users\ricca\Desktop\Za Comp Engine\storage\exports\freehub-handoff-validation.json`
- Rows read: 7
- Freehub-controlled fields present in source: none
- Official URL check: all `sourceUrl` and `termsUrl` hosts were official brand domains
- New row present: `SPAR Community School Support Competition`

## Starting counts

| Metric | Count |
| --- | ---: |
| Published competitions | 78 |
| ZA held rows | 2 |
| Held / needs-verification rows | 81 |
| Total competitions | 159 |

Starting ZA held rows:

- `dis-chem-garnier-pure-active-june-2026-competition`
- `makro-schweppes-icon-reimagined-transaction-driver-2026-competition`

## Final counts

| Metric | Count |
| --- | ---: |
| Published competitions | 78 |
| ZA held rows | 3 |
| Held / needs-verification rows | 82 |
| Total competitions | 160 |

Final ZA held rows:

- `dis-chem-garnier-pure-active-june-2026-competition`
- `makro-schweppes-icon-reimagined-transaction-driver-2026-competition`
- `spar-community-school-support-competition-2026`

## Per-row handling

| ZA row | Candidate ID | Freehub handling |
| --- | --- | --- |
| MoneyUp Academy Competition | `za-capitec-moneyup-academy-2026` | `skipped_published_match` |
| Clover and SPAR Rewards Ultimate Stormers Experience | `za-clover-spar-rewards-ultimate-stormers-experience-2026` | `skipped_published_match` |
| Garnier Pure Active June 2026 Competition | `za-dischem-garnier-pure-active-june-2026` | `updated_held` |
| Schweppes Icon Reimagined Transaction Driver 2026 Competition | `za-makro-schweppes-icon-reimagined-2026` | `updated_held` |
| SPAR Community School Support Competition | `za-spar-community-school-support-2026` | `imported_held` |
| SPAR Rewards Vaseline Cera Glow Competition | `za-spar-rewards-vaseline-cera-glow-2026` | `skipped_published_match` |
| SPAR Rewards Vaseline Winter Drive Competition | `za-spar-rewards-vaseline-winter-drive-2026` | `skipped_published_match` |

## Rows imported

- `spar-community-school-support-competition-2026`

## Rows updated

- `dis-chem-garnier-pure-active-june-2026-competition`
- `makro-schweppes-icon-reimagined-transaction-driver-2026-competition`

## Rows skipped as published matches

- `capitec-moneyup-academy-competition-2026`
- `clover-spar-rewards-stormers-jetour`
- `spar-rewards-vaseline-cera-glow-competition-2026`
- `spar-rewards-vaseline-winter-drive-competition-2026`

## Backup path

`C:\Users\ricca\Desktop\free-hub\data\backups\competitions-before-held-import-20260518T172550Z.json`

## Public exclusion proof

Held/private rows were checked after generation and validation.

| Row | Status | Detail page | `/out` redirect | Sitemap |
| --- | --- | --- | --- | --- |
| `spar-community-school-support-competition-2026` | `needs-verification`, `held`, `doNotPublish=true` | absent | absent | absent |
| `dis-chem-garnier-pure-active-june-2026-competition` | `needs-verification`, `held`, `doNotPublish=true` | absent | absent | absent |
| `makro-schweppes-icon-reimagined-transaction-driver-2026-competition` | `needs-verification`, `held`, `doNotPublish=true` | absent | absent | absent |

Published rows were still public:

- `capitec-moneyup-academy-competition-2026`
- `clover-spar-rewards-stormers-jetour`
- `spar-rewards-vaseline-cera-glow-competition-2026`
- `spar-rewards-vaseline-winter-drive-competition-2026`

The held candidate validator reported no held rows leaking into generated public HTML, public detail pages, `/out` redirects, or `sitemap.xml`.

## Validation results

Starting validation:

- `git status`: clean
- `npm test`: passed
- `npm run generate`: passed
- `npm run validate:held-candidates`: passed with 0 errors and 0 warnings

Dry-run import:

- Rows read: 7
- Rows imported: 1
- Rows updated: 2
- Rows skipped: 4
- Errors: 0
- Warnings: 0

Final validation:

- `npm run generate`: passed
- `npm run validate:held-candidates`: passed with 0 errors and 0 warnings
- `npm test`: passed
- Published count before/after: 78 / 78
- Total count before/after: 159 / 160
- Newly published rows: none
- Demoted published rows: none

## Rollback instructions

1. Restore `data/competitions.json` from `C:\Users\ricca\Desktop\free-hub\data\backups\competitions-before-held-import-20260518T172550Z.json`.
2. Run `npm run generate`.
3. Run `npm run validate:held-candidates`.
4. Confirm public and held counts return to the pre-import state:
   - Published competitions: 78
   - ZA held rows: 2
   - Held / needs-verification rows: 81
   - Total competitions: 159

## Confirmations

- No rows were published.
- No published rows were demoted.
- Existing published matches were skipped.
- Held rows retained `verificationStatus=needs-verification`, `publicationStatus=held`, and `doNotPublish=true`.
- No competitor or aggregator source URLs were imported.
- ZA Comp Engine files were not modified.

## Recommended next Freehub phase

Freehub Phase 3.17 should manually review the three ZA held rows, prioritising SPAR Community School Support as the new import and then rechecking the updated Dis-Chem and Makro held rows for publication readiness.
