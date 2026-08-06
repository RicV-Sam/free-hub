const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { walkHtmlFiles } = require("./lib/baseline-utils.js");
const { isExactReviewedDifference } = require("./lib/generated-output-review.js");

const REPO_ROOT = path.resolve(__dirname, "..");
const baseArg = process.argv.find((arg) => arg.startsWith("--base-dir="));
const actualArg = process.argv.find((arg) => arg.startsWith("--actual-dir="));
const allowAdsterraEvergreenV1 = process.argv.includes("--allow-adsterra-evergreen-v1");
const allowDiscoveryContentV1 = process.argv.includes("--allow-discovery-content-v1");
const allowOpportunityDetailFlow = process.argv.includes("--allow-opportunity-detail-flow");
if (!baseArg) {
  console.error("Usage: node scripts/compare-generated-output.js --base-dir=/path/to/built/base");
  process.exit(1);
}
const BASE_DIR = path.resolve(baseArg.slice("--base-dir=".length));
const ROOT_DIR = actualArg ? path.resolve(actualArg.slice("--actual-dir=".length)) : REPO_ROOT;

const FREE_STUFF_PARENT_FILE = "free-stuff-south-africa/index.html";
const DISCOVERY_LASTMOD_ROUTES = Object.freeze([
  "/category/vouchers/",
  "/free-samples-south-africa/",
  "/free-stuff-south-africa/",
]);
const OPPORTUNITY_OUTPUT_BASELINE_PATH = path.join(REPO_ROOT, "tests", "baselines", "opportunity-generated-output.json");
const OPPORTUNITY_OUTPUT_BASELINE = fs.existsSync(OPPORTUNITY_OUTPUT_BASELINE_PATH)
  ? JSON.parse(fs.readFileSync(OPPORTUNITY_OUTPUT_BASELINE_PATH, "utf8"))
  : { files: {}, surfaces: {} };
const DISCOVERY_OUTPUT_BASELINE_PATH = path.join(REPO_ROOT, "tests", "baselines", "discovery-generated-output.json");
const DISCOVERY_OUTPUT_BASELINE = fs.existsSync(DISCOVERY_OUTPUT_BASELINE_PATH)
  ? JSON.parse(fs.readFileSync(DISCOVERY_OUTPUT_BASELINE_PATH, "utf8"))
  : { files: {} };
const ADSTERRA_EVERGREEN_OUTPUT_BASELINE_PATH = path.join(
  REPO_ROOT,
  "tests",
  "baselines",
  "adsterra-evergreen-generated-output.json"
);
const ADSTERRA_EVERGREEN_OUTPUT_BASELINE = fs.existsSync(ADSTERRA_EVERGREEN_OUTPUT_BASELINE_PATH)
  ? JSON.parse(fs.readFileSync(ADSTERRA_EVERGREEN_OUTPUT_BASELINE_PATH, "utf8"))
  : { files: {} };
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
  if (
    allowAdsterraEvergreenV1 &&
    isExactReviewedDifference(ADSTERRA_EVERGREEN_OUTPUT_BASELINE, filePath, expectedEntry, actualEntry)
  ) {
    approvedDifferences.push({ file: filePath, reason: "exact reviewed Adsterra and evergreen-category release output" });
    return null;
  }
  if (
    allowDiscoveryContentV1 &&
    isExactReviewedDifference(DISCOVERY_OUTPUT_BASELINE, filePath, expectedEntry, actualEntry)
  ) {
    approvedDifferences.push({ file: filePath, reason: "exact reviewed voucher and samples release output" });
    return null;
  }
  const reviewedOpportunityFileHash = OPPORTUNITY_OUTPUT_BASELINE.files?.[filePath];
  if (allowOpportunityDetailFlow && !expectedEntry && actualEntry && reviewedOpportunityFileHash) {
    if (actualEntry.hash === reviewedOpportunityFileHash) {
      approvedDifferences.push({ file: filePath, reason: "exact reviewed Opportunity detail-flow file" });
      return null;
    }
  }
  if (!expectedEntry || !actualEntry) {
    return {
      file: filePath,
      expected: expectedEntry?.hash || "missing",
      actual: actualEntry?.hash || "missing",
    };
  }

  const expectedHtml = expectedEntry.content.toString("utf8");
  const actualHtml = actualEntry.content.toString("utf8");
  const reviewedSurface = OPPORTUNITY_OUTPUT_BASELINE.surfaces?.[filePath];
  if (
    allowOpportunityDetailFlow &&
    reviewedSurface &&
    expectedEntry.hash === reviewedSurface.flagOff &&
    actualEntry.hash === reviewedSurface.flagOn
  ) {
    approvedDifferences.push({ file: filePath, reason: "exact reviewed flag-enabled Opportunity surface" });
    return null;
  }

  const expectedStylesheetVersion = expectedHtml.match(/styles\.css\?v=([^"&]+)/)?.[1];
  if (allowDiscoveryContentV1 && filePath.startsWith("out/") && filePath.endsWith("/index.html")) {
    const normalizedOutboundActual = expectedStylesheetVersion
      ? actualHtml.replace(/(styles\.css\?v=)[^"&]+/g, `$1${expectedStylesheetVersion}`)
      : actualHtml;
    if (removeExactOutboundAdvertising(expectedHtml) === normalizedOutboundActual) {
      approvedDifferences.push({ file: filePath, reason: "exact outbound advertising removal" });
      return null;
    }
  }
  if (expectedStylesheetVersion) {
    const normalizedStylesheetActual = actualHtml.replace(/(styles\.css\?v=)[^"&]+/g, `$1${expectedStylesheetVersion}`);
    if (normalizedStylesheetActual === expectedHtml) {
      approvedDifferences.push({ file: filePath, reason: "exact reviewed stylesheet cache-version transition" });
      return null;
    }
  }

  if (allowDiscoveryContentV1 && filePath === "sitemap.xml") {
    const normalizedActual = DISCOVERY_LASTMOD_ROUTES.reduce(
      (normalized, route) => replaceSitemapLastmod(normalized, expectedHtml, route),
      actualHtml
    );
    if (normalizedActual === expectedHtml) {
      approvedDifferences.push({ file: filePath, reason: "exact reviewed discovery-page lastmod changes" });
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

function removeExactOutboundAdvertising(html) {
  const script = '    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6084410613829318" crossorigin="anonymous"></script>\n';
  const zones = '\n\n        <section class="ad-slot ad-slot--reserved" id="ad-top" data-placement="outbound-top" aria-label="Sponsored placement"></section>\n\n        <section class="ad-slot ad-slot--compact ad-slot--reserved" id="ad-middle" data-placement="outbound-middle" aria-label="Sponsored placement"></section>\n';
  const scriptCount = html.split(script).length - 1;
  const zoneCount = html.split(zones).length - 1;

  if (scriptCount !== 1 || zoneCount !== 1) {
    return html;
  }

  return html.replace(script, "").replace(zones, "\n");
}

function replaceSitemapLastmod(actualXml, expectedXml, route) {
  const escapedRoute = route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(<loc>https://freehub\\.co\\.za${escapedRoute}<\\/loc>\\s*<lastmod>)[^<]+(<\\/lastmod>)`);
  const expectedValue = expectedXml.match(pattern)?.[0];
  const expectedDate = expectedValue?.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
  return expectedDate ? actualXml.replace(pattern, `$1${expectedDate}$2`) : actualXml;
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
