const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync, spawn } = require("node:child_process");
const test = require("node:test");
const { sourceHash, approvalFromReview } = require("../../scripts/lib/competition-retirements.js");

test("a full build retires an approved synthetic archive, serves a real 404 and preserves live/result routes", async context => {
  const root = path.resolve(__dirname, "../..");
  const research = path.join(root, ".research");
  fs.mkdirSync(research, { recursive: true });
  const fixture = fs.mkdtempSync(path.join(research, "retirement-build-test-"));
  let probe;
  context.after(async () => {
    if (probe && probe.exitCode === null && probe.signalCode === null) {
      const ended = new Promise(resolve => probe.once("exit", resolve));
      probe.kill("SIGKILL");
      await ended;
    }
    const relative = path.relative(research, fixture);
    assert.ok(relative.startsWith("retirement-build-test-") && !relative.includes(path.sep));
    fs.rmSync(fixture, { recursive: true, force: true });
  });
  for (const name of ["scripts", "shared", "data", "assets", "tests/baselines", "tests/browser/server.js", "404.html", "styles.css", "app.js", "robots.txt"]) {
    fs.cpSync(path.join(root, name), path.join(fixture, name), { recursive: true });
  }
  const read = name => JSON.parse(fs.readFileSync(path.join(fixture, name), "utf8"));
  const write = (name, value) => fs.writeFileSync(path.join(fixture, name), `${JSON.stringify(value, null, 2)}\n`);
  const primary = read("data/competitions.json");
  const archive = read("data/archive/competitions-expired.json");
  const synthetic = { id: "synthetic-archive-build-test", title: "Synthetic archive regression fixture", brand: "Synthetic test promoter",
    category: "Vouchers", closingDate: "2026-06-01", url: "https://example.org/synthetic-test",
    sourceUrl: "https://example.org/synthetic-test", termsUrl: "https://example.org/synthetic-test",
    verificationStatus: "published", entryCostType: "free-entry", purchaseRequired: false };
  const archived = { ...synthetic, archivedAt: "2026-06-02", archiveReason: "expired" };
  // Cover historical archives whose cost classification lives in the legacy
  // manifest instead of the raw record. That manifest must remain complete.
  delete archived.entryCostType;
  write("data/archive/legacy-cost-classifications.json", [
    ...read("data/archive/legacy-cost-classifications.json"),
    { id: synthetic.id, entryCostType: "free-entry" },
  ]);
  write("data/competitions.json", [...primary, synthetic]);
  write("data/archive/competitions-expired.json", [...archive, archived]);
  const evidence = { status: "clear", reviewedAt: "2026-10-04", evidenceHash: "a".repeat(64), note: "Synthetic test evidence only; this does not clear any real competition." };
  const receipt = approvalFromReview({ id: synthetic.id, sourceHash: sourceHash([synthetic, archived]), reviewedAt: "2026-10-04", effectiveAt: "2026-10-04",
    traffic: { ...evidence, startDate: "2026-09-02", endDate: "2026-09-29", complete: true, googleClicks: 0, landingSessions: 0 },
    backlinks: { ...evidence, preserve: false }, claims: { ...evidence, sourceUrls: [synthetic.url] },
    results: { ...evidence, sourceUrls: [synthetic.url], usefulResult: false } }, [synthetic, archived], "2026-10-04");
  write("data/competition-retirements.json", { schemaVersion: 1, retirements: [receipt] });
  const build = date => {
    const result = spawnSync(process.execPath, ["scripts/generate-pages.js"], { cwd: fixture, encoding: "utf8",
      env: { ...process.env, FREEHUB_BUILD_DATE: date, FREEHUB_AS_OF_DATE: date, FREEHUB_ENABLE_OPPORTUNITIES: "true", FREEHUB_ENABLE_OFFERS: "true" } });
    assert.equal(result.status, 0, result.stderr);
  };
  const detail = path.join(fixture, "competition", synthetic.id, "index.html");
  build("2026-09-08");
  assert.ok(fs.readFileSync(detail, "utf8").includes("This competition has closed."));
  // Simulate a stale exit directory from an earlier build; retirement must remove it.
  fs.mkdirSync(path.join(fixture, "out", synthetic.id), { recursive: true });
  fs.writeFileSync(path.join(fixture, "out", synthetic.id, "index.html"), "stale synthetic exit");
  build("2026-10-04");
  assert.equal(fs.existsSync(detail), false);
  assert.equal(fs.existsSync(path.join(fixture, "out", synthetic.id)), false);
  assert.equal(read("data/competitions.json").some(row => row.id === synthetic.id), true);
  assert.equal(read("app-data/competitions.json").competitions.some(row => row.id === synthetic.id), false);
  assert.ok(!fs.readFileSync(path.join(fixture, "sitemap.xml"), "utf8").includes(synthetic.id));
  const linkScope = spawnSync(process.execPath, ["-e", "console.log(JSON.stringify(require('./scripts/validate-competition-links.js').loadCompetitions().map(row => row.id)))"],
    { cwd: fixture, encoding: "utf8", env: { ...process.env, FREEHUB_AS_OF_DATE: "2026-10-04" } });
  assert.equal(linkScope.status, 0, linkScope.stderr);
  assert.equal(JSON.parse(linkScope.stdout).includes(synthetic.id), false,
    "External-link validation must not demand a generated page for a retired archive.");
  const resultRecord = [...primary, ...archive].find(row => row.resultStatus === "confirmed");
  assert.ok(resultRecord, "Existing verified result fixture is required.");
  assert.ok(fs.existsSync(path.join(fixture, "competition", resultRecord.id, "index.html")));
  assert.ok(read("app-data/competitions.json").count > 0);
  // The actual project server's missing-route branch must send 404, not a soft 404 or redirect.
  // With port 0 the server log doesn't expose the selected port; use a temporary
  // copy that reports the bound address without changing its response handling.
  const serverFile = path.join(fixture, "tests/browser/server.js");
  fs.writeFileSync(serverFile, fs.readFileSync(serverFile, "utf8").replace("${PORT}", "${server.address().port}"));
  probe = spawn(process.execPath, ["tests/browser/server.js"], { cwd: fixture, env: { ...process.env, PORT: "0" }, stdio: ["ignore", "pipe", "pipe"] });
  const url = await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.stdout.on("data", chunk => { const match = String(chunk).match(/http:\/\/127\.0\.0\.1:\d+/); if (match) resolve(match[0]); });
    probe.once("exit", code => reject(new Error(`Fixture server exited: ${code}`)));
  });
  const response = await fetch(`${url}/competition/${synthetic.id}/`);
  assert.equal(response.status, 404);
  assert.equal(response.redirected, false);
  assert.ok((await response.text()).includes("/competitions/"));
  assert.equal((await fetch(`${url}/competition/${resultRecord.id}/`)).status, 200);
});
