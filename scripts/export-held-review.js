const fs = require("fs");
const path = require("path");
const shared = require("../shared/page-data.js");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT_DIR, "data", "competitions.json");
const EXPORT_DIR = path.join(ROOT_DIR, "storage", "exports");
const JSON_EXPORT_PATH = path.join(EXPORT_DIR, "held-candidates-review.json");
const CSV_EXPORT_PATH = path.join(EXPORT_DIR, "held-candidates-review.csv");

const EXPECTED_HELD_IDS = [
  "capitec-moneyup-academy-competition-2026",
  "dis-chem-garnier-pure-active-june-2026-competition",
];

const REVIEW_FIELDS = [
  "id",
  "slug",
  "brand",
  "title",
  "verificationStatus",
  "publicationStatus",
  "doNotPublish",
  "sourceUrl",
  "termsUrl",
  "closingDate",
  "prize",
  "entryMethod",
  "costOrPurchaseRequirement",
  "eligibility",
  "riskFlags",
  "imageNotes",
  "missingFields",
  "reviewerChecklist",
  "recommendedNextAction",
];

const REVIEWER_CHECKLIST = [
  "Open the official source and terms pages directly.",
  "Confirm the prize, closing date, entry route and eligibility in the official terms.",
  "Confirm whether the entry route is free, account-based, purchase-required or loyalty-linked.",
  "Resolve or accept each risk flag before any publication decision.",
  "Use only official campaign imagery, or leave the listing without an image.",
  "Keep verificationStatus as needs-verification and doNotPublish as true until a separate publish decision is approved.",
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isExpectedHeldRow(row) {
  return row && EXPECTED_HELD_IDS.includes(row.id);
}

function isImportedHeldRow(row) {
  return (
    row &&
    row.sourceSystem === "za-comp-engine" &&
    row.sourceReviewStatus === "manual-review-required" &&
    row.publicationStatus === "held" &&
    row.doNotPublish === true
  );
}

function getRecommendedNextAction(row) {
  const flags = new Set(asArray(row.riskFlags));

  if (row.verificationStatus !== "needs-verification" || row.publicationStatus !== "held" || row.doNotPublish !== true) {
    return "reject_or_archive";
  }

  if (flags.has("image_unresolved")) {
    return "needs_more_evidence";
  }

  if (
    flags.has("purchase_required") ||
    flags.has("loyalty_required") ||
    flags.has("account_required") ||
    flags.has("sms_verification") ||
    flags.has("weekly_recurring_draw")
  ) {
    return "needs_more_evidence";
  }

  return "ready_for_publication_review_later";
}

function getMissingFields(row) {
  const required = [
    "id",
    "brand",
    "title",
    "verificationStatus",
    "publicationStatus",
    "sourceUrl",
    "termsUrl",
    "closingDate",
    "prizeName",
    "entryType",
    "costOrPurchaseRequirement",
    "eligibility",
    "imageReviewNote",
  ];

  const missing = required.filter((field) => {
    if (field === "publicationStatus") return row[field] !== "held";
    if (field === "verificationStatus") return row[field] !== "needs-verification";
    return !asString(row[field]);
  });

  if (row.doNotPublish !== true) {
    missing.push("doNotPublish");
  }
  if (asArray(row.riskFlags).length === 0) {
    missing.push("riskFlags");
  }

  return missing;
}

function buildReviewRow(row) {
  const slug = shared.getCompetitionSlug(row);
  return {
    id: row.id,
    slug,
    brand: row.brand,
    title: row.title,
    verificationStatus: row.verificationStatus,
    publicationStatus: row.publicationStatus || "",
    doNotPublish: row.doNotPublish === true,
    sourceUrl: row.sourceUrl || row.url || "",
    termsUrl: row.termsUrl || "",
    closingDate: row.closingDate || "",
    prize: row.prizeName || "",
    entryMethod: row.entryChannel || row.entryType || "",
    costOrPurchaseRequirement: row.costOrPurchaseRequirement || row.entryFeeLabel || "",
    eligibility: row.eligibility || "",
    riskFlags: asArray(row.riskFlags),
    imageNotes: row.imageReviewNote || "",
    missingFields: getMissingFields(row),
    reviewerChecklist: REVIEWER_CHECKLIST,
    recommendedNextAction: getRecommendedNextAction(row),
  };
}

function csvEscape(value) {
  const normalized = Array.isArray(value) ? value.join(" | ") : String(value ?? "");
  return `"${normalized.replace(/"/g, '""')}"`;
}

function writeCsv(filePath, rows) {
  const lines = [
    REVIEW_FIELDS.join(","),
    ...rows.map((row) => REVIEW_FIELDS.map((field) => csvEscape(row[field])).join(",")),
  ];
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`);
}

function collectHtmlFiles(directory, results = []) {
  if (!fs.existsSync(directory)) return results;

  const ignoredDirectories = new Set([
    ".git",
    ".github",
    ".research",
    "data",
    "docs",
    "free-hub",
    "node_modules",
    "scripts",
    "shared",
    "storage",
  ]);

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collectHtmlFiles(fullPath, results);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      results.push(fullPath);
    }
  }

  return results;
}

function validateHeldRows(rows) {
  const errors = [];
  const foundIds = new Set(rows.map((row) => row.id));

  EXPECTED_HELD_IDS.forEach((id) => {
    if (!foundIds.has(id)) {
      errors.push(`Expected held row missing from data: ${id}`);
    }
  });

  rows.forEach((row) => {
    if (!isImportedHeldRow(row)) {
      errors.push(`${row.id} is not preserved as an imported held row.`);
    }
    if (row.verificationStatus !== "needs-verification") {
      errors.push(`${row.id} must not be marked published.`);
    }
    if (row.doNotPublish !== true) {
      errors.push(`${row.id} must keep doNotPublish=true.`);
    }
  });

  return errors;
}

function validatePublicSafety(rows) {
  const errors = [];
  const htmlFiles = collectHtmlFiles(ROOT_DIR);
  const sitemapPath = path.join(ROOT_DIR, "sitemap.xml");
  const sitemap = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, "utf8") : "";

  rows.forEach((row) => {
    const slug = shared.getCompetitionSlug(row);
    const detailPath = path.join(ROOT_DIR, "competition", slug, "index.html");
    const outPath = path.join(ROOT_DIR, "out", slug, "index.html");
    const needles = [row.id, slug, row.sourceHandoffId, row.termsUrl].filter(Boolean);

    if (fs.existsSync(detailPath)) {
      errors.push(`${row.id} has a generated public detail page.`);
    }
    if (fs.existsSync(outPath)) {
      errors.push(`${row.id} has a generated public /out/ redirect.`);
    }
    if (sitemap.includes(`/competition/${slug}/`) || sitemap.includes(`/out/${slug}/`)) {
      errors.push(`${row.id} appears in sitemap.xml.`);
    }

    htmlFiles.forEach((filePath) => {
      const html = fs.readFileSync(filePath, "utf8");
      const matched = needles.find((needle) => html.includes(needle));
      if (matched) {
        errors.push(`${row.id} appears in public HTML at ${path.relative(ROOT_DIR, filePath)} via "${matched}".`);
      }
    });
  });

  return errors;
}

function main() {
  const competitions = readJson(DATA_PATH);
  if (!Array.isArray(competitions)) {
    throw new Error("Freehub competitions data must be a JSON array.");
  }

  const heldRows = competitions.filter(isExpectedHeldRow);
  const rowErrors = validateHeldRows(heldRows);
  const publicSafetyErrors = validatePublicSafety(heldRows);
  const errors = [...rowErrors, ...publicSafetyErrors];

  if (errors.length > 0) {
    console.error("Held review export failed.");
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  const reviewRows = heldRows.map(buildReviewRow);
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
  writeJson(JSON_EXPORT_PATH, reviewRows);
  writeCsv(CSV_EXPORT_PATH, reviewRows);

  console.log("Held review export completed.");
  console.log(
    JSON.stringify(
      {
        rows: reviewRows.length,
        ids: reviewRows.map((row) => row.id),
        decisions: reviewRows.map((row) => ({
          id: row.id,
          recommendedNextAction: row.recommendedNextAction,
        })),
        files: [path.relative(ROOT_DIR, JSON_EXPORT_PATH), path.relative(ROOT_DIR, CSV_EXPORT_PATH)],
        publicSafetyChecks: {
          detailPagesExcluded: true,
          outRedirectsExcluded: true,
          sitemapEntriesExcluded: true,
          publicHtmlExcluded: true,
          storageExportsNotScannedAsPublicHtml: true,
        },
      },
      null,
      2
    )
  );
}

main();
