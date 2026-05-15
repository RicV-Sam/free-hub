# Phase 3.7 Freehub Private Review Workflow

Generated: 2026-05-15

## Executive summary

Phase 3.7 adds a private local export workflow for reviewing held competition candidates that already exist in Freehub data.

This phase does not publish held rows, does not add new competitions, and does not change public pages, styling, SEO routes, slugs, listing behaviour, or redirect behaviour.

## What the workflow does

The workflow reads the existing Freehub competition data, selects only the imported held candidates approved for private review in this phase, and writes local reviewer exports.

The exports include review fields such as status, source and terms references, prize summary, entry method, eligibility, risk flags, missing fields, a reviewer checklist, and a recommended next action.

The allowed next-action labels are:

- `ready_for_publication_review_later`
- `needs_more_evidence`
- `remain_held`
- `reject_or_archive`

## How to run it

Run the exporter from the Freehub repository root:

```bash
npm run export:held-review
```

Recommended validation sequence:

```bash
npm test
npm run generate
npm run validate:held-candidates
npm run export:held-review
npm run validate:held-candidates
node scripts/validate-competition-links.js --published-only
git diff --check
```

## Private export locations

The exporter writes:

```text
storage/exports/held-candidates-review.json
storage/exports/held-candidates-review.csv
```

These files are private local review artifacts. They are not public website files and must not be committed.

## Why exports are ignored

`storage/exports/` is ignored by git so private review exports stay local. The exports may contain reviewer-only workflow fields, source references, risk flags, and status notes that should not become part of the public site or repository history.

Backups and private research artifacts are also ignored so maintenance workflows can create local safety files without changing the public deploy surface.

## How to review held candidates

Use the JSON export when a reviewer wants structured data, and the CSV export when a spreadsheet is easier.

For each row:

1. Confirm the row is still marked `verificationStatus: "needs-verification"`.
2. Confirm `publicationStatus: "held"` and `doNotPublish: true`.
3. Open the official source and terms references directly.
4. Confirm the prize, closing date, entry method, cost or purchase requirement, eligibility, and risk flags.
5. Resolve image uncertainty by selecting official campaign artwork or leaving the row without an image.
6. Record whether the row needs more evidence, should remain held, should be rejected or archived, or can be considered in a later publication review.

## Publication safety rules

Held review is not publication.

Do not mark a held candidate as `published` during this workflow.

Do not create public detail pages or public `/out/` redirects for held candidates.

Do not add held candidates to public listing, hub, category, tag, brand, related, search, filter, or sitemap output.

Do not create new competition rows as part of this workflow.

Do not expose private review exports in generated public output.

## Public-safety checks

The held-candidate validator confirms that held rows are excluded from public detail pages, public `/out/` redirects, sitemap entries, and generated public HTML.

The held-review exporter repeats the public exclusion checks before writing private review artifacts.

Git safety checks should confirm:

```bash
git status --ignored --short storage/exports
git ls-files storage/exports
git ls-files data/backups
```

Expected result: review exports and backups are ignored or untracked, and no private export files are tracked.

## Recommended next phase

Recommended next phase: run a manual evidence review and publication decision pass for held candidates that remain promising.

That later phase should be separate from this export workflow and should require explicit approval before any row can move from held review to publication review.

## Safety confirmation

This phase does not publish rows.

This phase does not generate public detail pages for held rows.

This phase does not generate public `/out/` redirects for held rows.

This phase does not add sitemap entries for held rows.

This phase does not commit private review exports.
