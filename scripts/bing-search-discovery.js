const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT_DIR, "data", "competitions.json");
const ARCHIVE_PATH = path.join(ROOT_DIR, "data", "archive", "competitions-expired.json");
const DEFAULT_OUTPUT_PATH = path.join(ROOT_DIR, ".research", "bing-competition-leads.json");
const DEFAULT_ENDPOINT = "https://api.bing.microsoft.com/v7.0/search";

const DEFAULT_QUERIES = [
  '"competition" "South Africa" "closing date" "win"',
  '"win" "competition" "terms and conditions" "South Africa"',
  '"win a car" "competition" "South Africa" "2026"',
  '"cash prize" "competition" "South Africa" "closing date"',
  '"voucher" "competition" "South Africa" "closing date"',
  'site:.co.za "competition" "closing date" "terms and conditions"',
  'site:.co.za "win" "competition" "terms" "2026"',
];

const SELF_HOSTS = new Set(["freehub.co.za", "www.freehub.co.za", "freehub.datacost.co.za"]);
const LOW_VALUE_HOSTS = new Set([
  "facebook.com",
  "www.facebook.com",
  "instagram.com",
  "www.instagram.com",
  "tiktok.com",
  "www.tiktok.com",
  "twitter.com",
  "www.twitter.com",
  "x.com",
  "www.x.com",
  "youtube.com",
  "www.youtube.com",
  "linkedin.com",
  "www.linkedin.com",
  "pinterest.com",
  "www.pinterest.com",
]);

function parseArgs(argv) {
  const options = {
    count: 10,
    dryRun: false,
    endpoint: process.env.BING_SEARCH_ENDPOINT || DEFAULT_ENDPOINT,
    fixturePath: null,
    freshness: process.env.BING_SEARCH_FRESHNESS || "",
    includeKnown: false,
    includeLowScore: false,
    market: process.env.BING_SEARCH_MKT || "en-ZA",
    minScore: 3,
    offset: 0,
    outputPath: DEFAULT_OUTPUT_PATH,
    queries: [],
    queriesPath: null,
    safeSearch: process.env.BING_SAFE_SEARCH || "Moderate",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--include-known") {
      options.includeKnown = true;
      continue;
    }

    if (arg === "--include-low-score") {
      options.includeLowScore = true;
      continue;
    }

    const [name, inlineValue] = splitArg(arg);
    const value = inlineValue !== null ? inlineValue : argv[index + 1];
    const consumed = inlineValue === null;

    if (name === "--query" || name === "-q") {
      options.queries.push(requireOptionValue(name, value));
      if (consumed) index += 1;
      continue;
    }

    if (name === "--queries") {
      options.queriesPath = path.resolve(ROOT_DIR, requireOptionValue(name, value));
      if (consumed) index += 1;
      continue;
    }

    if (name === "--output" || name === "-o") {
      options.outputPath = path.resolve(ROOT_DIR, requireOptionValue(name, value));
      if (consumed) index += 1;
      continue;
    }

    if (name === "--endpoint") {
      options.endpoint = requireOptionValue(name, value);
      if (consumed) index += 1;
      continue;
    }

    if (name === "--mkt" || name === "--market") {
      options.market = requireOptionValue(name, value);
      if (consumed) index += 1;
      continue;
    }

    if (name === "--safe-search") {
      options.safeSearch = requireOptionValue(name, value);
      if (consumed) index += 1;
      continue;
    }

    if (name === "--freshness") {
      options.freshness = requireOptionValue(name, value);
      if (consumed) index += 1;
      continue;
    }

    if (name === "--fixture") {
      options.fixturePath = path.resolve(ROOT_DIR, requireOptionValue(name, value));
      if (consumed) index += 1;
      continue;
    }

    if (name === "--count") {
      options.count = parseIntegerOption("count", requireOptionValue(name, value), 1, 50);
      if (consumed) index += 1;
      continue;
    }

    if (name === "--offset") {
      options.offset = parseIntegerOption("offset", requireOptionValue(name, value), 0, 1000);
      if (consumed) index += 1;
      continue;
    }

    if (name === "--min-score") {
      options.minScore = parseIntegerOption("min-score", requireOptionValue(name, value), -20, 20);
      if (consumed) index += 1;
      continue;
    }

    if (String(arg).startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function splitArg(arg) {
  const equalsIndex = arg.indexOf("=");
  if (equalsIndex === -1) {
    return [arg, null];
  }

  return [arg.slice(0, equalsIndex), arg.slice(equalsIndex + 1)];
}

function requireOptionValue(name, value) {
  if (value === undefined || value === null || String(value).trim() === "" || String(value).startsWith("--")) {
    throw new Error(`${name} requires a value.`);
  }

  return String(value);
}

function parseIntegerOption(name, value, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`--${name} must be an integer from ${min} to ${max}.`);
  }

  return parsed;
}

