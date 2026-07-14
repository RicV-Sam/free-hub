const fs = require("fs");
const path = require("path");
const shared = require("../shared/page-data.js");
const opportunityData = require("../shared/opportunity-data.js");
const {
  SITE_ORIGIN,
  fileToRoute,
  normalizeRoute,
  parseHtml,
  routeToFile,
  walkHtmlFiles,
} = require("./lib/baseline-utils.js");

const ROOT_DIR = path.resolve(__dirname, "..");
const BASELINE_DIR = path.join(ROOT_DIR, "tests", "baselines");
const CONFIG = readJson(path.join(BASELINE_DIR, "seo-baseline.json"));
const MANIFEST = readJson(path.join(BASELINE_DIR, "generated-pages.json"));
const COMPETITIONS = readJson(path.join(ROOT_DIR, "data", "competitions.json")).filter(Boolean);
const OPPORTUNITIES = readJson(path.join(ROOT_DIR, "data", "opportunities.json")).filter(Boolean);
const OPPORTUNITY_EVIDENCE = readJson(path.join(ROOT_DIR, "data", "opportunity-source-evidence.json")).filter(Boolean);
const OPPORTUNITIES_ENABLED = opportunityData.isOpportunityFeatureEnabled(process.env.FREEHUB_ENABLE_OPPORTUNITIES);
const BUILD_DATE_ISO = process.env.FREEHUB_BUILD_DATE || getLocalIsoDate(new Date());
const OPPORTUNITY_GATE_OPTIONS = {
  asOfDate: BUILD_DATE_ISO,
  strictFreeOnly: false,
  allowedSourceHosts: CONFIG.opportunityAllowedSourceHosts,
  sourceEvidence: OPPORTUNITY_EVIDENCE,
  requireSourceEvidence: true,
};
const ACTIVE_OPPORTUNITIES = OPPORTUNITIES_ENABLED
  ? OPPORTUNITIES.filter((opportunity) => opportunityData.isPublicOpportunity(opportunity, OPPORTUNITY_GATE_OPTIONS))
  : [];
const TOMBSTONE_OPPORTUNITY_IDS = new Set(
  OPPORTUNITIES_ENABLED
    ? OPPORTUNITIES.filter((opportunity) =>
        opportunityData.isOpportunityTombstoneAllowed(opportunity, OPPORTUNITY_GATE_OPTIONS)
      ).map((opportunity) => opportunity.id)
    : []
);
const SITEMAP_PATH = path.join(ROOT_DIR, "sitemap.xml");
const errors = [];
const notices = [];
let checks = 0;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getLocalIsoDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatValue(value) {
  return typeof value === "string" ? value || "(empty)" : JSON.stringify(value);
}

function check(condition, { file, route, rule, expected, actual }) {
  checks += 1;
  if (!condition) {
    errors.push({ file, route, rule, expected, actual });
  }
}

function absoluteUrl(route) {
  return `${SITE_ORIGIN}${normalizeRoute(route)}`;
}

function parseSitemap(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].replace(/&amp;/g, "&").trim());
}

function isPrivateRoute(route) {
  return (
    route.startsWith("/out/") ||
    route.startsWith("/admin/") ||
    route === "/club/dashboard/" ||
    route === "/club/account/" ||
    route.startsWith("/club/referrals/")
  );
}

function getPage(filePath) {
  const html = fs.readFileSync(filePath, "utf8");
  return { html, ...parseHtml(html) };
}

check(CONFIG.siteOrigin === SITE_ORIGIN, {
  file: path.relative(ROOT_DIR, path.join(BASELINE_DIR, "seo-baseline.json")),
  route: "(configuration)",
  rule: "site origin is fixed",
  expected: SITE_ORIGIN,
  actual: CONFIG.siteOrigin,
});

check(fs.existsSync(SITEMAP_PATH), {
  file: "sitemap.xml",
  route: "/sitemap.xml",
  rule: "generated sitemap exists",
  expected: "file present",
  actual: "missing",
});

const sitemapUrls = fs.existsSync(SITEMAP_PATH) ? parseSitemap(fs.readFileSync(SITEMAP_PATH, "utf8")) : [];
const sitemapRoutes = sitemapUrls.map((url) => normalizeRoute(url));
const sitemapSet = new Set(sitemapRoutes);

const expectedSitemapUrlCount = CONFIG.sitemapUrlCount + ACTIVE_OPPORTUNITIES.length;
check(sitemapUrls.length === expectedSitemapUrlCount, {
  file: "sitemap.xml",
  route: "/sitemap.xml",
  rule: "sitemap URL count matches reviewed baseline",
  expected: expectedSitemapUrlCount,
  actual: sitemapUrls.length,
});

