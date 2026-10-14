const shared = require('../../shared/page-data.js');
const { getEligibleEditorialPicks } = require('../../scripts/lib/editorial-picks.js');
const referenceDate = process.env.FREEHUB_AS_OF_DATE || process.env.FREEHUB_BUILD_DATE || shared.getSouthAfricanDate();
const homePicks = getEligibleEditorialPicks(require('../../data/editorial-picks.json'), {
  competition: require('../../data/competitions.json'),
  resource: require('../../data/free-resources.json'),
  offer: process.env.FREEHUB_ENABLE_OFFERS === 'true' ? require('../../data/offers.json') : [],
}, 'home', referenceDate);
module.exports = { homePicks, referenceDate };
