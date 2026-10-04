const fs = require("fs");
const path = require("path");
const { validateEditorialPicks, getEligibleEditorialPicks } = require("./editorial-picks.js");

function validateEditorialFreshness(root, today) {
  const read = (file) => JSON.parse(fs.readFileSync(path.join(root, "data", file), "utf8"));
  const picks = read("editorial-picks.json");
  const collections = { competition: read("competitions.json"), resource: read("free-resources.json"), offer: read("offers.json") };
  validateEditorialPicks(picks, collections);
  const errors = [];
  for (const [surface, file] of [["home", "index.html"], ["monthly", "best-competitions-south-africa-this-month/index.html"]]) {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    const eligible = new Set(getEligibleEditorialPicks(picks, collections, surface, today).map(pick => pick.recordId));
    for (const [, id, due] of html.matchAll(/data-editorial-pick="([^"]+)" data-valid-through="([^"]+)"/g)) {
      if (!eligible.has(id) || due < today) errors.push(`${surface}: stale or ineligible recommendation ${id}`);
    }
    for (const [, closing] of html.matchAll(/data-current-listing data-closing-date="([^"]+)"/g)) {
      if (closing < today) errors.push(`${surface}: expired comparison row ${closing}`);
    }
    if (/Ends today|Ends in \d+ days?/.test(html)) errors.push(`${surface}: frozen relative deadline`);
  }
  return errors;
}
module.exports = { validateEditorialFreshness };
