const fs = require("fs");
const path = require("path");
const shared = require("../shared/page-data.js");
const {
  compareWarningBaseline,
  loadWarningBaseline,
  normalizeCompetitionWarning,
  printWarningComparison,
} = require("./lib/warning-baseline.js");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT_DIR, "data", "competitions.json");
const SITEMAP_PATH = path.join(ROOT_DIR, "sitemap.xml");

const args = new Set(process.argv.slice(2));
const publishedOnly = args.has("--published-only");
const jsonOnly = args.has("--json");
const timeoutArg = process.argv.find((arg) => arg.startsWith("--timeout="));
const concurrencyArg = process.argv.find((arg) => arg.startsWith("--concurrency="));
const baselineArg = process.argv.find((arg) => arg.startsWith("--baseline="));
const timeoutMs = timeoutArg ? Number(timeoutArg.split("=")[1]) : 25000;
const concurrency = concurrencyArg ? Number(concurrencyArg.split("=")[1]) : 8;
const baselinePath = baselineArg ? baselineArg.slice("--baseline=".length) : "";
const manualRecheckDays = 30;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 FreeHubValidator/1.0";
const APPROVED_MANUAL_OK_URLS = new Map([
  [
    "kitkat-f1-monza-competition-2026",
    "https://www.nestle-esar.com/2026-kitkat%C2%AE-south-africa-breaks-full-throttle-promotion-terms-conditions-conditions-entry",
  ],
  [
    "mobile-world-live-satellite-ntn-survey-ipad-draw-2026",
    "https://gsma.co1.qualtrics.com/jfe/form/SV_aafYIcTV5FSxuC2",
  ],
  [
    "clere-share-of-r1-million-cash-2026",
    "https://clere.co.za/competitions/",
  ],
  [
    "clere-for-men-play-it-smooth-2026",
    "https://clere.co.za/play-it-smooth-competition/",
  ],
  [
    "capitec-moneyup-academy-competition-2026",
    "https://www.capitecbank.co.za/globalassets/pages/competition-and-conditions/competitions/2026/moneyup-academy-competition-rules-2026.pdf",
  ],
  [
    "capitec-tactical-flexi-voucher-2026",
    "https://www.capitecbank.co.za/competitions-and-conditions/",
  ],
  [
    "clicks-clubcard-scan-win",
    "https://clicks.co.za/competitions/view/clubcard-scan-win-2026",
  ],
  [
    "clicks-sorbet-voucher-2026",
    "https://clicks.co.za/clubcard/competitions/clubcard-magazine-april-may-issue-of-2026-sorbet-voucher-competition",
  ],
  [
    "clicks-babyclub-competition",
    "https://clicks.co.za/clubcard/competitions/win-with-babyclub-competition",
  ],
  [
    "clicks-dark-and-lovely-best-for-braids-2026",
    "https://clicks.co.za/clubcard/competitions/dark-and-lovely-best-for-braids-competition1",
  ],
  [
    "clicks-clubcard-have-your-say-june-july-2026",
    "https://clicks.co.za/clubcard/competitions/clubcard-mag-june-july-2026-have-your-say-competition",
  ],
  [
    "clicks-clubcard-fragrance-giveaway-june-july-2026",
    "https://www.clicks.co.za/clubcard/competitions/clubcard-magazine-june-july-issue-of-2026-fragrance-giveaway-competition",
  ],
  [
    "clicks-clubcard-portia-m-hamper-june-july-2026",
    "https://clicks.co.za/clubcard/competitions/clubcard-mag-june-july-2026-portia-m-hamper-competition",
  ],
  [
    "clicks-clubcard-mens-wellness-hamper-june-july-2026",
    "https://clicks.co.za/clubcard/competitions/clubcard-magazine-june-july-issue-of-2026-mens-wellness-hamper-competition",
  ],
  [
    "clicks-clubcard-newness-hamper-june-july-2026",
    "https://clicks.co.za/clubcard/competitions/clubcard-magazine-june-july-issue-of-2026-fragrance-giveaway-competition1",
  ],
  [
    "clicks-cashback-haul-competition",
    "https://clicks.co.za/clubcard/competitions/cashback-haul-competition",
  ],
  [
    "revlon-matric-dance-vouchers",
    "https://clicks.co.za/clubcard/competitions/revlon-fragrance-take-scentre-stage-matric-dance-2026-competition",
  ],
  [
    "clicks-protex-protect-their-future-2026",
    "https://clicks.co.za/clubcard/competitions/protex-protect-their-future-competition",
  ],
  [
    "clicks-nivea-men-broscape-cash-card-2026",
    "https://clicks.co.za/clubcard/competitions/nivea-men-broscape-clicks-clubcard-competition",
  ],
  [
    "dis-chem-protex-fund-the-future-2026",
    "https://www.dischem.co.za/protex-fund-the-future-june-2026-competition",
  ],
  [
    "dis-chem-garnier-pure-active-june-2026-competition",
    "https://www.dischem.co.za/garnier-pure-active-june-2026-competition",
  ],
  [
    "dis-chem-power-gro-trust-the-process-2026",
    "https://www.dischem.co.za/power-gro-trust-the-process-july-2026-competition",
  ],
  [
    "dis-chem-fishermans-friend-luxury-retreat-2026",
    "https://www.dischem.co.za/fisherman-s-friend-win-a-luxury-retreat-or-an-adventure-day-july-2026-competition",
  ],
  [
    "dis-chem-catrice-skin-like-moisturizer-2026",
    "https://www.dischem.co.za/dis-chem-better-magazine-winter-issue-catrice-hd-foundation-skin-like-moisturizer-july-2026-competition",
  ],
  [
    "nestle-milo-meet-the-champ-2026",
    "https://www.nestle-esar.com/nestle-milo-meet-champ-campaign-2026",
  ],
  [
    "bridgestone-toyota-corolla-cross-2026",
    "https://www1.bridgestone.co.za/win-a-car",
  ],
  [
    "dragon-energy-xtreme-comp-2026",
    "https://www.dragon.co.za/xtreme-comp-2026/",
  ],
  [
    "parmalat-everything-needs-cheese-2026",
    "https://lactalis.co.za/pieces/cms/69d77101348ee.pdf",
  ],
  [
    "spur-family-cruises-with-spur-2026",
    "https://www.spursteakranches.com/za/promotions",
  ],
  [
    "spur-ultimate-springboks-match-day-experience-2026",
    "https://www.spursteakranches.com/za/promotions/win-the-ultimate-springboks-match-day-experience",
  ],
  [
    "mcdonalds-nazo-meals-airtime-data-rewards-2026",
    "https://www.mcdonalds.co.za/airtime-data-rewards-ts-cs",
  ],
  [
    "sanlam-reality-lekkeslaap-voucher-2026",
    "https://www.sanlamreality.co.za/terms-condition/competitions/",
  ],
]);

