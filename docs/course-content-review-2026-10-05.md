# Course content review — 5 October 2026

Updated the existing course guide and Google/Microsoft directory records; added a CS50x certificate explainer, linked from the guide, blog and guides index. These are local review drafts. No commit, push or deployment was performed.

The last30days research supplied topic leads, not evidence of South African search demand or course terms. All course claims below were checked on the underlying official pages. No AdSense approval or ranking improvement is predicted.

## Official evidence

- [Grow with Google in Africa](https://grow.google/intl/ssa-en/) links to the current Fundamentals course on Skillshop.
- [Fundamentals of Digital Marketing](https://skillshop.exceedlms.com/student/collection/1830706?locale=en) lists beginner difficulty, self-paced learning, 40 hours and a completion award. It does not state a price; the draft explicitly records that limit.
- [Google award guidance](https://support.google.com/skillshop/answer/18072892?hl=en) describes the digital badge and completion process after the Digital Garage migration.
- [Google's Skillshop training guidance](https://support.google.com/google-ads/answer/7539883?hl=en) confirms free Google Ads training. This does not establish that all Google programmes are free.
- [Microsoft Learn FAQ](https://learn.microsoft.com/en-us/training/support/faq) separates free content and achievements from credentials and says the former sandboxes are unavailable; Azure exercises require subscription access.
- [CS50x](https://cs50.harvard.edu/x/), [certificate requirements](https://cs50.harvard.edu/x/certificate/), [FAQ](https://cs50.harvard.edu/x/faqs/) and [honesty policy](https://cs50.harvard.edu/x/honesty/) support the explainer. Its free certificate requires passing coursework; paid edX verification is separate.

No exact edX price, South African accreditation, zero-rated data, employment outcome or universal device compatibility was verified or claimed. Other directory records retain their own review dates. No new offer or competition listing was created.

## Validation

- Build passed using the main repository's installed dependencies through NODE_PATH.
- SEO, performance, Free Stuff parent and Free Samples checks passed with offers enabled, matching the deployment workflow's default. The performance check retains its informational CSS-size warning.
- Lifecycle suite: 122 of 123 passed. The Huletts entry-label assertion fails on the unchanged HEAD inputs too (targeted control: 6 of 7 passed). It was not changed as part of the course content scope.
- With offers disabled, the existing park guide links to the unavailable deals collection. Enabling offers resolves that assertion; this draft does not change deployment feature flags.
- Desktop (1440 px) and mobile (390 px) pages were inspected with Playwright. Both fit the mobile viewport after constraining comparison tables to their own scroll region. Article markup, canonical URLs, sitemap inclusion and blog/guide links were validated.
- The local server deliberately omits firebase-config.json. Optional auth and third-party ad requests produced console noise; no claim is made that those integrations were validated locally.

Build-generated tracked inventory/report files were restored to HEAD in this isolated checkout to avoid including unrelated inventory changes. Generated HTML and the sitemap remain available locally for preview and are rebuilt during deployment.

## Approved release validation

The user authorized commit and live publication after reviewing the local drafts. The course commit was rebased onto origin/main, preserving its maintenance, retirement and hadeda artwork changes. The reviewed route count adds one to the newer main-branch baseline.

With the repository's current dependencies installed and both production feature flags enabled: build, held-candidate validation, SEO validation, maintenance validation and all 137 lifecycle tests pass. The previous Huletts assertion is resolved in the newer main branch. The Free Stuff and Free Samples aggregate checks retain a generated-file count mismatch (expected 563, actual 562); the unchanged origin/main control also fails the count check. No production settings or unrelated routes were changed to suppress it.
