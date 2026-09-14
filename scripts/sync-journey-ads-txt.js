const fs = require('node:fs');
const path = require('node:path');
const SOURCE = 'https://adstxt.journeymv.com/sites/db39d7ff-ec0e-46b2-9797-bad57ea1954f/ads.txt';
const TARGET = path.resolve(__dirname, '..', 'ads.txt');

function validateAdsTxt(text) {
  if (/<[a-z!/]/i.test(text)) throw new Error('Journey returned HTML instead of ads.txt.');
  const lines = text.split(/\r?\n/).map(line => line.trim());
  for (const required of [
    'managerdomain=journeymv.com',
    'ownerdomain=freehub.co.za',
    'journeymv.com, db39d7ff-ec0e-46b2-9797-bad57ea1954f, DIRECT, 1363c924529b3998',
  ]) {
    if (!lines.includes(required)) throw new Error('Journey ads.txt is missing the expected Freehub identity: ' + required);
  }
  const sellers = lines.filter(line => /^[^#=\s,]+\s*,\s*[^,]+\s*,\s*(DIRECT|RESELLER)(\s*,|\s*$)/.test(line));
  if (sellers.length < 2) throw new Error('Journey ads.txt has no partner list.');
  return sellers.length;
}

async function syncAdsTxt() {
  const response = await fetch(SOURCE, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error('Journey ads.txt HTTP ' + response.status);
  if (!(response.headers.get('content-type') || '').includes('text/plain')) {
    throw new Error('Journey ads.txt response is not plain text.');
  }
  const text = await response.text();
  const count = validateAdsTxt(text);
  // Validate completely before replacing the published file; a failed fetch stops deployment.
  fs.writeFileSync(TARGET + '.tmp', text, 'utf8');
  fs.renameSync(TARGET + '.tmp', TARGET);
  console.log('Synced Journey ads.txt for freehub.co.za (' + count + ' seller records).');
}

module.exports = { validateAdsTxt };
if (require.main === module) syncAdsTxt().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