function loadCompetitions() {
  return JSON.parse(fs.readFileSync(DATA_PATH, "utf8")).filter(Boolean);
}

function getLinkValidationScope(competitions) {
  const withUrls = competitions.filter((competition) => competition && competition.url);

  if (publishedOnly) {
    return withUrls.filter(shared.isPublishedCompetition);
  }

  return withUrls;
}

function getLifecycle(competition) {
  if (shared.isActiveCompetition(competition)) {
    return "active";
  }

  if (
    shared.isExpiredArchiveEligibleCompetition(competition) ||
    shared.isArchivedLowValueCompetition(competition)
  ) {
    return "expired-archive";
  }

  if (!shared.isPublishedCompetition(competition) || competition.publicationStatus === "held" || competition.doNotPublish === true) {
    return "held-private";
  }

  if (shared.isExpiredCompetition(competition)) {
    return "expired-unarchived";
  }

  return "unknown";
}

function classifyResult(status, finalUrl, bodyText) {
  const content = (bodyText || "").slice(0, 6000).toLowerCase();
  const normalizedUrl = (finalUrl || "").toLowerCase();
  const badUrlHints = ["404", "not-found", "page-not-found", "/error", "/errors", "page-no-longer-available"];
  const soft404Hints = [
    "page not found",
    "404 not found",
    "404 page",
    "the page you requested could not be found",
    "sorry, this page could not be found",
    "we can't find the page",
    "we couldn't find the page",
    "no longer available",
    "this page is unavailable",
  ];

  if (!finalUrl) {
    return { level: "error", reason: "no-final-url" };
  }

  if (status >= 400) {
    return { level: "error", reason: `http-${status}` };
  }

  if (badUrlHints.some((hint) => normalizedUrl.includes(hint))) {
    return { level: "error", reason: "redirected-to-error-like-url" };
  }

  if (soft404Hints.some((hint) => content.includes(hint))) {
    return { level: "error", reason: "soft-404-content" };
  }

  return { level: "ok", reason: "ok" };
}

