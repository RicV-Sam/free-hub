const fs = require('node:fs');
const { inventorySitemapCount } = require('./inventory-routes.js');
const path = require('node:path');
const shared = require('../../shared/page-data.js');
const { applyCompetitionRetirements } = require('./competition-retirements.js');
const opportunityData = require('../../shared/opportunity-data.js');
const root = path.resolve(__dirname, '../..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));

function getCurrentContentBaseline() {
  const buildDate = process.env.FREEHUB_BUILD_DATE || shared.getSouthAfricanDate();
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
  const resultSlugs = new Set([...competitions, ...retirementState.archive].filter(shared.hasVerifiedCompetitionResult).map(shared.getCompetitionSlug));
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
    generatedFileCount: 452 - retiredDetailCount + active.length + read('data/student-guide.json').offers.length + detailOpportunities.length + publicOpportunities.length,
    sitemapUrlCount: read('tests/baselines/seo-baseline.json').staticSitemapUrlCount + inventorySitemapCount(active, read('tests/baselines/seo-baseline.json').canonicalAliases) + new Set([...active.map(shared.getCompetitionSlug), ...resultSlugs]).size + publicOpportunities.length + (read('data/airtime-dash.json').enabled ? 1 : 0),
  };
}
module.exports = { getCurrentContentBaseline };
