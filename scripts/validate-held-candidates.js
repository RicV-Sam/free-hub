const fs = require("fs");
const path = require("path");
const shared = require("../shared/page-data.js");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT_DIR, "data", "competitions.json");

function parseArgs(argv) {
  const options = {
    dataPath: DATA_PATH,
    allowMissing: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--allow-missing") {
      options.allowMissing = true;
      continue;
    }

    if (arg === "--data") {
      options.dataPath = path.resolve(argv[index + 1]);
      index += 1;
      continue;
    }

    if (arg.startsWith("--data=")) {
      options.dataPath = path.resolve(arg.split("=").slice(1).join("="));
    }
  }

  return options;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isImportedHeldRow(row) {
  return row && row.sourceSystem === "za-comp-engine" && row.sourceReviewStatus === "manual-review-required";
}

function collectHtmlFiles(directory, results = []) {
  if (!fs.existsSync(directory)) return results;

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (
      entry.name === ".git" ||
      entry.name === "data" ||
      entry.name === "scripts" ||
      entry.name === "shared" ||
      entry.name === "node_modules" ||
      entry.name === ".research" ||
      entry.name === "free-hub"
    ) {
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

function isExpired(dateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const closing = new Date(dateString);
  closing.setHours(0, 0, 0, 0);
  return Number.isNaN(closing.getTime()) || closing < today;
}

function requireField(errors, row, field) {
  if (!asString(row[field])) {
    errors.push(`${row.id || "held row"} missing ${field}.`);
  }
}

function validateRows(competitions, heldRows) {
  const errors = [];
  const warnings = [];
  const seenIds = new Map();

  competitions.forEach((competition, index) => {
    if (!competition.id) return;
    if (seenIds.has(competition.id)) {
      errors.push(`Duplicate id "${competition.id}" at indexes ${seenIds.get(competition.id)} and ${index}.`);
    } else {
      seenIds.set(competition.id, index);
    }
  });

  heldRows.forEach((row) => {
    const label = row.id || row.sourceHandoffId || row.title || "held row";

    if (row.verificationStatus !== "needs-verification") {
      errors.push(`${label} must have verificationStatus=needs-verification.`);
    }
    if (row.verificationStatus === "published") {
      errors.push(`${label} must not be published.`);
    }
    if (row.publicationStatus !== "held") {
      errors.push(`${label} must preserve publicationStatus=held.`);
    }
    if (row.doNotPublish !== true) {
      errors.push(`${label} must preserve doNotPublish=true.`);
    }

    [
      "id",
      "title",
      "brand",
      "summary",
      "sourceUrl",
      "termsUrl",
      "closingDate",
      "entryType",
      "entryChannel",
      "entryCostType",
      "entryFeeLabel",
      "eligibility",
      "verificationNote",
      "sourceHandoffId",
      "sourceReport",
      "evidenceNotes",
      "imageReviewNote",
    ].forEach((field) => requireField(errors, row, field));

    if (!Array.isArray(row.riskFlags) || row.riskFlags.length === 0) {
      errors.push(`${label} must preserve riskFlags.`);
    }
    if (!Array.isArray(row.validationWarnings)) {
      errors.push(`${label} must preserve validationWarnings.`);
    }
    if (!Array.isArray(row.entrySteps) || row.entrySteps.length === 0) {
      errors.push(`${label} must preserve entrySteps.`);
    }
    if (row.purchaseRequired === true && !asString(row.requiredProduct)) {
      warnings.push(`${label} is purchase-required but has no requiredProduct.`);
    }
  });

  return { errors, warnings };
}

function validatePublicArtifacts(competitions, heldRows) {
  const errors = [];
  const htmlFiles = collectHtmlFiles(ROOT_DIR);
  const sitemapPath = path.join(ROOT_DIR, "sitemap.xml");
  const sitemap = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, "utf8") : "";

  heldRows.forEach((row) => {
    const slug = shared.getCompetitionSlug(row);
    const detailPath = path.join(ROOT_DIR, "competition", slug, "index.html");
    const outPath = path.join(ROOT_DIR, "out", slug, "index.html");
    const needles = [slug, row.sourceHandoffId, row.termsUrl].filter(Boolean);

    if (fs.existsSync(detailPath)) {
      errors.push(`${row.id} has a generated public competition detail page: ${detailPath}.`);
    }
    if (fs.existsSync(outPath)) {
      errors.push(`${row.id} has a generated public /out/ redirect page: ${outPath}.`);
    }
    if (sitemap.includes(`/competition/${slug}/`) || sitemap.includes(`/out/${slug}/`)) {
      errors.push(`${row.id} appears in sitemap.xml.`);
    }

    htmlFiles.forEach((filePath) => {
      if (filePath === detailPath || filePath === outPath) return;
      const html = fs.readFileSync(filePath, "utf8");
      const matched = needles.find((needle) => html.includes(needle));
      if (matched) {
        errors.push(`${row.id} appears in generated public HTML (${filePath}) via "${matched}".`);
      }
    });
  });

  const firstActivePublished = competitions.find(
    (competition) => competition.verificationStatus === "published" && !isExpired(competition.closingDate)
  );
  if (firstActivePublished) {
    const publishedSlug = shared.getCompetitionSlug(firstActivePublished);
    const publishedDetailPath = path.join(ROOT_DIR, "competition", publishedSlug, "index.html");
    const publishedOutPath = path.join(ROOT_DIR, "out", publishedSlug, "index.html");

    if (!fs.existsSync(publishedDetailPath)) {
      errors.push(`Published competition detail page missing for ${firstActivePublished.id}.`);
    }
    if (!fs.existsSync(publishedOutPath)) {
      errors.push(`Published competition /out/ page missing for ${firstActivePublished.id}.`);
    }
    if (!sitemap.includes(`/competition/${publishedSlug}/`)) {
      errors.push(`Published active competition ${firstActivePublished.id} is missing from sitemap.xml.`);
    }
  }

  return errors;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const competitions = readJson(options.dataPath);
  if (!Array.isArray(competitions)) {
    throw new Error("Freehub competitions data must be a JSON array.");
  }

  const heldRows = competitions.filter(isImportedHeldRow);
  if (heldRows.length === 0 && !options.allowMissing) {
    console.error("No ZA Comp Engine held rows found in data/competitions.json.");
    process.exit(1);
  }

  if (heldRows.length === 0 && options.allowMissing) {
    console.log("No ZA Comp Engine held rows found; allow-missing mode passed.");
    return;
  }

  const rowValidation = validateRows(competitions, heldRows);
  const artifactErrors = validatePublicArtifacts(competitions, heldRows);
  const errors = [...rowValidation.errors, ...artifactErrors];

  const summary = {
    dataPath: options.dataPath,
    heldRows: heldRows.length,
    heldRowIds: heldRows.map((row) => row.id),
    errors: errors.length,
    warnings: rowValidation.warnings.length,
    warningDetails: rowValidation.warnings,
  };

  if (errors.length > 0) {
    console.error("Held candidate validation failed.");
    errors.forEach((error) => console.error(`- ${error}`));
    console.error(JSON.stringify(summary, null, 2));
    process.exit(1);
  }

  console.log("Held candidate validation passed.");
  console.log(JSON.stringify(summary, null, 2));
}

main();