async function validateCompetitionLinks(competition) {
  const lifecycle = getLifecycle(competition);

  if (lifecycle === "held-private") {
    return [];
  }

  const manualResult = validateManualOkMetadata(competition, lifecycle);
  const staticResults = lifecycle === "active"
    ? validateActiveOutPage(competition)
    : validateExpiredArchivePage(competition, lifecycle);

  if (manualResult && manualResult.level === "error") {
    return [manualResult, ...staticResults];
  }

  const urlFields = collectUrlFields(competition);
  const linkResults = [];

  for (const field of urlFields) {
    if (manualResult && isManualCoveredUrl(competition, field.url)) {
      linkResults.push({
        id: competition.id,
        title: competition.title,
        lifecycle,
        field: field.name,
        url: field.url,
        finalUrl: field.url,
        httpStatus: null,
        level: "ok",
        reason: "manual-ok",
        manualOk: true,
        checkedAt: getManualCheckedAt(competition),
        recheckDue: addDays(getManualCheckedAt(competition), manualRecheckDays),
      });
      continue;
    }

    const result = await fetchUrlField(competition, field, lifecycle);
    linkResults.push(result);
  }

  return [...linkResults, ...staticResults];
}

function collectUrlFields(competition) {
  const fields = [];
  const seen = new Set();

  [
    ["url", competition.url],
    ["sourceUrl", competition.sourceUrl],
    ["termsUrl", competition.termsUrl],
  ].forEach(([name, rawUrl]) => {
    const url = String(rawUrl || "").trim();

    if (!url || seen.has(url)) {
      return;
    }

    seen.add(url);
    fields.push({ name, url });
  });

  return fields;
}

async function fetchUrlField(competition, field, lifecycle) {
  const warningOnly = lifecycle !== "active";

  try {
    const response = await fetchWithRetry(field.url);
    const bodyText = await response.text().catch(() => "");
    const classification = classifyResult(response.status, response.url, bodyText);

    return {
      id: competition.id,
      title: competition.title,
      lifecycle,
      field: field.name,
      url: field.url,
      finalUrl: response.url,
      httpStatus: response.status,
      level: warningOnly && classification.level === "error" ? "warning" : classification.level,
      reason: classification.reason,
    };
  } catch (error) {
    return {
      id: competition.id,
      title: competition.title,
      lifecycle,
      field: field.name,
      url: field.url,
      finalUrl: "",
      httpStatus: null,
      level: warningOnly ? "warning" : "error",
      reason: error.name === "AbortError" ? "timeout" : error.code || error.message || "fetch-error",
    };
  }
}

