# Sprint 2026-05-23 URL Trust Triage

Date: 2026-05-23

This follow-up checked the full competition URL set after the organic CTR and trust sprint shipped.

## Result

- Full URL validation checked 163 competition URLs.
- Published-only URL validation checked 79 URLs and returned 0 errors.
- The 63 URL failures were all already `verificationStatus: "needs-verification"`.
- No failed URL belonged to a public published record.

## Action Taken

Each failed needs-verification record was stamped with:

- `linkValidationStatus: "failed"`
- `linkValidationReason` with the 2026-05-23 HTTP result
- `linkValidationCheckedAt: "2026-05-23"`
- `doNotPublish: true`

This keeps broken, blocked, or source-weak records out of public generation until a working official source is confirmed.

## Failure Breakdown

- `http-404`: 45 records
- `http-403`: 15 records
- `http-500`: 3 records

## Public Safety Confirmation

No public page was created, revived, or expanded as part of this triage. Published-only generation remains unchanged.
