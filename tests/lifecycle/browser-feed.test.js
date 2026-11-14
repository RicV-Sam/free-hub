const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const shared = require("../../shared/page-data.js");
const { applyCompetitionRetirements } = require("../../scripts/lib/competition-retirements.js");
const root = path.resolve(__dirname, "../..");

test("browser feed retains full current public records and excludes the editorial ledger", () => {
  const read = name => JSON.parse(fs.readFileSync(path.join(root, name), "utf8"));
  shared.setReferenceDate(process.env.FREEHUB_AS_OF_DATE || process.env.FREEHUB_BUILD_DATE || shared.getSouthAfricanDate());
  const primary = read("data/competitions.json");
  const { primary: retained } = applyCompetitionRetirements(primary, read("data/archive/competitions-expired.json"));
  const expected = shared.getPublishedActiveCompetitions(shared.sortCompetitions(retained));
  const feed = fs.readFileSync(path.join(root, "app-data/browser-competitions.json"), "utf8");
  const actual = JSON.parse(feed);
  assert.deepEqual(actual, expected);
  assert.ok(actual.every(record => shared.isPublicCompetition(record) && !record.doNotPublish));
  // The share of the registry that is active changes as entries move to the
  // archive. Check that the complete eligible payload ships in compact form.
  assert.equal(feed, `${JSON.stringify(actual)}\n`, "browser feed must use compact JSON");
});