async function fetchWithRetry(url) {
  let lastError = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await fetchWithTimeout(url);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": USER_AGENT,
        "accept-language": "en-US,en;q=0.9",
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

function validateManualOkMetadata(competition, lifecycle) {
  if (competition.linkValidationStatus !== "manual-ok") {
    return null;
  }

  const errors = [];
  const expectedUrl = APPROVED_MANUAL_OK_URLS.get(competition.id);
  const allowedDomains = getAllowedManualDomains(competition);
  const checkedAt = getManualCheckedAt(competition);
  const evidence = competition.linkValidationEvidence || competition.evidenceNotes || competition.verificationNote;
  const hostname = getHostname(competition.url);

  if (!expectedUrl) {
    errors.push("missing approved manual-ok URL allowlist entry");
  } else if (normalizeUrl(competition.url) !== normalizeUrl(expectedUrl)) {
    errors.push(`manual-ok URL does not match allowlist URL: ${expectedUrl}`);
  }

  if (!competition.linkValidationReason) {
    errors.push("missing linkValidationReason");
  }

  if (!checkedAt) {
    errors.push("missing linkValidationCheckedAt");
  } else if (!isValidIsoDate(checkedAt)) {
    errors.push(`invalid linkValidationCheckedAt: ${checkedAt}`);
  } else if (lifecycle === "active" && getAgeDays(checkedAt) > manualRecheckDays) {
    errors.push(`manual-ok exception is older than ${manualRecheckDays} days`);
  }

  if (allowedDomains.length === 0) {
    errors.push("missing linkValidationAllowedDomain");
  } else if (!hostname || !allowedDomains.includes(normalizeHostname(hostname))) {
    errors.push(`URL hostname ${hostname || "(invalid)"} does not match linkValidationAllowedDomain`);
  }

  if (!evidence) {
    errors.push("missing linkValidationEvidence or evidenceNotes");
  }

  if (isGenericHomepage(competition.url) && competition.linkValidationAllowGenericUrl !== true) {
    errors.push("manual-ok URL is a generic homepage");
  }

  if (errors.length === 0) {
    return {
      id: competition.id,
      title: competition.title,
      lifecycle,
      field: "manual-ok",
      url: competition.url,
      finalUrl: competition.url,
      httpStatus: null,
      level: "ok",
      reason: "manual-ok-metadata-valid",
      manualOk: true,
      checkedAt,
      recheckDue: addDays(checkedAt, manualRecheckDays),
    };
  }

  return {
    id: competition.id,
    title: competition.title,
    lifecycle,
    field: "manual-ok",
    url: competition.url,
    finalUrl: competition.url,
    httpStatus: null,
    level: lifecycle === "active" ? "error" : "warning",
    reason: `invalid-manual-ok: ${errors.join("; ")}`,
    manualOk: true,
    checkedAt,
    recheckDue: checkedAt && isValidIsoDate(checkedAt) ? addDays(checkedAt, manualRecheckDays) : "",
  };
}

function isManualCoveredUrl(competition, url) {
  const expectedUrl = APPROVED_MANUAL_OK_URLS.get(competition.id);

  if (!expectedUrl) {
    return false;
  }

  if (normalizeUrl(url) === normalizeUrl(expectedUrl) || normalizeUrl(url) === normalizeUrl(competition.url)) {
    return true;
  }

  const hostname = normalizeHostname(getHostname(url));
  return hostname && getAllowedManualDomains(competition).includes(hostname) && !isGenericHomepage(url);
}

function validateActiveOutPage(competition) {
  const slug = shared.getCompetitionSlug(competition);
  const outPath = path.join(ROOT_DIR, "out", slug, "index.html");
  const targetUrl = competition.sourceUrl || competition.url;
  const results = [];

  if (!fs.existsSync(outPath)) {
    return [
      {
        id: competition.id,
        title: competition.title,
        lifecycle: "active",
        field: "out",
        url: `/out/${slug}/`,
        finalUrl: "",
        httpStatus: null,
        level: "error",
        reason: "missing-active-out-page",
      },
    ];
  }

  const html = fs.readFileSync(outPath, "utf8");

  if (!html.includes('name="robots" content="noindex, nofollow"')) {
    results.push(makeStaticResult(competition, "active", "out", `/out/${slug}/`, "error", "out-page-missing-noindex-nofollow"));
  }

  if (!html.includes(JSON.stringify(targetUrl))) {
    results.push(makeStaticResult(competition, "active", "out", `/out/${slug}/`, "error", "out-target-mismatch"));
  }

  return results.length > 0
    ? results
    : [makeStaticResult(competition, "active", "out", `/out/${slug}/`, "ok", "out-page-ok")];
}

function validateExpiredArchivePage(competition, lifecycle) {
  if (lifecycle !== "expired-archive") {
    return [];
  }

  const slug = shared.getCompetitionSlug(competition);
  const detailPath = path.join(ROOT_DIR, "competition", slug, "index.html");
  const outPath = path.join(ROOT_DIR, "out", slug, "index.html");
  const results = [];

  if (!fs.existsSync(detailPath)) {
    return [makeStaticResult(competition, lifecycle, "archive", `/competition/${slug}/`, "error", "missing-expired-archive-page")];
  }

  const html = fs.readFileSync(detailPath, "utf8");
  const archiveLeadSection = html.split("Current competitions you may like")[0] || html;

  if (!html.includes("This competition has closed.")) {
    results.push(makeStaticResult(competition, lifecycle, "archive", `/competition/${slug}/`, "error", "archive-missing-closed-banner"));
  }

  if (
    /href="\/out\//.test(archiveLeadSection) ||
    /<a[^>]*>\s*Enter (Competition|Now|on|via|using)/i.test(archiveLeadSection)
  ) {
    results.push(makeStaticResult(competition, lifecycle, "archive", `/competition/${slug}/`, "error", "archive-exposes-active-entry-cta"));
  }

  if (fs.existsSync(outPath)) {
    results.push(makeStaticResult(competition, lifecycle, "out", `/out/${slug}/`, "error", "expired-archive-has-out-page"));
  }

  return results.length > 0
    ? results
    : [makeStaticResult(competition, lifecycle, "archive", `/competition/${slug}/`, "ok", "archive-page-ok")];
}

function validatePrivateGeneratedState(competition, sitemap, collectionFiles) {
  const slug = shared.getCompetitionSlug(competition);
  const detailPath = path.join(ROOT_DIR, "competition", slug, "index.html");
  const outPath = path.join(ROOT_DIR, "out", slug, "index.html");
  const results = [];

  if (fs.existsSync(detailPath)) {
    results.push(makeStaticResult(competition, "held-private", "competition", `/competition/${slug}/`, "error", "private-detail-page-generated"));
  }

  if (fs.existsSync(outPath)) {
    results.push(makeStaticResult(competition, "held-private", "out", `/out/${slug}/`, "error", "private-out-page-generated"));
  }

  if (sitemap.includes(`/competition/${slug}/`) || sitemap.includes(`/out/${slug}/`)) {
    results.push(makeStaticResult(competition, "held-private", "sitemap", `/competition/${slug}/`, "error", "private-page-in-sitemap"));
  }

  collectionFiles.forEach((filePath) => {
    const html = fs.readFileSync(filePath, "utf8");
    if (html.includes(`/competition/${slug}/`) || html.includes(`/out/${slug}/`)) {
      results.push(makeStaticResult(competition, "held-private", "collection", filePath, "error", "private-page-in-active-listing"));
    }
  });

  return results;
}

function makeStaticResult(competition, lifecycle, field, url, level, reason) {
  return {
    id: competition.id,
    title: competition.title,
    lifecycle,
    field,
    url,
    finalUrl: url,
    httpStatus: null,
    level,
    reason,
  };
}

function getCollectionFiles() {
  return [
    path.join(ROOT_DIR, "index.html"),
    ...getNestedIndexFiles(path.join(ROOT_DIR, "category")),
    ...getNestedIndexFiles(path.join(ROOT_DIR, "tag")),
    ...shared.HUB_SLUGS.map((slug) => path.join(ROOT_DIR, slug, "index.html")),
    path.join(ROOT_DIR, "brands", "index.html"),
    ...getNestedIndexFiles(path.join(ROOT_DIR, "brand")),
  ].filter((filePath) => fs.existsSync(filePath));
}

function getNestedIndexFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(directory, entry.name, "index.html"))
    .filter((filePath) => fs.existsSync(filePath));
}

