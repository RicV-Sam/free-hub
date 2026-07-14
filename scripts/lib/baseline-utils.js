const fs = require("fs");
const path = require("path");

const SITE_ORIGIN = "https://freehub.co.za";

function decodeEntities(value) {
  const named = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return String(value || "")
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match);
}

function textContent(value) {
  return decodeEntities(String(value || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function getAttribute(tag, name) {
  const match = String(tag || "").match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, "i"));
  return match ? decodeEntities(match[2]).trim() : "";
}

function getMetaContent(html, name) {
  for (const match of String(html || "").matchAll(/<meta\b[^>]*>/gi)) {
    if (getAttribute(match[0], "name").toLowerCase() === name.toLowerCase()) {
      return getAttribute(match[0], "content");
    }
  }
  return "";
}

function getLinkHref(html, rel) {
  for (const match of String(html || "").matchAll(/<link\b[^>]*>/gi)) {
    const relValues = getAttribute(match[0], "rel").toLowerCase().split(/\s+/);
    if (relValues.includes(rel.toLowerCase())) {
      return getAttribute(match[0], "href");
    }
  }
  return "";
}

function collectSchemaTypes(value, types = new Set()) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectSchemaTypes(entry, types));
    return types;
  }

  if (!value || typeof value !== "object") {
    return types;
  }

  const type = value["@type"];
  (Array.isArray(type) ? type : [type]).filter(Boolean).forEach((entry) => types.add(String(entry)));
  Object.values(value).forEach((entry) => collectSchemaTypes(entry, types));
  return types;
}

function collectBreadcrumbUrls(value, urls = []) {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectBreadcrumbUrls(entry, urls));
    return urls;
  }

  if (!value || typeof value !== "object") {
    return urls;
  }

  if (value["@type"] === "BreadcrumbList" && Array.isArray(value.itemListElement)) {
    value.itemListElement.forEach((entry) => {
      const item = entry && typeof entry.item === "object" ? entry.item["@id"] || entry.item.url : entry && entry.item;
      if (item) {
        urls.push(String(item));
      }
    });
  }

  Object.values(value).forEach((entry) => collectBreadcrumbUrls(entry, urls));
  return urls;
}

function parseHtml(html) {
  const titleMatch = String(html || "").match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const h1 = [...String(html || "").matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) => textContent(match[1]));
  const jsonLd = [];
  const jsonLdErrors = [];

  for (const match of String(html || "").matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      jsonLd.push(JSON.parse(decodeEntities(match[1]).trim()));
    } catch (error) {
      jsonLdErrors.push(error.message);
    }
  }

  const anchors = [...String(html || "").matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi)].map((match) =>
    decodeEntities(match[2]).trim()
  );

  return {
    title: titleMatch ? textContent(titleMatch[1]) : "",
    description: getMetaContent(html, "description"),
    canonical: getLinkHref(html, "canonical"),
    robots: getMetaContent(html, "robots").toLowerCase(),
    h1,
    jsonLd,
    jsonLdErrors,
    schemaTypes: [...collectSchemaTypes(jsonLd)].sort(),
    breadcrumbUrls: collectBreadcrumbUrls(jsonLd),
    anchors,
  };
}

function normalizeRoute(value) {
  const parsed = new URL(value, SITE_ORIGIN);
  let pathname = parsed.pathname.replace(/\/{2,}/g, "/");
  if (!path.extname(pathname) && !pathname.endsWith("/")) {
    pathname += "/";
  }
  return pathname || "/";
}

function routeToFile(rootDir, route) {
  const pathname = normalizeRoute(route);
  if (pathname === "/") {
    return path.join(rootDir, "index.html");
  }
  if (pathname === "/404/") {
    return path.join(rootDir, "404.html");
  }
  return path.join(rootDir, pathname.replace(/^\//, ""), "index.html");
}

function fileToRoute(rootDir, filePath) {
  const relative = path.relative(rootDir, filePath).replace(/\\/g, "/");
  if (relative === "index.html") {
    return "/";
  }
  if (relative === "404.html") {
    return "/404/";
  }
  return `/${relative.replace(/\/index\.html$/, "")}/`.replace(/\/{2,}/g, "/");
}

function walkHtmlFiles(rootDir) {
  const ignoredDirectories = new Set([
    ".git",
    ".github",
    ".research",
    "data",
    "docs",
    "node_modules",
    "output",
    "reports",
    "scripts",
    "shared",
    "storage",
    "tests",
    "verification",
  ]);
  const files = [];

  function visit(directory) {
    fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
      if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
        return;
      }
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
      } else if (entry.isFile() && entry.name.endsWith(".html")) {
        files.push(entryPath);
      }
    });
  }

  visit(rootDir);
  return files.sort();
}

module.exports = {
  SITE_ORIGIN,
  decodeEntities,
  fileToRoute,
  normalizeRoute,
  parseHtml,
  routeToFile,
  walkHtmlFiles,
};
