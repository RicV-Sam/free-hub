# Freehub SEO, UX, Trust, Data Quality, and Growth Audit

Generated: 2026-06-27  
Site: https://freehub.co.za  
Scope: public site, generated repo output, local competition data, and bounded competitor/SERP sampling. No GA4 or GSC private exports were available.

## A. Executive Summary

Freehub is no longer an early-stage static site with basic crawlability questions. The current site has a real SEO foundation: live competition detail pages, indexable category and intent hubs, brand pages, official-source messaging, trust/safety pages, Club, Refer & Win, WhatsApp CTAs, generated schema, and a sitemap with 132 URLs.

The main opportunity is to protect trust and grow the winning verticals. The biggest risks are not "can Google crawl this?" but "is every active listing fresh, correctly labelled, visually credible, and internally linked into the right intent page?"

Key evidence:

- `npm run build` passed.
- Live `/competitions/` returned 200, is indexable, has schema, and renders 73 competition cards.
- Live `/win-a-car/` returned 200, is indexable, has schema, and renders 7 car competition cards.
- Live WhatsApp, SMS, and till-slip hubs returned 200, are indexable, have schema, and render 15, 3, and 23 cards respectively.
- Local sitemap has 132 URLs and local canonical checks found 0 canonical-domain issues.
- Active published inventory: 73 competitions.
- Active entry-cost mix: 19 free-entry, 46 purchase-required, 5 account-required, 1 app-required, 2 till-slip-required.
- Active image gap: 55 of 73 active listings have no dedicated image.
- Freshness gap: 45 active listings have `lastChecked` older than 21 days.
- Rich listing gap: 25 active listings lack `evidenceNotes`, 15 lack `eligibility`, 6 lack `entrySteps`, and 5 lack `quickAnswer`.

Top priorities:

1. Create a weekly listing freshness and data-quality pass for active, high-value, and closing-soon competitions.
2. Improve above-the-fold card and detail-page clarity around entry cost, official source, closing date, and "Freehub is not the promoter".
3. Strengthen winning verticals first: `/competitions/`, `/win-a-car/`, `/category/cars/`, `/whatsapp-competitions-south-africa/`, `/till-slip-competitions-south-africa/`, and top active detail pages.
4. Build only inventory-supported new pages; avoid thin page expansion.
5. Add stronger GA4/GTM events and dashboards so organic traffic can be tied to detail views, official-source clicks, WhatsApp follows, saves, Club sign-ins, and Refer & Win actions.

## B. Current State vs Previous Audit

| Area | Previous risk | Current state | Remaining risk | Priority |
|---|---|---|---|---:|
| Detail pages | Missing or weak generated detail pages | Active competition detail pages exist with metadata, FAQ, breadcrumbs, official source links, save UI, related competitions, and outbound tracking routes | Some listings lack images, evidence notes, eligibility, or recent source checks | 9 |
| Core hubs | Limited page coverage | `/competitions/`, `/free-competitions/`, `/competitions-ending-soon/`, `/purchase-required-competitions/`, `/win-a-car/`, category pages and tag pages exist | Some hubs compete with tag pages; titles and intro copy can be sharpened by intent | 7 |
| Trust pages | Thin legal/trust layer | About, contact, privacy, terms, verify, safe-entry, fake-winner, entry-cost, closing-date, submit, and report pages exist | Trust copy should be pulled higher into cards and detail pages, not only footer/guides | 8 |
| Sitemap/crawl | Earlier domain/build risk | Build passes; local sitemap has 132 URLs; live sitemap returns 200; live robots exposes sitemap | Live Cloudflare-managed robots adds AI bot directives; local robots differs from deployed robots | 5 |
| Data labels | Developing | Entry-cost and entry-channel fields exist in active listings | 45 stale checks, 55 image gaps, and several free-entry listings that need manual review because they include app/account/quote/social actions | 10 |
| Expired handling | Expired pages could pollute active UX | Expired pages are generated as noindex/follow and active hubs exclude expired inventory | Closing-soon listings must be rechecked aggressively to avoid stale active pages | 9 |
| Monetisation | Early and policy-sensitive | AdSense script is present; tracking hooks exist | Ad placement must not confuse users about promoter vs Freehub or bury official-source safety cues | 6 |
| Club and Refer & Win | Early growth surfaces | Club landing, dashboard/account noindex, local saves, auth, referral UI, and Refer & Win page are present | Club value should be visible in context, and Refer & Win needs ongoing consent/manual-review clarity | 7 |

## C. Biggest SEO Problems

| Issue | Problem | Why it matters | Recommended fix | Priority | Impact | Difficulty |
|---|---|---|---|---:|---|---|
| Freshness as ranking/trust signal | 45 active listings were last checked more than 21 days ago. | Competition pages are time-sensitive. Stale dates or source claims can reduce trust, increase pogo-sticking, and harm repeat use. | Add a weekly active-listing QA queue sorted by closing date, high-value tags, car/cash/WhatsApp/till-slip intent, and lastChecked age. Update `lastChecked`, source, terms, and evidence notes after review. | 10 | High | Medium |
| Thin visual evidence | 55 active listings have no dedicated image. | Cards without specific images feel generic and reduce click confidence, especially for high-value prizes. | Prioritise images for top 25 high-value/current listings. Use approved local assets or credible brand/source images with fallback only when no image is safe. | 8 | High | Medium |
| Duplicate intent pressure | `/tag/free-entry/`, `/free-competitions/`, `/tag/purchase-required/`, `/purchase-required-competitions/`, and similar routes can compete. | Google may split relevance between near-duplicate pages if canonical/noindex strategy drifts. | Keep the current duplicate tag canonical/noindex rules, but add a static audit test that verifies duplicate tags are never indexed or sitemapped. | 7 | Medium | Low |
| Borderline inventory pages | SMS has exactly 3 listings; grocery vouchers has exactly 3 listings; data competition page is held with 2. | Thin verticals can become low-value if one listing expires. | Keep the 3-listing publication threshold, but add "near-threshold" monitoring and temporary noindex if active inventory falls below 3. | 7 | Medium | Medium |
| Title length and CTR | 6 local titles exceed roughly 65 characters, including homepage and `/competitions/`. | Long titles may truncate in SERPs and hide the strongest click promise. | Rewrite the main titles to keep the keyword and value prop early. Example: `Competitions South Africa | Live Giveaways & Freehub`. | 5 | Medium | Low |
| Missing analytics prioritisation | No GA4/GSC export was available for actual CTR and conversion prioritisation. | Without real query/page data, roadmap priority is partly assumed. | Add optional GSC/GA4 addendum: high impressions with low CTR, positions 5-20, pages with weak official-source click rate, and WhatsApp/Club conversion gaps. | 6 | High | Low |