async function runWithConcurrency(items, workerFn) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const currentIndex = index++;
      const itemResults = await workerFn(items[currentIndex]);
      results.push(...itemResults);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  results.sort((a, b) => `${a.id}:${a.field}`.localeCompare(`${b.id}:${b.field}`));
  return results;
}

function buildSummary(results, competitions) {
  const lifecycleCounts = competitions.reduce((counts, competition) => {
    const lifecycle = getLifecycle(competition);
    counts[lifecycle] = (counts[lifecycle] || 0) + 1;
    return counts;
  }, {});

  return results.reduce(
    (accumulator, result) => {
      accumulator.total += 1;
      accumulator[result.level] += 1;

      if (result.level !== "ok") {
        accumulator.byReason[result.reason] = (accumulator.byReason[result.reason] || 0) + 1;
      }

      return accumulator;
    },
    {
      total: 0,
      ok: 0,
      warning: 0,
      error: 0,
      byReason: {},
      lifecycleCounts,
    }
  );
}

function printHumanReport(summary, failures, warnings, manualOkResults) {
  console.log("=== Competition Link Validation ===");
  console.log(`Scope: ${publishedOnly ? "published competitions plus private output checks" : "all competitions with URLs"}`);
  console.log(`Lifecycle scope: ${formatObjectCounts(summary.lifecycleCounts)}`);
  console.log(`Total checks: ${summary.total}`);
  console.log(`OK: ${summary.ok}`);
  console.log(`Warnings: ${summary.warning}`);
  console.log(`Errors: ${summary.error}`);
  console.log("");

  if (Object.keys(summary.byReason).length > 0) {
    console.log("Non-OK reasons:");
    Object.entries(summary.byReason)
      .sort((a, b) => b[1] - a[1])
      .forEach(([reason, count]) => {
        console.log(`- ${reason}: ${count}`);
      });
    console.log("");
  }

  if (manualOkResults.length > 0) {
    console.log("Manual OK exceptions (warning summary):");
    uniqueManualOkResults(manualOkResults).forEach((result) => {
      console.log(`- ${result.id} | checked ${result.checkedAt || "unknown"} | recheck by ${result.recheckDue || "unknown"}`);
    });
    console.log("");
  }

  if (warnings.length > 0) {
    console.log("Warnings:");
    warnings.forEach(printResult);
    console.log("");
  }

  if (failures.length === 0) {
    console.log("No failing active competition URLs or lifecycle output violations detected.");
    return;
  }

  console.log("Failures:");
  failures.forEach(printResult);
}

