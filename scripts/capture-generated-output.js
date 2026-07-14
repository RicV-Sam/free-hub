const fs = require("fs");
const path = require("path");
const { walkHtmlFiles } = require("./lib/baseline-utils.js");

const ROOT_DIR = path.resolve(__dirname, "..");
const outputArg = process.argv.find((arg) => arg.startsWith("--output-dir="));
if (!outputArg) {
  console.error("Usage: node scripts/capture-generated-output.js --output-dir=/path/to/snapshot");
  process.exit(1);
}
const OUTPUT_DIR = path.resolve(outputArg.slice("--output-dir=".length));
fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });

const files = walkHtmlFiles(ROOT_DIR);
const sitemap = path.join(ROOT_DIR, "sitemap.xml");
if (fs.existsSync(sitemap)) files.push(sitemap);
files.forEach((filePath) => {
  const relative = path.relative(ROOT_DIR, filePath);
  const target = path.join(OUTPUT_DIR, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(filePath, target);
});
console.log(`Captured ${files.length} generated files in ${OUTPUT_DIR}.`);