function printHelp() {
  console.log(`Bing competition discovery

Usage:
  node scripts/bing-search-discovery.js [options]

Environment:
  BING_SEARCH_API_KEY       Bing Search subscription key
  BING_SUBSCRIPTION_KEY     Alternate key name
  AZURE_BING_SEARCH_KEY     Alternate key name
  BING_SEARCH_ENDPOINT      Optional endpoint override
  BING_SEARCH_MKT           Optional market, defaults to en-ZA

Options:
  --query, -q <query>       Add a query. Can be repeated.
  --queries <path>          Read queries from JSON array or newline file.
  --output, -o <path>       Output report path. Defaults to .research/bing-competition-leads.json.
  --count <1-50>            Results per query. Defaults to 10.
  --offset <number>         Search offset. Defaults to 0.
  --mkt <market>            Bing market. Defaults to en-ZA.
  --freshness <value>       Optional Bing freshness filter.
  --safe-search <value>     Defaults to Moderate.
  --min-score <number>      Minimum lead score. Defaults to 3.
  --include-known           Include URLs already in Freehub data/archive.
  --include-low-score       Include all non-self results regardless of score.
  --fixture <path>          Process a saved Bing-style JSON response instead of calling the API.
  --dry-run                 Print query plan without calling the API.
`);
}

function readJsonArray(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!Array.isArray(parsed)) {
    throw new Error(`${filePath} must contain a JSON array.`);
  }

  return parsed;
}

function readQueriesFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").trim();
  if (!raw) {
    return [];
  }

  if (raw.startsWith("[")) {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error("--queries JSON file must contain an array.");
    }
    return parsed.map((query) => String(query).trim()).filter(Boolean);
  }

  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

function getApiKey() {
  return (
    process.env.BING_SEARCH_API_KEY ||
    process.env.BING_SUBSCRIPTION_KEY ||
    process.env.AZURE_BING_SEARCH_KEY ||
    ""
  ).trim();
}

function getQueries(options) {
  const queries = [...options.queries];
  if (options.queriesPath) {
    queries.push(...readQueriesFile(options.queriesPath));
  }

  const selectedQueries = queries.length > 0 ? queries : DEFAULT_QUERIES;
  return Array.from(new Set(selectedQueries.map((query) => query.trim()).filter(Boolean)));
}

function normalizeUrl(value) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);
    url.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid"].forEach((param) => {
      url.searchParams.delete(param);
    });

    const search = Array.from(url.searchParams.entries()).sort(([left], [right]) => left.localeCompare(right));
    url.search = "";
    search.forEach(([key, paramValue]) => url.searchParams.append(key, paramValue));

    return url.toString().replace(/\/$/, "");
  } catch (_error) {
    return String(value).trim();
  }
}

function getHost(value) {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch (_error) {
    return "";
  }
}

function getDomain(value) {
  return getHost(value).replace(/^www\./, "");
}

function buildKnownIndex() {
  const current = readJsonArray(DATA_PATH);
  const archive = readJsonArray(ARCHIVE_PATH);
  const urlToRecord = new Map();
  const domainCounts = new Map();

  [...current, ...archive].forEach((competition) => {
    ["url", "sourceUrl", "termsUrl"].forEach((field) => {
      const normalized = normalizeUrl(competition[field]);
      if (normalized) {
        urlToRecord.set(normalized, {
          id: competition.id,
          title: competition.title,
          status: competition.verificationStatus || competition.publicationStatus || "archive",
        });
      }
    });

    const domain = getDomain(competition.sourceUrl || competition.url || competition.termsUrl);
    if (domain) {
      domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
    }
  });

  return { currentCount: current.length, archiveCount: archive.length, domainCounts, urlToRecord };
}

function isLikelySelfResult(resultUrl) {
  const host = getHost(resultUrl);
  return SELF_HOSTS.has(host) || SELF_HOSTS.has(host.replace(/^www\./, ""));
}

