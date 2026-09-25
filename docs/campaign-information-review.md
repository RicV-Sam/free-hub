# Campaign information review

Prepared 25 September 2026. This is an editorial workflow, not an individual winner-authentication service.

## Scope

Use the existing hello@freehub.co.za address. Consumer subject: `Suspicious competition claim`. Company subject: `Campaign information review`.

Review public campaign facts, terms consistency, promoter/agency relationship, contact methods, deadlines and document-submission instructions. Do not certify legal compliance, authenticate callers, confirm personal wins, guarantee prizes or recover funds. A listed real campaign can be impersonated.

## Manual handling

1. Triage urgent financial/account exposure to the consumer's bank or provider through independently found official channels. Never ask them to wait for an editorial review.
2. Request only campaign identity, public URLs, a short concern and optionally a redacted screenshot. Do not solicit IDs, banking information, OTPs, redemption codes, customer lists or winner records.
3. Find the official source independently. Check the promoter and agency relationship; a company-domain email alone is insufficient. Do not use links or phone numbers from a suspicious message as the sole verification route.
4. Compare entry requirements, prizes, campaign/draw dates, notification method, claim deadline, requested documents and public support route. Treat missing or conflicting information as unresolved. Seek corrected public terms where consumers need to verify a clarification themselves.
5. Record only necessary public evidence, source URLs, review date, unresolved points and editorial decision. Keep private correspondence and reporter contact details out of the repository and public pages.
6. Describe the specific finding, for example “Published winner-contact process checked on [date]”, rather than a blanket approval badge. Mark unconfirmed details explicitly. A report alone is not proof of fraud.
7. Recheck sources before publishing corrections. No automatic publication, company outreach, forwarding of private reports or promised response time is introduced by this change.

## Before promoting or publishing the expanded email service

Confirm who monitors the inbox, access controls and escalation ownership. Agree a retention/deletion schedule for reports and attachments, including how accidentally supplied sensitive data is handled. These operational arrangements have not been verified or configured in this task; do not claim they are in place or promise a service-level response time.

## Source basis

- SABRIC: https://www.sabric.co.za/how-to-stay-safe/ — independent contact, spoofed numbers, account compromise and bank escalation.
- Capitec: https://www.capitecbank.co.za/fraud-centre/avoid-these-common-scams/ — prize payments and banking-app tasks as warning signs.
- Vodacom fraud guidance: https://www.vodacom.co.za/vodacom/help/fraud-scams-and-hoaxes — examples of promotion impersonation; no individual allegation confirmed.
- Vodacom rewards terms: https://www.vodacom.co.za/vodacom/terms/vodacom-rewards-programme — example of legitimate telephone contact and eligibility checks, not an endorsement of every clause or campaign date.
- ASA/CAP: https://www.asa.org.uk/advice-online/promotional-marketing-prize-winners.html — UK best-practice reference for clear notifications and deadlines, not South African legal advice.

## Implementation and verification

Five existing routes updated in scripts/generate-pages.js: fake-competition-winner-messages, contact, report-a-competition, submit-a-competition and privacy-policy. Existing submission functionality is retained. Email links contain subject lines only, with no private report data in URLs. Optional section IDs enable direct safety-guide jumps; existing routes remain unchanged.

Local build and npm test with FREEHUB_ENABLE_OFFERS=true and FREEHUB_ENABLE_OPPORTUNITIES=true passed, including 121 lifecycle tests and the SEO/performance checks. The initial default-feature build exposed a missing /deals/ link from an existing parks page; enabling the collections resolved that test failure. This task does not change feature defaults.

Publication, inbox delivery and production behaviour have not been tested. Local browser previews intentionally return 404 for firebase-config.json in tests/browser/server.js; account authentication is outside this content change.

All five pages passed content-layout checks at 1280, 768, 390 and 320 CSS pixels, with valid JSON-LD, expected canonical URLs and no missing fragment targets. Both guide jump links worked; 200% text enlargement had no horizontal overflow. Third-party requests were blocked for this deterministic content check. With third-party ads enabled, a report-page ad rail overflowed the viewport; no ad integration was changed and full third-party responsive behaviour is not cleared by these checks.

Repository-wide lint remains failing on unrelated competition-link errors/warning drift and missing current opportunity-source evidence. Maintenance validation reports two expired competitions missing from the archive: food-lovers-market-supersport-heritage-day-2026 and takealot-heritage-design-challenge-2026. These were left outside this editorial change. See output/safety-review/lint.log and browser.log for local results.
