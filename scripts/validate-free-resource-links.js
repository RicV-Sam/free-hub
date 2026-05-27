const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT_DIR, "data", "free-resources.json");
const resources = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const timeoutMs = Number(process.env.FREE_RESOURCE_LINK_TIMEOUT_MS || 20000);
const manualRecheckDays = 30;

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});

async function main() {
  const failures = [];
  const warnings = [];
  const manualOkResources = resources.filter((resource) => resource.manualOk);

  for (const resource of resources) {
    const metadataFailures = validateResourceMetadata(resource);
    failures.push(...metadataFailures);

    if (metadataFailures.length > 0) {
      continue;
    }

    const result = await checkResource(resource);

    if (!result.ok) {
      failures.push(result);
    } else if (result.manualOk) {
      warnings.push(result);
    }
  }

  console.log("=== Free Resource Link Validation ===");
  console.log(`Total checked: ${resources.length}`);
  console.log(`OK: ${resources.length - failures.length}`);
  console.log(`Manual OK: ${manualOkResources.length}`);
  console.log(`Warnings: ${warnings.length}`);
  console.log(`Errors: ${failures.length}`);

  if (manualOkResources.length > 0) {
    console.log("");
    console.log("Manual OK exceptions (warning summary):");
    manualOkResources.forEach((resource) => {
      console.log(
        `- ${resource.name}: checked ${resource.manualOkCheckedAt || "unknown"}, recheck by ${
          addDays(resource.manualOkCheckedAt, manualRecheckDays) || "unknown"
        }`
      );
    });
  }

  if (warnings.length > 0) {
    console.log("");
    console.log("Warnings:");
    warnings.forEach((warning) => {
      console.log(`- ${warning.name}: ${warning.url} (${warning.reason})`);
    });
  }

  if (failures.length > 0) {
    console.log("");
    console.log("Failures:");
    failures.forEach((failure) => {
      console.log(`- ${failure.name}: ${failure.url || "(no URL)"} (${failure.reason})`);
    });
    process.exitCode = 1;
  }
}

function validateResourceMetadata(resource) {
  const failures = [];
  const label = resource.name || "(unnamed free resource)";
  const requiredFields = [
    "name",
    "category",
    "categoryLabel",
    "officialUrl",
    "bestFor",
    "freeDetails",
    "requirements",
    "watchOut",
    "datePublished",
    "lastReviewed",
    "dateModified",
  ];

  requiredFields.forEach((field) => {
    if (!resource[field]) {
      failures.push({ ok: false, name: label, url: resource.officialUrl || "", reason: `missing ${field}` });
    }
  });

  ["datePublished", "lastReviewed", "dateModified"].forEach((field) => {
    if (resource[field] && !isValidIsoDate(resource[field])) {
      failures.push({ ok: false, name: label, url: resource.officialUrl || "", reason: `invalid ${field}` });
    }
  });

  if (resource.manualOk) {
    failures.push(...validateManualOk(resource));
  }

  return failures;
}

function validateManualOk(resource) {
  const failures = [];
  const label = resource.name || "(unnamed free resource)";
  const url = String(resource.officialUrl || "").trim();
  const hostname = getHostname(url);
  const allowedDomain = normalizeHostname(resource.manualOkAllowedDomain);

  if (!resource.manualOkReason) {
    failures.push({ ok: false, name: label, url, reason: "manualOk missing manualOkReason" });
  }

  if (!resource.manualOkCheckedAt) {
    failures.push({ ok: false, name: label, url, reason: "manualOk missing manualOkCheckedAt" });
  } else if (!isValidIsoDate(resource.manualOkCheckedAt)) {
    failures.push({ ok: false, name: label, url, reason: "manualOk has invalid manualOkCheckedAt" });
  } else if (getAgeDays(resource.manualOkCheckedAt) > manualRecheckDays) {
    failures.push({ ok: false, name: label, url, reason: `manualOk exception is older than ${manualRecheckDays} days` });
  }

  if (!allowedDomain) {
    failures.push({ ok: false, name: label, url, reason: "manualOk missing manualOkAllowedDomain" });
  } else if (!hostname || normalizeHostname(hostname) !== allowedDomain) {
    failures.push({ ok: false, name: label, url, reason: "manualOk URL hostname does not match manualOkAllowedDomain" });
  }

  if (!resource.manualOkEvidence) {
    failures.push({ ok: false, name: label, url, reason: "manualOk missing manualOkEvidence" });
  }

  if (isGenericHomepage(url) && resource.manualOkAllowGenericHomepage !== true) {
    failures.push({ ok: false, name: label, url, reason: "manualOk URL is a generic homepage" });
  }

  return failures;
}

async function checkResource(resource) {
  const url = String(resource.officialUrl || "").trim();

  if (resource.internal) {
    const pathname = new URL(url).pathname;
    const filePath =
      pathname === "/"
        ? path.join(ROOT_DIR, "index.html")
        : path.join(ROOT_DIR, pathname.replace(/^\//, ""), "index.html");

    return fs.existsSync(filePath)
      ? { ok: true }
      : { ok: false, name: resource.name, url, reason: "missing internal generated page" };
  }

  try {
    const response = await fetchWithRetry(url, { method: "HEAD" });

    if (isAcceptableStatus(response.status)) {
      return { ok: true };
    }

    const fallback = await fetchWithRetry(url, { method: "GET" });
    if (isAcceptableStatus(fallback.status)) {
      return { ok: true };
    }

    return resource.manualOk
      ? { ok: true, manualOk: true, name: resource.name, url, reason: `manual-ok after HTTP ${fallback.status}` }
      : { ok: false, name: resource.name, url, reason: `HTTP ${fallback.status}` };
  } catch (error) {
    return resource.manualOk
      ? { ok: true, manualOk: true, name: resource.name, url, reason: `manual-ok after ${error.message}` }
      : { ok: false, name: resource.name, url, reason: error.message };
  }
}

function isAcceptableStatus(status) {
  return status >= 200 && status < 400;
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent": "Freehub link checker (+https://freehub.co.za/)",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWithRetry(url, options) {
  let lastError = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await fetchWithTimeout(url, options);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
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
