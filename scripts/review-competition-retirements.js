const fs = require("node:fs");
const path = require("node:path");
const shared = require("../shared/page-data.js");
const { reviewBlockers, approvalFromReview, applyCompetitionRetirements } = require("./lib/competition-retirements.js");

function run(argv = process.argv.slice(2)) {
  const value = key => argv.find(arg => arg.startsWith(`${key}=`))?.slice(key.length + 1);
  const input = value("--review");
  if (!input) throw new Error("Supply --review=<private JSON review file>; use --approve only after all reviews clear.");
  const root = path.resolve(__dirname, "..");
  const inputPath = path.resolve(input);
  const researchRoot = path.join(root, ".research");
  const relative = path.relative(researchRoot, inputPath);
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Keep the private review dossier under .research/.");
  const asOfDate = value("--today") || shared.getSouthAfricanDate();
  shared.setReferenceDate(asOfDate);
  const read = name => JSON.parse(fs.readFileSync(path.join(root, name), "utf8"));
  const primary = read("data/competitions.json");
  const archive = read("data/archive/competitions-expired.json");
  const dossier = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  if (!Array.isArray(dossier.reviews)) throw new Error("Private review dossier must contain a reviews array.");
  const seen = new Set();
  const decisions = dossier.reviews.map(review => {
    if (!review?.id || seen.has(review.id)) throw new Error("Missing or duplicate review ID.");
    seen.add(review.id);
    const records = [...primary, ...archive].filter(record => record.id === review.id);
    const blockers = reviewBlockers(review, records, asOfDate);
    return { id: review.id, action: blockers.length ? "hold" : "ready", blockers,
      note: review.note || "", receipt: blockers.length ? null : approvalFromReview(review, records, asOfDate) };
  });
  const report = { asOfDate, reviewed: decisions.length, ready: decisions.filter(row => row.action === "ready").length,
    held: decisions.filter(row => row.action === "hold").length, decisions };
  fs.writeFileSync(path.join(path.dirname(inputPath), "retirement-decisions.json"), `${JSON.stringify(report, null, 2)}\n`);
  if (argv.includes("--approve")) {
    if (report.held) throw new Error("No registry changes made: every submitted review must clear first. Submit a separate dossier for a cleared subset.");
    const existing = read("data/competition-retirements.json");
    const ids = new Set(decisions.map(row => row.id));
    const updated = { ...existing, retirements: [...existing.retirements.filter(row => !ids.has(row.id)), ...decisions.map(row => row.receipt)] };
    applyCompetitionRetirements(primary, archive, { asOfDate, retirementRegistry: updated });
    fs.writeFileSync(path.join(root, "data/competition-retirements.json"), `${JSON.stringify(updated, null, 2)}\n`);
  }
  console.log(JSON.stringify({ asOfDate, reviewed: report.reviewed, ready: report.ready, held: report.held,
    registryChanged: argv.includes("--approve") }));
  return report;
}

if (require.main === module) {
  try { run(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { run };
