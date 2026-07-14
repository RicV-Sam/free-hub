const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { walkHtmlFiles } = require("./lib/baseline-utils.js");

const REPO_ROOT = path.resolve(__dirname, "..");
const baseArg = process.argv.find((arg) => arg.startsWith("--base-dir="));
const actualArg = process.argv.find((arg) => arg.startsWith("--actual-dir="));
const allowFreeStuffParentV2 = process.argv.includes("--allow-free-stuff-parent-v2");
if (!baseArg) {
  console.error("Usage: node scripts/compare-generated-output.js --base-dir=/path/to/built/base");
  process.exit(1);
}
const BASE_DIR = path.resolve(baseArg.slice("--base-dir=".length));
const ROOT_DIR = actualArg ? path.resolve(actualArg.slice("--actual-dir=".length)) : REPO_ROOT;

const FREE_STUFF_PARENT_FILE = "free-stuff-south-africa/index.html";
const FREE_STUFF_PARENT_MARKER = 'data-free-stuff-parent-version="2"';
const FREE_STUFF_NAV_LINE = '          <a class="site-topbar__link" href="/free-stuff-south-africa/">Free Stuff</a>';
const COMPETITION_NAV_LINES = [
  '          <a class="site-topbar__link" href="/competitions/">Competitions</a>',
  '          <a class="site-topbar__link is-active" href="/competitions/" aria-current="page">Competitions</a>',
];

function hashContent(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function inventory(rootDir) {
  const files = walkHtmlFiles(rootDir);
  const sitemap = path.join(rootDir, "sitemap.xml");
  if (fs.existsSync(sitemap)) {
    files.push(sitemap);
  }
  return new Map(
    files
      .map((filePath) => {
        const content = fs.readFileSync(filePath);
        return [path.relative(rootDir, filePath).replace(/\\/g, "/"), { content, hash: hashContent(content) }];
      })
      .sort(([left], [right]) => left.localeCompare(right))
  );
}

const expected = inventory(BASE_DIR);
const actual = inventory(ROOT_DIR);
const paths = new Set([...expected.keys(), ...actual.keys()]);
const approvedDifferences = [];
const differences = [...paths]
  .filter((filePath) => expected.get(filePath)?.hash !== actual.get(filePath)?.hash)
  .sort()
  .map((filePath) => classifyDifference(filePath, expected.get(filePath), actual.get(filePath)))
  .filter(Boolean);

function classifyDifference(filePath, expectedEntry, actualEntry) {
  if (!expectedEntry || !actualEntry) {
    return {
      file: filePath,
      expected: expectedEntry?.hash || "missing",
      actual: actualEntry?.hash || "missing",
    };
  }

  const expectedHtml = expectedEntry.content.toString("utf8");
  const actualHtml = actualEntry.content.toString("utf8");
  if (filePath === FREE_STUFF_PARENT_FILE && allowFreeStuffParentV2) {
    if (!expectedHtml.includes(FREE_STUFF_PARENT_MARKER) && actualHtml.includes(FREE_STUFF_PARENT_MARKER)) {
      approvedDifferences.push({ file: filePath, reason: "one-time Free Stuff parent v2 transition" });
      return null;
    }
  }

  if (filePath.endsWith(".html") && filePath !== FREE_STUFF_PARENT_FILE) {
    const withoutApprovedInsertion = removeExactNavigationInsertion(actualHtml);
    const baseAlreadyContainsNavigation = expectedHtml.includes(FREE_STUFF_NAV_LINE);
    if (!baseAlreadyContainsNavigation && withoutApprovedInsertion === expectedHtml) {
      approvedDifferences.push({ file: filePath, reason: "exact Free Stuff navigation insertion" });
      return null;
    }
  }

  return { file: filePath, expected: expectedEntry.hash, actual: actualEntry.hash };
}

function removeExactNavigationInsertion(html) {
  const matches = COMPETITION_NAV_LINES.filter((line) =>
    html.includes(`${line}\n${FREE_STUFF_NAV_LINE}\n`)
  );
  if (matches.length !== 1 || html.split(FREE_STUFF_NAV_LINE).length !== 2) {
    return html;
  }
  const predecessor = matches[0];
  return html.replace(`${predecessor}\n${FREE_STUFF_NAV_LINE}\n`, `${predecessor}\n`);
}

console.log("=== Generated Public Output Parity ===");
console.log(`Base files: ${expected.size}`);
console.log(`Candidate files: ${actual.size}`);
console.log(`Differences: ${differences.length}`);
console.log(`Approved differences: ${approvedDifferences.length}`);
approvedDifferences.forEach((difference) => console.log(`- approved: ${difference.file} (${difference.reason})`));
differences.forEach((difference) => {
  console.log(`- ${difference.file}`);
  console.log(`  expected: ${difference.expected}`);
  console.log(`  actual:   ${difference.actual}`);
});

if (differences.length > 0) {
  process.exitCode = 1;
}
