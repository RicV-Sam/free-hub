const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { walkHtmlFiles } = require("./lib/baseline-utils.js");

const REPO_ROOT = path.resolve(__dirname, "..");
const baseArg = process.argv.find((arg) => arg.startsWith("--base-dir="));
const actualArg = process.argv.find((arg) => arg.startsWith("--actual-dir="));
const allowFreeStuffParentV2 = process.argv.includes("--allow-free-stuff-parent-v2");
const allowFreeSamplesV2 = process.argv.includes("--allow-free-samples-v2");
const allowOpportunityPilot = process.argv.includes("--allow-opportunity-pilot");
if (!baseArg) {
  console.error("Usage: node scripts/compare-generated-output.js --base-dir=/path/to/built/base");
  process.exit(1);
}
const BASE_DIR = path.resolve(baseArg.slice("--base-dir=".length));
const ROOT_DIR = actualArg ? path.resolve(actualArg.slice("--actual-dir=".length)) : REPO_ROOT;

const FREE_STUFF_PARENT_FILE = "free-stuff-south-africa/index.html";
const FREE_SAMPLES_FILE = "free-samples-south-africa/index.html";
const FREE_STUFF_PARENT_MARKER = 'data-free-stuff-parent-version="2"';
const FREE_SAMPLES_MARKER = 'data-free-samples-page-version="2"';
const OPPORTUNITY_SURFACE_FILES = new Set([FREE_STUFF_PARENT_FILE, FREE_SAMPLES_FILE]);
const OPPORTUNITY_PILOT_FRAGMENT_HASHES = Object.freeze({
  [FREE_SAMPLES_FILE]: Object.freeze({
    section: "cbdac709faad6e5e76f700ba661e0dcfbea4c1c9d784ce6b6b313568c1ac0b27",
    schema: "b53fd770d9a047edf0ce8b3ba491bedeca8b01cbf38171eadca1a2ffafeffa8f",
  }),
  [FREE_STUFF_PARENT_FILE]: Object.freeze({
    section: "54fed56748fd194d59251b15b20346158ce72d82bc99c77cf6d3cafddfe73008",
    schema: "98caf66922dc9da55071f50f0cc980970f7b9e7e0fa14b04ff4fab1031e76d50",
  }),
});
const SAMPLE_RESOURCE_CLASSIFICATIONS = Object.freeze([
  ["Brand Advisor", "product_testing_panel", "brand-advisor"],
  ["Review Club South Africa", "product_testing_panel", "review-club-south-africa"],
  ["ReviewClub international product tests", "editorial_guide", "reviewclub-international-product-tests"],
  ["Home Tester Club South Africa", "product_testing_panel", "home-tester-club-south-africa"],
  ["Try and Review South Africa", "product_testing_panel", "try-and-review-south-africa"],
  ["Coloplast South Africa Samples", "brand_sample_programme", "coloplast-south-africa-samples"],
  ["Kalley free flooring samples", "brand_sample_programme", "kalley-free-flooring-samples"],
]);
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
  if (allowFreeSamplesV2 && [FREE_STUFF_PARENT_FILE, "sitemap.xml"].includes(filePath)) {
    const normalizedActual = normalizeFreeSamplesV2SharedChanges(filePath, expectedHtml, actualHtml);
    if (normalizedActual === expectedHtml) {
      approvedDifferences.push({ file: filePath, reason: "exact reviewed Samples classification and lastmod changes" });
      return null;
    }
  }
  if (filePath === FREE_SAMPLES_FILE && allowFreeSamplesV2) {
    if (!expectedHtml.includes(FREE_SAMPLES_MARKER) && actualHtml.includes(FREE_SAMPLES_MARKER)) {
      approvedDifferences.push({ file: filePath, reason: "one-time Free Samples page v2 transition" });
      return null;
    }
  }

  if (OPPORTUNITY_SURFACE_FILES.has(filePath) && allowOpportunityPilot) {
    const normalizedActual = removeExactOpportunityPilot(actualHtml, filePath);
    if (normalizedActual === expectedHtml) {
      approvedDifferences.push({ file: filePath, reason: "exact flag-enabled Opportunity pilot fragments" });
      return null;
    }
    if (process.env.FREEHUB_PARITY_DEBUG === "true") {
      const index = firstDifferenceIndex(expectedHtml, normalizedActual);
      console.error(`[parity debug] ${filePath} first normalized difference at ${index}; expected=${expectedHtml.length}; actual=${normalizedActual.length}`);
      console.error(JSON.stringify(expectedHtml.slice(Math.max(0, index - 40), index + 80)));
      console.error(JSON.stringify(normalizedActual.slice(Math.max(0, index - 40), index + 80)));
    }
  }
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

