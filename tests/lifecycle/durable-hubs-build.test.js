const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

test("durable guides survive a real generator build with zero qualifying published inventory", context => {
  const root = path.resolve(__dirname, "../..");
  const research = path.join(root, ".research");
  fs.mkdirSync(research, { recursive: true });
  const fixture = fs.mkdtempSync(path.join(research, "durable-hubs-build-test-"));
  context.after(() => {
    const relative = path.relative(research, fixture);
    assert.ok(relative.startsWith("durable-hubs-build-test-") && !relative.includes(path.sep));
    fs.rmSync(fixture, { recursive: true, force: true });
  });
  for (const name of ["scripts", "shared", "data", "assets", "functions/airtime-dash/engine.js", "tests/baselines", "404.html", "styles.css", "app.js", "robots.txt"]) {
    fs.cpSync(path.join(root, name), path.join(fixture, name), { recursive: true });
  }
  const records = JSON.parse(fs.readFileSync(path.join(fixture, "data/competitions.json")));
  const referenceDate = process.env.FREEHUB_AS_OF_DATE || process.env.FREEHUB_BUILD_DATE || "2026-10-14";
  // Withhold every qualifying guide record in this synthetic fixture while
  // preserving unrelated campaigns and the archive's required related links.
  const slugs = ["sms-competitions-south-africa", "win-airtime-competitions-south-africa", "win-data-competitions-south-africa"];
  const qualifyingIds = new Set(slugs.flatMap(slug => {
    const html = fs.readFileSync(path.join(root, slug, "index.html"), "utf8");
    return JSON.parse(html.match(/window.FreeHubVerticalCollection = (\{.*?\});/)[1]).recordIds;
  }));
  const withhold = record => qualifyingIds.has(record.id) ? { ...record, verificationStatus: "held", publicationStatus: "held", doNotPublish: true } : record;
  fs.writeFileSync(path.join(fixture, "data/competitions.json"), JSON.stringify(records.map(withhold)));
  // An archived copy must not republish a campaign withheld in this fixture.
  const archivePath = path.join(fixture, "data/archive/competitions-expired.json");
  fs.writeFileSync(archivePath, JSON.stringify(JSON.parse(fs.readFileSync(archivePath)).map(withhold)));
  const result = spawnSync(process.execPath, ["scripts/generate-pages.js"], { cwd: fixture, encoding: "utf8",
    env: { ...process.env, FREEHUB_AS_OF_DATE: referenceDate, FREEHUB_BUILD_DATE: referenceDate, FREEHUB_ENABLE_OFFERS: "true", FREEHUB_ENABLE_OPPORTUNITIES: "true" } });
  assert.equal(result.status, 0, result.stderr);
  const sitemap = fs.readFileSync(path.join(fixture, "sitemap.xml"), "utf8");
  for (const slug of slugs) {
    const html = fs.readFileSync(path.join(fixture, slug, "index.html"), "utf8");
    assert.ok(sitemap.includes(`https://freehub.co.za/${slug}/`));
    assert.match(html, /name="robots" content="index,\s*follow(?:,|"|\s)/);
    assert.ok(html.includes("No current verified competitions match this guide."));
    assert.ok(html.includes("seo-copy-block--intro"));
    assert.equal((html.match(/<article class="competition-card"/g) || []).length, 0);
    assert.ok(html.includes('"recordIds":[]'));
  }
});
