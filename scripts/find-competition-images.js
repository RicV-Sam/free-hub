const fs = require("fs");
const path = require("path");
const shared = require("../shared/page-data.js");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT_DIR, "data", "competitions.json");
const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_CONCURRENCY = 4;
const NEUTRAL_FALLBACK_URL = "https://freehub.co.za/FH%20logo.png";

function parseArgs(argv) {
  const options = {
    apply: false,
    id: null,
    limit: null,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    concurrency: DEFAULT_CONCURRENCY,
    markNeutralFallbacks: false,
  };

  argv.forEach((arg) => {
    if (arg === "--apply") {
      options.apply = true;
      return;
    }

    if (arg === "--mark-neutral-fallbacks") {
      options.markNeutralFallbacks = true;
      return;
    }

    if (arg.startsWith("--id=")) {
      options.id = arg.split("=")[1] || null;
      return;
    }

    if (arg.startsWith("--limit=")) {
      options.limit = Number(arg.split("=")[1]);
      return;
    }

    if (arg.startsWith("--timeout-ms=")) {
      options.timeoutMs = Number(arg.split("=")[1]) || DEFAULT_TIMEOUT_MS;
      return;
    }

    if (arg.startsWith("--concurrency=")) {
      options.concurrency = Math.max(1, Number(arg.split("=")[1]) || DEFAULT_CONCURRENCY);
    }
  });

  return options;
}

function getSourceUrl(competition) {
  return competition.sourceUrl || competition.url || "";
}

function isHtmlUrl(url) {
  return !/\.pdf(?:$|[?#])/i.test(url);
}

function getTargetCompetitions(competitions, options) {
  let targets = competitions.filter(
    (competition) =>
      competition.verificationStatus === "published" &&
      !competition.image &&
      getSourceUrl(competition) &&
      isHtmlUrl(getSourceUrl(competition))
  );

  if (options.id) {
    targets = targets.filter((competition) => competition.id === options.id);
  }

  if (Number.isFinite(options.limit) && options.limit > 0) {
    targets = targets.slice(0, options.limit);
  }

  return targets;
}

async function fetchHtml(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent": "FreehubImageDiscovery/1.0 (+https://freehub.co.za/)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      return { ok: false, status: response.status, finalUrl: response.url, error: `HTTP ${response.status}` };
    }

    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return {
        ok: false,
        status: response.status,
        finalUrl: response.url,
        error: `Unsupported content type: ${contentType || "unknown"}`,
      };
    }

    return { ok: true, status: response.status, finalUrl: response.url, html: await response.text() };
  } catch (error) {
    return { ok: false, status: 0, finalUrl: url, error: error.name === "AbortError" ? "Timeout" : error.message };
  } finally {
    clearTimeout(timeout);
  }
}

function extractImageCandidates(html, baseUrl, competition) {
  const candidates = [
    ...extractMetaImageCandidates(html, baseUrl),
    ...extractJsonLdImageCandidates(html, baseUrl),
  ];
  const seen = new Set();

  return candidates
    .filter(isLikelyImageCandidate)
    .map((candidate) => {
      const termHits = countCandidateTermHits(candidate.url, competition);
      return {
        ...candidate,
        termHits,
        score: scoreImageCandidate(candidate, baseUrl, competition, termHits),
      };
    })
    .filter((candidate) => {
      if (!candidate.url || seen.has(candidate.url) || candidate.score < 1) {
        return false;
      }

      seen.add(candidate.url);
      return true;
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);
}

function extractMetaImageCandidates(html, baseUrl) {
  const candidates = [];
  const metaRegex = /<meta\b[^>]*>/gi;
  const imageKeys = new Set([
    "og:image",
    "og:image:url",
    "og:image:secure_url",
    "twitter:image",
    "twitter:image:src",
  ]);
  let match;

  while ((match = metaRegex.exec(html))) {
    const attributes = parseAttributes(match[0]);
    const key = String(attributes.property || attributes.name || "").toLowerCase();
    const content = attributes.content || "";

    if (imageKeys.has(key)) {
      const url = resolveCandidateUrl(content, baseUrl);
      if (url) {
        candidates.push({ url, source: key });
      }
    }
  }

  return candidates;
}

function extractJsonLdImageCandidates(html, baseUrl) {
  const candidates = [];
  const scriptRegex = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRegex.exec(html))) {
    const rawJson = match[1].trim();
    if (!rawJson) {
      continue;
    }

    try {
      collectJsonLdImages(JSON.parse(rawJson), baseUrl, candidates);
    } catch (_error) {
      // Ignore malformed JSON-LD. Promoter pages often include comments or invalid snippets.
    }
  }

  return candidates;
}

