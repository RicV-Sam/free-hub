# Discovery handoff editorial review

FreeHub reads the reviewed ZA Comp Engine Discovery handoff into a private editorial register. This intake covers promotions, coupons, free samples and product-testing opportunities. It does not publish pages, change the public offer or opportunity registries, add sitemap URLs, or make a verification decision.

## Run the intake

Preview the current handoff:

```powershell
npm run import:discovery-review
```

Write the private register after reviewing the preview:

```powershell
npm run import:discovery-review -- --write
```

The default private register is `.research/discovery-editorial-review.json`, which is excluded from source control. Use `--input <path>` or `--review <path>` when a non-default handoff or private register is required.

## Fail-closed rules

- Only handoff contract version 1 is accepted.
- Every row must be approved by the ZA review workflow and include reviewer notes.
- Source, destination, terms and privacy URLs must use HTTPS.
- Source handoffs cannot set FreeHub publication or verification fields.
- Each candidate is mapped to `pending_review`, with `publicationDecision: false`.
- Exact URL matches against public offers and opportunities are labelled `existing_public_match` for reconciliation.
- Re-imports refresh source evidence while preserving FreeHub editorial status, assignment and notes.
- Moving a candidate into a public registry remains a separate, manual curation task subject to the existing offer or opportunity schema, verification, expiry and source-evidence gates.