function firstDifferenceIndex(left, right) {
  const limit = Math.min(left.length, right.length);
  for (let index = 0; index < limit; index += 1) {
    if (left[index] !== right[index]) return index;
  }
  return limit;
}

function normalizeFreeSamplesV2SharedChanges(filePath, expectedHtml, actualHtml) {
  if (filePath === "sitemap.xml") {
    return ["/free-stuff-south-africa/", "/free-samples-south-africa/"].reduce(
      (normalized, route) => replaceSitemapLastmod(normalized, expectedHtml, route),
      actualHtml
    );
  }

  let normalized = actualHtml.replace(/ data-page-type="free_stuff_parent" data-destination-path="[^"]+"/g, "");
  normalized = normalized.replace(/ data-page-type="free_stuff_parent"(?=>Free (?:Samples|Courses)|>Children&#39;s Books|>Credit Reports)/g, "");

  const expectedArticleDate = expectedHtml.match(/<script id="structured-data-article"[^>]*>[\s\S]*?"dateModified":"([^"]+)"[\s\S]*?<\/script>/)?.[1];
  if (expectedArticleDate) {
    normalized = normalized.replace(
      /(<script id="structured-data-article"[^>]*>[\s\S]*?"dateModified":")[^"]+("[\s\S]*?<\/script>)/,
      `$1${expectedArticleDate}$2`
    );
  }

  SAMPLE_RESOURCE_CLASSIFICATIONS.forEach(([name, contentType, id]) => {
    const expectedCard = findResourceCard(expectedHtml, name);
    const actualCard = findResourceCard(normalized, name);
    if (!expectedCard || !actualCard) return;
    const expectedReviewed = expectedCard.match(/Reviewed [^<]+/)?.[0];
    let adjusted = actualCard
      .replace(`data-content-type="${contentType}" data-content-id="${id}"`, `data-content-type="samples" data-content-id="${escapeAttributeText(name)}"`);
    if (expectedReviewed) {
      adjusted = adjusted.replace("Reviewed 14 Jul 2026", expectedReviewed);
    }
    if (name === "ReviewClub international product tests") {
      const expectedCheckFirst = expectedCard.match(/<dt>Check first<\/dt>\s*<dd>[\s\S]*?<\/dd>/)?.[0];
      if (expectedCheckFirst) {
        adjusted = adjusted.replace(/<dt>Check first<\/dt>\s*<dd>[\s\S]*?<\/dd>/, expectedCheckFirst);
      }
    }
    normalized = normalized.replace(actualCard, adjusted);
  });
  return normalized;
}

function replaceSitemapLastmod(actualXml, expectedXml, route) {
  const escapedRoute = route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(<loc>https://freehub\\.co\\.za${escapedRoute}<\\/loc>\\s*<lastmod>)[^<]+(<\\/lastmod>)`);
  const expectedValue = expectedXml.match(pattern)?.[0];
  const expectedDate = expectedValue?.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
  return expectedDate ? actualXml.replace(pattern, `$1${expectedDate}$2`) : actualXml;
}

function findResourceCard(html, name) {
  return (html.match(/<article class="free-resource-card">[\s\S]*?<\/article>/g) || []).find((card) =>
    card.includes(`<h3>${escapeAttributeText(name)}</h3>`)
  );
}

function escapeAttributeText(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function removeExactOpportunityPilot(html, filePath) {
  const id = "coloplast-speedicath-short-sample";
  const sectionMatches = html.match(/        <section class="opportunity-section"[\s\S]*?        <\/section>\r?\n\r?\n/g) || [];
  const schemaMatches = html.match(/    <script id="structured-data-opportunities"[^>]*>[\s\S]*?<\/script>\r?\n/g) || [];
  if (sectionMatches.length !== 1 || schemaMatches.length !== 1) {
    return html;
  }
  if (!sectionMatches[0].includes(`data-opportunity-id="${id}"`) || !schemaMatches[0].includes(id)) {
    return html;
  }
  if ((html.match(new RegExp(`data-opportunity-id="${id}"`, "g")) || []).length !== 1) {
    return html;
  }
  const expectedHashes = OPPORTUNITY_PILOT_FRAGMENT_HASHES[filePath];
  if (
    !expectedHashes ||
    hashContent(sectionMatches[0]) !== expectedHashes.section ||
    hashContent(schemaMatches[0]) !== expectedHashes.schema
  ) {
    return html;
  }
  const schemaNewline = schemaMatches[0].endsWith("\r\n") ? "\r\n" : "\n";
  const sectionNewline = sectionMatches[0].endsWith("\r\n\r\n") ? "\r\n" : "\n";
  return html
    .replace(schemaMatches[0], `    ${schemaNewline}`)
    .replace(sectionMatches[0], `        ${sectionNewline}${sectionNewline}`);
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
