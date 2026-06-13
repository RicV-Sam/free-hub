# Phase 3.21 ZA Current Candidate Held Sync

Date: 2026-06-12

## Scope

This pass imported the latest ZA Comp Engine handoff into Freehub private review after the Phase 3.25 ZA reviewed-registry upsert.

Source files:

- `C:\Users\ricca\Desktop\Za Comp Engine\storage\exports\freehub-handoff-candidates.json`
- `C:\Users\ricca\Desktop\Za Comp Engine\storage\exports\freehub-handoff-validation.json`

The ZA handoff contained 10 valid rows and validation passed with 0 errors and 30 expected review-risk warnings.

## Import Result

Command:

```bash
npm run import:held-candidates
```

Result:

- Rows read: 10
- Rows imported: 3
- Rows updated: 2
- Rows skipped: 5
- Errors: 0
- Warnings: 0
- Backup: `data/backups/competitions-before-held-import-20260612T182700Z.json`

New private held rows:

| Freehub row | ZA handoff ID | Status |
| --- | --- | --- |
| `checkers-vaseline-winter-shoprite-checkers-competition-2026` | `za-checkers-vaseline-winter-shoprite-checkers-2026` | `needs-verification`, `held`, `doNotPublish: true` |
| `mtn-fc-world-cup-competition-2026` | `za-mtn-fc-world-cup-competition-2026` | `needs-verification`, `held`, `doNotPublish: true` |
| `rhodes-quality-win-your-share-of-r1-million-competition-2026` | `za-rhodes-quality-win-share-r1-million-2026` | `needs-verification`, `held`, `doNotPublish: true` |

Updated existing private held rows:

| Freehub row | ZA handoff ID |
| --- | --- |
| `dis-chem-garnier-pure-active-june-2026-competition` | `za-dischem-garnier-pure-active-june-2026` |
| `spar-community-school-support-competition-2026` | `za-spar-community-school-support-2026` |

Skipped already-published matches:

| ZA handoff ID | Existing Freehub row |
| --- | --- |
| `za-capitec-moneyup-academy-2026` | `capitec-moneyup-academy-competition-2026` |
| `za-clover-spar-rewards-ultimate-stormers-experience-2026` | `clover-spar-rewards-stormers-jetour` |
| `za-spar-rewards-vaseline-cera-glow-2026` | `spar-rewards-vaseline-cera-glow-competition-2026` |
| `za-spar-rewards-vaseline-winter-drive-2026` | `spar-rewards-vaseline-winter-drive-competition-2026` |
| `za-standard-bank-game-day-everyday-2026` | `standard-bank-game-day-everyday` |

No published row was demoted. No held row was published.

## Importer Update

The importer official-domain allowlist was extended for the newly validated handoff hosts:

- Checkers: `termsconditions.co.za`
- MTN South Africa: `mtn.co.za`
- Rhodes Quality: `rhodesquality.com`
- Standard Bank: `standardbank.co.za`

This keeps source validation strict while allowing the current official ZA evidence package.

## Current ZA Held Rows

Freehub currently has 6 imported ZA held/private rows:

| Freehub row | Current private disposition |
| --- | --- |
| `dis-chem-garnier-pure-active-june-2026-competition` | `needs_more_evidence` |
| `makro-schweppes-icon-reimagined-transaction-driver-2026-competition` | `reject_or_archive` |
| `spar-community-school-support-competition-2026` | `remain_held` |
| `checkers-vaseline-winter-shoprite-checkers-competition-2026` | `needs_more_evidence` |
| `mtn-fc-world-cup-competition-2026` | `needs_more_evidence` |
| `rhodes-quality-win-your-share-of-r1-million-competition-2026` | `needs_more_evidence` |

## Validation

Commands passed:

```bash
npm run import:held-candidates -- --dry-run
npm run import:held-candidates
npm run generate
npm run validate:held-candidates
npm test
npm run export:held-review
npm run lint
```

Final held validator result:

- Held rows: 6
- Errors: 0
- Warnings: 0

`npm run lint` reported non-failing archived/manual-OK link warnings only. No active competition URL failures or lifecycle output violations were detected.

## Safety Confirmation

No rows were marked published.

No public competition pages were generated for the imported held rows.

No public `/out/` redirects were generated for the imported held rows.

No sitemap entries were generated for the imported held rows.

ZA Comp Engine was untouched during the Freehub import.
