const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT_DIR = path.resolve(__dirname, "..", "..");

test("Vodacom VNN lists every terms-supported official entry account", () => {
  const competitions = JSON.parse(
    fs.readFileSync(path.join(ROOT_DIR, "data", "competitions.json"), "utf8")
  );
  const vodacom = competitions.find(
    (competition) => competition.id === "vodacom-value-news-network-2026"
  );
  const expectedPlatforms = ["TikTok", "Facebook", "Instagram", "X", "LinkedIn", "YouTube"];

  assert.ok(vodacom);
  assert.deepEqual(
    vodacom.officialEntryAccounts.map((account) => account.platform),
    expectedPlatforms
  );

  const generatedPage = fs.readFileSync(
    path.join(ROOT_DIR, "competition", "vodacom-value-news-network-2026", "index.html"),
    "utf8"
  );

  assert.match(generatedPage, />Official VNN accounts</);
  vodacom.officialEntryAccounts.forEach((account) => {
    assert.match(generatedPage, new RegExp(`href="${escapeRegExp(account.url)}"`));
  });
});

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
