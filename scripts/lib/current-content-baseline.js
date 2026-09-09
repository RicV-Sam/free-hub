const fs = require('node:fs');
const path = require('node:path');
const shared = require('../../shared/page-data.js');
const opportunityData = require('../../shared/opportunity-data.js');
const root = path.resolve(__dirname, '../..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));

function getCurrentContentBaseline() {
  const today = new Date();
  const buildDate = process.env.FREEHUB_BUILD_DATE || [today.getFullYear(), String(today.getMonth()+1).padStart(2,'0'), String(today.getDate()).padStart(2,'0')].join('-');
  shared.setReferenceDate(process.env.FREEHUB_AS_OF_DATE || buildDate);
  const competitions = read('data/competitions.json');
  const active = shared.getPublishedActiveCompetitions(competitions);
  const core = shared.getPublishedCoreActiveCompetitions(competitions);
  const resultSlugs = new Set([...competitions, ...read('data/archive/competitions-expired.json')].filter(shared.hasVerifiedCompetitionResult).map(shared.getCompetitionSlug));
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
    // Reviewed 9 September base: includes four additional Bargain Books details; active counts exit routes.
    generatedFileCount: 339 + active.length + read('data/student-guide.json').offers.length + detailOpportunities.length + publicOpportunities.length,
    sitemapUrlCount: read('tests/baselines/seo-baseline.json').staticSitemapUrlCount + new Set([...active.map(shared.getCompetitionSlug), ...resultSlugs]).size + publicOpportunities.length,
  };
}
module.exports = { getCurrentContentBaseline };
