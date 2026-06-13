const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const DEFAULT_SITE_URL = "https://freehub.co.za";
const DEFAULT_SITEMAP = "https://freehub.co.za/sitemap.xml";
const DEFAULT_ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_BATCH_SIZE = 10000;

function splitArg(arg) {
  const equalsIndex = arg.indexOf("=");
  if (equalsIndex === -1) return [arg, null];
  return [arg.slice(0, equalsIndex), arg.slice(equalsIndex + 1)];
}

function parseArgs(argv) {
  const options = {
    dryRun: false,
    endpoint: process.env.INDEXNOW_ENDPOINT || DEFAULT_ENDPOINT,
    limit: Number.POSITIVE_INFINITY,
    siteUrl: process.env.INDEXNOW_SITE_URL || DEFAULT_SITE_URL,
    sitemap: process.env.INDEXNOW_SITEMAP_URL || DEFAULT_SITEMAP,
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

    if (name === "--endpoint") {
      options.endpoint = requireValue(name, value);
      if (consumed) index += 1;
    } else if (name === "--limit") {
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

function chunks(items, size) {
  const out = [];
  for (let index = 0; index < items.length; index += size) {
    out.push(items.slice(index, index + size));
  }
  return out;
}

async function submitBatch(endpoint, body) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  const text = await response.text();

  if (![200, 202].includes(response.status)) {
    throw new Error(`IndexNow submit failed with HTTP ${response.status}${text.trim() ? `: ${text.trim()}` : ""}`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const key = (process.env.INDEXNOW_API_KEY || "").trim();

  if (!key && !options.dryRun) {
    throw new Error("INDEXNOW_API_KEY is required");
  }

  const urls = prepareUrls(await readSitemapUrls(options.sitemap), options.siteUrl, options.limit);
  if (urls.length === 0) {
    console.log("IndexNow: no sitemap URLs to submit.");
    return;
  }

  const site = new URL(options.siteUrl);
  const keyLocation = `${site.origin}/${key}.txt`;

  if (options.dryRun) {
    console.log(`IndexNow dry run: would submit ${urls.length} URL(s) for ${site.host}`);
    console.log(`Endpoint: ${options.endpoint}`);
    console.log(`Key location: ${key ? keyLocation : "(requires INDEXNOW_API_KEY for live submission)"}`);
    urls.slice(0, 20).forEach((url) => console.log(`- ${url}`));
    if (urls.length > 20) console.log(`...and ${urls.length - 20} more`);
    return;
  }

  const batches = chunks(urls, MAX_BATCH_SIZE);
  for (let index = 0; index < batches.length; index += 1) {
    await submitBatch(options.endpoint, {
      host: site.host,
      key,
      keyLocation,
      urlList: batches[index],
    });
    console.log(`IndexNow accepted batch ${index + 1}/${batches.length} (${batches[index].length} URL(s))`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