const sitemapPages = new Map();
const titleRoutes = new Map();
const descriptionRoutes = new Map();

sitemapUrls.forEach((url, index) => {
  const route = sitemapRoutes[index];
  const filePath = routeToFile(ROOT_DIR, route);
  const relativeFile = path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    parsedUrl = null;
  }

  check(parsedUrl?.origin === SITE_ORIGIN && !parsedUrl.search && !parsedUrl.hash, {
    file: "sitemap.xml",
    route,
    rule: "sitemap URL uses the canonical Freehub origin without parameters",
    expected: absoluteUrl(route),
    actual: url,
  });
  check(fs.existsSync(filePath), {
    file: relativeFile,
    route,
    rule: "sitemap route has a generated file",
    expected: "file present",
    actual: "missing",
  });
  if (!fs.existsSync(filePath)) {
    return;
  }

  const page = getPage(filePath);
  sitemapPages.set(route, page);
  check(page.h1.length === 1, {
    file: relativeFile,
    route,
    rule: "page has exactly one H1",
    expected: 1,
    actual: page.h1.length,
  });
  check(Boolean(page.title), {
    file: relativeFile,
    route,
    rule: "title is non-empty",
    expected: "non-empty title",
    actual: page.title,
  });
  check(Boolean(page.description), {
    file: relativeFile,
    route,
    rule: "meta description is non-empty",
    expected: "non-empty description",
    actual: page.description,
  });
  check(page.canonical === url, {
    file: relativeFile,
    route,
    rule: "canonical matches sitemap URL",
    expected: url,
    actual: page.canonical,
  });
  check(!page.robots.split(/\s*,\s*/).includes("noindex"), {
    file: relativeFile,
    route,
    rule: "sitemap page is indexable",
    expected: "robots without noindex",
    actual: page.robots,
  });
  check(!isPrivateRoute(route), {
    file: "sitemap.xml",
    route,
    rule: "private and redirect routes stay out of sitemap",
    expected: "public route",
    actual: route,
  });
  check(page.jsonLdErrors.length === 0, {
    file: relativeFile,
    route,
    rule: "JSON-LD parses as valid JSON",
    expected: [],
    actual: page.jsonLdErrors,
  });

  page.breadcrumbUrls.forEach((breadcrumbUrl) => {
    let breadcrumbRoute = "";
    let valid = false;
    try {
      const parsed = new URL(breadcrumbUrl);
      breadcrumbRoute = normalizeRoute(parsed.pathname);
      const breadcrumbFile = routeToFile(ROOT_DIR, breadcrumbRoute);
      const targetCanonical = fs.existsSync(breadcrumbFile) ? getPage(breadcrumbFile).canonical : "";
      valid =
        parsed.origin === SITE_ORIGIN &&
        !parsed.search &&
        !parsed.hash &&
        breadcrumbUrl === absoluteUrl(breadcrumbRoute) &&
        targetCanonical === breadcrumbUrl;
    } catch (error) {
      valid = false;
    }
    check(valid, {
      file: relativeFile,
      route,
      rule: "breadcrumb item uses a canonical Freehub URL",
      expected: breadcrumbRoute ? absoluteUrl(breadcrumbRoute) : `${SITE_ORIGIN}/…/`,
      actual: breadcrumbUrl,
    });
  });

  if (page.title) {
    titleRoutes.set(page.title, [...(titleRoutes.get(page.title) || []), route]);
  }
  if (page.description) {
    descriptionRoutes.set(page.description, [...(descriptionRoutes.get(page.description) || []), route]);
  }
});

for (const [title, routes] of titleRoutes) {
  check(routes.length === 1, {
    file: "sitemap.xml",
    route: routes.join(", "),
    rule: "sitemap titles are unique",
    expected: "one route per title",
    actual: `${routes.length} routes use ${title}`,
  });
}
for (const [description, routes] of descriptionRoutes) {
  check(routes.length === 1, {
    file: "sitemap.xml",
    route: routes.join(", "),
    rule: "sitemap descriptions are unique",
    expected: "one route per description",
    actual: `${routes.length} routes use ${description}`,
  });
}

const activePublicSlugs = new Set(shared.getPublishedActiveCompetitions(COMPETITIONS).map(shared.getCompetitionSlug));
sitemapRoutes.filter((route) => route.startsWith("/competition/")).forEach((route) => {
  const slug = route.split("/").filter(Boolean)[1];
  check(activePublicSlugs.has(slug), {
    file: "sitemap.xml",
    route,
    rule: "competition sitemap entry is active, published, public, and indexable",
    expected: "active public competition",
    actual: slug,
  });
});

