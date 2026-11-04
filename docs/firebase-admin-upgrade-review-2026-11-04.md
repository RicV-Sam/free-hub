# Firebase Admin upgrade review — 4 November 2026

Prepared on branch `codex/firebase-admin-review-2026-11-04`, reconciled with main `81b9ed8`, in `C:/Users/ricca/.codex/worktrees/freehub-firebase-20261104`. The owner authorised committing and pushing the tested upgrade and archive maintenance on 4 November 2026. The main workspace contains unrelated unfinished work and was left untouched.

## Closure verified

The live `https://freehub.co.za/data/airtime-dash.json` identifies the Cloudflare API. Its public `config` action returned competition `airtime-dash-2026-10`, `status: winner_pending`, `live: false`, and `endAt: 1793484000000` (31 October 2026 22:00 UTC / 1 November 00:00 South African time). The local service code confirms that ranked entry requires live status and a time before endAt. No admin action, entry, result modification or alert send was performed.

## Changes

- Root Firebase Admin: installed 13.10.0 to 14.5.0; declared range now `^14.5.0`.
- Migrated `scripts/queue-email-alerts.js` from the removed namespace API to `firebase-admin/app` and `firebase-admin/firestore`. Preserved credential options, consent requirements, dry-run default, deduplication and batch limits.
- Added offline and optional local-emulator tests to `npm test`. Requiring the script no longer runs its CLI, allowing tests to exercise the actual functions.
- Root transitive Firestore moved from 7.11.6 to 9.4.0; Storage from 7.22.0 to 8.4.0. Separate Functions and Cloudflare package trees were not edited.

The [official Firebase release notes](https://firebase.google.com/support/release-notes/admin/node) document the v14 Node 22+ requirement and removal of namespace support. The project uses Node 24. Installed package exports were checked and the modular imports were exercised locally.

## Security result and remaining findings

The root audit changed from eight moderate affected packages to six. There are no high or critical findings. UUID is absent from the upgraded root tree, clearing [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq).

The remaining six affected packages are `gaxios`, `gcp-metadata`, `glob`, `google-gax`, `minimatch` and `rimraf`. They trace to [glob cancellation](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) and [minimatch amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249). Although npm reports a fix as available, `npm audit fix --ignore-scripts` leaves these findings. No forced override was introduced. This is not a zero-advisory upgrade.

## Validation

- Clean `npm ci --ignore-scripts`: passed; `npm ls --all`: valid dependency tree.
- Node 24.19.0 deterministic build and full `npm test`: passed (191 lifecycle tests, 30 Airtime Dash tests, four new offline tests; the existing Airtime Dash emulator test skipped).
- New root Firestore emulator test: passed separately against locally bound `127.0.0.1:18088`, using only `demo-freehub-admin-upgrade`. It exercised actual reads/writes, consent selection, timestamp persistence and duplicate prevention in test-only collections. No email extension was running. The emulator was stopped afterwards.
- After clean install, offline tests passed again; the new optional emulator test skips when no local emulator is configured.
- Current-date production-flag build and maintenance validation: passed with no missing archive entries or expired listing leaks. Main already contained the six previously missing records; the standard maintenance command added the newly closed HOT Cares Schools Challenge. Regenerated tracked feeds remove it from active listings.
- Reconciled full regression suite passed; local Firestore emulator passed again. Twenty Chromium closure/expiry checks passed.
- External competition-link validation did not pass: the unchanged Dis-Chem Energizer manual exception is over 30 days old, and three unchanged archived source pages (Fountains Mall Herbelin, Penguin Random House Art of Hosting, Penguin Post 44) returned new 404 warnings. No review dates or warning baselines were altered to suppress these findings. These require separate source review.
- Live authenticated Firebase operations and email delivery were not tested. Production data, results and alerts were not modified.

Evidence logs are private under `.research/firebase-upgrade/` in the isolated checkout. The main workspace and its unfinished changes remain untouched. The one-time scheduled follow-up was removed. Six moderate dependency advisories remain as described above.
