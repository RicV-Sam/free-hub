const fs = require("fs");
const path = require("path");
const { parseHtml, walkHtmlFiles } = require("./lib/baseline-utils.js");

const ROOT_DIR = path.resolve(__dirname, "..");
const expectedOpportunityCount = process.env.FREEHUB_ENABLE_OPPORTUNITIES === "true" ? 1 : 0;
const expectedGeneratedFiles = 342 + expectedOpportunityCount * 2;
const expectedSitemapUrls = 140 + expectedOpportunityCount;
const expectedActiveCompetitionCount = 81;
const expectedId = "coloplast-speedicath-short-sample";
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
const parentOpportunitySchema = parentPage.jsonLd.find((item) => item?.name === "Current verified opportunities");
const faqSchema = samplePage.jsonLd.find((item) => item?.["@type"] === "FAQPage");
const competitionSchema = competitionPage.jsonLd.find((item) => item?.["@type"] === "ItemList");
const htmlFiles = walkHtmlFiles(ROOT_DIR);

check("Generated files", htmlFiles.length + 1, expectedGeneratedFiles);
check("Sitemap URLs", count(sitemap, /<loc>/g), expectedSitemapUrls);
check("Active competition cards", count(competitions, /<article class="competition-card\b/g), expectedActiveCompetitionCount);
check("Competition schema items", competitionSchema?.itemListElement?.length || 0, expectedActiveCompetitionCount);
check("Samples page marker", samples.includes('data-free-samples-page-version="2"'), true);
check("Samples title", samplePage.title, "Where to Get Free Samples in South Africa | Official Offers Guide");
check("Samples H1 count", samplePage.h1.length, 1);
check("Samples H1", samplePage.h1[0], "Where to Get Free Samples in South Africa");
check("Samples canonical", samplePage.canonical, "https://freehub.co.za/free-samples-south-africa/");
check("Durable sample resources", count(samples, /<article class="free-resource-card">/g), 7);
check("Durable sample schema items", sampleResourceSchema?.itemListElement?.length || 0, 7);
check("Product-testing panels", count(samples, /data-content-type="product_testing_panel"/g), 4);
check("Brand sample programmes", count(samples, /data-content-type="brand_sample_programme"/g), 2);
check("Editorial explainers", count(samples, /data-content-type="editorial_guide"/g), 1);
check("Visible FAQs", count(samples, /<details>/g), 6);
check("FAQ schema items", faqSchema?.mainEntity?.length || 0, 6);
check("Samples Opportunity cards", count(samples, /<article class="opportunity-card\b/g), expectedOpportunityCount);
check("Parent Opportunity cards", count(parent, /<article class="opportunity-card\b/g), expectedOpportunityCount);
check("Samples Opportunity schema items", sampleOpportunitySchema?.itemListElement?.length || 0, expectedOpportunityCount);
check("Parent Opportunity schema items", parentOpportunitySchema?.itemListElement?.length || 0, expectedOpportunityCount);
check("Opportunity detail routes", countGeneratedRoutes("opportunity"), expectedOpportunityCount);
check("Opportunity exit routes", countGeneratedRoutes(path.join("out", "opportunity")), expectedOpportunityCount);
check("Opportunity sitemap entries", count(sitemap, /<loc>https:\/\/freehub\.co\.za\/opportunity\//g), expectedOpportunityCount);

const renderedIds = [
  ...samples.matchAll(/data-opportunity-id="([^"]+)"/g),
  ...parent.matchAll(/data-opportunity-id="([^"]+)"/g),
].map((match) => match[1]);
check("Opportunity surface render count", renderedIds.length, expectedOpportunityCount * 2);
if (expectedOpportunityCount === 1) {
  check("Opportunity stable ID only", renderedIds.every((id) => id === expectedId), true);
  check("Full card variant", samples.includes('data-card-variant="full"'), true);
  check("Compact card variant", parent.includes('data-card-variant="compact"'), true);
  check("Cards link to one detail route", [samples, parent].every((html) => html.includes('href="/opportunity/coloplast-speedicath-short-sample/"')), true);
  check("Privacy boundary on both surfaces", [samples, parent].every((html) => html.includes("Freehub does not receive or assess your application")), true);
  check("Official consent link on both surfaces", [samples, parent].every((html) => html.includes("https://www.coloplast.co.za/global/declaration-of-consent/")), true);
}

const orderedMarkers = [
  "Direct samples, testing panels and directories are different",
  ...(expectedOpportunityCount ? ["<h2>Current verified samples</h2>"] : []),
  "<h2>Product-testing panels</h2>",
  "<h2>Official brand sample programmes</h2>",
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
