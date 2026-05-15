const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT_DIR, "data", "competitions.json");
const DEFAULT_HANDOFF_PATH = path.resolve(
  ROOT_DIR,
  "..",
  "Za Comp Engine",
  "storage",
  "exports",
  "freehub-handoff-candidates.json"
);

const OFFICIAL_DOMAINS = {
  Capitec: ["capitecbank.co.za", "moneyup.co.za"],
  "Dis-Chem": ["dischem.co.za"],
};

function parseArgs(argv) {
  const options = {
    dryRun: false,
    inputPath: DEFAULT_HANDOFF_PATH,
    validationPath: null,
    dataPath: DATA_PATH,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--input" || arg === "--handoff") {
      options.inputPath = path.resolve(argv[index + 1]);
      index += 1;
      continue;
    }

    if (arg.startsWith("--input=") || arg.startsWith("--handoff=")) {
      options.inputPath = path.resolve(arg.split("=").slice(1).join("="));
      continue;
    }

    if (arg === "--validation") {
      options.validationPath = path.resolve(argv[index + 1]);
      index += 1;
      continue;
    }

    if (arg.startsWith("--validation=")) {
      options.validationPath = path.resolve(arg.split("=").slice(1).join("="));
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

  if (!options.validationPath) {
    options.validationPath = path.join(path.dirname(options.inputPath), "freehub-handoff-validation.json");
  }

  return options;
}

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

function getHost(value) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch (_error) {
    return "";
  }
}

