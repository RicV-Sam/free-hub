const fs = require("fs");
const path = require("path");
const { parseHtml, walkHtmlFiles } = require("./lib/baseline-utils.js");
const { getOfferBaselineCounts } = require("./lib/offer-baseline-counts.js");

const { getCurrentContentBaseline } = require("./lib/current-content-baseline.js");
const current = getCurrentContentBaseline();

const ROOT_DIR = path.resolve(__dirname, "..");
const opportunitiesEnabled = process.env.FREEHUB_ENABLE_OPPORTUNITIES === "true";
const expectedOpportunityCount = current.publicOpportunities.length;
const expectedSampleOpportunityCount = current.samples.length;
const expectedTestingOpportunityCount = current.testing.length;
const expectedParentOpportunityCount = current.featured.length;
const offerBaseline = getOfferBaselineCounts({
  offers: JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "data", "offers.json"), "utf8")),
  enabled: process.env.FREEHUB_ENABLE_OFFERS === "true",
  asOfDate: process.env.FREEHUB_AS_OF_DATE || process.env.FREEHUB_BUILD_DATE || getLocalIsoDate(new Date()),
});
const expectedGeneratedFiles = current.generatedFileCount + offerBaseline.generatedFileCount;
const expectedSitemapUrls = current.sitemapUrlCount + offerBaseline.sitemapUrlCount;
const expectedCoreCompetitionCount = current.core.length;

function getLocalIsoDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
const expectedIds = [...current.samples, ...current.testing].map(row => row.id).sort();
const expectedSampleIds = current.samples.map(row => row.id).sort();
const errors = [];
const checks = [];

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT_DIR, relativePath), "utf8");
}

function count(value, pattern) {
  return [...value.matchAll(pattern)].length;
}

function check(label, actual, expected) {
  checks.push({ label, actual });
  if (actual !== expected) errors.push({ label, actual, expected });
}

function countGeneratedRoutes(relativeDirectory) {
  const directory = path.join(ROOT_DIR, relativeDirectory);
  if (!fs.existsSync(directory)) return 0;
  return walkHtmlFiles(directory).filter((filePath) => path.basename(filePath) === "index.html").length;
}

const samples = read("free-samples-south-africa/index.html");
const parent = read("free-stuff-south-africa/index.html");
const competitions = read("competitions/index.html");
const sitemap = read("sitemap.xml");
const samplePage = parseHtml(samples);
const parentPage = parseHtml(parent);
const competitionPage = parseHtml(competitions);
const sampleResourceSchema = samplePage.jsonLd.find((item) => item?.name === "Sample and product-testing routes");
const sampleOpportunitySchema = samplePage.jsonLd.find((item) => item?.name === "Current verified samples");
const testingOpportunitySchema = samplePage.jsonLd.find((item) => item?.name === "Current verified product-testing applications");
const parentOpportunitySchema = parentPage.jsonLd.find((item) => item?.name === "Current verified opportunities");
const faqSchema = samplePage.jsonLd.find((item) => item?.["@type"] === "FAQPage");
const competitionSchema = competitionPage.jsonLd.find((item) => item?.["@type"] === "ItemList");
const htmlFiles = walkHtmlFiles(ROOT_DIR);

