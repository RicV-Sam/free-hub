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

test("instruction and terms destinations are not labelled as direct app or WhatsApp entry", () => {
  for (const [slug, label] of [
    ["nescafe-gold-rush-spar-2026", "View official terms"],
    ["heinz-heritage-spar-2026", "View official terms"],
    ["huletts-heritage-2026", "View official entry instructions"],
    ["nedbank-moyaapp-consumer-education-2026", "View official terms"],
    ["sasol-magpie-2026", "View official entry instructions"],
  ]) {
    const html = fs.readFileSync(path.join(ROOT_DIR, "competition", slug, "index.html"), "utf8");
    assert.ok(html.includes(`>${label}</a>`), slug);
    assert.ok(!html.includes(">Enter in the official app</a>"), slug);
    assert.ok(!html.includes(">Enter via official WhatsApp</a>"), slug);
  }
});

test("the NESCAFE travel voucher cannot populate the grocery-voucher collection", () => {
  const file = path.join(ROOT_DIR, "win-grocery-vouchers-south-africa", "index.html");
  if (fs.existsSync(file)) {
    assert.ok(!fs.readFileSync(file, "utf8").includes("nescafe-gold-rush-spar-2026"));
  }
  const sitemap = fs.readFileSync(path.join(ROOT_DIR, "sitemap.xml"), "utf8");
  assert.ok(sitemap.includes("/competition/nescafe-gold-rush-spar-2026/"));
});
