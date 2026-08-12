const fs = require("fs");
const path = require("path");
const shared = require("../shared/page-data.js");
const { parseHtml, walkHtmlFiles } = require("./lib/baseline-utils.js");
const { getOfferBaselineCounts } = require("./lib/offer-baseline-counts.js");

const ROOT_DIR = path.resolve(__dirname, "..");
const errors = [];
const checks = [];
const FREE_STUFF_ROUTE = "/free-stuff-south-africa/";
const FREE_STUFF_NAV_INACTIVE = '          <a class="site-topbar__link" href="/free-stuff-south-africa/">Free Stuff</a>';
const FREE_STUFF_NAV_ACTIVE = '          <a class="site-topbar__link is-active" href="/free-stuff-south-africa/" aria-current="page">Free Stuff</a>';
const expectedOpportunityCount = process.env.FREEHUB_ENABLE_OPPORTUNITIES === "true" ? 21 : 0;
const expectedFeaturedOpportunityCount = process.env.FREEHUB_ENABLE_OPPORTUNITIES === "true" ? 2 : 0;
const offerBaseline = getOfferBaselineCounts({
  offers: JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "data", "offers.json"), "utf8")),
  enabled: process.env.FREEHUB_ENABLE_OFFERS === "true",
  asOfDate: process.env.FREEHUB_AS_OF_DATE || process.env.FREEHUB_BUILD_DATE || getLocalIsoDate(new Date()),
});
const expectedGeneratedFiles = 331 + expectedOpportunityCount * 2 + offerBaseline.generatedFileCount;
const expectedSitemapUrls = 104 + expectedOpportunityCount + offerBaseline.sitemapUrlCount;
const expectedActiveCompetitionCount = 49;

function getLocalIsoDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function check(label, actual, expected) {
  checks.push({ label, actual, expected });
  if (actual !== expected) errors.push({ label, actual, expected });
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT_DIR, relativePath), "utf8");
}

function count(html, pattern) {
  return [...html.matchAll(pattern)].length;
}

function countGeneratedRoutes(relativeDirectory) {
  const directory = path.join(ROOT_DIR, relativeDirectory);
  if (!fs.existsSync(directory)) return 0;
  return walkHtmlFiles(directory).filter((filePath) => path.basename(filePath) === "index.html").length;
}

const htmlFiles = walkHtmlFiles(ROOT_DIR);
const sitemap = read("sitemap.xml");
const parent = read("free-stuff-south-africa/index.html");
const homepage = read("index.html");
const competitions = read("competitions/index.html");
const parentPage = parseHtml(parent);
const homepagePage = parseHtml(homepage);
const competitionPage = parseHtml(competitions);
const competitionItemList = competitionPage.jsonLd.find((item) => item && item["@type"] === "ItemList");
const resourceItemList = parentPage.jsonLd.find(
  (item) => item?.["@type"] === "ItemList" && item.name === "Official programmes, services and directories"
);
const opportunitySchema = parentPage.jsonLd.find((item) => item?.name === "Current verified opportunities");
const activeCompetitions = shared.getPublishedActiveCompetitions(
  JSON.parse(read("data/competitions.json")).filter(Boolean)
);

check("Generated files", htmlFiles.length + 1, expectedGeneratedFiles);
check("Sitemap URLs", count(sitemap, /<loc>/g), expectedSitemapUrls);
check("Active competition cards", count(competitions, /<article class="competition-card\b/g), expectedActiveCompetitionCount);
check("Competition schema items", competitionItemList?.itemListElement?.length || 0, expectedActiveCompetitionCount);
check("Active competition records", activeCompetitions.length, expectedActiveCompetitionCount);
check("Opportunity records rendered", new Set([...parent.matchAll(/data-opportunity-id="([^"]+)"/g)].map((match) => match[1])).size, expectedFeaturedOpportunityCount);
check("Opportunity cards rendered", count(parent, /<article class="opportunity-card\b/g), expectedFeaturedOpportunityCount);
check("Opportunity schema items", opportunitySchema?.itemListElement?.length || 0, expectedFeaturedOpportunityCount);
check("Opportunity routes generated", countGeneratedRoutes("opportunity"), expectedOpportunityCount);
check("Opportunity exit routes generated", countGeneratedRoutes(path.join("out", "opportunity")), expectedOpportunityCount);
check("Opportunity sitemap entries", count(sitemap, /<loc>https:\/\/freehub\.co\.za\/opportunity\//g), expectedOpportunityCount);
check("Durable resources on parent", count(parent, /<article class="free-resource-card">/g), 24);
check("Durable resource schema items", resourceItemList?.itemListElement?.length || 0, 24);
check("Permanent Free Stuff child links", count(parent, /class="free-stuff-child-nav__link"/g), 4);
check("Parent H1 count", parentPage.h1.length, 1);
check("Parent H1", parentPage.h1[0], "Free Stuff South Africa");
check("Parent title", parentPage.title, "Free Stuff South Africa | Legit Freebies, Samples, Competitions");
check("Parent canonical", parentPage.canonical, "https://freehub.co.za/free-stuff-south-africa/");
check("Homepage title", homepagePage.title, "South African Competitions Worth Entering Today | Freehub");
check("Homepage H1", homepagePage.h1[0], "Find South African competitions worth entering today");
const orderedParentMarkers = [
  "Quick answer: free stuff South Africa",
  'class="free-stuff-child-nav"',
  "<h2>Official programmes, services and directories</h2>",
  'class="free-stuff-competition-callout"',
  "Where Freehub should focus",
  "Common Questions",
];
const markerPositions = orderedParentMarkers.map((marker) => parent.indexOf(marker));
check(
  "Parent section order",
  markerPositions.every((position, index) => position >= 0 && (index === 0 || position > markerPositions[index - 1])),
  true
);

htmlFiles.forEach((filePath) => {
  const relative = path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");
  if (relative === "freehub-account-benefits/index.html") return;
  const html = fs.readFileSync(filePath, "utf8");
  const expectedLine = relative === "free-stuff-south-africa/index.html" ? FREE_STUFF_NAV_ACTIVE : FREE_STUFF_NAV_INACTIVE;
  const occurrences = html.split(expectedLine).length - 1;
  if (occurrences !== 1) {
    errors.push({ label: `${relative} exact Free Stuff navigation anchor`, actual: occurrences, expected: 1 });
  }
  const competitionIndex = html.indexOf('href="/competitions/"');
  const freeStuffIndex = html.indexOf(expectedLine);
  const endingIndex = html.indexOf('href="/competitions-ending-soon/"');
  if (!(competitionIndex >= 0 && freeStuffIndex > competitionIndex && endingIndex > freeStuffIndex)) {
    errors.push({ label: `${relative} Free Stuff navigation position`, actual: "unexpected", expected: "after Competitions and before Ending soon" });
  }
});

console.log("=== Free Stuff Parent Merge Gates ===");
checks.forEach(({ label, actual }) => console.log(`${label}: ${actual}`));
console.log(`Approved HTML navigation insertions: ${htmlFiles.length}`);
console.log(`Parent upgrade: ${FREE_STUFF_ROUTE}index.html`);
console.log(`Errors: ${errors.length}`);
errors.forEach(({ label, actual, expected }) => console.error(`- ${label}: expected ${expected}; actual ${actual}`));
if (errors.length > 0) process.exitCode = 1;
