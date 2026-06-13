const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const DEFAULT_SITE_URL = "https://freehub.co.za";
const DEFAULT_SITEMAP = "https://freehub.co.za/sitemap.xml";
const API_BASE = "https://ssl.bing.com/webmaster/api.svc/json";
const MAX_BATCH_SIZE = 500;

function splitArg(arg) {
  const equalsIndex = arg.indexOf("=");
  if (equalsIndex === -1) return [arg, null];
  return [arg.slice(0, equalsIndex), arg.slice(equalsIndex + 1)];
}

function parseArgs(argv) {
  const options = {
    dryRun: false,
    limit: Number.POSITIVE_INFINITY,
    siteUrl: process.env.BING_SITE_URL || DEFAULT_SITE_URL,
    sitemap: process.env.BING_SITEMAP_URL || DEFAULT_SITEMAP,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    const [name, inlineValue] = splitArg(arg);
    const value = inlineValue !== null ? inlineValue : argv[index + 1];
    const consumed = inlineValue === null;

    if (name === "--limit") {
      options.limit = parsePositiveInteger(requireValue(name, value), name);
      if (consumed) index += 1;
    } else if (name === "--site") {
      options.siteUrl = requireValue(name, value);
      if (consumed) index += 1;
    } else if (name === "--sitemap") {
      options.sitemap = requireValue(name, value);
      if (consumed) index += 1;
    } else if (String(arg).startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function requireValue(name, value) {
  if (value === undefined || value === null || String(value).trim() === "" || String(value).startsWith("--")) {
    throw new Error(`${name} requires a value`);
  }
  return String(value);
}

function parsePositiveInteger(value, name) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

async function readText(source) {
  if (/^https?:\/\//i.test(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${source}: HTTP ${response.status}`);
    }
    return response.text();
  }

  return fs.readFileSync(path.resolve(ROOT_DIR, source), "utf8");
}

function decodeXml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");
}

function locsFromXml(xml) {
  return Array.from(xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)).map((match) => decodeXml(match[1].trim()));
}

async function readSitemapUrls(source, visited = new Set()) {
  const absoluteSource = /^https?:\/\//i.test(source)
    ? new URL(source).toString()
    : path.resolve(ROOT_DIR, source);

  if (visited.has(absoluteSource)) return [];
  visited.add(absoluteSource);

  const xml = await readText(source);
  const locs = locsFromXml(xml);
  if (!/<sitemapindex\b/i.test(xml)) return locs;

  const nested = [];
  for (const loc of locs) {
    nested.push(...await readSitemapUrls(loc, visited));
  }
  return nested;
}

function prepareUrls(urls, siteUrl, limit) {
  const siteOrigin = new URL(siteUrl).origin;
  const seen = new Set();
  const cleaned = [];

  for (const raw of urls) {
    const url = new URL(raw);
    if (url.origin !== siteOrigin || seen.has(url.toString())) continue;
    seen.add(url.toString());
    cleaned.push(url.toString());
    if (cleaned.length >= limit) break;
  }

  return cleaned;
}

function apiUrl(method, apiKey, params = {}) {
  const url = new URL(`${API_BASE}/${method}`);
  url.searchParams.set("apikey", apiKey);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url;
}

async function bingRequest(method, apiKey, options = {}) {
  const response = await fetch(apiUrl(method, apiKey, options.params), {
    method: options.body ? "POST" : "GET",
    headers: options.body ? { "Content-Type": "application/json; charset=utf-8" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  let json = null;

  if (text.trim()) {
    try {
      json = JSON.parse(text);
    } catch (_error) {
      json = null;
    }
  }

  if (!response.ok) {
    const detail = json ? JSON.stringify(json) : text.trim();
    throw new Error(`Bing ${method} failed with HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
  }

  return json;
}

async function getQuota(apiKey, siteUrl) {
  const data = await bingRequest("GetUrlSubmissionQuota", apiKey, {
    params: { siteUrl },
  });
  const quota = data && data.d ? data.d : data || {};
  const daily = Number(quota.DailyQuota);
  const monthly = Number(quota.MonthlyQuota);

  return {
    daily: Number.isFinite(daily) ? daily : Number.POSITIVE_INFINITY,
    monthly: Number.isFinite(monthly) ? monthly : Number.POSITIVE_INFINITY,
  };
}

function chunks(items, size) {
  const out = [];
  for (let index = 0; index < items.length; index += size) {
    out.push(items.slice(index, index + size));
  }
  return out;
}

async function submitBatch(apiKey, siteUrl, urlList) {
  await bingRequest("SubmitUrlbatch", apiKey, {
    body: { siteUrl, urlList },
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const apiKey = (process.env.BING_WEBMASTER_API_KEY || process.env.BING_API_KEY || "").trim();

  if (!apiKey && !options.dryRun) {
    throw new Error("BING_WEBMASTER_API_KEY is required");
  }

  const urls = prepareUrls(await readSitemapUrls(options.sitemap), options.siteUrl, options.limit);
  if (urls.length === 0) {
    console.log("Bing: no sitemap URLs to submit.");
    return;
  }

  if (options.dryRun) {
    console.log(`Bing dry run: would submit ${urls.length} URL(s) for ${options.siteUrl}`);
    urls.slice(0, 20).forEach((url) => console.log(`- ${url}`));
    if (urls.length > 20) console.log(`...and ${urls.length - 20} more`);
    return;
  }

  const quota = await getQuota(apiKey, options.siteUrl);
  const allowance = Math.min(urls.length, quota.daily, quota.monthly);
  if (allowance < 1) {
    console.log(`Bing quota is exhausted for ${options.siteUrl}. Daily: ${quota.daily}, monthly: ${quota.monthly}`);
    return;
  }

  const submitUrls = urls.slice(0, allowance);
  const batches = chunks(submitUrls, MAX_BATCH_SIZE);

  for (let index = 0; index < batches.length; index += 1) {
    await submitBatch(apiKey, options.siteUrl, batches[index]);
    console.log(`Submitted Bing batch ${index + 1}/${batches.length} (${batches[index].length} URL(s))`);
  }

  console.log(`Submitted ${submitUrls.length} URL(s) to Bing for ${options.siteUrl}.`);
  if (submitUrls.length < urls.length) {
    console.log(`Skipped ${urls.length - submitUrls.length} URL(s) because of quota or --limit.`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
