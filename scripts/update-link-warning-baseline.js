const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { sortWarnings, warningKey } = require("./lib/warning-baseline.js");

const ROOT_DIR = path.resolve(__dirname, "..");
const BASELINE_PATH = path.join(ROOT_DIR, "tests", "baselines", "link-warnings.json");

if (!process.argv.includes("--update")) {
  console.error("Refusing to change the reviewed warning baseline without --update.");
  process.exit(1);
}

function runJsonScript(script, args) {
  const result = spawnSync(process.execPath, [path.join(ROOT_DIR, script), ...args, "--json"], {
    cwd: ROOT_DIR,
    encoding: "utf8",
    env: process.env,
  });

  if (result.status !== 0) {
    console.error(result.stderr || result.stdout || `${script} failed`);
    process.exit(1);
  }

  const output = JSON.parse(result.stdout);
  if (output.failures.length > 0) {
    console.error(`${script} reported hard failures; warning baseline was not changed.`);
    process.exit(1);
  }
  return output.normalizedWarnings;
}

const competitionWarnings = runJsonScript("scripts/validate-competition-links.js", [
  "--published-only",
  "--timeout=25000",
  "--concurrency=8",
]);
const resourceWarnings = runJsonScript("scripts/validate-free-resource-links.js", []);
const observedWarnings = [...competitionWarnings, ...resourceWarnings];
const existingWarnings = fs.existsSync(BASELINE_PATH)
  ? JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8")).warnings || []
  : [];
const pruneResolved = process.argv.includes("--prune-resolved");
const mergedByKey = new Map(
  (pruneResolved ? [] : existingWarnings).map((warning) => [`${warning.sourceType}:${warningKey(warning)}`, warning])
);
observedWarnings.forEach((warning) => mergedByKey.set(`${warning.sourceType}:${warningKey(warning)}`, warning));
const baseline = {
  version: 1,
  warnings: sortWarnings([...mergedByKey.values()]),
};

fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`, "utf8");
console.log(
  `Updated ${path.relative(ROOT_DIR, BASELINE_PATH)} with ${baseline.warnings.length} reviewed warnings${
    pruneResolved ? " after explicitly pruning resolved entries" : "; resolved entries were preserved"
  }.`
);