## D. Biggest UX Problems

| Issue | Problem | Why it matters | Recommended fix | Priority | Impact | Difficulty |
|---|---|---|---|---:|---|---|
| Cards need faster cost scanning | Cards show official source and entry cues, but cost type, purchase requirement, and closing urgency should be even easier to scan on mobile. | Users decide quickly whether a competition is worth entering. Hidden cost uncertainty creates distrust. | Make card metadata order: closing date, entry cost, entry method, brand/source, prize type. Use consistent chips: `Free entry`, `Purchase required`, `Account required`, `Till slip`, `WhatsApp`, `SMS`, `Online`. | 9 | High | Medium |
| Detail vs official-source intent | Users may not always understand why they should click "View details" before "official source". | Freehub needs detail pages for SEO/trust, but users want the promoter link. | On cards use `View details` as primary and a small `Official source checked` trust cue. On detail pages use `Go to official source` as the main action. | 8 | High | Low |
| Club value appears late | Club save/sign-in UI exists, but the reason to join can feel secondary to browsing. | Repeat visitors are a core growth goal. | Add microcopy near save buttons: `Save closing dates, mark entered, and hide competitions you are done with.` Keep browsing open without sign-in. | 7 | Medium | Low |
| WhatsApp CTA is broad | Follow-on-WhatsApp CTAs exist, but they can be more intent-specific. | WhatsApp growth is likely strongest on ending-soon, WhatsApp-entry, and high-value pages. | Change CTA copy by context: `Get new competitions on WhatsApp`, `Get closing-soon reminders`, `Follow WhatsApp competition updates`. | 7 | Medium | Low |
| Refer & Win needs trust before action | Referral campaigns can feel suspicious if review, privacy, and no public leaderboard are not repeated near CTA. | Referral growth must not undermine trust. | Above the fold, include: `Approved referrals are manually reviewed. No public leaderboard. Marketing consent is optional.` | 8 | Medium | Low |

## E. Biggest Data Quality and Trust Risks

| Issue | Problem | Why it matters | Recommended fix | Priority | Impact | Difficulty |
|---|---|---|---|---:|---|---|
| Stale active listings | 45 active listings have `lastChecked` older than 21 days. Examples include Looters Toyota Vitz, Boxer Nedbank Greenbacks, Standard Bank Game Day Everyday, Flash MTN, and multiple closing-30-June listings. | A stale active competition is the fastest way to lose trust. | Create a daily queue for listings closing in 7 days and weekly queue for listings older than 21 days. Do not let high-value listings exceed 14 days unchecked. | 10 | High | Medium |
| Image gaps | 55 active listings lack an image. | Image-less or generic cards weaken perceived legitimacy and lower click-through. | Add a `needsImage` queue. Prioritise car, cash, grocery/voucher, WhatsApp, and top homepage listings. | 8 | High | Medium |
| Evidence notes gaps | 25 active listings lack `evidenceNotes`. | Freehub's differentiation is source-backed trust. Evidence notes let editors verify why a listing is published. | Require evidence notes for high-value, car, cash, purchase-required, WhatsApp, SMS, and till-slip listings before they can be featured. | 9 | High | Medium |
| Eligibility gaps | 15 active listings lack eligibility details. | Age, region, account, purchase, licence, and residency rules directly affect user safety. | Add `eligibilitySummary` to all active high-value and purchase/account-required listings. | 8 | Medium | Medium |
| Free-entry review needed | 12 free-entry records include language that may imply account, app, quote, social, or other qualifying action. Some may still be valid free-entry, but they need clearer sublabels. | "Free entry" can be misleading if users must be a client, use an app, request a quote, or perform a social action. | Keep `entryCostType=free-entry` only when no purchase/payment is required, but add secondary requirement chips: `Social action`, `App required`, `Client only`, `Quote required`, `Account required`. | 9 | High | Medium |
| Near-expiry inventory | 22 active listings close within 7 days. | Near-expiry pages drive urgency but can turn stale quickly. | Run a daily expiry job and add an editor view: closing today, tomorrow, this week, stale source, missing terms, missing image. | 10 | High | Medium |

## F. Biggest Growth Opportunities

1. **Win-a-car vertical**  
   `/win-a-car/` is already live, indexable, and has 7 listings. It should become the best South African car competition hub by adding stronger vehicle-specific filters, transfer-cost warnings, licence/eligibility cues, and source-backed car model details.

2. **WhatsApp and till-slip verticals**  
   WhatsApp has 15 listings and till-slip has 23. These are distinct South African search behaviours and should be turned into high-trust guides plus fresh listing hubs.

3. **Purchase-required clarity**  
   46 of 73 active competitions are purchase-required. Freehub can own the "what does purchase-required mean?" intent with cost labels, proof-of-purchase warnings, and safer entry guidance.

4. **Repeat-use tooling**  
   Club already supports saving and tracking. Promote it as a practical competition hunter tool: save, mark entered, hide skipped, get reminders.

5. **WhatsApp channel growth**  
   Use intent-specific CTAs on ending-soon, WhatsApp, till-slip, and high-value detail pages.