function getWebResults(response) {
  return response && response.webPages && Array.isArray(response.webPages.value) ? response.webPages.value : [];
}

function scoreResult(result, knownIndex) {
  const url = String(result.url || "").trim();
  const normalizedUrl = normalizeUrl(url);
  const host = getHost(url);
  const domain = getDomain(url);
  const text = [result.name, result.snippet, result.displayUrl, url].join(" ").toLowerCase();
  let score = 0;
  const reasons = [];
  const warnings = [];

  if (isLikelySelfResult(url)) {
    return {
      excluded: true,
      exclusionReason: "self-result",
      normalizedUrl,
      score: -100,
      reasons: ["Freehub result ignored"],
      warnings,
    };
  }

  if (/\bcompetition(s)?\b|\bgiveaway(s)?\b|\bpromotion(s)?\b/.test(text)) {
    score += 2;
    reasons.push("competition language");
  }

  if (/\bwin\b|\bprize\b|\bdraw\b|\benter\b/.test(text)) {
    score += 1;
    reasons.push("entry or prize language");
  }

  if (/closing date|closes|ends|valid until|terms and conditions|t&cs|rules/.test(text)) {
    score += 2;
    reasons.push("rules or closing-date language");
  }

  if (/south africa|\brsa\b|\.co\.za|\.org\.za|\.ac\.za/.test(text)) {
    score += 1;
    reasons.push("South Africa signal");
  }

  if (/\/competition|\/competitions|\/promotion|\/promotions|\/terms|\/win|\/campaign/.test(text)) {
    score += 1;
    reasons.push("promotional URL path");
  }

  if (knownIndex.domainCounts.has(domain)) {
    score += 1;
    reasons.push("known promoter domain");
  }

  if (/winner(s)? announced|closed|ended|expired|past competition|archive|draw took place|has ended/.test(text)) {
    score -= 3;
    warnings.push("may be expired or winner-result content");
  }

  if (LOW_VALUE_HOSTS.has(host) || LOW_VALUE_HOSTS.has(domain)) {
    score -= 2;
    warnings.push("social/network result needs extra verification");
  }

  const knownRecord = knownIndex.urlToRecord.get(normalizedUrl);
  if (knownRecord) {
    score -= 4;
    warnings.push(`already tracked as ${knownRecord.id}`);
  }

  return { excluded: false, knownRecord, normalizedUrl, score, reasons, warnings };
}

function normalizeLead(result, query, knownIndex, discoveredAt) {
  const scoring = scoreResult(result, knownIndex);
  const url = String(result.url || "").trim();
  const domain = getDomain(url);

  return {
    title: String(result.name || "").trim(),
    url,
    normalizedUrl: scoring.normalizedUrl,
    displayUrl: String(result.displayUrl || "").trim(),
    domain,
    snippet: String(result.snippet || "").trim(),
    dateLastCrawled: result.dateLastCrawled || "",
    language: result.language || "",
    query,
    score: scoring.score,
    reasons: scoring.reasons,
    warnings: scoring.warnings,
    excluded: scoring.excluded,
    exclusionReason: scoring.exclusionReason || "",
    knownRecordId: scoring.knownRecord ? scoring.knownRecord.id : "",
    knownRecordTitle: scoring.knownRecord ? scoring.knownRecord.title : "",
    discoveredAt,
    suggestedAction: scoring.knownRecord ? "already-tracked" : "manual-review",
    sourceSystem: "bing-search-discovery",
  };
}

function mergeLeads(leads) {
  const byUrl = new Map();

  leads.forEach((lead) => {
    if (!lead.normalizedUrl) {
      return;
    }

    const existing = byUrl.get(lead.normalizedUrl);
    if (!existing) {
      byUrl.set(lead.normalizedUrl, { ...lead, queries: [lead.query] });
      return;
    }

    existing.score = Math.max(existing.score, lead.score);
    existing.queries = Array.from(new Set([...existing.queries, lead.query]));
    existing.reasons = Array.from(new Set([...existing.reasons, ...lead.reasons]));
    existing.warnings = Array.from(new Set([...existing.warnings, ...lead.warnings]));
  });

  return Array.from(byUrl.values()).sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    return left.title.localeCompare(right.title);
  });
}

