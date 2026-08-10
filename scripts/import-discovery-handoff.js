const fs = require("node:fs");
const path = require("node:path");
const {
  buildReviewRegistry,
  summarizeRegistry,
} = require("./lib/discovery-handoff-review.js");

const ROOT_DIR = path.resolve(__dirname, "..");
const DEFAULT_HANDOFF_PATH = path.resolve(
  ROOT_DIR,
  "..",
  "Za Comp Engine",
  "storage",
  "exports",
  "discovery-handoff-candidates.json"
);
const DEFAULT_REVIEW_PATH = path.join(ROOT_DIR, ".research", "discovery-editorial-review.json");

function parseArgs(argv) {
  const options = { write: false, inputPath: DEFAULT_HANDOFF_PATH, reviewPath: DEFAULT_REVIEW_PATH };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--write") options.write = true;
    else if (arg === "--input") options.inputPath = path.resolve(argv[++index]);
    else if (arg.startsWith("--input=")) options.inputPath = path.resolve(arg.slice(8));
    else if (arg === "--review") options.reviewPath = path.resolve(argv[++index]);
    else if (arg.startsWith("--review=")) options.reviewPath = path.resolve(arg.slice(9));
    else if (arg !== "--dry-run") throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonIfPresent(filePath, fallback) {
  return fs.existsSync(filePath) ? readJson(filePath) : fallback;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const registry = buildReviewRegistry({
    handoff: readJson(options.inputPath),
    offers: readJson(path.join(ROOT_DIR, "data", "offers.json")),
    opportunities: readJson(path.join(ROOT_DIR, "data", "opportunities.json")),
    existingRegistry: readJsonIfPresent(options.reviewPath, null),
    nowIso: new Date().toISOString(),
  });
  if (options.write) {
    fs.mkdirSync(path.dirname(options.reviewPath), { recursive: true });
    fs.writeFileSync(options.reviewPath, `${JSON.stringify(registry, null, 2)}\n`);
  }
  console.log(JSON.stringify({
    mode: options.write ? "write_private_review_registry" : "dry_run",
    inputPath: options.inputPath,
    reviewPath: options.reviewPath,
    publicDataChanged: false,
    ...summarizeRegistry(registry),
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(`Discovery handoff import failed: ${error.message}`);
  process.exitCode = 1;
}
