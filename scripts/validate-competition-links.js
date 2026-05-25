const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT_DIR, "data", "competitions.json");

const args = new Set(process.argv.slice(2));
const publishedOnly = args.has("--published-only");
const jsonOnly = args.has("--json");
const timeoutArg = process.argv.find((arg) => arg.startsWith("--timeout="));
const concurrencyArg = process.argv.find((arg) => arg.startsWith("--concurrency="));
const timeoutMs = timeoutArg ? Number(timeoutArg.split("=")[1]) : 25000;
const concurrency = concurrencyArg ? Number(concurrencyArg.split("=")[1]) : 8;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36 FreeHubValidator/1.0";
const MANUAL_OK_LINKS = new Map([
  [
    "capitec-moneyup-academy-competition-2026",
    "https://www.capitecbank.co.za/globalassets/pages/competition-and-conditions/competitions/2026/moneyup-academy-competition-rules-2026.pdf",
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
    "spur-family-cruises-with-spur-2026",
    "https://www.spursteakranches.com/za/promotions",
  ],
  [
    "spur-ultimate-springboks-match-day-experience-2026",
    "https://www.spursteakranches.com/za/promotions/win-the-ultimate-springboks-match-day-experience",
  ],
]);

function loadCompetitions() {
  const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  return raw.filter((competition) => {
    if (!competition || !competition.url) {
      return false;
    }

    if (publishedOnly) {
      return competition.verificationStatus === "published";
    }

    return true;
  });
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

function getManualOkResult(competition) {
  if (competition.linkValidationStatus !== "manual-ok") {
    return null;
  }

  const expectedUrl = MANUAL_OK_LINKS.get(competition.id);
  let hostname = "";

  try {
    hostname = new URL(competition.url).hostname.toLowerCase();
  } catch (error) {
    return {
      level: "error",
      reason: "invalid-manual-ok-url",
    };
  }

  if (
    !expectedUrl ||
    competition.url !== expectedUrl ||
    ![
      "capitecbank.co.za",
      "www.capitecbank.co.za",
      "clicks.co.za",
      "www.clicks.co.za",
      "spursteakranches.com",
      "www.spursteakranches.com",
    ].includes(hostname) ||
    !competition.linkValidationReason ||
    !competition.linkValidationCheckedAt
  ) {
    return {
      level: "error",
      reason: "invalid-manual-ok",
    };
  }

  return {
    level: "ok",
    reason: "manual-ok",
  };
}

async function fetchCompetition(competition) {
  const manualOkResult = getManualOkResult(competition);
  if (manualOkResult) {
    return {
      id: competition.id,
      title: competition.title,
      verificationStatus: competition.verificationStatus || "unset",
      category: competition.category || "",
      closingDate: competition.closingDate || "",
      url: competition.url,
      finalUrl: competition.url,
      httpStatus: null,
      level: manualOkResult.level,
      reason: manualOkResult.reason,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(competition.url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": USER_AGENT,
        "accept-language": "en-US,en;q=0.9",
      },
    });

    const bodyText = await response.text().catch(() => "");
    const classification = classifyResult(response.status, response.url, bodyText);

    return {
      id: competition.id,
      title: competition.title,
      verificationStatus: competition.verificationStatus || "unset",
      category: competition.category || "",
      closingDate: competition.closingDate || "",
      url: competition.url,
      finalUrl: response.url,
      httpStatus: response.status,
      level: classification.level,
      reason: classification.reason,
    };
  } catch (error) {
    return {
      id: competition.id,
      title: competition.title,
      verificationStatus: competition.verificationStatus || "unset",
      category: competition.category || "",
      closingDate: competition.closingDate || "",
      url: competition.url,
      finalUrl: "",
      httpStatus: null,
      level: "error",
      reason: error.name === "AbortError" ? "timeout" : error.code || error.message || "fetch-error",
    };
  } finally {
    clearTimeout(timer);
  }
}

async function runWithConcurrency(items, workerFn) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const currentIndex = index++;
      results.push(await workerFn(items[currentIndex]));
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  results.sort((a, b) => a.id.localeCompare(b.id));
  return results;
}

function buildSummary(results) {
  return results.reduce(
    (accumulator, result) => {
      accumulator.total += 1;
      accumulator[result.level] += 1;
      accumulator.byReason[result.reason] = (accumulator.byReason[result.reason] || 0) + 1;
      return accumulator;
    },
    {
      total: 0,
      ok: 0,
      error: 0,
      byReason: {},
    }
  );
}

function printHumanReport(summary, failures) {
  console.log("=== Competition Link Validation ===");
  console.log(`Scope: ${publishedOnly ? "published competitions only" : "all competitions with URLs"}`);
  console.log(`Total checked: ${summary.total}`);
  console.log(`OK: ${summary.ok}`);
  console.log(`Errors: ${summary.error}`);
  console.log("");

  if (Object.keys(summary.byReason).length > 0) {
    console.log("Failure reasons:");
    Object.entries(summary.byReason)
      .sort((a, b) => b[1] - a[1])
      .forEach(([reason, count]) => {
        console.log(`- ${reason}: ${count}`);
      });
    console.log("");
  }

  if (failures.length === 0) {
    console.log("No broken or suspicious competition URLs detected.");
    return;
  }

  console.log("Failures:");
  failures.forEach((failure) => {
    console.log(
      `- ${failure.id} | ${failure.reason} | ${failure.httpStatus ?? "no-status"} | ${failure.finalUrl || failure.url}`
    );
  });
}

async function main() {
  const competitions = loadCompetitions();
  const results = await runWithConcurrency(competitions, fetchCompetition);
  const failures = results.filter((result) => result.level !== "ok");
  const summary = buildSummary(results);
  const output = {
    generatedAt: new Date().toISOString(),
    scope: publishedOnly ? "published-only" : "all-with-urls",
    summary,
    failures,
  };

  if (jsonOnly) {
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  printHumanReport(summary, failures);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
