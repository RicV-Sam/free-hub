# Student guide SEO and AI-search audit

**Implementation follow-up, 7 September:** The representative-image finding is resolved with local AI-created campus artwork, responsive exports and matching Article/social metadata. Visible FreeHub attribution and its About link are added. Open Graph now identifies an article, and the unsupported Table Mountain comparison amount is removed from public copy. See `student-guide-artwork.md` for assets and exact prompts. The original audit below is retained as the review record; its Cloudflare-policy caveat and existing repository-wide failures still apply.

Audited 7 September 2026. Scope: the generated student guide, its content/renderer, internal discovery, local tests and publicly served crawler policy. This audit does not change site code, deploy the page or alter crawler permissions.

## Verdict

The local guide has a sound technical and content foundation. It is not yet eligible to be discovered at its public URL because it has deliberately not been deployed. One article-image issue should be corrected, attribution could be clearer, and the live AI content-use policy needs an informed review. The repository-wide SEO suite is still not fully green.

## Findings, in priority order

### P2 — The article image does not represent the student guide

The generated Open Graph, Twitter and Article image fields use the shared Unsplash confetti photograph. The image was opened and visually inspected. The Article field comes from `shared.DEFAULT_OG_IMAGE` in `scripts/generate-pages.js:8164`; generated metadata is at `student-freebies-discounts-south-africa/index.html:15` and line 22.

Use a relevant student-guide image, or omit the optional Article image until a representative image is available. Avoid changing the shared default for unrelated pages. A purpose-made share image would also make the page easier to recognise when shared.