6. **Retailer/brand hub expansion only when inventory supports it**  
   Brand pages should be created or indexed only where there are enough active listings or strong evergreen search demand.

## G. Technical SEO Fixes

| Problem | Why it matters | Recommended fix | Priority | Impact | Difficulty |
|---|---|---|---:|---|---|
| Live robots differs from local robots because Cloudflare Managed Content Signals are injected. Search crawling is allowed, but AI bot restrictions are added. | This is not an SEO blocker, but deploy/local differences can confuse future audits. | Document the deployed robots behaviour in `docs/deployment-canonical-domain.md` or a robots note. Keep local `robots.txt` simple and verify live after Cloudflare changes. | 4 | Low | Low |
| Active generated pages count is much larger than local `rg --files -g index.html` because many generated competition pages live in subdirectories. | Manual audits can undercount if they only inspect top-level folders. | Add a small audit command or script that reports generated route counts: sitemap URLs, active competitions, expired pages, out routes, brand pages, category pages, tag pages, noindex pages. | 5 | Medium | Low |
| Paid-entry page is noindex because inventory is below threshold. | Correct now, but if inventory grows, page should become indexable with strong safety copy. | Keep noindex until at least 3 verified active paid-entry listings exist. Add paid-entry compliance checklist before indexing. | 5 | Medium | Low |
| 404 live request correctly returns 404, but command-line fetch did not expose the custom body after error handling. | Search engines care about HTTP status and helpful HTML; users need recovery links. | Verify the 404 body in a browser or deployment preview. Keep `noindex, follow`, links to competitions, categories, safety, and contact/report pages. | 4 | Low | Low |
| Detail pages use FAQ schema on competition pages. | Helpful for trust, but FAQ rich results are selective and overly generic FAQs can look templated. | Keep FAQ schema, but ensure answers are competition-specific where possible and avoid identical generic FAQ blocks across every page. | 6 | Medium | Medium |
| Some OG images are external, missing, SVG, or generic fallback. | Social shares and rich cards affect perceived quality. | Prefer local optimised WebP/PNG for high-value listings. Avoid remote SVG logos as primary competition images where possible. | 7 | Medium | Medium |

## H. Content and Page Improvements

| Search intent | Existing page | Strength | Missing / risk | Recommended improvement | Internal links in | Links out |
|---|---|---|---|---|---|---|
| competitions South Africa | `/competitions/` | Strong | Title could be shorter; add "updated today" and stronger cost/source above fold. | Title: `Competitions South Africa | Live Giveaways & Freehub`. H1: `Live Competitions in South Africa`. Intro: `Browse current South African competitions with closing dates, entry cost labels, entry methods and official promoter links.` | Homepage, footer, category cards, detail related modules | Free, ending soon, purchase-required, car, WhatsApp, safety |
| free competitions South Africa | `/free-competitions/` | Strong | Need clearer distinction between no purchase and account/social actions. | Add chips for `No purchase`, `Social action`, `Online form`, `WhatsApp`, and exclude account-required. | Homepage, `/competitions/`, safety pages, detail cards | Ending soon, online, safe-entry, official source detail pages |
| win a car South Africa | `/win-a-car/` | Strong | Needs vehicle-specific trust depth and transfer-cost warnings. | Add section: `Before you enter a car competition: licence, registration, insurance, transfer, delivery, tax, finalist events.` | Homepage hero, category cars, footer, all car detail pages | Car listings, category cars, safe-entry, entry-cost labels |
| win airtime South Africa | `/win-airtime-competitions-south-africa/` | Needs improvement | Only 5 listings; airtime/data overlap can blur intent. | Keep as airtime; create data page only when inventory reaches threshold. Add recharge and network-rate copy. | WhatsApp, SMS, vouchers, homepage popular searches | MTN/Vodacom/Cell C listings, entry-cost guide |
| win grocery vouchers South Africa | `/win-grocery-vouchers-south-africa/` | Thin/risky | Exactly 3 listings; can fall below threshold quickly. | Keep indexable only while inventory >= 3. Add supermarket proof and voucher redemption notes. | Supermarket hub, voucher category, homepage seasonal block | Supermarket competitions, voucher category, relevant retailers |
| WhatsApp competitions South Africa | `/whatsapp-competitions-south-africa/` | Strong | Needs visible official-number warning on cards and detail pages. | Add card chip: `Use promoter's official WhatsApp number`. Add intro: `Do not trust copied numbers from comments or forwarded winner messages.` | Homepage, footer, detail pages with WhatsApp entry, fake winner guide | Fake winner guide, till-slip, official source pages |
| SMS competitions South Africa | `/sms-competitions-south-africa/` | Thin/risky | Exactly 3 listings; SMS verification vs SMS entry can be confused. | Add strict tag policy: SMS entry only, not account OTP. Add cost warning: `standard network/SMS rates may apply`. | Entry-method nav, footer, detail pages | Entry-cost labels, safe-entry guide |
| till slip competitions South Africa | `/till-slip-competitions-south-africa/` | Strong | Some matches rely on text rather than explicit tags. | Add explicit tags: `till-slip`, `receipt`, `proof-of-purchase`, `upload-required`. | Homepage, purchase-required, WhatsApp, supermarket | Entry-cost labels, safe-entry, report issue |
| online competitions South Africa | `/online-competitions-south-africa/` | Strong | Needs "online does not always mean free" clarity. | Add filter chips for free online, purchase online, account online. | Free competitions, homepage, detail pages | Free, purchase-required, safety |
| competitions ending soon | `/competitions-ending-soon/` and `/tag/ending-soon/` | Strong | Duplicate route exposure must stay controlled. | Prefer `/competitions-ending-soon/` as main hub; tag route should canonical/noindex if duplicate. Add "checked today" cues. | Homepage hero, nav, footer, detail pages | WhatsApp follow, Club save, report expired |
| legit competitions South Africa | `/legit-competitions-south-africa/` | Good | Needs stronger links from detail pages and homepage trust block. | Title: `Legit Competitions South Africa | How Freehub Checks Sources`. H1: `How to Find Legit Competitions in South Africa`. | Footer, detail trust panel, fake winner guide | How we verify, report, official source pages |
| how to enter competitions safely | `/how-to-enter-competitions-safely/` | Good | Should answer specific entry methods with anchors. | Add jump links: WhatsApp, SMS, till slip, paid entry, purchase required, winner messages. | Detail pages, WhatsApp, SMS, till-slip, footer | Fake winner, entry cost, verify |
| purchase required competitions | `/purchase-required-competitions/` | Strong | This is the dominant inventory type; make it a trust asset. | H1: `Purchase Required Competitions in South Africa`. Add "before you buy" checklist. | Homepage, till-slip, supermarket, cards with purchase chip | Entry-cost labels, till-slip, report |
| brand-specific competitions | `/brands/` and `/brand/*/` | Good but limited | Only 5 generated brand pages despite many brands. | Keep threshold-based generation; add "top brands this month" and noindex low-inventory pages. | Footer, detail pages, category pages | Brand pages, submit competition |
| retailer competitions | Partial via brand/supermarket | Missing | Needs retailer cluster, not generic brand sprawl. | Create only inventory-supported retailer hubs: supermarket, Clicks/Dis-Chem, SPAR/Boxer when active inventory supports. | Supermarket, voucher, purchase-required | Retailer details, official sources |
| bank competitions | No dedicated hub | Opportunity | Banking has 5 active tag matches but eligibility/account rules are sensitive. | Create `/bank-competitions-south-africa/` after QA. Add account/client-only warnings. | Cash, account-required, brand pages | FNB, Standard Bank, Capitec listings |
| supermarket competitions | `/supermarket-competitions-south-africa/` | Strong | Needs retailer filters and proof-of-purchase clarity. | Add sections for SPAR, Boxer, Checkers/Shoprite, Woolworths when active. | Homepage, vouchers, grocery, till-slip | Retailer listings, purchase-required |
| radio competitions | Missing | Opportunity if inventory exists later | No active evidence found in current data. | Hold until inventory exists. Use evergreen guide only if useful: `How radio competitions usually work in South Africa`. | Safety pages | None until inventory exists |
| mall competitions | Missing | Hold | No active inventory basis found. | Do not create yet. Add to discovery backlog. | None | None |
| holiday competitions | `/category/holidays/` | Good | Could be upgraded to `/holiday-competitions-south-africa/` if search demand supports. | Add eligibility, travel date, transfer, spending money, partner restrictions. | Homepage, category nav, detail pages | Holiday listings, safe-entry |
| cash competitions | `/category/cash/` | Strong | Needs payment-scam warning and prize fulfilment clarity. | Add panel: `Never pay a release fee to claim cash winnings.` | Homepage, purchase-required, fake winner | Cash listings, fake winner guide |
| voucher competitions | `/category/vouchers/` | Strong | Generic voucher vs grocery voucher overlap. | Segment grocery, retail, airtime/data, fuel, eWallet/cashback. | Homepage, grocery, supermarket, airtime | Voucher listings, entry-cost |

