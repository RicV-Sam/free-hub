const path = require("path");
const { spawnSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const BASELINE = "tests/baselines/link-warnings.json";
const allowCiNetworkInconclusive = process.argv.includes("--allow-ci-network-inconclusive");
const ciNetworkArgs = allowCiNetworkInconclusive ? ["--allow-ci-network-inconclusive"] : [];

function run(script, args) {
  const result = spawnSync(process.execPath, [path.join(ROOT_DIR, script), ...args], {
    cwd: ROOT_DIR,
    env: process.env,
    stdio: "inherit",
  });
  return result.status === 0;
}

const competitionPassed = run("scripts/validate-competition-links.js", [
  "--published-only",
  "--timeout=25000",
  "--concurrency=8",
  `--baseline=${BASELINE}`,
  ...ciNetworkArgs,
]);
const resourcePassed = run("scripts/validate-free-resource-links.js", [`--baseline=${BASELINE}`, ...ciNetworkArgs]);
const opportunityPassed = run("scripts/validate-opportunity-links.js", ciNetworkArgs);
// A withdrawal resolves a public-source alert only if its generated boundaries
// are safe. Fresh evidence remains mandatory for every published opportunity.
const { buildOpportunityHealthReport } = require("./lib/opportunity-health-report.js");
const health = buildOpportunityHealthReport({
  asOfDate: process.env.FREEHUB_BUILD_DATE || new Date().toISOString().slice(0, 10),
  rawFeatureValue: process.env.FREEHUB_ENABLE_OPPORTUNITIES,
});
console.log(`Opportunity evidence and publication health: ${health.ok ? "PASS" : "FAIL"}`);
health.actionableErrors.forEach(error => console.log(`- ${error}`));

if (!competitionPassed || !resourcePassed || !opportunityPassed || !health.ok) {
  process.exitCode = 1;
}
