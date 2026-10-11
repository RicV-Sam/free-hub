# Fuel rewards comparison preview — 11 October 2026

Scope: one evergreen fuel comparison and local calculator, at `/guides/best-fuel-rewards-south-africa/`. No separate programme guides or live release.

The fuel data holds reviewed provider rates and source URLs. The shared engine runs in Node tests and the browser; the UI renders text and owns input/result focus. The existing research-guide renderer supplies static sections, sources, FAQ and article metadata. Calculator styles load on the fuel page only. Existing authentication and tracking code, project dependencies and lockfiles are unchanged.

Absa + Sasol is explicitly supported by the current Sasol partner page and section 5.7.2. Points remain outside the rand ranking because no current redemption conversion was verified. Other combinations are included only as documented in the reviewed sources. Price, eligible benefits and remaining personal allowances are inputs; blank bank limits exclude the bank estimate. FNB rules are held after 30 June 2027; Discovery Bank's known maximum changes on 1 November 2026 in South African time.

Validation: feature-enabled build; full suite 185 passed, one existing skip; 11 calculator tests; 62 fuel browser assertions; SEO 231 URLs / 3958 checks / zero hard failures; maintenance and whitespace checks. Phone layout, empty estimates, keyboard focus, 200% text size, jump headings clearing the sticky menu and the no-JavaScript comparison were checked. The local browser interactions did not issue network requests; live third-party analytics was not audited.

Review covered the new fuel modules, data, CSS and tests, the appended guide record, changed generator/package hooks and direct rendering dependencies. Previously reviewed unchanged generator sections were not re-audited. No material finding remains in that incremental scope. This is not a fresh audit or approval of the entire site.

Recheck primary evidence and current duplicates before release; review by 31 October. Keep the existing source-lint and student-comparison gates. Local success does not prove live eligibility, redemption, indexing, citations, analytics or ad delivery. No commit, push, deployment or publication occurred.

Rebuild with `FREEHUB_ENABLE_OFFERS=true`, `FREEHUB_ENABLE_OPPORTUNITIES=true`, `FREEHUB_BUILD_DATE=2026-10-11` and `FREEHUB_AS_OF_DATE=2026-10-11` for this preview. Use the repository's normal build and test scripts. The fuel-specific test is `npm run test:fuel-rewards`.