## I. New Page Recommendations

Only create or index pages when active verified inventory and differentiation justify them. Page count is not the growth strategy; useful, fresh, trustworthy pages are.

### A. High-priority SEO landing pages

| URL | Page title | H1 | Target keyword | Secondary keywords | Search intent | Why this page exists | Sections | Internal links in | Internal links out | Monetisation | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---:|
| `/bank-competitions-south-africa/` | Bank Competitions South Africa | Bank Competitions in South Africa | bank competitions South Africa | FNB competitions, Standard Bank competitions, Capitec competitions, account required competitions | Users looking for bank/app/account prize draws | Active data includes banking/account-required patterns and cash/voucher prizes | Current bank competitions, account requirements, app/client-only warnings, safety checklist, FAQ | Cash, account-required, brand pages, footer | FNB, Standard Bank, Capitec, safe-entry | High-value display ads, no misleading financial affiliate placement | 8 |
| `/cash-competitions-south-africa/` | Cash Competitions South Africa | Cash Competitions in South Africa | cash competitions South Africa | win cash prizes, money giveaways, eWallet competitions | Prize-type search | Cash is one of the largest active categories | Current cash prizes, free vs purchase-required, scam warnings, official source checklist | Homepage, category cash, fake winner guide | Cash listings, fake winner guide | AdSense mid-content after trust block | 9 |
| `/high-value-competitions-south-africa/` | High Value Competitions South Africa | High Value Competitions in South Africa | high value competitions South Africa | win cars, win cash, win holidays | Users chasing bigger prizes | 40 active high-value listings | Current high-value list, prize types, entry cost filter, source checks | Homepage, car, cash, holiday, detail pages | High-value details, safe-entry | Premium ad slot only after first listings | 8 |

### B. Competition category pages

| URL | Page title | H1 | Target keyword | Secondary keywords | Search intent | Why this page exists | Sections | Internal links in | Internal links out | Monetisation | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---:|
| `/holiday-competitions-south-africa/` | Holiday Competitions South Africa | Holiday Competitions in South Africa | holiday competitions South Africa | win a holiday, travel giveaways, getaway competitions | Prize category | Holiday category exists but can target exact South African travel intent | Current trips, eligibility, travel dates, what costs are included, safe-entry FAQ | Homepage, category holidays, detail pages | Holiday listings, safe-entry | Travel-safe AdSense, no fake travel affiliate pressure | 7 |
| `/tech-competitions-south-africa/` | Tech Competitions South Africa | Tech and Gadget Competitions in South Africa | tech competitions South Africa | win phone, win TV, win electronics | Prize category | Tech has 6 active prize-type listings and broader electronics demand | Current tech prizes, device activation warnings, app/account requirements | Homepage, category tech | Tech details, online competitions | Display ads after listing grid | 6 |

