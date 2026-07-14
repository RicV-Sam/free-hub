const path = require("path");
const { spawnSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const BASELINE = "tests/baselines/link-warnings.json";

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
]);
const resourcePassed = run("scripts/validate-free-resource-links.js", [`--baseline=${BASELINE}`]);

if (!competitionPassed || !resourcePassed) {
  process.exitCode = 1;
}
