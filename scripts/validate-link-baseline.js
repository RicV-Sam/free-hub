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

if (!competitionPassed || !resourcePassed || !opportunityPassed) {
  process.exitCode = 1;
}