COMPETITIONS.filter((competition) => !activePublicSlugs.has(shared.getCompetitionSlug(competition))).forEach((competition) => {
  const route = `/competition/${shared.getCompetitionSlug(competition)}/`;
  check(!sitemapSet.has(route), {
    file: "sitemap.xml",
    route,
    rule: "expired, noindex, held, rejected, and doNotPublish records stay out of sitemap",
    expected: "route excluded",
    actual: "route included",
  });
});

const activeOpportunityRoutes = new Set(ACTIVE_OPPORTUNITIES.map(opportunityData.getOpportunityDetailPath));
sitemapRoutes.filter((route) => route.startsWith("/opportunity/")).forEach((route) => {
  check(activeOpportunityRoutes.has(route), {
    file: "sitemap.xml",
    route,
    rule: "Opportunity sitemap entry is active, verified, evidence-backed, and indexable",
    expected: "active public Opportunity",
    actual: route,
  });
});
activeOpportunityRoutes.forEach((route) => {
  check(sitemapSet.has(route), {
    file: "sitemap.xml",
    route,
    rule: "active public Opportunity has one sitemap entry",
    expected: "route included",
    actual: sitemapSet.has(route) ? "route included" : "route excluded",
  });
});

Object.entries(CONFIG.canonicalAliases).forEach(([alias, canonicalRoute]) => {
  const aliasFile = routeToFile(ROOT_DIR, alias);
  check(!sitemapSet.has(alias), {
    file: "sitemap.xml",
    route: alias,
    rule: "canonical alias stays out of sitemap",
    expected: "route excluded",
    actual: sitemapSet.has(alias) ? "route included" : "route excluded",
  });
  if (fs.existsSync(aliasFile)) {
    const page = getPage(aliasFile);
    check(page.canonical === absoluteUrl(canonicalRoute), {
      file: path.relative(ROOT_DIR, aliasFile).replace(/\\/g, "/"),
      route: alias,
      rule: "canonical alias targets its established pillar",
      expected: absoluteUrl(canonicalRoute),
      actual: page.canonical,
    });
  } else {
    notices.push(`Canonical alias currently has no generated file: ${alias}`);
  }
});

CONFIG.forbiddenAliases.forEach((route) => {
  const filePath = routeToFile(ROOT_DIR, route);
  check(!fs.existsSync(filePath) && !sitemapSet.has(route), {
    file: path.relative(ROOT_DIR, filePath).replace(/\\/g, "/"),
    route,
    rule: "invented short alias is not generated or indexed",
    expected: "file and sitemap entry absent",
    actual: `${fs.existsSync(filePath) ? "file present" : "file absent"}; ${sitemapSet.has(route) ? "in sitemap" : "not in sitemap"}`,
  });
});

const incoming = new Map(sitemapRoutes.map((route) => [route, new Set()]));
const allPages = new Map();
walkHtmlFiles(ROOT_DIR).forEach((filePath) => {
  const route = fileToRoute(ROOT_DIR, filePath);
  const page = getPage(filePath);
  allPages.set(route, page);
  page.anchors.forEach((href) => {
    if (!href || href.startsWith("#") || /^(?:mailto:|tel:|javascript:)/i.test(href)) {
      return;
    }
    let parsed;
    try {
      parsed = new URL(href, `${SITE_ORIGIN}${route}`);
    } catch (error) {
      return;
    }
    if (parsed.origin !== SITE_ORIGIN) {
      return;
    }
    const target = normalizeRoute(parsed.pathname);
    if (target !== route && incoming.has(target)) {
      incoming.get(target).add(route);
    }
  });
});

const reviewedOrphans = new Set(CONFIG.reviewedOrphanExceptions);
for (const [route, sources] of incoming) {
  if (sources.size > 0) {
    if (reviewedOrphans.has(route)) {
      notices.push(`Resolved reviewed orphan: ${route}`);
    }
    continue;
  }
  check(reviewedOrphans.has(route), {
    file: path.relative(ROOT_DIR, routeToFile(ROOT_DIR, route)).replace(/\\/g, "/"),
    route,
    rule: "sitemap route has an incoming cross-page anchor",
    expected: "at least one source route or reviewed baseline exception",
    actual: "no incoming cross-page anchors",
  });
}