### C. Entry-method pages

| URL | Page title | H1 | Target keyword | Secondary keywords | Search intent | Why this page exists | Sections | Internal links in | Internal links out | Monetisation | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---:|
| `/ussd-competitions-south-africa/` | USSD Competitions South Africa | USSD Competitions in South Africa | USSD competitions South Africa | dial code competitions, mobile competitions | Entry-method search | 6 active `ussd-entry` tags | Current USSD competitions, network cost warning, code verification, FAQ | WhatsApp, SMS, purchase-required, footer | USSD listings, entry-cost labels | Limited ads; keep cost warning above ads | 7 |
| `/app-competitions-south-africa/` | App Competitions South Africa | App Competitions in South Africa | app competitions South Africa | app required competitions, bank app competitions | Entry-method/account intent | Existing static page exists; keep and strengthen | App/client-only warning, privacy, current app competitions, FAQ | Club, bank, account-required, detail pages | App-required listings, privacy | No app-install affiliate unless clearly labelled | 6 |

### D. Prize-type pages

| URL | Page title | H1 | Target keyword | Secondary keywords | Search intent | Why this page exists | Sections | Internal links in | Internal links out | Monetisation | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---:|
| `/fuel-voucher-competitions-south-africa/` | Fuel Voucher Competitions South Africa | Fuel Voucher Competitions in South Africa | fuel voucher competitions South Africa | win petrol vouchers, fuel giveaways | Prize-type search | Several cash/voucher campaigns include fuel or transport-adjacent prizes | Current listings, redemption rules, purchase/account requirements | Voucher, cash, bank, supermarket | Relevant listings, entry-cost labels | AdSense only after current listing block | 5 |
| `/airtime-and-data-competitions-south-africa/` | Airtime and Data Competitions South Africa | Airtime and Data Competitions in South Africa | airtime and data competitions South Africa | win airtime, win data, MTN competitions, Vodacom competitions | Telecom prize search | Data page is currently below threshold, but combined airtime/data can be useful | Current airtime/data listings, recharge requirements, network rates, FAQ | Airtime page, WhatsApp, SMS | Telecom listings | Telecom ads only if non-confusing | 6 |

### E. Brand/retailer/operator pages

| URL | Page title | H1 | Target keyword | Secondary keywords | Search intent | Why this page exists | Sections | Internal links in | Internal links out | Monetisation | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---:|
| `/spar-competitions-south-africa/` | SPAR Competitions South Africa | SPAR Competitions in South Africa | SPAR competitions South Africa | SPAR Rewards competitions, supermarket competitions | Brand/retailer search | SPAR has multiple active matches and supermarket intent | Current SPAR listings, Rewards card rules, till slip rules, official source warning | Supermarket, till-slip, brand index | SPAR details, purchase-required | Retail display ads; no fake SPAR claim language | 8 |
| `/boxer-competitions-south-africa/` | Boxer Competitions South Africa | Boxer Competitions in South Africa | Boxer competitions South Africa | Boxer Rewards, supermarket prizes | Brand/retailer search | Boxer has multiple active matches | Current Boxer listings, rewards card, purchase rules, FAQ | Supermarket, vouchers, brand index | Boxer details | AdSense after listings | 7 |
| `/mtn-competitions-south-africa/` | MTN Competitions South Africa | MTN Competitions in South Africa | MTN competitions South Africa | win data MTN, MTN airtime competition | Operator search | MTN appears in active telecom listings | Current MTN listings, app/recharge requirements, network-rate warnings | Airtime, data, SMS, WhatsApp | MTN details | Telecom display ads with clear labelling | 7 |

### F. Safety and trust pages

| URL | Page title | H1 | Target keyword | Secondary keywords | Search intent | Why this page exists | Sections | Internal links in | Internal links out | Monetisation | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---:|
| `/competition-scam-checklist-south-africa/` | Competition Scam Checklist South Africa | Competition Scam Checklist | competition scam South Africa | fake winner messages, prize release fee, WhatsApp scam | Safety/trust | Scam anxiety is central to competition search | Red flags, official source check, winner fee warning, reporting flow | Detail trust panels, fake winner guide, footer | Report page, legit guide | No ads above safety checklist | 9 |
| `/competition-entry-costs-south-africa/` | Competition Entry Costs South Africa | Competition Entry Costs Explained | competition entry costs South Africa | free entry, purchase required, SMS cost, paid entry | Safety/comparison | Cost clarity is Freehub's differentiator | Cost label glossary, examples, FAQ, report wrong cost | Cards, detail pages, purchase-required | Free, paid, till-slip, report | AdSense after glossary | 8 |

### G. Free-stuff pages

| URL | Page title | H1 | Target keyword | Secondary keywords | Search intent | Why this page exists | Sections | Internal links in | Internal links out | Monetisation | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---:|
| `/free-vouchers-south-africa/` | Free Vouchers South Africa | Free Vouchers and Voucher Competitions | free vouchers South Africa | voucher giveaways, grocery vouchers, shopping vouchers | Freebie/voucher search | Voucher category is large, but must distinguish true freebies from competitions | Current voucher competitions, non-competition voucher guide, safety warnings | Voucher category, grocery, free-stuff | Voucher listings, free samples | High AdSense potential after disclaimer | 7 |
| `/free-data-south-africa/` | Free Data South Africa | Free Data Offers and Competitions | free data South Africa | win data, free MTN data, data rewards | Free-stuff/telecom | Only publish as evergreen guide unless competition inventory grows | Official routes, app rewards, telecom scams, current data competitions if any | Free stuff, airtime/data | Telecom listings, safety | AdSense; no misleading "free data now" CTAs | 5 |

### H. Freehub Club / account-growth pages