function isOfficialUrl(brand, value) {
  const host = getHost(value);
  const allowed = OFFICIAL_DOMAINS[brand] || [];
  return allowed.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function validateHandoff(handoff, validation) {
  const errors = [];

  if (!handoff || typeof handoff !== "object" || !Array.isArray(handoff.rows)) {
    errors.push("Handoff file must be an object with a rows array.");
  }

  if (!validation || typeof validation !== "object") {
    errors.push("Validation file must be a JSON object.");
  } else {
    const errorCount = Number(validation.issue_counts && validation.issue_counts.error);
    if (validation.passed !== true || errorCount > 0) {
      errors.push("ZA handoff validation must pass with zero errors before import.");
    }
  }

  if (handoff && validation && Array.isArray(handoff.rows) && Number(validation.total_rows) !== handoff.rows.length) {
    errors.push("Handoff row count does not match validation summary row count.");
  }

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
}

function getWarningCodes(validation, row) {
  const issues = Array.isArray(validation.issues) ? validation.issues : [];
  return issues
    .filter((issue) => issue && issue.severity === "warning" && issue.proposedId === row.proposedId)
    .map((issue) => issue.code)
    .filter(Boolean);
}

function validateSourceRow(row) {
  const errors = [];
  const requiredFields = [
    "proposedId",
    "proposedSlug",
    "brand",
    "title",
    "prize",
    "summary",
    "sourceUrl",
    "termsUrl",
    "closingDate",
    "entryMethod",
    "costOrPurchaseRequirement",
    "eligibility",
    "imageNotes",
    "evidenceNotes",
    "sourceReport",
  ];

  requiredFields.forEach((field) => {
    if (!asString(row[field])) {
      errors.push(`${row.proposedId || "row"} missing ${field}.`);
    }
  });

  if (row.verificationStatus !== "needs-verification") {
    errors.push(`${row.proposedId} must keep verificationStatus=needs-verification.`);
  }
  if (row.publicationStatus !== "held") {
    errors.push(`${row.proposedId} must keep publicationStatus=held.`);
  }
  if (row.sourceReviewStatus !== "manual-review-required") {
    errors.push(`${row.proposedId} must keep sourceReviewStatus=manual-review-required.`);
  }
  if (row.doNotPublish !== true) {
    errors.push(`${row.proposedId} must keep doNotPublish=true.`);
  }
  if (!Array.isArray(row.riskFlags) || row.riskFlags.length === 0) {
    errors.push(`${row.proposedId} must preserve riskFlags.`);
  }
  if (!isOfficialUrl(row.brand, row.sourceUrl)) {
    errors.push(`${row.proposedId} sourceUrl is not allowlisted as official for ${row.brand}.`);
  }
  if (!isOfficialUrl(row.brand, row.termsUrl)) {
    errors.push(`${row.proposedId} termsUrl is not allowlisted as official for ${row.brand}.`);
  }

  return errors;
}

function derivePrizeType(row) {
  const text = `${row.prize} ${asArray(row.riskFlags).join(" ")}`.toLowerCase();
  if (text.includes("event_ticket_prize") || text.includes("ticket")) return "experience";
  if (text.includes("voucher")) return "voucher";
  if (text.includes("cash")) return "cash";
  if (text.includes("car") || text.includes("vehicle")) return "car";
  if (text.includes("holiday") || text.includes("travel")) return "holiday";
  if (text.includes("phone") || text.includes("tech")) return "tech";
  return "retail";
}

function deriveCategory(prizeType) {
  if (prizeType === "car") return "Cars";
  if (prizeType === "cash") return "Cash";
  if (prizeType === "holiday") return "Holidays";
  if (prizeType === "tech") return "Tech";
  return "Vouchers";
}

function deriveNumberOfPrizes(row) {
  const match = asString(row.prize).match(/\b1\s+of\s+(\d+)\b/i);
  if (match) return match[1];
  if (/weekly/i.test(`${row.entryMethod} ${asArray(row.riskFlags).join(" ")}`)) return "Weekly draw";
  return "";
}

function deriveTags(row, prizeType) {
  const flags = new Set(asArray(row.riskFlags));
  const tags = new Set();

  if (prizeType === "voucher") tags.add("vouchers");
  if (prizeType === "experience") tags.add("experience");
  if (flags.has("purchase_required")) tags.add("purchase-required");
  if (flags.has("qualifying_products_required")) tags.add("qualifying-products");
  if (flags.has("loyalty_required")) tags.add("loyalty-required");
  if (flags.has("account_required")) tags.add("account-required");
  if (flags.has("sms_verification")) tags.add("sms-verification");
  if (flags.has("age_18_plus")) tags.add("age-18-plus");
  if (flags.has("image_unresolved")) tags.add("image-unresolved");
  if (/in-store|point of sale|swipe/i.test(row.entryMethod)) tags.add("in-store-entry");
  if (/online|academy|account|quiz|learning/i.test(row.entryMethod)) tags.add("online-entry");

  return Array.from(tags);
}

function deriveEntryType(row) {
  if (row.brand === "Dis-Chem") return "In-store Purchase";
  if (row.brand === "Capitec") return "Online / Account";
  if (/in-store|point of sale|swipe/i.test(row.entryMethod)) return "In-store";
  return "Online";
}

function deriveEntryChannel(row) {
  if (row.brand === "Dis-Chem") return "In-store purchase and Better Rewards card swipe";
  if (row.brand === "Capitec") return "MoneyUp Academy account";
  return asString(row.entryMethod).slice(0, 120);
}

function deriveEntryCostType(row) {
  const flags = new Set(asArray(row.riskFlags));
  if (flags.has("purchase_required")) return "purchase-required";
  if (flags.has("paid_entry") || flags.has("subscription") || flags.has("vas")) return "paid-entry";
  return "unknown";
}

function deriveEntryFeeLabel(row) {
  if (row.brand === "Capitec") {
    return "No purchase requirement found; MoneyUp account and RSA mobile verification required";
  }
  if (row.brand === "Dis-Chem") {
    return "Purchase required; Better Rewards card and qualifying products required";
  }
  return asString(row.costOrPurchaseRequirement);
}

function deriveEntrySteps(row) {
  if (row.brand === "Capitec") {
    return [
      "Use or create a verified MoneyUp Academy account with a registered RSA mobile number.",
      "Earn 4,000 weekly points by completing MoneyUp Academy learning, recap, or quiz activities.",
      "Keep this row held until a reviewer confirms account, SMS, age, data and voucher caveats.",
    ];
  }

  if (row.brand === "Dis-Chem") {
    return [
      "Purchase four specified Garnier Pure Active products in-store during the campaign period.",
      "Swipe a Dis-Chem Better Rewards card at point of sale.",
      "Keep this row held until a reviewer confirms purchase, loyalty-card, product and prize caveats.",
    ];
  }

  return [
    asString(row.entryMethod),
    "Keep this row held until a reviewer confirms all official terms and cost notes.",
  ];
}

function deriveRequiredProduct(row) {
  if (row.brand === "Dis-Chem") return "Four specified Garnier Pure Active products";
  return "";
}

function mapHandoffRow(row, warningCodes, nowIso, existing) {
  const prizeType = derivePrizeType(row);
  const sourceDomain = getHost(row.sourceUrl);
  const entryCostType = deriveEntryCostType(row);
  const purchaseRequired = entryCostType === "purchase-required";
  const url = row.brand === "Dis-Chem" ? row.termsUrl : row.sourceUrl;

  return {
    id: row.proposedSlug,
    title: row.title,
    brand: row.brand,
    summary: row.summary.replace(/^Held review candidate:\s*/i, ""),
    entrySteps: deriveEntrySteps(row),
    closingDate: row.closingDate,
    category: deriveCategory(prizeType),
    prizeName: row.prize,
    prizeType,
    prizeValueAmount: null,
    prizeValueCurrency: "ZAR",
    numberOfPrizes: deriveNumberOfPrizes(row),
    entryType: deriveEntryType(row),
    tags: deriveTags(row, prizeType),
    isHighValue: false,
    isEndingSoon: false,
    url,
    sourceUrl: row.sourceUrl,
    termsUrl: row.termsUrl,
    sourceDomain,
    lastChecked: row.lastCheckedAt || nowIso.slice(0, 10),
    verificationStatus: "needs-verification",
    entryCostType,
    entryFeeLabel: deriveEntryFeeLabel(row),
    purchaseRequired,
    requiredProduct: deriveRequiredProduct(row),
    entryChannel: deriveEntryChannel(row),
    region: "National",
    eligibility: row.eligibility,
    verificationNote: `Imported from ZA Comp Engine held-review handoff. ${row.evidenceNotes} Accepted held-review warnings: ${warningCodes.join(", ") || "none"}. Do not publish until manually reviewed in Freehub.`,
    sourceSystem: "za-comp-engine",
    sourceHandoffId: row.proposedId,
    proposedSlug: row.proposedSlug,
    publicationStatus: "held",
    sourceReviewStatus: "manual-review-required",
    doNotPublish: true,
    riskFlags: asArray(row.riskFlags),
    costOrPurchaseRequirement: row.costOrPurchaseRequirement,
    image: row.imageUrl || undefined,
    imageReviewNote: row.imageNotes,
    evidenceNotes: row.evidenceNotes,
    sourceReport: row.sourceReport,
    validationWarnings: warningCodes,
    importedAt: existing && existing.importedAt ? existing.importedAt : nowIso,
  };
}

function stableJson(value) {
  return JSON.stringify(value);
}

function makeBackup(dataPath) {
  const backupDir = path.join(path.dirname(dataPath), "backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const backupPath = path.join(backupDir, `competitions-before-held-import-${stamp}.json`);
  fs.copyFileSync(dataPath, backupPath);
  return backupPath;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const nowIso = new Date().toISOString();
  const handoff = readJson(options.inputPath);
  const validation = readJson(options.validationPath);
  validateHandoff(handoff, validation);

  const competitions = readJson(options.dataPath);
  if (!Array.isArray(competitions)) {
    throw new Error("Freehub competitions data must be a JSON array.");
  }

  const errors = [];
  const warnings = [];
  const byId = new Map();
  const byHandoffId = new Map();

  competitions.forEach((competition, index) => {
    if (byId.has(competition.id)) {
      errors.push(`Existing data has duplicate id "${competition.id}" at index ${index}.`);
    } else {
      byId.set(competition.id, { competition, index });
    }
    if (competition.sourceHandoffId) {
      byHandoffId.set(competition.sourceHandoffId, { competition, index });
    }
  });

  const nextCompetitions = competitions.slice();
  let imported = 0;
  let updated = 0;
  let skipped = 0;

  handoff.rows.forEach((row) => {
    errors.push(...validateSourceRow(row));
    const warningCodes = getWarningCodes(validation, row);
    const existingByHandoff = byHandoffId.get(row.proposedId);
    const existingById = byId.get(row.proposedSlug);
    const existing = existingByHandoff || existingById || null;

    if (existing && existing.competition.verificationStatus === "published") {
      errors.push(`${row.proposedId} collides with published Freehub row "${existing.competition.id}".`);
      return;
    }

    const mapped = mapHandoffRow(row, warningCodes, nowIso, existing && existing.competition);

    if (existing) {
      if (stableJson(existing.competition) === stableJson(mapped)) {
        skipped += 1;
        return;
      }

      nextCompetitions[existing.index] = mapped;
      updated += 1;
      return;
    }

    nextCompetitions.push(mapped);
    imported += 1;
  });

  if (errors.length > 0) {
    console.error("Held candidate import failed.");
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  let backupPath = null;
  if (!options.dryRun && (imported > 0 || updated > 0)) {
    backupPath = makeBackup(options.dataPath);
    writeJson(options.dataPath, nextCompetitions);
  }

  const summary = {
    dryRun: options.dryRun,
    handoffPath: options.inputPath,
    validationPath: options.validationPath,
    dataPath: options.dataPath,
    backupPath,
    rowsRead: handoff.rows.length,
    rowsImported: imported,
    rowsUpdated: updated,
    rowsSkipped: skipped,
    errors: 0,
    warnings: warnings.length,
  };

  console.log("Held candidate import summary:");
  console.log(JSON.stringify(summary, null, 2));
}

main();