check("Generated files", htmlFiles.length + 1, expectedGeneratedFiles);
check("Sitemap URLs", count(sitemap, /<loc>/g), expectedSitemapUrls);
check("Core competition cards", count(competitions, /<article class="competition-card\b/g), expectedCoreCompetitionCount);
check("Core competition schema items", competitionSchema?.itemListElement?.length || 0, expectedCoreCompetitionCount);
check("Samples page marker", samples.includes('data-free-samples-page-version="4"'), true);
check("Samples title", samplePage.title, "Where to Get Free Samples in South Africa | Official Sites");
check("Samples H1 count", samplePage.h1.length, 1);
check("Samples H1", samplePage.h1[0], "Where to Get Free Samples in South Africa");
check("Samples intent-led hero", samples.includes("This guide shows where to get free samples in South Africa"), true);
check("Samples canonical", samplePage.canonical, "https://freehub.co.za/free-samples-south-africa/");
check("Durable sample resources", count(samples, /<article class="free-resource-card">/g), 6);
check("Durable sample schema items", sampleResourceSchema?.itemListElement?.length || 0, 6);
check("Product-testing panels", count(samples, /data-content-type="product_testing_panel"/g), 3);
check("Unverified Review Club resource excluded", samples.includes("https://reviewclub.co.za/how-it-works/"), false);
check("Brand sample programmes", count(samples, /data-content-type="brand_sample_programme"/g), 2);
check("Editorial explainers", count(samples, /data-content-type="editorial_guide"/g), 1);
check("Sample route finder", samples.includes('id="sample-options"'), true);
check("Brand programmes prioritised", samples.indexOf('id="brand-sample-programmes"') < samples.indexOf('id="product-testing-panels"'), true);
check("Visible FAQs", count(samples, /<details>/g), 6);
check("FAQ schema items", faqSchema?.mainEntity?.length || 0, 6);
check("Samples Opportunity cards", count(samples, /<article class="opportunity-card\b/g), expectedSampleOpportunityCount + expectedTestingOpportunityCount);
check("Parent Opportunity cards", count(parent, /<article class="opportunity-card\b/g), expectedParentOpportunityCount);
check("Samples Opportunity schema items", sampleOpportunitySchema?.itemListElement?.length || 0, expectedSampleOpportunityCount);
check("Product-testing Opportunity schema items", testingOpportunitySchema?.itemListElement?.length || 0, expectedTestingOpportunityCount);
check("Parent Opportunity schema items", parentOpportunitySchema?.itemListElement?.length || 0, expectedParentOpportunityCount);
check("Opportunity detail routes", countGeneratedRoutes("opportunity"), current.detailOpportunities.length);
check("Opportunity exit routes", countGeneratedRoutes(path.join("out", "opportunity")), expectedOpportunityCount);
check("Opportunity sitemap entries", count(sitemap, /<loc>https:\/\/freehub\.co\.za\/opportunity\//g), expectedOpportunityCount);

const renderedIds = [
  ...samples.matchAll(/data-opportunity-id="([^"]+)"/g),
  ...parent.matchAll(/data-opportunity-id="([^"]+)"/g),
].map((match) => match[1]);
check("Opportunity surface render count", renderedIds.length, expectedSampleOpportunityCount + expectedTestingOpportunityCount + expectedParentOpportunityCount);
if (opportunitiesEnabled && expectedIds.length > 0) {
  const uniqueRenderedIds = [...new Set([...samples.matchAll(/data-opportunity-id="([^"]+)"/g)].map(match => match[1]))].sort();
  check("Opportunity stable IDs", JSON.stringify(uniqueRenderedIds), JSON.stringify(expectedIds));
  check("Full card variant", samples.includes('data-card-variant="full"'), true);
  check("Compact card variant", parent.includes('data-card-variant="compact"'), true);
  check(
    "Direct sample detail routes",
    expectedSampleIds.every((id) => samples.includes(`href="/opportunity/${id}/"`)),
    true
  );
  check(
    "Product-testing detail routes",
    expectedIds
      .filter((id) => id.startsWith("brand-advisor-"))
      .every((id) => samples.includes(`href="/opportunity/${id}/"`)),
    true
  );
  check("Privacy boundary on both surfaces", [samples, parent].every((html) => html.includes("Freehub does not receive or assess your application")), true);
  check("Official consent link on both surfaces", [samples, parent].every((html) => html.includes("https://www.coloplast.co.za/global/declaration-of-consent/")), true);
  if (expectedTestingOpportunityCount > 0) {
    check("Creator selection boundary", samples.includes("Applying does not guarantee selection or a product"), true);
  }
  if (current.samples.some(record => record.details.selectionStatus === "selected_participants")) {
    check("Sample selection boundary", samples.includes("Application only; fulfilment is not guaranteed"), true);
  }
}

const orderedMarkers = [
  "Direct samples, testing panels and directories are different",
  ...(expectedSampleOpportunityCount ? ["<h2>Current verified samples</h2>"] : []),
  ...(expectedTestingOpportunityCount ? ["<h2>Current product-testing applications</h2>"] : []),
  "<h2>Official brand sample programmes</h2>",
  "<h2>Product-testing panels</h2>",
  "<h2>International sample explainer</h2>",
  "<h2>Safety and sensitive information</h2>",
  "<h2>Looking for free-entry prize draws?</h2>",
  "Common Questions",
];
const positions = orderedMarkers.map((marker) => samples.indexOf(marker));
check("Samples section order", positions.every((position, index) => position >= 0 && (index === 0 || position > positions[index - 1])), true);

console.log("=== Free Samples Pilot Merge Gates ===");
checks.forEach(({ label, actual }) => console.log(`${label}: ${actual}`));
console.log(`Errors: ${errors.length}`);
errors.forEach(({ label, actual, expected }) => console.error(`- ${label}: expected ${expected}; actual ${actual}`));
if (errors.length > 0) process.exitCode = 1;