| URL | Page title | H1 | Target keyword | Secondary keywords | Search intent | Why this page exists | Sections | Internal links in | Internal links out | Monetisation | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---:|
| `/freehub-club/competition-tracker/` | Competition Tracker South Africa | Track Competitions You Want to Enter | competition tracker South Africa | save competitions, track giveaways | Product/account intent | Gives Club a search-friendly utility page | Save, entered, skipped, closing dates, privacy, FAQ | Club, detail save panels, footer | Dashboard noindex, privacy | No ads; conversion page | 7 |

### I. Refer & Win growth pages

| URL | Page title | H1 | Target keyword | Secondary keywords | Search intent | Why this page exists | Sections | Internal links in | Internal links out | Monetisation | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---:|
| `/refer-and-win/how-it-works/` | How Freehub Refer & Win Works | How Refer & Win Works | Freehub Refer and Win | referral competition, win airtime | Campaign trust | Supports compliance and conversion | Eligibility, manual review, privacy, no public leaderboard, optional marketing consent, FAQ | Refer & Win, Club | Terms, privacy, contact | No ads; trust/conversion page | 6 |

### J. WhatsApp channel growth pages

| URL | Page title | H1 | Target keyword | Secondary keywords | Search intent | Why this page exists | Sections | Internal links in | Internal links out | Monetisation | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---:|
| `/whatsapp-channel/` | Freehub WhatsApp Competition Updates | Get South African Competition Updates on WhatsApp | competition WhatsApp channel South Africa | giveaway alerts, closing soon alerts | Follow intent | Gives channel CTA a dedicated trust page | What users get, frequency, privacy, unsubscribe, follow CTA | Homepage, ending soon, WhatsApp hub, footer | WhatsApp channel, privacy | No ads above CTA | 7 |

### K. AdSense-safe informational pages

| URL | Page title | H1 | Target keyword | Secondary keywords | Search intent | Why this page exists | Sections | Internal links in | Internal links out | Monetisation | Priority |
|---|---|---|---|---|---|---|---|---|---|---|---:|
| `/how-competition-winners-are-contacted-south-africa/` | How Competition Winners Are Contacted in South Africa | How Competition Winners Are Usually Contacted | how are competition winners contacted South Africa | fake winner SMS, prize scam WhatsApp | Informational/safety | High trust value and AdSense-safe evergreen content | Legit winner contact, red flags, never pay release fee, what to verify | Fake winner, detail pages, footer | Report, official source, safe-entry | Strong AdSense after warning block | 8 |
| `/what-to-check-before-entering-a-competition/` | What to Check Before Entering a Competition | What to Check Before You Enter | what to check before entering a competition | competition terms checklist, safe competition entry | Informational | Supports every listing and improves user confidence | Closing date, cost, source, terms, purchase, privacy, eligibility | Detail pages, homepage trust, footer | Entry-cost, safe-entry, report | AdSense after checklist | 8 |

## J. Competition Page Template Improvements

Ideal detail-page structure:

1. Hero: competition name, brand/promoter, closing date, entry-cost chip, entry-method chip, official-source trust cue.
2. Primary CTA: `Go to official source`.
3. Secondary CTA: `Save to Freehub Club`.
4. Prize summary: prize name, value if known, number of prizes, category.
5. Entry requirements: entry cost, purchase requirement, account/app requirement, who can enter, region, age, licence if relevant.
6. Steps to enter: numbered, sourced from terms.
7. Official source and terms: source domain, terms link, last checked date.
8. Safety panel: not the promoter, never pay winner-release fees, confirm latest rules on official source.
9. Club panel: save, mark entered, hide skipped, reminders.
10. Similar competitions: same category, same entry method, same prize type.
11. Related hubs: category, entry-method, cost-type, brand if available.
12. Expired state: noindex/follow, clear closed banner, remove active urgency, show current alternatives.
13. Schema: WebPage, BreadcrumbList, ItemList for related items if present, FAQ only where useful and accurate.

Example improved copy block:

> Freehub found this competition from the promoter source shown below. Freehub does not run the competition, accept entries, choose winners, or handle prizes. Use this page to compare the prize, closing date, entry cost and entry method, then enter only through the official promoter link.

Example CTA copy:

- Card primary: `View details`
- Detail primary: `Go to official source`
- Detail note: `You will leave Freehub and open the promoter page. Check the latest terms before entering.`
- Save CTA: `Save to Club`
- WhatsApp CTA: `Get new competitions on WhatsApp`
- Report CTA: `Report a broken or suspicious listing`

## K. Trust and Safety Improvements

| Area | Recommendation | Exact copy |
|---|---|---|
| Global disclaimer | Keep footer disclaimer but repeat near high-intent CTAs. | `Freehub lists competitions and links to official promoter pages. We do not run most competitions, accept entries, choose winners or ask for winner-release fees.` |
| Official source cue | Add consistent label near outbound links. | `Official source checked: [domain]. Last checked: [date].` |
| Purchase-required warning | Add before source click. | `This competition requires a qualifying purchase or action. Confirm the product, date, receipt and terms before spending money.` |
| WhatsApp warning | Add to WhatsApp hub and WhatsApp detail pages. | `Only use the WhatsApp number shown on the promoter's official page or terms. Do not trust forwarded numbers or comment screenshots.` |
| Fake winner warning | Add to cash/car/high-value details. | `Never pay a release fee, clearance fee or admin fee to receive a prize unless the official terms clearly explain a legitimate cost. Report suspicious winner messages.` |
| Club privacy reassurance | Add near sign-in. | `Browsing and official-source links stay open without sign-in. Signing in only helps you save and track competitions.` |
| Refer & Win reassurance | Add above fold. | `Approved referrals are manually reviewed. No public leaderboard. Marketing consent is optional.` |
| Reporting | Make report link visible on every detail page and expired page. | `Tell Freehub about a broken, expired or suspicious listing.` |

## L. Freehub Club Improvements

Freehub Club is a strong retention lever because competition hunters need to remember closing dates, avoid duplicate effort, and track what they entered.

Recommended changes:

