# Phase 3.17 Current ZA Held-Row Disposition Pass

Date: 2026-06-12

## Executive summary

Phase 3.17 reviewed the current three ZA Comp Engine held/private rows after the 2026-06-12 six-row handoff refresh.

No rows were published. No row was marked verified. No public detail page, `/out` redirect, sitemap entry, or listing card was created for any held row.

Final private dispositions:

| Row | Disposition |
| --- | --- |
| Dis-Chem Garnier Pure Active | `needs_more_evidence` |
| Makro Schweppes Icon Reimagined | `reject_or_archive` |
| SPAR Community School Support | `remain_held` |

These are private review dispositions only. The rows remain `verificationStatus: "needs-verification"`, `publicationStatus: "held"`, `sourceReviewStatus: "manual-review-required"`, and `doNotPublish: true`.

## Starting state

| Check | Result |
| --- | --- |
| Latest Freehub commit before this pass | `0345a73 Import current ZA held review rows` |
| ZA handoff rows imported | 6 |
| Current ZA held/private rows | 3 |
| Unrelated untracked file present | `docs/whatsapp-channel-posts-2026-06-12.md` |

Current counts:

| Count | Value |
| --- | ---: |
| Total competitions | 175 |
| Published competitions | 96 |
| Held / needs-verification competitions | 79 |
| ZA held rows | 3 |

## Rows reviewed

| Row | Title | Brand | Closing date | Status |
| --- | --- | --- | --- | --- |
| Dis-Chem Garnier Pure Active | Garnier Pure Active June 2026 Competition | Dis-Chem | 2026-06-28 | Held/private |
| Makro Schweppes Icon Reimagined | Schweppes Icon Reimagined Transaction Driver 2026 Competition | Makro | 2026-05-31 | Held/private |
| SPAR Community School Support | SPAR Community School Support Competition | SPAR South Africa | 2026-10-31 | Held/private |

## Private disposition decisions

| Row | Disposition | Reason |
| --- | --- | --- |
| Dis-Chem Garnier Pure Active | `needs_more_evidence` | Evidence, prize, purchase mechanic, Better Rewards requirement, age eligibility, and closing date are represented, but the row still has unresolved image evidence and a preserved source-link validation note: automated URL validation returned HTTP 403 on 2026-05-23. Keep private until a reviewer resolves or explicitly accepts the source/image blockers. |
| Makro Schweppes Icon Reimagined | `reject_or_archive` | The row is expired as of this pass. The official closing date was 2026-05-31, and the ZA finish pass reclassified it as expired/reference-only. Keep held/private for audit history; do not route into any current publication workflow. |
| SPAR Community School Support | `remain_held` | Official evidence is strong and the closing date is future, but the prize mechanic benefits schools rather than individual entrants and is limited to participating KZN stores. This needs a Freehub policy decision before any public listing should be considered. |

## Row detail

### Dis-Chem Garnier Pure Active

Disposition: `needs_more_evidence`

Evidence retained:

- Official Dis-Chem source and terms references are present.
- Closing date is 2026-06-28.
- Prize, purchase entry mechanic, Better Rewards requirement, 18+ eligibility, and random draw context are represented.

Blockers:

- `image_unresolved` remains in `riskFlags`.
- `linkValidationStatus` remains `failed`.
- `linkValidationReason` states that automated URL validation returned HTTP 403 on 2026-05-23.

Next action:

- Recheck the official Dis-Chem terms URL in a normal browser and decide whether the HTTP 403 is an automation-only issue.
- Resolve image handling, or explicitly accept a no-image private-to-public path in a later approval phase.

### Makro Schweppes Icon Reimagined

Disposition: `reject_or_archive`

Evidence retained:

- Official Makro page and terms evidence are preserved in the held row.
- Purchase, WhatsApp/till-slip entry, age, and personal-information risks are represented.

Blockers:

- Official closing date was 2026-05-31.
- The row is no longer current as of 2026-06-12.
- Prior review also identified duplicate/source-variant risk against the Schweppes public listing.

Next action:

- Keep the row held/private as expired/reference-only unless Freehub later adds an explicit archive status for imported held rows.
- Do not publish.

### SPAR Community School Support

Disposition: `remain_held`

Evidence retained:

- Official SPAR source and terms page are present.
- Closing date is 2026-10-31.
- Official image URL is present, subject to reuse-suitability review.
- Entry mechanic, participating stores, monthly draw/count process, original till-slip requirement, and school-beneficiary prize structure are represented.

Blockers:

- Prize funds benefit schools, not individual entrants.
- Participation is tied to named KZN stores.
- The mechanic may not fit the normal Freehub public competition promise without policy framing.

Next action:

- Decide whether Freehub should support school/community-beneficiary competitions as public listings.
- If yes, create explicit editorial wording and category/tag rules before publication.
- If no, keep the row private/reference-only.

## Export workflow update

`scripts/export-held-review.js` was updated so the private review export selects the actual current imported ZA held rows instead of stale hardcoded IDs.

The exporter now recommends:

| Row | Recommended action |
| --- | --- |
| `dis-chem-garnier-pure-active-june-2026-competition` | `needs_more_evidence` |
| `makro-schweppes-icon-reimagined-transaction-driver-2026-competition` | `reject_or_archive` |
| `spar-community-school-support-competition-2026` | `remain_held` |

The private export was generated under ignored local storage:

- `storage/exports/held-candidates-review.json`
- `storage/exports/held-candidates-review.csv`

These files are not public website artifacts and must not be committed.

## Public exclusion proof

Local checks confirmed:

| Row | Detail page | `/out` redirect | Sitemap entry |
| --- | --- | --- | --- |
| SPAR Community School Support | Absent | Absent | Absent |
| Dis-Chem Garnier Pure Active | Absent by held validator | Absent by held validator | Absent by held validator |
| Makro Schweppes Icon Reimagined | Absent by held validator | Absent by held validator | Absent by held validator |

## Validation results

| Command | Result |
| --- | --- |
| `npm run export:held-review` | Passed; 3 rows exported privately with public-safety checks passing |
| `npm run generate` | Passed |
| `npm run validate:held-candidates` | Passed; 3 ZA held rows, 0 errors, 0 warnings |
| `npm test` | Passed |
| `npm run lint` | Passed; 0 errors, existing external-link warnings only |

## Publication gate

No Phase 3.17 disposition authorizes publication.

Before any of these rows can become public, a later explicit approval phase must:

1. Name the exact row.
2. Resolve its current disposition blocker.
3. Change `verificationStatus`, `publicationStatus`, `sourceReviewStatus`, and `doNotPublish` deliberately.
4. Run `npm run generate`.
5. Run `npm run validate:held-candidates`.
6. Confirm generated public pages, redirects, listings, and sitemap behavior intentionally changed only for approved rows.

## Recommended next phase

Recommended next Freehub phase: decide SPAR Community policy, then either keep it private/reference-only or prepare an explicit single-row publication-approval phase with school-beneficiary wording.

Recommended next ZA Comp Engine phase: return to the high-priority missing-close-date review queue and complete evidence for SPAR, Clicks, Clover, Jacaranda, and Makro candidates.