Google recommends that Article images represent the marked-up content; the image property is recommended, not mandatory. This finding is not a claim of a ranking penalty. [Google Article guidance](https://developers.google.com/search/docs/appearance/structured-data/article)

### P2 — Live content-use permissions need review for broader AI summaries

The local `robots.txt` contains a general allow rule. The public [robots.txt](https://freehub.co.za/robots.txt) returns HTTP 200 and additionally contains Cloudflare-managed rules:

- `search=yes,ai-train=no,use=reference`.
- Explicit disallows for GPTBot, ClaudeBot, Google-Extended and several other crawlers.
- No explicit disallow for OAI-SearchBot, Claude-SearchBot or Claude-User in the returned file.

Do not mistake a training opt-out for a blanket search block. OpenAI distinguishes OAI-SearchBot from GPTBot; Anthropic distinguishes its search/user bots from ClaudeBot. [OpenAI crawler roles](https://developers.openai.com/api/docs/bots), [Anthropic crawler roles](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)

However, Cloudflare defines `use=reference` as permission to index, excerpt and link back, and distinguishes this from broader summarisation/reproduction. This is a policy consideration if broader AI reuse is desired, not proof that current systems cannot cite the site. Do not automatically remove training restrictions or broaden reuse permissions. Cloudflare firewall rules and verified crawler traffic were not available for inspection. [Cloudflare content-use documentation](https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/)

### P3 — Make editorial ownership visible

Article markup identifies Freehub as the organisation author, but the visible guide has no explicit byline. The page does have a methodology, source dates and a corrections contact, which are useful trust signals.

Add a truthful visible attribution such as “By FreeHub” linked to the existing About page, alongside the review date. Do not invent an individual reviewer or qualifications. Organisation authorship is supported; this is a clarity improvement, not invalid schema. [Google author guidance](https://developers.google.com/search/docs/appearance/structured-data/article)

### P3 — Small metadata and copy improvements

- The page is an Article in JSON-LD but uses `og:type=website`. Article-specific social metadata would describe it more precisely; this is not an indexing blocker.
- The Table Mountain paragraph refers to “the research brief” and repeats an unverified R265 amount. The caveat is explicit, but that internal-project wording is unnecessary for readers. Keep the correction clear without repeating an unsupported price in an extractable passage.
- Publication metadata is set to 7 September. If first public deployment happens later, use the real first-publication date and retain the actual research date rather than pretending the research was refreshed.

## Technical checks

| Area | Observed result |
| --- | --- |
| Local route | HTTP 200 |
| Public route | HTTP 404, expected because it is not deployed |
| Public sitemap | HTTP 200; student route absent, also expected |
| Local title | Relevant and unique in purpose; 59 characters including brand |
| Description | 160 characters; matches the guide's actual scope. Character counts are descriptive, not guaranteed display limits. |
| Canonical | Correct HTTPS evergreen route with trailing slash |
| Index/snippet controls | Local `index, follow`; no `nosnippet`, zero-length snippet limit or `data-nosnippet` restriction found |
| Language | HTML English; WebPage schema `en-ZA` |
| Headings | One H1; categories at H2 and entries at H3 |
| Structured data | WebPage, BreadcrumbList and Article parse successfully; headline, description, URL and dates agree with content, subject to the image finding above |
| Local sitemap | Exactly one student URL, lastmod 7 September 2026 |
| Internal discovery | Links from Free Stuff, Guides and Blog |
| Core content | All 22 benefits are present in HTML with JavaScript disabled |
| Student tests rerun | 15 focused tests passed |
| Browser tests rerun | All 5 passed: mobile/intermediate/desktop, focus, no-JavaScript operation, metadata and enlarged-content checks |
| SEO suite rerun | 1,992 checks, one failure: sitemap total 96 rather than expected 99 |

The sitemap-total discrepancy was previously reproduced with the pre-change generator; this audit confirms it remains. The guide's individual metadata checks pass. See `student-guide-validation.md` for the broader existing failures. No baseline was weakened in this audit.

## AI readability and answer grounding

The guide provides a useful structure for extracting answers: stable entry anchors, named programmes, explicit classifications, eligibility, claim steps, limitations, source links and dates. The 22 entries comprise **9 completely free benefits, 3 trials, 8 student discounts and 2 account benefits**. These categories are visible, not just hidden in structured data.

A qualitative reading of the rendered text found that common questions can be answered without guessing:

- Which benefits have no separate subscription fee? The free classification and four starting picks identify them, with eligibility caveats.
- Does Google's offer later charge? Its trial label and renewal paragraph state that paid conversion follows; the unverified rand amount is not invented.
- What does Spotify cost after its trial? The entry gives the student renewal price and explains the later move away from student pricing.
- Does Gautrain cover airport trips? Its restrictions explicitly exclude OR Tambo and distinguish weekly/monthly products.
- Does Standard Bank make Varsity Vibe entirely free? The entry separates the membership benefit from banking fees.
- Are all food partner discounts verified? The everyday section explicitly says detailed unverified partner deals were not counted.

This is a content/extraction assessment, not a measured citation test across external LLMs. A model can still omit a caveat. Keeping conditions close to benefits is sensible, but cannot guarantee accurate summaries or inclusion.

No special AI schema, keyword repetition or `llms.txt` is needed to satisfy Google's AI-search eligibility requirements. Google says normal search requirements apply and important information should be accessible as text, internally linked and consistent with structured data. Those foundations are present locally. [Google AI-search guidance](https://developers.google.com/search/docs/appearance/ai-features)

## Freshness and remaining verification

The comparison guard was exercised at 8 October 2026 and correctly rejects overdue Kirstenbosch and Aquarium comparisons. This protects future builds; it cannot update an already deployed static page without a subsequent deployment. Editorial review remains necessary.

Before publication: resolve the representative-image issue, make an informed decision about content-use permissions, review publication dating, and address the existing repository release-check failures. After separately authorised deployment: verify live status, canonical, sitemap, crawler access and Search Console URL Inspection.

Not established in this audit: actual Google/Bing index coverage, rankings, keyword demand, AI citation frequency, verified-bot access through Cloudflare, Search Console/Rich Results Test approval, or production Core Web Vitals. The page is not public yet, so a production-readiness or ranking guarantee would be premature.

Audit evidence: `output/playwright/student-audit-seo.log`, `output/playwright/student-audit-browser.log`, and `output/playwright/student-audit-social-image.png`. Implementation files were left unchanged.