- Rename main value proposition: `Save, track and tidy up your competition list`.
- Add three visible states: `Saved`, `Entered`, `Skipped`.
- Add contextual save prompts on detail pages after entry requirements, not only in generic auth panels.
- Keep non-sign-in browsing prominent: `No account needed to browse or open official sources.`
- Add Club dashboard filters: closing soon, saved this week, entered, skipped, expired.
- Track events: `club_signin_start`, `club_signin_success`, `save_competition`, `save_competition_local`, `mark_entered`, `mark_skipped`, `remove_saved`, `copy_referral_link`.

## M. Refer & Win Improvements

Refer & Win can grow accounts, but it must feel clean and compliant.

Recommendations:

- Above fold, explain: prize, campaign period, manual review, eligibility, no public leaderboard, optional marketing consent.
- CTA text: `Join Refer & Win` and `Copy my referral link`.
- Avoid leaderboard pressure. Use private progress only.
- Add FAQ:
  - `How are approved referrals counted?`
  - `Can I refer myself?`
  - `Do referred people need to consent to marketing?`
  - `When is the winner reviewed?`
  - `What happens if referrals are suspicious?`
- Add tracking:
  - `refer_win_view`
  - `refer_win_join_click`
  - `refer_win_opt_in`
  - `refer_win_copy_link`
  - `refer_win_share_whatsapp`
  - `refer_win_terms_click`

## N. WhatsApp Growth Improvements

Where WhatsApp CTA should appear:

- Homepage hero and after first listing section.
- `/competitions-ending-soon/` above listing grid: `Get closing-soon reminders on WhatsApp`.
- `/whatsapp-competitions-south-africa/` hero: `Follow WhatsApp competition updates`.
- Detail pages for high-value, car, cash, and closing-soon listings after official-source CTA.
- Expired pages: `Follow WhatsApp for current competitions instead`.

CTA variants to test:

1. `Get new competitions on WhatsApp`
2. `Get closing-soon reminders`
3. `Follow South African competition updates`
4. `Never miss new giveaways`

Do not place WhatsApp CTA above safety warnings on WhatsApp-entry pages. Users should first understand official-number risks.

## O. Internal Linking Plan

Homepage links:

- `Live competitions in South Africa` -> `/competitions/`
- `Win a car competitions` -> `/win-a-car/`
- `Free competitions` -> `/free-competitions/`
- `Competitions ending soon` -> `/competitions-ending-soon/`
- `WhatsApp competitions` -> `/whatsapp-competitions-south-africa/`
- `Purchase-required competitions` -> `/purchase-required-competitions/`
- `How to enter safely` -> `/how-to-enter-competitions-safely/`

Competition hub links:

- `/competitions/` should link to free, ending soon, purchase-required, car, cash, vouchers, WhatsApp, SMS, till-slip, online, supermarket, and safety pages.

Category hub links:

- Cash -> fake winner guide, purchase-required, WhatsApp, cash details.
- Cars -> win-a-car, high-value, licence/transfer checklist, car details.
- Vouchers -> grocery vouchers, supermarket, purchase-required, free vouchers guide.
- Holidays -> safe-entry, travel-cost warnings, holiday details.

Brand page links:

- Detail pages should link to generated brand page when available.
- Brand pages should link back to category and entry-method hubs.
- Use anchor text like `More SPAR competitions`, not just `SPAR`.

Expired competition links:

- Add `Current competitions you may like`.
- Link to same category, same entry method, ending soon, and WhatsApp channel.
- Avoid urgency copy on expired pages.

Footer links:

- Keep About, Contact, Privacy, Terms, Report, Submit.
- Add or keep safety cluster: verify competitions, safe entry, fake winner messages, entry cost labels, closing date checklist.

Breadcrumb improvements:

- Home -> Category/Hub -> Competition title.
- For vertical pages: Home -> Entry method -> Listing.
- For brand pages: Home -> Brands -> Brand name.

## P. Monetisation Plan

Principle: monetise after trust, not before trust.

Safe AdSense placements:

- After first listing grid block on collection pages.
- Mid-guide after safety/trust section.
- Sidebar or between sections on desktop, not inside the first card cluster.
- Expired pages after active replacement suggestions.
- Evergreen safety/free-stuff guides after the core answer.

Where not to place ads:

- Between competition title and official-source CTA.
- Inside the official-source/trust panel.
- Above fake-winner or purchase-required warnings.
- In a way that resembles a competition card.
- Next to Refer & Win terms, privacy, or consent choices.

Trust-safe monetisation ideas:

- Sponsored listing only if labelled `Sponsored` and still source-checked.
- Brand submission page for legitimate promoters.
- Newsletter or WhatsApp alerts before aggressive ad density.
- Future affiliate only for non-competition informational guides, clearly labelled, and never for "guaranteed win" claims.

CTA tests:

- Detail CTA: `Go to official source` vs `Open official competition page`.
- Club CTA: `Save to Club` vs `Track this competition`.
- WhatsApp CTA: `Get new competitions on WhatsApp` vs `Get closing-soon reminders`.
- Report CTA: `Report issue` vs `Tell Freehub about a problem`.

## Q. Tracking Plan

Existing tracking signals found in code include `competition_card_click`, `detail_page_view`, `enter_competition_click`, `category_filter_click`, `search`, `ad_view`, `ad_click`, `scroll_50`, `time_on_site_30s`, save/auth events, and Club referral actions.

Recommended GA4/GTM events:

