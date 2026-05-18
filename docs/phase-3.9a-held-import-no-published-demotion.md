# Phase 3.9A Held Import Without Published Demotion

Generated: 2026-05-18

## Executive Summary

Phase 3.9 initially proved the ZA handoff could be imported safely as held rows, but the pre-commit audit found that two existing published Freehub rows were demoted automatically:

- Capitec MoneyUp Academy
- Clover / SPAR Rewards Ultimate Stormers Experience

Phase 3.9A rolled back that data import and changed the held importer so a ZA handoff row cannot silently override an existing published Freehub row. Published matches are now skipped with a clear `needs_manual_publication_review` reason. New rows are still imported as held/private, and existing held rows can still be updated as held/private.

No row was published. ZA Comp Engine was not modified.

## Rollback First

The Phase 3.9 data import was rolled back from:

- `C:\Users\ricca\Desktop\free-hub\data\backups\competitions-before-held-import-20260518T152257Z.json`

After rollback:

```bash
npm run generate
npm run validate:held-candidates -- --allow-missing
```

Result:

- validation passed
- one pre-existing ZA held row remained: `dis-chem-garnier-pure-active-june-2026-competition`

## Importer Rule Change

`scripts/import-held-candidates.js` now supports the current ZA `freehub-candidate-evidence-v2` handoff and applies the safer publication rule:

- If a ZA row matches an existing published Freehub row by source handoff ID, slug, source URL, or terms URL, skip it.
- Do not change `verificationStatus`.
- Do not change `publicationStatus`.
- Do not set `doNotPublish`.
- Do not change title, slug, source URL, terms URL, or closing date.
- Report the row in `skippedPublishedMatches` with `reason: "needs_manual_publication_review"`.
- If a ZA row matches an existing held row, update it while preserving held/private status.
- If a ZA row has no existing match, import it as held/private.

Imported/new held rows always use:

- `verificationStatus: "needs-verification"`
- `publicationStatus: "held"`
- `doNotPublish: true`
- `sourceReviewStatus: "manual-review-required"`

The importer also rejects Freehub-controlled publication fields if they appear in the ZA source handoff.

## Source Handoff

Source file:

- `C:\Users\ricca\Desktop\Za Comp Engine\storage\exports\freehub-handoff-candidates.json`

Validation file:

- `C:\Users\ricca\Desktop\Za Comp Engine\storage\exports\freehub-handoff-validation.json`

Inspection confirmed:

- schema version: `freehub-candidate-evidence-v2`
- rows read: 6
- no Freehub-controlled fields in source rows
- each row has source URL, terms URL, closing date, prize, entry method, and risk flags

## Corrected Import Result

Dry-run result:

- rows read: 6
- rows imported: 3
- rows updated: 1
- rows skipped: 2
- errors: 0

Real import result:

- rows read: 6
- rows imported: 3
- rows updated: 1
- rows skipped: 2
- errors: 0

Backup path from corrected import:

- `C:\Users\ricca\Desktop\free-hub\data\backups\competitions-before-held-import-20260518T153208Z.json`

## Rows Imported

These rows were new in Freehub and were imported as held/private:

| Freehub ID | Source handoff ID | Status |
| --- | --- | --- |
| `makro-schweppes-icon-reimagined-transaction-driver-2026-competition` | `za-makro-schweppes-icon-reimagined-2026` | held/private |
| `spar-rewards-vaseline-cera-glow-competition-2026` | `za-spar-rewards-vaseline-cera-glow-2026` | held/private |
| `spar-rewards-vaseline-winter-drive-competition-2026` | `za-spar-rewards-vaseline-winter-drive-2026` | held/private |

## Rows Updated

This existing held row was updated while remaining held/private:

| Freehub ID | Source handoff ID | Status |
| --- | --- | --- |
| `dis-chem-garnier-pure-active-june-2026-competition` | `za-dischem-garnier-pure-active-june-2026` | held/private |

## Rows Skipped For Manual Publication Review

These ZA rows matched existing published Freehub rows and were skipped:

| ZA candidate ID | Existing Freehub ID | Existing title | Result |
| --- | --- | --- | --- |
| `za-capitec-moneyup-academy-2026` | `capitec-moneyup-academy-competition-2026` | MoneyUp Academy Competition | skipped; published row unchanged |
| `za-clover-spar-rewards-ultimate-stormers-experience-2026` | `clover-spar-rewards-stormers-jetour` | Clover and SPAR Rewards Ultimate Stormers Experience - Win a Jetour Dashing | skipped; published row unchanged |

Both require a separate explicit Freehub publication review if their public state should change later.

## Current Public State

Final counts after corrected import and generation:

- total competitions: 159
- published count: 76
- held/needs-verification count: 83
- ZA imported held rows: 4
- public detail page count: 76
- `/out` redirect count: 76
- sitemap held-row leaks: 0
- expired published count: 0

Publication-state confirmations:

- Capitec stayed published.
- Clover stayed published.
- Dis-Chem stayed held/private.
- Makro Schweppes imported as held/private.
- SPAR Vaseline Winter Drive imported as held/private.
- SPAR Vaseline Cera Glow imported as held/private.

## Public Exclusion Proof

For each ZA held row currently imported into Freehub:

- public detail page exists: false
- public `/out/` redirect exists: false
- sitemap entry exists: false
- published/imported state: false

Held validator passed with:

- errors: 0
- warnings: 0

## Validation Results

Commands run:

```bash
npm test
npm run import:held-candidates -- --dry-run
npm run import:held-candidates
npm run generate
npm run validate:held-candidates
```

Results:

- `npm test`: passed
- dry-run import: passed
- real import: passed
- page generation: passed
- held candidate validation: passed

## Safety Confirmation

This phase did not:

- publish any imported row
- demote any published row after the 3.9A fix
- set `doNotPublish` false
- create public pages for imported held rows
- create `/out` redirects for imported held rows
- add imported held rows to sitemap
- touch ZA Comp Engine

## Rollback Instructions

To roll back the corrected Phase 3.9A import data:

```powershell
Copy-Item -LiteralPath "C:\Users\ricca\Desktop\free-hub\data\backups\competitions-before-held-import-20260518T153208Z.json" -Destination "C:\Users\ricca\Desktop\free-hub\data\competitions.json" -Force
npm run generate
npm run validate:held-candidates -- --allow-missing
```

To roll back all uncommitted Phase 3.9A work:

```bash
git restore data/competitions.json scripts/import-held-candidates.js
git clean -f docs/phase-3.9a-held-import-no-published-demotion.md
npm run generate
```

Do not use rollback commands after later unrelated edits without first inspecting `git status` and `git diff`.

## Recommended Next Step

Commit Phase 3.9A as the safe Freehub private import checkpoint. If Capitec or Clover should be demoted, refreshed, or republished based on ZA evidence, handle that in a separate explicit Freehub publication review phase.
