const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT_DIR, "data", "competitions.json");

function inferPrizeType(competition) {
  const tags = new Set(Array.isArray(competition.tags) ? competition.tags : []);
  const category = String(competition.category || "").trim().toLowerCase();

  if (String(competition.prizeType || "").trim()) {
    return competition.prizeType;
  }

  if (category === "cars") return "car";
  if (category === "cash" || tags.has("cash")) return "cash";
  if (category === "vouchers" || tags.has("vouchers")) return "voucher";
  if (category === "holidays" || tags.has("holidays")) return "holiday";
  if (category === "tech" || tags.has("electronics")) return "tech";

  return "";
}

function normalizeCompetition(competition) {
  const normalized = { ...competition };
  const tags = Array.isArray(normalized.tags) ? normalized.tags : [];
  const isPublished = normalized.verificationStatus === "published";
  const changes = [];

  if (isPublished && tags.includes("purchase-required") && normalized.purchaseRequired !== true) {
    normalized.purchaseRequired = true;
    changes.push("purchaseRequired");
  }

  if (isPublished && (normalized.isHighValue === true || tags.includes("high-value")) && !normalized.prizeType) {
    const prizeType = inferPrizeType(normalized);

    if (prizeType) {
      normalized.prizeType = prizeType;
      changes.push("prizeType");
    }
  }

  return { normalized, changes };
}

function main() {
  const competitions = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const report = {
    updatedEntries: 0,
    purchaseRequiredFixes: 0,
    prizeTypeFixes: 0,
  };

  const normalizedCompetitions = competitions.map((competition) => {
    const { normalized, changes } = normalizeCompetition(competition);

    if (changes.length > 0) {
      report.updatedEntries += 1;
      if (changes.includes("purchaseRequired")) report.purchaseRequiredFixes += 1;
      if (changes.includes("prizeType")) report.prizeTypeFixes += 1;
    }

    return normalized;
  });

  fs.writeFileSync(DATA_PATH, `${JSON.stringify(normalizedCompetitions, null, 2)}\n`);

  console.log("=== Competition Metadata Normalization ===");
  console.log(`Updated entries: ${report.updatedEntries}`);
  console.log(`purchaseRequired fixes: ${report.purchaseRequiredFixes}`);
  console.log(`prizeType fixes: ${report.prizeTypeFixes}`);
}

main();
