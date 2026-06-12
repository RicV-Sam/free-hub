# Phase 3.20 ZA Production-Ready Handoff Sync

Date: 2026-06-12

## Scope

This pass synced Freehub against the production-ready ZA Comp Engine handoff created after the ZA review queue drain.

Source files:

- `C:\Users\ricca\Desktop\Za Comp Engine\storage\exports\freehub-handoff-candidates.json`
- `C:\Users\ricca\Desktop\Za Comp Engine\storage\exports\freehub-handoff-validation.json`

The ZA handoff contained 6 valid rows and validation passed with 0 errors and 16 expected review-risk warnings.

## Import Result

`npm run import:held-candidates -- --input "C:\Users\ricca\Desktop\Za Comp Engine\storage\exports\freehub-handoff-candidates.json"`

Result:

- Rows read: 6
- Rows imported: 0
- Rows updated: 2
- Rows skipped: 4
- Errors: 0
- Warnings: 0
- Backup: `data/backups/competitions-before-held-import-20260612T151914Z.json`

Updated held rows:

| Freehub row | ZA handoff ID | Change |
| --- | --- | --- |
| `dis-chem-garnier-pure-active-june-2026-competition` | `za-dischem-garnier-pure-active-june-2026` | Refreshed `sourceReport` export timestamp only. |
| `spar-community-school-support-competition-2026` | `za-spar-community-school-support-2026` | Refreshed `sourceReport` export timestamp only. |

Skipped published matches:

| ZA handoff ID | Existing Freehub row | Handling |
| --- | --- | --- |
| `za-capitec-moneyup-academy-2026` | `capitec-moneyup-academy-competition-2026` | Skipped; published row unchanged. |
| `za-clover-spar-rewards-ultimate-stormers-experience-2026` | `clover-spar-rewards-stormers-jetour` | Skipped; published row unchanged. |
| `za-spar-rewards-vaseline-cera-glow-2026` | `spar-rewards-vaseline-cera-glow-competition-2026` | Skipped; published row unchanged. |
| `za-spar-rewards-vaseline-winter-drive-2026` | `spar-rewards-vaseline-winter-drive-competition-2026` | Skipped; published row unchanged. |

No published row was demoted. No held row was published.

## Current ZA Held Rows

Freehub currently has 3 imported ZA held/private rows:

| Freehub row | Current private disposition |
| --- | --- |
| `dis-chem-garnier-pure-active-june-2026-competition` | `needs_more_evidence` |
| `makro-schweppes-icon-reimagined-transaction-driver-2026-competition` | `reject_or_archive` |
| `spar-community-school-support-competition-2026` | `remain_held` |

These dispositions match the Phase 3.17 held-row review export.

## Validation

- `npm run generate`: passed
- `npm run validate:held-candidates`: passed, 3 held rows, 0 errors, 0 warnings
- `npm test`: passed, 3 held rows, 0 errors, 0 warnings
- `npm run lint`: passed
- `npm run export:held-review`: passed, 3 rows

`npm run lint` reported non-failing archived/manual-OK link warnings only. No active competition URL failures or lifecycle output violations were detected.

## Current State

Freehub is in sync with the production-ready ZA handoff without changing publication status. The remaining work is editorial/product review of the three private held rows, not import safety or queue cleanup.
