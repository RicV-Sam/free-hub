const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const shared = require("../../shared/page-data.js");
const { validateEditorialPicks, getEligibleEditorialPicks } = require("../../scripts/lib/editorial-picks.js");
const picks = require("../../data/editorial-picks.json");
const collections = { competition: require("../../data/competitions.json"), resource: require("../../data/free-resources.json"), offer: require("../../data/offers.json") };

test("South African day changes at 22:00 UTC in every visitor timezone", () => {
  for (const tz of ["UTC", "Pacific/Honolulu", "Asia/Tokyo", "America/New_York"]) {
    const result = execFileSync(process.execPath, ["-e", `const s=require('./shared/page-data');s.setReferenceDate(''); console.log(s.getSouthAfricanDate('2026-10-03T21:59:59Z')); console.log(s.getSouthAfricanDate('2026-10-03T22:00:00Z'));`], { cwd: require("node:path").resolve(__dirname, "../.."), env: { ...process.env, TZ: tz, NODE_OPTIONS: "" }, encoding: "utf8" });
    assert.deepEqual(result.trim().split(/\r?\n/), ["2026-10-03", "2026-10-04"]);
  }
});

test("date-only closing day is inclusive and deterministic overrides survive timezone differences", () => {
  shared.setReferenceDate("2026-10-03");
  assert.equal(shared.getDaysUntilClosing("2026-10-03"), 0);
  shared.setReferenceDate("2026-10-04");
  assert.equal(shared.getDaysUntilClosing("2026-10-03"), -1);
  assert.equal(shared.formatDate("2026-10-03"), "3 Oct 2026");
  assert.throws(() => shared.setReferenceDate("2026-02-30"));
  shared.setReferenceDate(process.env.FREEHUB_AS_OF_DATE || "");
});

test("reviewed shortlist references real records and enforces weekly review", () => {
  assert.doesNotThrow(() => validateEditorialPicks(picks, collections));
  assert.deepEqual(getEligibleEditorialPicks(picks, collections, "home", "2026-10-04").map(p => p.kind), ["resource", "offer", "competition"]);
  assert.equal(getEligibleEditorialPicks(picks, collections, "monthly", "2026-10-04").length, 3);
  assert.equal(getEligibleEditorialPicks(picks, collections, "home", "2026-10-12").length, 0);
  assert.equal(getEligibleEditorialPicks(picks, collections, "home", "2026-09-08").length, 0);
  const overdue = [{ ...picks[0], reviewDueAt: "2026-10-20" }];
  assert.throws(() => validateEditorialPicks(overdue, collections));
});

test("held, withdrawn, expired and evidence-overdue records cannot be recommended", () => {
  for (const field of [{ publicationStatus: "held" }, { publicationStatus: "withdrawn" }, { closingDate: "2026-10-03" }, { reviewDueAt: "2026-10-03" }]) {
    const changed = { ...collections, competition: collections.competition.map(item => item.id === "cadbury-made-to-share-2026" ? { ...item, ...field } : item) };
    assert.ok(!getEligibleEditorialPicks(picks, changed, "home", "2026-10-04").some(p => p.recordId === "cadbury-made-to-share-2026"));
  }
  const changed = { ...collections, resource: collections.resource.map(item => item.id === "resource-childrens-books-book-dash" ? { ...item, availability: "retired" } : item) };
  assert.ok(!getEligibleEditorialPicks(picks, changed, "home", "2026-10-04").some(p => p.kind === "resource"));
});
