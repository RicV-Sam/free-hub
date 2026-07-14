const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { walkHtmlFiles } = require("./lib/baseline-utils.js");

const ROOT_DIR = path.resolve(__dirname, "..");
const baseArg = process.argv.find((arg) => arg.startsWith("--base-dir="));
if (!baseArg) {
  console.error("Usage: node scripts/compare-generated-output.js --base-dir=/path/to/built/base");
  process.exit(1);
}
const BASE_DIR = path.resolve(baseArg.slice("--base-dir=".length));

function hashFile(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function inventory(rootDir) {
  const files = walkHtmlFiles(rootDir);
  const sitemap = path.join(rootDir, "sitemap.xml");
  if (fs.existsSync(sitemap)) {
    files.push(sitemap);
  }
  return new Map(
    files
      .map((filePath) => [path.relative(rootDir, filePath).replace(/\\/g, "/"), hashFile(filePath)])
      .sort(([left], [right]) => left.localeCompare(right))
  );
}

const expected = inventory(BASE_DIR);
const actual = inventory(ROOT_DIR);
const paths = new Set([...expected.keys(), ...actual.keys()]);
const differences = [...paths]
  .filter((filePath) => expected.get(filePath) !== actual.get(filePath))
  .sort()
  .map((filePath) => ({
    file: filePath,
    expected: expected.get(filePath) || "missing",
    actual: actual.get(filePath) || "missing",
  }));

console.log("=== Generated Public Output Parity ===");
console.log(`Base files: ${expected.size}`);
console.log(`Candidate files: ${actual.size}`);
console.log(`Differences: ${differences.length}`);
differences.forEach((difference) => {
  console.log(`- ${difference.file}`);
  console.log(`  expected: ${difference.expected}`);
  console.log(`  actual:   ${difference.actual}`);
});

if (differences.length > 0) {
  process.exitCode = 1;
}
