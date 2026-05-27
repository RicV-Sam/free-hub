const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT_DIR, "data", "free-resources.json");
const resources = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const timeoutMs = Number(process.env.FREE_RESOURCE_LINK_TIMEOUT_MS || 20000);

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});

async function main() {
  const failures = [];
  let manualOk = 0;

  for (const resource of resources) {
    const result = await checkResource(resource);
    if (result.manualOk) {
      manualOk += 1;
      continue;
    }
    if (!result.ok) {
      failures.push(result);
    }
  }

  console.log("=== Free Resource Link Validation ===");
  console.log(`Total checked: ${resources.length}`);
  console.log(`OK: ${resources.length - failures.length}`);
  console.log(`Manual OK: ${manualOk}`);
  console.log(`Errors: ${failures.length}`);

  if (failures.length > 0) {
    failures.forEach((failure) => {
      console.log(`- ${failure.name}: ${failure.url} (${failure.reason})`);
    });
    process.exitCode = 1;
  }
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
    const response = await fetchWithTimeout(url, { method: "HEAD" });

    if (isAcceptableStatus(response.status)) {
      return { ok: true };
    }

    const fallback = await fetchWithTimeout(url, { method: "GET" });
    if (isAcceptableStatus(fallback.status)) {
      return { ok: true };
    }

    return resource.manualOk
      ? { ok: true, manualOk: true }
      : { ok: false, name: resource.name, url, reason: `HTTP ${fallback.status}` };
  } catch (error) {
    return resource.manualOk
      ? { ok: true, manualOk: true }
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
