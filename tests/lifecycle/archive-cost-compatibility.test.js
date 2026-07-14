const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const shared = require("../../shared/page-data.js");
const {
  applyLegacyArchiveCostCompatibility,
  loadLegacyArchiveCostManifest,
} = require("../../scripts/lib/legacy-archive-costs.js");

const rootDir = path.resolve(__dirname, "..", "..");
const archive = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "archive", "competitions-expired.json"), "utf8"));
const manifest = loadLegacyArchiveCostManifest();

test("archive compatibility is explicit, complete, and serialization-neutral", () => {
  const compatible = applyLegacyArchiveCostCompatibility(archive, { manifest });
  const rawById = new Map(archive.map((record) => [record.id, record]));
  const compatibleById = new Map(compatible.map((record) => [record.id, record]));
  const missingPublishedArchiveIds = archive
    .filter((record) => shared.isExpiredArchiveEligibleCompetition(record) && !record.entryCostType)
    .map((record) => record.id)
    .sort();

  assert.equal(manifest.length, 15);
  assert.deepEqual(manifest.map((entry) => entry.id).sort(), missingPublishedArchiveIds);

  manifest.forEach((entry) => {
    const raw = rawById.get(entry.id);
    const normalized = compatibleById.get(entry.id);
    assert.equal(raw.entryCostType, undefined);
    assert.equal(normalized.entryCostType, undefined);
    assert.equal(shared.isExpiredArchiveEligibleCompetition(normalized), true);
    assert.equal(shared.isActiveCompetition(normalized), false);
    assert.equal(JSON.stringify(normalized), JSON.stringify(raw));
    assert.notEqual(shared.getEntryCostLabel(normalized), "Entry requirements unclear");
  });
});

test("all 85 active competition labels match the reviewed compact snapshot", () => {
  const baseline = JSON.parse(fs.readFileSync(path.join(rootDir, "tests", "baselines", "active-cost-labels.json"), "utf8"));
  const competitions = JSON.parse(fs.readFileSync(path.join(rootDir, "data", "competitions.json"), "utf8"));
  const active = shared.getPublishedActiveCompetitions(competitions);
  const pairs = active.map((record) => `${record.id}\t${shared.getEntryCostLabel(record)}`).sort();
  const labelCounts = active.reduce((counts, record) => {
    const label = shared.getEntryCostLabel(record);
    counts[label] = (counts[label] || 0) + 1;
    return counts;
  }, {});

  assert.equal(active.length, baseline.activeCount);
  assert.deepEqual(labelCounts, baseline.labelCounts);
  assert.equal(crypto.createHash("sha256").update(pairs.join("\n")).digest("hex"), baseline.sha256);
});
