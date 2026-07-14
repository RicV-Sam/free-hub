const fs = require("fs");
const path = require("path");
const { parseHtml } = require("./lib/baseline-utils.js");

const ROOT_DIR = path.resolve(__dirname, "..");
const BASELINE_PATH = path.join(ROOT_DIR, "tests", "baselines", "performance.json");
const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
const warnings = [];
const failures = [];

function percentChange(actual, expected) {
  return ((actual - expected) / expected) * 100;
}

console.log("=== Informational Performance Baseline ===");
Object.entries(baseline.assets).forEach(([name, asset]) => {
  const filePath = path.join(ROOT_DIR, asset.file);
  if (!fs.existsSync(filePath)) {
    failures.push(`${name}: missing ${asset.file}`);
    return;
  }
  const actual = fs.statSync(filePath).size;
  const growth = percentChange(actual, asset.bytes);
  const summary = `${name}: ${actual} bytes (baseline ${asset.bytes}, ${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%)`;
  console.log(`- ${summary}`);
  if (growth > baseline.failGrowthPercent) {
    failures.push(`${summary}; exceeds +${baseline.failGrowthPercent}%`);
  } else if (growth > baseline.warnGrowthPercent) {
    warnings.push(`${summary}; exceeds +${baseline.warnGrowthPercent}%`);
  }
});

const competitionsHtml = fs.readFileSync(path.join(ROOT_DIR, "competitions", "index.html"), "utf8");
const competitionCards = (competitionsHtml.match(/<article class="competition-card"/g) || []).length;
let structuredDataItems = 0;

function inspectStructuredData(value) {
  if (Array.isArray(value)) {
    value.forEach(inspectStructuredData);
    return;
  }
  if (!value || typeof value !== "object") {
    return;
  }
  if (value["@type"] === "ItemList" && Array.isArray(value.itemListElement)) {
    structuredDataItems = Math.max(structuredDataItems, value.itemListElement.length);
  }
  Object.values(value).forEach(inspectStructuredData);
}

inspectStructuredData(parseHtml(competitionsHtml).jsonLd);
console.log(
  `- competition cards: ${competitionCards} (baseline ${baseline.inventory.competitionCards}, informational delta ${competitionCards - baseline.inventory.competitionCards})`
);
console.log(
  `- structured-data items: ${structuredDataItems} (baseline ${baseline.inventory.structuredDataItems}, informational delta ${structuredDataItems - baseline.inventory.structuredDataItems})`
);

if (competitionCards !== structuredDataItems) {
  failures.push(`competition card/schema parity: expected equal counts, actual ${competitionCards} cards and ${structuredDataItems} items`);
}

console.log(`Warnings: ${warnings.length}`);
warnings.forEach((warning) => console.log(`- ${warning}`));
console.log(`Hard failures: ${failures.length}`);
failures.forEach((failure) => console.log(`- ${failure}`));

if (failures.length > 0) {
  process.exitCode = 1;
}