function collectJsonLdImages(value, baseUrl, candidates) {
  if (!value) {
    return;
  }

  if (typeof value === "string") {
    const url = resolveCandidateUrl(value, baseUrl);
    if (url) {
      candidates.push({ url, source: "json-ld:image" });
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectJsonLdImages(item, baseUrl, candidates));
    return;
  }

  if (typeof value !== "object") {
    return;
  }

  const image = value.image || value.thumbnailUrl || value.logo;
  if (typeof image === "string") {
    const url = resolveCandidateUrl(image, baseUrl);
    if (url) {
      candidates.push({ url, source: "json-ld:image" });
    }
  } else if (Array.isArray(image)) {
    image.forEach((item) => collectJsonLdImages({ image: item }, baseUrl, candidates));
  } else if (image && typeof image === "object") {
    collectJsonLdImages(image.url || image.contentUrl || image["@id"], baseUrl, candidates);
  }

  Object.values(value).forEach((item) => {
    if (item && typeof item === "object") {
      collectJsonLdImages(item, baseUrl, candidates);
    }
  });
}

function parseAttributes(tag) {
  const attributes = {};
  const attrRegex = /([a-zA-Z_:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  let match;

  while ((match = attrRegex.exec(tag))) {
    attributes[match[1].toLowerCase()] = match[2] || match[3] || match[4] || "";
  }

  return attributes;
}

function resolveCandidateUrl(value, baseUrl) {
  const trimmed = String(value || "").trim();
  if (!trimmed || trimmed.startsWith("data:")) {
    return "";
  }

  try {
    const url = new URL(trimmed, baseUrl);
    if (!/^https?:$/.test(url.protocol)) {
      return "";
    }

    return url.href;
  } catch (_error) {
    return "";
  }
}

function isLikelyImageCandidate(candidate) {
  const lowerUrl = candidate.url.toLowerCase();

  if (/(?:facebook|instagram|youtube|twitter|x)\.com\/[^/]+\/?$/i.test(lowerUrl)) {
    return false;
  }

  if (/\.(?:jpe?g|png|webp|gif|avif)(?:$|[?#])/i.test(lowerUrl)) {
    return true;
  }

  return /^(og:image|og:image:url|og:image:secure_url|twitter:image|twitter:image:src)$/.test(candidate.source);
}

function scoreImageCandidate(candidate, pageUrl, competition, termHits) {
  const url = candidate.url;
  const lowerUrl = url.toLowerCase();
  let score = 0;

  if (isSameRegistrableDomain(url, pageUrl)) {
    score += 35;
  }

  if (/^https:\/\//i.test(url)) {
    score += 8;
  }

  if (/\.(?:jpe?g|png|webp)(?:$|[?#])/i.test(url)) {
    score += 12;
  }

  if (/^(og:image|og:image:url|og:image:secure_url|twitter:image|twitter:image:src|json-ld:image)$/.test(candidate.source)) {
    score += 30;
  }

  score += termHits * 8;

  if (/(logo|favicon|sprite|icon|placeholder|blank|pixel|tracking|avatar)/i.test(lowerUrl)) {
    score -= 70;
  }

  return score;
}

function countCandidateTermHits(url, competition) {
  let searchablePath = url.toLowerCase();

  try {
    const parsed = new URL(url);
    searchablePath = [parsed.pathname, parsed.search].join(" ").toLowerCase();
  } catch (_error) {
    // Keep the full URL fallback for malformed values.
  }

  return getCompetitionImageTerms(competition).filter((term) => term && searchablePath.includes(term)).length;
}

function getCompetitionImageTerms(competition) {
  return [
    competition.id,
    competition.category,
    competition.brand,
    competition.prizeType,
    competition.prizeName,
  ]
    .flatMap((value) =>
      String(value || "")
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((part) => part.length >= 4)
    )
    .slice(0, 12);
}

function isSameRegistrableDomain(leftUrl, rightUrl) {
  return getRegistrableDomain(leftUrl) === getRegistrableDomain(rightUrl);
}

function getRegistrableDomain(url) {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    const parts = host.split(".");
    const secondLevelSuffixes = new Set(["co.za", "org.za", "ac.za", "net.za", "gov.za", "co.uk", "com.au"]);
    const lastTwo = parts.slice(-2).join(".");

    if (parts.length >= 3 && secondLevelSuffixes.has(lastTwo)) {
      return parts.slice(-3).join(".");
    }

    return lastTwo;
  } catch (_error) {
    return "";
  }
}

function isAutoApplicable(candidate) {
  return (
    candidate &&
    candidate.score >= 70 &&
    candidate.termHits > 0 &&
    /^(og:image|og:image:url|og:image:secure_url|twitter:image|twitter:image:src|json-ld:image)$/.test(candidate.source)
  );
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

async function inspectCompetition(competition, options) {
  const sourceUrl = getSourceUrl(competition);
  const response = await fetchHtml(sourceUrl, options.timeoutMs);

  if (!response.ok) {
    return {
      id: competition.id,
      title: competition.title,
      sourceUrl,
      ok: false,
      error: response.error,
      candidates: [],
    };
  }

  const candidates = extractImageCandidates(response.html, response.finalUrl, competition);

  return {
    id: competition.id,
    title: competition.title,
    sourceUrl,
    finalUrl: response.finalUrl,
    ok: true,
    candidates,
    selected: isAutoApplicable(candidates[0]) ? candidates[0].url : "",
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const competitions = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const targets = getTargetCompetitions(competitions, options);
  const results = await mapWithConcurrency(targets, options.concurrency, (competition) =>
    inspectCompetition(competition, options)
  );
  const selectedById = new Map(results.filter((result) => result.selected).map((result) => [result.id, result.selected]));
  const neutralFallbackIds = new Set(
    options.markNeutralFallbacks
      ? competitions
          .filter(
            (competition) =>
              !competition.image &&
              !selectedById.has(competition.id) &&
              isActivePublishedCompetition(competition)
          )
          .map((competition) => competition.id)
      : []
  );

  if (options.apply && (selectedById.size > 0 || neutralFallbackIds.size > 0)) {
    competitions.forEach((competition) => {
      const selected = selectedById.get(competition.id);
      if (selected) {
        competition.image = selected;
        competition.imageReviewStatus = "official-source";
        competition.imageReviewCheckedAt = getTodayIsoDate();
        delete competition.imageFallback;
      } else if (neutralFallbackIds.has(competition.id)) {
        competition.imageFallback = NEUTRAL_FALLBACK_URL;
        competition.imageReviewStatus = "neutral-fallback";
        competition.imageReviewCheckedAt = getTodayIsoDate();
      }
    });
    fs.writeFileSync(DATA_PATH, `${JSON.stringify(competitions, null, 2)}\n`);
  }

  const found = results.filter((result) => result.candidates.length > 0).length;
  const selected = results.filter((result) => result.selected).length;
  const failed = results.filter((result) => !result.ok).length;

  console.log(`Image discovery targets: ${targets.length}`);
  console.log(`Pages with candidates: ${found}`);
  console.log(`Auto-applicable candidates: ${selected}`);
  console.log(`Failed fetches: ${failed}`);
  if (options.apply) {
    console.log(`Applied images: ${selectedById.size}`);
    console.log(`Marked neutral fallbacks: ${neutralFallbackIds.size}`);
  }

  results.forEach((result) => {
    if (result.selected) {
      console.log(`\n[SELECTED] ${result.id}`);
      console.log(`  ${result.selected}`);
      return;
    }

    if (result.candidates.length > 0) {
      console.log(`\n[CANDIDATES] ${result.id}`);
      result.candidates.forEach((candidate) => {
        console.log(`  (${candidate.score}) ${candidate.source}: ${candidate.url}`);
      });
      return;
    }

    console.log(`\n[NO IMAGE] ${result.id}${result.error ? ` - ${result.error}` : ""}`);
  });
}

function isActivePublishedCompetition(competition) {
  if (!competition || !shared.isPublishedCompetition(competition)) {
    return false;
  }

  const closingDate = String(competition.closingDate || "").slice(0, 10);
  return !closingDate || closingDate >= getTodayIsoDate();
}

function getTodayIsoDate() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