MANIFEST.pages.forEach((expectedPage) => {
  const filePath = path.join(ROOT_DIR, expectedPage.file);
  const route = expectedPage.route;
  const tombstoneExpected =
    expectedPage.route.startsWith("/opportunity/") &&
    expectedPage.opportunityId &&
    TOMBSTONE_OPPORTUNITY_IDS.has(expectedPage.opportunityId);
  if (tombstoneExpected) {
    check(fs.existsSync(filePath), {
      file: expectedPage.file,
      route,
      rule: "reviewed Opportunity tombstone exists",
      expected: "file present",
      actual: fs.existsSync(filePath) ? "file present" : "missing",
    });
    if (fs.existsSync(filePath)) {
      const page = getPage(filePath);
      check(page.canonical === expectedPage.canonical, {
        file: expectedPage.file,
        route,
        rule: "Opportunity tombstone retains its canonical",
        expected: expectedPage.canonical,
        actual: page.canonical,
      });
      check(page.robots === "noindex, follow", {
        file: expectedPage.file,
        route,
        rule: "Opportunity tombstone is noindex, follow",
        expected: "noindex, follow",
        actual: page.robots,
      });
      check(!page.schemaTypes.includes("Thing") && !sitemapSet.has(route), {
        file: expectedPage.file,
        route,
        rule: "Opportunity tombstone has no active Thing schema or sitemap entry",
        expected: "no Thing; route excluded",
        actual: `${page.schemaTypes.includes("Thing") ? "Thing present" : "no Thing"}; ${sitemapSet.has(route) ? "route included" : "route excluded"}`,
      });
    }
    return;
  }
  const conditionMet =
    expectedPage.requiresOpportunityFlag !== true ||
    (OPPORTUNITIES_ENABLED &&
      (!expectedPage.opportunityId || ACTIVE_OPPORTUNITIES.some((opportunity) => opportunity.id === expectedPage.opportunityId)));
  if (!conditionMet) {
    check(!fs.existsSync(filePath), {
      file: expectedPage.file,
      route,
      rule: "flag-controlled representative route is absent",
      expected: "file absent",
      actual: fs.existsSync(filePath) ? "file present" : "file absent",
    });
    check(!sitemapSet.has(route), {
      file: "sitemap.xml",
      route,
      rule: "disabled representative route stays out of sitemap",
      expected: "route excluded",
      actual: sitemapSet.has(route) ? "route included" : "route excluded",
    });
    return;
  }
  check(fs.existsSync(filePath), {
    file: expectedPage.file,
    route,
    rule: "representative output file exists",
    expected: "file present",
    actual: fs.existsSync(filePath) ? "file present" : "missing",
  });
  if (!fs.existsSync(filePath)) {
    return;
  }
  const page = getPage(filePath);
  check(page.jsonLdErrors.length === 0, {
    file: expectedPage.file,
    route,
    rule: "representative JSON-LD parses as valid JSON",
    expected: [],
    actual: page.jsonLdErrors,
  });
  ["title", "description", "canonical", "robots"].forEach((field) => {
    check(page[field] === expectedPage[field], {
      file: expectedPage.file,
      route,
      rule: `representative ${field} matches baseline`,
      expected: expectedPage[field],
      actual: page[field],
    });
  });
  check(page.h1.length === 1 && page.h1[0] === expectedPage.h1, {
    file: expectedPage.file,
    route,
    rule: "representative H1 matches baseline",
    expected: expectedPage.h1,
    actual: page.h1,
  });
  check(expectedPage.schemaTypes.every((type) => page.schemaTypes.includes(type)), {
    file: expectedPage.file,
    route,
    rule: "representative schema types include baseline types",
    expected: expectedPage.schemaTypes,
    actual: page.schemaTypes,
  });
  check(sitemapSet.has(route) === expectedPage.inSitemap, {
    file: "sitemap.xml",
    route,
    rule: "representative sitemap inclusion matches baseline",
    expected: expectedPage.inSitemap,
    actual: sitemapSet.has(route),
  });
});

console.log("=== SEO Baseline Validation ===");
console.log(`Sitemap URLs: ${sitemapUrls.length}`);
console.log(`Checks: ${checks}`);
console.log(`Reviewed orphan exceptions: ${CONFIG.reviewedOrphanExceptions.length}`);
notices.forEach((notice) => console.log(`NOTICE: ${notice}`));

if (errors.length === 0) {
  console.log("Hard failures: 0");
  console.log("SEO baseline passed.");
} else {
  console.log(`Hard failures: ${errors.length}`);
  errors.forEach((error) => {
    console.log(`\n[FAIL] ${error.rule}`);
    console.log(`  Route: ${error.route}`);
    console.log(`  File: ${error.file}`);
    console.log(`  Expected: ${formatValue(error.expected)}`);
    console.log(`  Actual: ${formatValue(error.actual)}`);
  });
  process.exitCode = 1;
}
