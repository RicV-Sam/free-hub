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
  const competitions = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "data", "competitions.json"), "utf8"));
  const asOfDate = process.env.FREEHUB_BUILD_DATE || new Date().toISOString().slice(0, 10);
  for (const [slug, label] of [
    ["nescafe-gold-rush-spar-2026", "View official terms"],
    ["heinz-heritage-spar-2026", "View official terms"],
    ["nedbank-moyaapp-consumer-education-2026", "View official terms"],
    ["sasol-magpie-2026", "View official entry instructions"],
  ]) {
    const html = fs.readFileSync(path.join(ROOT_DIR, "competition", slug, "index.html"), "utf8");
    const competition = competitions.find((row) => row.id === slug);
    assert.ok(competition, slug);
    if (competition.closingDate < asOfDate) {
      assert.ok(html.includes('aria-label="Competition closed"'), slug);
      assert.ok(!html.includes(`href="/out/${slug}/"`), slug);
    } else {
      assert.ok(html.includes(`>${label}</a>`), slug);
    }
    assert.ok(!html.includes(">Enter in the official app</a>"), slug);
    assert.ok(!html.includes(">Enter via official WhatsApp</a>"), slug);
  }
});

test("Huletts closing day is active and the following day is archived", () => {
  const shared = require("../../shared/page-data.js");
  const competition = require("../../data/competitions.json").find(item => item.id === "huletts-heritage-2026");
  const original = shared.getReferenceDate();
  shared.setReferenceDate(competition.closingDate);
  assert.equal(shared.isExpiredCompetition(competition), false);
  shared.setReferenceDate(new Date(Date.parse(competition.closingDate) + 86400000).toISOString().slice(0, 10));
  assert.equal(shared.isExpiredCompetition(competition), true);
  shared.setReferenceDate(process.env.FREEHUB_AS_OF_DATE || "");
  const html = fs.readFileSync(path.join(ROOT_DIR, "competition", competition.id, "index.html"), "utf8");
  const active = (process.env.FREEHUB_AS_OF_DATE || original) <= competition.closingDate;
  assert.ok(html.includes(active ? '>View official entry instructions</a>' : 'This competition has closed.'), competition.id);
  assert.ok(!html.includes('>Enter in the official app</a>'));
  assert.ok(!html.includes('>Enter via official WhatsApp</a>'));
});

test("the NESCAFE travel voucher cannot populate the grocery-voucher collection", () => {
  const file = path.join(ROOT_DIR, "win-grocery-vouchers-south-africa", "index.html");
  if (fs.existsSync(file)) {
    assert.ok(!fs.readFileSync(file, "utf8").includes("nescafe-gold-rush-spar-2026"));
  }
  const sitemap = fs.readFileSync(path.join(ROOT_DIR, "sitemap.xml"), "utf8");
  assert.ok(sitemap.includes("/competition/nescafe-gold-rush-spar-2026/"));
});