function printResult(result) {
  console.log(
    `- ${result.id} | ${result.lifecycle} | ${result.field} | ${result.reason} | ${result.httpStatus ?? "no-status"} | ${result.finalUrl || result.url}`
  );
}

function uniqueManualOkResults(results) {
  const seen = new Set();
  return results.filter((result) => {
    if (seen.has(result.id)) {
      return false;
    }

    seen.add(result.id);
    return true;
  });
}

function formatObjectCounts(counts) {
  return Object.entries(counts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, count]) => `${key}=${count}`)
    .join(", ");
}

function getAllowedManualDomains(competition) {
  return String(competition.linkValidationAllowedDomain || "")
    .split(",")
    .map((domain) => normalizeHostname(domain))
    .filter(Boolean);
}

function getManualCheckedAt(competition) {
  return String(competition.linkValidationCheckedAt || "").trim();
}

function getHostname(url) {
  try {
    return new URL(url).hostname;
  } catch (error) {
    return "";
  }
}

function normalizeHostname(hostname) {
  return String(hostname || "")
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
}

function normalizeUrl(url) {
  return String(url || "").trim();
}

function isGenericHomepage(url) {
  try {
    const parsed = new URL(url);
    return parsed.pathname === "/" || parsed.pathname === "";
  } catch (error) {
    return false;
  }
}

function isValidIsoDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) && !Number.isNaN(date.getTime());
}

function getAgeDays(dateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const date = new Date(`${dateString}T00:00:00`);
  date.setHours(0, 0, 0, 0);

  return Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(dateString, days) {
  if (!isValidIsoDate(dateString)) {
    return "";
  }

  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function main() {
  const allCompetitions = loadCompetitions();
  const linkScope = getLinkValidationScope(allCompetitions);
  const sitemap = fs.existsSync(SITEMAP_PATH) ? fs.readFileSync(SITEMAP_PATH, "utf8") : "";
  const collectionFiles = getCollectionFiles();
  const privateOutputResults = allCompetitions
    .filter((competition) => getLifecycle(competition) === "held-private")
    .flatMap((competition) => validatePrivateGeneratedState(competition, sitemap, collectionFiles));
  const linkResults = await runWithConcurrency(linkScope, validateCompetitionLinks);
  const results = [...linkResults, ...privateOutputResults];
  const failures = results.filter((result) => result.level === "error");
  const warnings = results.filter((result) => result.level === "warning");
  const manualOkResults = results.filter((result) => result.manualOk);
  const summary = buildSummary(results, linkScope);
  const normalizedWarnings = warnings.map(normalizeCompetitionWarning);
  const warningComparison = baselinePath
    ? compareWarningBaseline(normalizedWarnings, loadWarningBaseline(ROOT_DIR, baselinePath), "competition")
    : null;
  const output = {
    generatedAt: new Date().toISOString(),
    scope: publishedOnly ? "published-plus-private-output-checks" : "all-with-urls",
    summary,
    failures,
    warnings,
    normalizedWarnings,
    warningComparison,
    manualOk: uniqueManualOkResults(manualOkResults).map((result) => ({
      id: result.id,
      checkedAt: result.checkedAt || "",
      recheckDue: result.recheckDue || "",
    })),
  };

  if (jsonOnly) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    printHumanReport(summary, failures, warnings, manualOkResults);
    if (warningComparison) {
      console.log("");
      console.log("=== Competition Warning Baseline ===");
      printWarningComparison(warningComparison);
    }
  }

  if (failures.length > 0 || warningComparison?.hasRegression) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
