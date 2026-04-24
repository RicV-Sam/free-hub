const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT_DIR, "data", "competitions.json");
const ARCHIVE_DIR = path.join(ROOT_DIR, "data", "archive");
const ARCHIVE_PATH = path.join(ARCHIVE_DIR, "competitions-expired.json");

function parseArgs(argv) {
  const options = {
    archiveExpired: false,
    today: null,
  };

  argv.forEach((arg) => {
    if (arg === "--archive-expired") {
      options.archiveExpired = true;
      return;
    }

    if (arg.startsWith("--today=")) {
      options.today = arg.split("=")[1] || null;
    }
  });

  return options;
}

function normalizeDate(value) {
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(String(value))
    ? new Date(`${value}T00:00:00`)
    : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }

  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function classifyCompetitions(competitions, today) {
  const expired = [];
  const active = [];
  const closingSoon = [];

  competitions.forEach((competition) => {
    const closingDate = normalizeDate(competition.closingDate);
    const diffDays = Math.ceil((closingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      expired.push(competition);
      return;
    }

    active.push(competition);
    if (diffDays <= 14) {
      closingSoon.push({ ...competition, daysUntilClose: diffDays });
    }
  });

  return { expired, active, closingSoon };
}

function archiveExpiredCompetitions(expired, todayIso) {
  if (expired.length === 0) {
    return;
  }

  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });

  const existingArchive = fs.existsSync(ARCHIVE_PATH)
    ? JSON.parse(fs.readFileSync(ARCHIVE_PATH, "utf8"))
    : [];
  const existingIds = new Set(existingArchive.map((entry) => entry.id));

  const archiveAdds = expired
    .filter((competition) => !existingIds.has(competition.id))
    .map((competition) => ({
      ...competition,
      archivedAt: todayIso,
      archiveReason: "expired",
    }));

  if (archiveAdds.length > 0) {
    const updatedArchive = [...existingArchive, ...archiveAdds];
    fs.writeFileSync(ARCHIVE_PATH, `${JSON.stringify(updatedArchive, null, 2)}\n`);
  }
}

function saveActiveCompetitions(active) {
  fs.writeFileSync(DATA_PATH, `${JSON.stringify(active, null, 2)}\n`);
}

function printSummary({ total, expired, active, closingSoon, keywordCoverage, options, todayIso }) {
  console.log("=== Competition Maintenance Report ===");
  console.log(`Date: ${todayIso}`);
  console.log(`Mode: ${options.archiveExpired ? "archive-expired" : "dry-run"}`);
  console.log(`Total competitions: ${total}`);
  console.log(`Active competitions: ${active.length}`);
  console.log(`Expired competitions: ${expired.length}`);
  console.log(`Closing in next 14 days: ${closingSoon.length}`);

  if (expired.length > 0) {
    console.log("\nExpired competition IDs:");
    expired
      .slice()
      .sort((left, right) => new Date(left.closingDate) - new Date(right.closingDate))
      .forEach((competition) => {
        console.log(`- ${competition.id} (${competition.closingDate})`);
      });
  }

  if (closingSoon.length > 0) {
    console.log("\nClosing soon (next 14 days):");
    closingSoon
      .slice()
      .sort((left, right) => left.daysUntilClose - right.daysUntilClose)
      .forEach((competition) => {
        console.log(`- ${competition.id} (${competition.daysUntilClose} days)`);
      });
  }

  console.log("\nKeyword cluster coverage (active data scan):");
  Object.entries(keywordCoverage).forEach(([cluster, details]) => {
    console.log(`- ${cluster}: ${details.hits}/${details.total} terms present`);
    if (details.missing.length > 0) {
      console.log(`  Missing: ${details.missing.join(", ")}`);
    }
  });

  if (options.archiveExpired) {
    console.log("\nApplied changes:");
    console.log(`- Archived expired entries to ${ARCHIVE_PATH}`);
    console.log(`- Removed expired entries from ${DATA_PATH}`);
    console.log("- Next step: run `node scripts/generate-pages.js` and deploy.");
  }
}

function scanKeywordCoverage(activeCompetitions) {
  const text = activeCompetitions
    .map((competition) => `${competition.title} ${competition.summary || ""}`.toLowerCase())
    .join("\n");

  const clusters = {
    cars: [
      "free car competitions south africa",
      "current car competitions",
      "win a car competition free entry",
    ],
    holidays: ["win a holiday south africa", "holiday giveaway", "local getaway competition"],
    cash: ["cash competitions south africa", "win cash online south africa"],
    vouchers: ["voucher giveaway", "voucher competitions south africa", "takealot competitions"],
    tech: ["gadget giveaway", "smartphone competition", "tech giveaways south africa"],
  };

  const coverage = {};
  Object.entries(clusters).forEach(([cluster, terms]) => {
    const missing = terms.filter((term) => !text.includes(term));
    coverage[cluster] = {
      total: terms.length,
      hits: terms.length - missing.length,
      missing,
    };
  });

  return coverage;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const today = options.today ? normalizeDate(options.today) : normalizeDate(new Date());
  const todayIso = formatDateLocal(today);

  const competitions = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const { expired, active, closingSoon } = classifyCompetitions(competitions, today);
  const keywordCoverage = scanKeywordCoverage(active);

  if (options.archiveExpired) {
    archiveExpiredCompetitions(expired, todayIso);
    saveActiveCompetitions(active);
  }

  printSummary({
    total: competitions.length,
    expired,
    active,
    closingSoon,
    keywordCoverage,
    options,
    todayIso,
  });
}

main();
