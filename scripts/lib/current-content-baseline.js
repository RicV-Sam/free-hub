const fs = require('node:fs');
const { inventorySitemapCount, featuredVideoSlugs } = require('./inventory-routes.js');
const path = require('node:path');
const shared = require('../../shared/page-data.js');
const { applyCompetitionRetirements } = require('./competition-retirements.js');
const opportunityData = require('../../shared/opportunity-data.js');
const unverifiedData = require('../../shared/unverified-competition-data.js');
const { getReviewedGuides } = require('./research-guides.js');
const { getGroceryPages } = require('./grocery-savings.js');
const root = path.resolve(__dirname, '../..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));

function getCurrentContentBaseline() {
  const buildDate = process.env.FREEHUB_BUILD_DATE || shared.getSouthAfricanDate();
  const underReviewCount = unverifiedData.getPublicUnderReview(read('data/unverified-competitions.json'), { asOfDate: process.env.FREEHUB_AS_OF_DATE || buildDate }).length;
  const groceryPageCount = process.env.FREEHUB_ENABLE_OFFERS === 'true' ? getGroceryPages({ asOfDate: process.env.FREEHUB_AS_OF_DATE || buildDate }).length : 0;
  shared.setReferenceDate(process.env.FREEHUB_AS_OF_DATE || buildDate);
  const sourceCompetitions = read('data/competitions.json');
  const sourceArchive = read('data/archive/competitions-expired.json');
  const retirementState = applyCompetitionRetirements(sourceCompetitions, sourceArchive);
  const competitions = retirementState.primary;
  const retiredDetailCount = new Set([...sourceCompetitions, ...sourceArchive]
    .filter(row => retirementState.retiredIds.has(row.id) && shared.isExpiredArchiveEligibleCompetition(row))
    .map(shared.getCompetitionSlug)).size;
  const active = shared.getPublishedActiveCompetitions(competitions);
  const core = shared.getPublishedCoreActiveCompetitions(competitions);
  const resultSlugs = new Set([...competitions, ...retirementState.archive].filter(shared.isIndexableClosedCompetition).map(shared.getCompetitionSlug));
  const enabled = process.env.FREEHUB_ENABLE_OPPORTUNITIES === 'true';
  const options = { asOfDate: buildDate, strictFreeOnly: false, requireSourceEvidence: true,
    sourceEvidence: read('data/opportunity-source-evidence.json'),
    allowedSourceHosts: read('tests/baselines/seo-baseline.json').opportunityAllowedSourceHosts };
  const opportunities = enabled ? read('data/opportunities.json') : [];
  const publicOpportunities = opportunities.filter(row => opportunityData.isPublicOpportunity(row, options));
  const detailOpportunities = opportunities.filter(row => {
    const validation = opportunityData.validateOpportunity(row);
    return validation.valid && validation.typeSupported && (opportunityData.isPublicOpportunity(row, options) || opportunityData.isOpportunityTombstoneAllowed(row, options));
  });
  const samples = publicOpportunities.filter(row => row.type === 'free_sample');
  const testing = publicOpportunities.filter(row => row.type === 'product_testing');
  const featured = [samples[0], testing.at(-1), publicOpportunities.find(row => row.type === 'birthday_freebie')].filter(Boolean);
  return { active, core, publicOpportunities, detailOpportunities, samples, testing, featured,
    // Reviewed 24 September base includes the website batch, five Instagram-sourced pages and the qualifying grocery hub;
    // Seven reviewed crawl-132 pages and fourteen reviewed wide-search competition
    // detail pages were added on 3 October, followed by the Vodacom MTN8 final
    // ticket draw detail page and its noindex football tag page. SPAR Weekly Wins remains held.
    // Active counts add the corresponding exit routes. The fixed detail-page base
    // excludes the Kaizer Chiefs survey withdrawn on 2 October after its entry page closed.
    // GoTyme Card Swipe and Spend adds one reviewed detail page on 4 October.
    // The CS50 certificate explainer adds one reviewed editorial route on 5 October.
    // 6 October: six reviewed detail pages and the international hub add seven.
    // Correcting ERA removes the under-threshold airtime vertical; the clean
    // 88c28b8 build also reproduced a pre-existing one-page overcount.
    // Airtime Dash adds the game and its admin review page, both noindex while draft.
    // 8 October: Huletts, Powerade, Jockey, MTN and Raimondi add five reviewed detail pages.
    // The additional eight reviewed October listings add eight detail pages,
    // the Standard Bank brand page and the newly generated ending-soon tag page.
    // The next reviewed workbook batch adds eighteen competition detail pages.
    // Their eighteen exit routes are already counted by active.length below.
    // October 11 adds seven competition detail pages; exit routes vary with active inventory.
    // 14 October: restore the three durable SMS, airtime and data guides.
    // Brand, tag and competition-video routes now vary with source inventory;
    // The verified 14 October sweep adds eight competition detail pages, including the resolved MTN hold.
    // Their exit routes are already counted by active.length; offer routes use their own baseline.
    // 15 October: DocTalk adds one reviewed competition detail page; its exit is counted by active.length.
    // 15 October: Cadbury Fan Club adds one reviewed detail page; its exit is counted by active.length.
    // 16 October: Boxer & Colgate adds one reviewed competition detail page; its active exit is counted below.
    // 16 October: Camp Half-Blood adds one reviewed detail page; its active exit is counted below.
    // 18 October: Superbalist Live Superb adds one reviewed competition detail page; its active exit is counted below.
    // 18 October: hold Ackermans Baby of the Year because its official rules conflict.
    // 21 October: Braai Broekies, Greenie and Telkom Datanaire add three reviewed detail pages.
    // 461 excludes variable brand, tag and competition-video routes from this fixed component.
    // 24 October: four reviewed competition detail pages; exits are counted by active.length.
    // 25 October: Everest Wealth and First Choice add two reviewed detail pages; active exits are counted below.
    // 28 October: Hypertext Mobile Survey adds one reviewed detail page; its active exit is counted below.
    // 30 October: Dr. Oetker adds one reviewed competition detail; active exits are counted below.
    // Six reviewed competition detail pages and the current under-review detail pages.
    generatedFileCount: groceryPageCount + 484 + underReviewCount + shared.TAG_SLUGS.filter(slug => shared.getTagFilteredCompetitions(active, slug).length > 0).length + featuredVideoSlugs(active).size + shared.getGeneratedBrandPageDefinitions(core).length + getReviewedGuides(buildDate).length - retiredDetailCount + active.length + read('data/student-guide.json').offers.length + detailOpportunities.length + publicOpportunities.length,
    sitemapUrlCount: groceryPageCount + underReviewCount + read('tests/baselines/seo-baseline.json').staticSitemapUrlCount + getReviewedGuides(buildDate).filter(page => !page.noindex).length + inventorySitemapCount(active, read('tests/baselines/seo-baseline.json').canonicalAliases) + new Set([...active.map(shared.getCompetitionSlug), ...resultSlugs]).size + publicOpportunities.length + (read('data/airtime-dash.json').enabled ? 1 : 0),
  };
}
module.exports = { getCurrentContentBaseline };