async function searchBing(options, key, query) {
  const url = new URL(options.endpoint);
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(options.count));
  url.searchParams.set("offset", String(options.offset));
  url.searchParams.set("mkt", options.market);
  url.searchParams.set("safeSearch", options.safeSearch);
  url.searchParams.set("responseFilter", "Webpages");

  if (options.freshness) {
    url.searchParams.set("freshness", options.freshness);
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Ocp-Apim-Subscription-Key": key,
      "User-Agent": "FreeHub Bing discovery/1.0",
    },
  });

  const body = await response.text();
  if (!response.ok) {
    let message = body.slice(0, 500);
    try {
      const parsed = JSON.parse(body);
      message = parsed.message || parsed.error_description || JSON.stringify(parsed);
    } catch (_error) {
      // Keep the raw body snippet.
    }
    throw new Error(`Bing Search request failed for "${query}" with HTTP ${response.status}: ${message}`);
  }

  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error(`Bing Search returned non-JSON content for "${query}": ${error.message}`);
  }
}

function readFixtureResponses(fixturePath, queries) {
  const parsed = JSON.parse(fs.readFileSync(fixturePath, "utf8"));

  if (Array.isArray(parsed)) {
    return parsed.map((entry, index) => ({
      query: entry.query || queries[index] || `fixture-${index + 1}`,
      response: entry.response || entry,
    }));
  }

  return [{ query: queries[0] || "fixture", response: parsed }];
}

function filterLeads(leads, options) {
  return leads.filter((lead) => {
    if (lead.excluded) {
      return false;
    }

    if (!options.includeKnown && lead.knownRecordId) {
      return false;
    }

    if (options.includeLowScore) {
      return true;
    }

    return lead.score >= options.minScore;
  });
}

function writeReport(report, outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  if (typeof fetch !== "function" && !options.fixturePath && !options.dryRun) {
    throw new Error("This script requires Node.js fetch support. Use Node 18+ or the GitHub Actions Node 24 runtime.");
  }

  const queries = getQueries(options);
  const key = getApiKey();

  console.log("=== Bing Competition Discovery ===");
  console.log(`Queries: ${queries.length}`);
  console.log(`Market: ${options.market}`);
  console.log(`Endpoint: ${options.endpoint}`);
  console.log(`Output: ${options.outputPath}`);

  if (options.dryRun) {
    console.log("\nDry run only. No API request made.");
    queries.forEach((query) => console.log(`- ${query}`));
    if (!key) {
      console.log("\nNo Bing key found. Set BING_SEARCH_API_KEY before live discovery.");
    }
    return;
  }

  if (!options.fixturePath && !key) {
    throw new Error("Missing Bing Search API key. Set BING_SEARCH_API_KEY, BING_SUBSCRIPTION_KEY, or AZURE_BING_SEARCH_KEY.");
  }

  const knownIndex = buildKnownIndex();
  const discoveredAt = new Date().toISOString();
  const responseEntries = [];

  if (options.fixturePath) {
    responseEntries.push(...readFixtureResponses(options.fixturePath, queries));
  } else {
    for (const query of queries) {
      console.log(`Searching: ${query}`);
      const response = await searchBing(options, key, query);
      responseEntries.push({ query, response });
    }
  }

  const rawLeads = [];
  responseEntries.forEach(({ query, response }) => {
    getWebResults(response).forEach((result) => {
      rawLeads.push(normalizeLead(result, query, knownIndex, discoveredAt));
    });
  });

  const mergedLeads = mergeLeads(rawLeads);
  const leads = filterLeads(mergedLeads, options);
  const report = {
    generatedAt: discoveredAt,
    provider: "bing-web-search-compatible",
    providerNotice:
      "Microsoft announced that Bing Search APIs retired on 2025-08-11. This script supports legacy-compatible endpoints when a working key/endpoint is available.",
    endpoint: options.endpoint,
    market: options.market,
    countPerQuery: options.count,
    minScore: options.minScore,
    queries,
    knownData: {
      activeAndHeldRecords: knownIndex.currentCount,
      archiveRecords: knownIndex.archiveCount,
    },
    summary: {
      responsesProcessed: responseEntries.length,
      rawResults: rawLeads.length,
      uniqueResults: mergedLeads.length,
      excludedSelfResults: mergedLeads.filter((lead) => lead.excluded).length,
      knownMatches: mergedLeads.filter((lead) => lead.knownRecordId).length,
      reviewLeads: leads.length,
    },
    leads,
  };

  writeReport(report, options.outputPath);

  console.log("\nDiscovery report written.");
  console.log(`Review leads: ${leads.length}`);
  console.log(`Path: ${options.outputPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