| Event | Trigger | Key params |
|---|---|---|
| `view_competition_detail` | Detail page load | slug, title, brand, category, prize_type, entry_cost_type, closing_date |
| `click_official_source` | Outbound CTA click | slug, source_domain, entry_cost_type, entry_method, page_type |
| `follow_whatsapp` | WhatsApp channel click | page_type, placement, slug/category if available |
| `join_club_start` | Sign-in modal opened | provider, page_type, slug |
| `join_club_success` | Auth success | provider, page_type |
| `save_competition` | Save action | slug, category, entry_cost_type, signed_in |
| `mark_entered` | Club status change | slug, category |
| `mark_skipped` | Club status change | slug, category |
| `refer_win_opt_in` | Refer & Win participation | campaign_id, consent_state |
| `copy_referral_link` | Referral copy | campaign_id, page_type |
| `submit_competition_start` | Submit form start | source_page |
| `submit_competition_complete` | Submission success | source_page |
| `report_competition_start` | Report action | slug, report_type if available |
| `report_competition_complete` | Report success | slug, report_type |
| `filter_apply` | Category/filter use | filter_type, filter_value, page_type |
| `search` | Site search | search_term, results_count |
| `expired_page_exit` | Click from expired page | slug, destination_type |

Dashboards:

- Organic landing pages by clicks, impressions, CTR, average position.
- High impressions / low CTR pages.
- Pages ranking positions 5-20.
- Official-source click rate by page, category, entry cost, and source domain.
- WhatsApp CTA conversion by placement.
- Club save/sign-in conversion by page type.
- Refer & Win opt-in and referral-copy funnel.
- Expired competition traffic and exits.
- Search/filter usage and no-results terms.
- Active listing freshness: lastChecked age, days to close, missing fields.

## R. 30-Day Action Plan

| Task | Why it matters | Impact | Difficulty | Priority | Dependencies | Expected outcome |
|---|---|---|---|---:|---|---|
| Build active-listing QA queue sorted by closing date and lastChecked | Prevent stale active listings | High | Medium | 10 | Competition data fields | Fewer expired/stale active pages |
| Recheck all active listings closing within 7 days | 22 active listings close soon | High | Low | 10 | Source/terms access | Current dates and fewer user reports |
| Add evidence notes to high-value, car, cash, WhatsApp, SMS, and till-slip listings | Strengthens editorial trust | High | Medium | 9 | Editorial review time | Better internal QA and safer detail pages |
| Add or improve images for top 25 active listings | Improves card trust and CTR | High | Medium | 8 | Image sourcing policy | Stronger homepage/category UX |
| Add secondary requirement chips | Fixes "free entry but account/app/social action" ambiguity | High | Medium | 9 | Data schema/template update | Better cost clarity |
| Tighten homepage and `/competitions/` titles | Improve CTR and SERP clarity | Medium | Low | 5 | Copy update | Cleaner snippets |
| Add contextual WhatsApp CTAs | Grow channel from high-intent pages | Medium | Low | 7 | Template copy | More WhatsApp follows |
| Add Club microcopy to save panels | Improve repeat visitor conversion | Medium | Low | 7 | Template copy | More saves/sign-ins |
| Add static audit for duplicate/noindex sitemap rules | Protect crawl hygiene | Medium | Low | 7 | Build script/test | Reduced accidental duplicate indexation |
| Verify 404 body in browser/deploy preview | Ensure user recovery | Low | Low | 4 | Browser/deploy access | Better error-page confidence |

## S. 90-Day Growth Plan

| Task | Why it matters | Impact | Difficulty | Priority | Dependencies | Expected outcome |
|---|---|---|---|---:|---|---|
| Turn `/win-a-car/` into the best car competition hub in South Africa | High-value search and repeat interest | High | Medium | 10 | Data QA, car-specific copy | Better ranking and click-through for car intent |
| Build a listing quality score | Scales trust decisions | High | High | 9 | Field completeness, source checks | Better featured listings and lower risk |
| Add GSC/GA4 reporting addendum | Prioritises work by actual traffic and conversions | High | Medium | 9 | Exports/access | More commercial roadmap |
| Expand inventory-supported retailer pages | Captures brand/retailer searches | Medium | Medium | 8 | Active inventory thresholds | Stronger long-tail acquisition |
| Launch WhatsApp-channel growth page | Converts high-intent users into repeat visitors | Medium | Low | 7 | Copy/page template | More channel followers |
| Create competition scam checklist | Builds trust and AdSense-safe evergreen traffic | High | Medium | 9 | Content writing | More safety authority |
| Add no-results search insight workflow | Reveals missing page/inventory demand | Medium | Medium | 6 | GA4 events | Better discovery backlog |
| Test sponsored-listing policy | Monetises without hurting trust | Medium | High | 5 | Labelling/compliance policy | Safe partnership model |
| Improve brand/entity normalisation | Better brand pages and internal links | Medium | Medium | 7 | Data cleanup | Stronger brand search coverage |
| Add editorial review dashboard | Operationalises freshness and risk | High | High | 9 | Admin/review UI | Sustainable listing quality |

## Source Notes

Evidence used:

- Local build: `npm run build` on 2026-06-27.
- Local data: `data/competitions.json`, `data/archive/competitions-expired.json`.
- Local generated output: `index.html`, `/competitions/`, `/win-a-car/`, vertical pages, detail pages, `/out/*`, `sitemap.xml`, `robots.txt`.
- Existing reports: `reports/vertical-page-coverage-report.md`, `reports/published-competition-quality-report.md`.
- Live checks: `https://freehub.co.za/`, `/competitions/`, `/win-a-car/`, `/whatsapp-competitions-south-africa/`, `/sms-competitions-south-africa/`, `/till-slip-competitions-south-africa/`, `/club/`, `/refer-and-win/`, `/sitemap.xml`, `/robots.txt`, representative detail and outbound URLs.
- Competitor sample: `https://www.winsomething.co.za/` returned a large competition aggregator page with title targeting cash, cars, electronics and South African competitions. Other competitor URLs were not consistently fetchable from this environment, so broader SERP conclusions are treated as pattern-level assumptions rather than complete ranking proof.

## Final Verdict

Freehub is already a credible competition discovery site with the right foundations. The next phase should not be raw page growth. It should be freshness discipline, data-label precision, stronger high-value verticals, sharper mobile trust cues, and measurement that connects organic visits to official-source clicks, WhatsApp follows, saves, Club sign-ins and Refer & Win participation.
