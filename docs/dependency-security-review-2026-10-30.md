# Root dependency security review — 30 October 2026

Scope: the root `package.json` and `package-lock.json`. The separate Firebase Functions and Cloudflare worker dependency trees were not changed in this review.

The initial npm audit reported 12 affected dependency packages: four high and eight moderate. These counts include parent packages affected through dependencies; they are not 12 independent vulnerabilities.

## Compatible updates

`npm audit fix --ignore-scripts` updated the lockfile within existing dependency constraints. No root dependency ranges, application code or forced overrides were changed.

| Package | Before | After |
| --- | --- | --- |
| @fastify/busboy | 3.2.0 | 3.2.4 |
| @grpc/grpc-js | 1.14.4 | 1.14.7 |
| fast-uri | 3.1.3 | 3.1.9 |
| fast-xml-parser | 5.10.0 | 5.11.2 |
| @google-cloud/storage | 7.21.0 | 7.22.0 |
| @nodable/entities | 2.2.0 | 3.1.0 |
| strnum | 2.4.1 | 2.5.1 |

The entities update is required by the updated XML parser's declared dependency range. Storage now requires Node 18 or newer; this project uses Node 24.

The refreshed audit reports zero high/critical and eight moderate affected packages. All four original high-severity package findings are cleared. Upstream advisory references include [Busboy](https://github.com/advisories/GHSA-gxm5-99cw-xjw9), [gRPC](https://github.com/advisories/GHSA-m9gg-hp2v-232j), [fast-uri](https://github.com/advisories/GHSA-w74x-v6f9-j3xg) and [XML parser](https://github.com/advisories/GHSA-8r6m-32jq-jx6q).

## Remaining issue and decision

The eight moderate findings are `uuid`, `gaxios`, `google-gax`, `teeny-request`, `retry-request`, `@google-cloud/firestore`, `@google-cloud/storage` and `firebase-admin`. All trace to [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq), a missing buffer bounds check in UUID v3/v5/v6 when a buffer is supplied. Installed UUID is 9.0.1; the advisory identifies 11.1.1 as a patched version.

The installed callers inspected in `gaxios`, `google-gax` and `teeny-request` use `v4()` without a supplied buffer. That limits the apparent exposure along these inspected paths; it does not make the audit finding disappear or prove all runtime behaviour safe.

npm proposes Firebase Admin 14.5.0, outside the root's existing `^13.6.0` range. Keep the compatible fixes and defer that migration: the root email-alert tool uses Firebase Admin for authentication and Firestore access, and live authenticated behaviour has not been tested. Do not force a transitive UUID major-version override solely to suppress the report. Revisit with an upstream compatible fix or a separately tested Firebase migration.

Audit evidence and validation logs are retained privately under `.research/dependency-*`. No alerts were sent and no deployment was performed.

## Validation

- Clean `npm ci --ignore-scripts` installation succeeded; `npm ls --all` found no invalid dependency tree.
- Node 24.19.0 deterministic build and full `npm test` passed (178 lifecycle tests and 30 Airtime Dash tests; one emulator-dependent test skipped).
- Offline Firebase initialization, Firestore query construction, Storage initialization and XML parsing passed without remote requests.
- Current-date build with offers and opportunities enabled and maintenance-state validation passed.
- All six targeted Chromium checks for closed competitions, reviewed listing artwork and under-review pages passed, including mobile and desktop widths.
- Regenerated tracked output has no content differences from the checked-in output; `git diff --check` passed.
- Live Firebase credentials, authenticated service operations and email delivery were not tested. External campaign links were not re-audited for this dependency-only change.
