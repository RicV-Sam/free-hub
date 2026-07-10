const fs = require("fs");
const path = require("path");
const shared = require("../shared/page-data.js");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT_DIR, "data", "competitions.json");
const VERTICAL_REPORT_PATH = path.join(ROOT_DIR, "reports", "vertical-page-coverage-report.md");
const DEFAULT_REPORT_PATH = path.join(ROOT_DIR, "reports", "active-listing-quality-report.md");
const DAY_MS = 24 * 60 * 60 * 1000;
const CLOSING_SOON_DAYS = 7;
const STALE_DAYS = 21;
const HIGH_VALUE_STALE_DAYS = 14;
const COLLECTION_THRESHOLD = 2;
const VERTICAL_THRESHOLD = 3;

function parseArgs(argv) {
  const options = {
    today: null,
    out: DEFAULT_REPORT_PATH,
  };

  argv.forEach((arg) => {
    if (arg.startsWith("--today=")) {
      options.today = arg.slice("--today=".length);
      return;
    }

    if (arg.startsWith("--out=")) {
      options.out = path.resolve(ROOT_DIR, arg.slice("--out=".length));
    }
  });

  return options;
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(String(value))
    ? new Date(`${value}T00:00:00`)
    : new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
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

function daysBetween(left, right) {
  if (!left || !right) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.floor((left.getTime() - right.getTime()) / DAY_MS);
}

function daysUntilClosing(competition, today) {
  const closingDate = normalizeDate(competition.closingDate);
  if (!closingDate) {
    return Number.POSITIVE_INFINITY;
  }

  return daysBetween(closingDate, today);
}

function daysSinceLastChecked(competition, today) {
  const lastChecked = getLatestReviewDate(competition);
  if (!lastChecked) {
    return Number.POSITIVE_INFINITY;
  }

  return daysBetween(today, lastChecked);
}

function getLatestReviewDate(competition) {
  return [competition.lastChecked, competition.linkValidationCheckedAt]
    .map(normalizeDate)
    .filter(Boolean)
    .sort((left, right) => right.getTime() - left.getTime())[0] || null;
}

function getLatestReviewDateLabel(competition) {
  const latest = getLatestReviewDate(competition);
  return latest ? formatDateLocal(latest) : "";
}

function isActiveCompetition(competition, today) {
  return shared.isPublishedCompetition(competition) && daysUntilClosing(competition, today) >= 0;
}

function hasText(value) {
  return String(value || "").trim().length > 0;
}

function isHighValueCompetition(competition) {
  const tags = Array.isArray(competition.tags) ? competition.tags : [];
  return competition.isHighValue === true || tags.includes("high-value") || shared.isHighValueCompetition(competition);
}

function getFreeEntryRequirementMatches(competition) {
  const entryCostType = String(competition.entryCostType || "").trim().toLowerCase();
  const entryCostLabel = shared.getEntryCostLabel(competition);

  if (entryCostType !== "free-entry" && entryCostLabel !== "Free entry") {
    return [];
  }

  const searchableText = [
    competition.title,
    competition.summary,
    competition.quickAnswer,
    competition.entryType,
    competition.entryChannel,
    competition.entryFeeLabel,
    competition.requiredProduct,
    competition.eligibility,
    competition.eligibilitySummary,
    Array.isArray(competition.entrySteps) ? competition.entrySteps.join(" ") : "",
    Array.isArray(competition.tags) ? competition.tags.join(" ") : "",
  ]
    .join(" ")
    .toLowerCase();

  const patterns = [
    ["app", /\b(app|in-app|mobile app|download the app|app-only|app required)\b/],
    ["account", /\b(account|sign in|sign-in|login|logged in|register|registration|profile|clubcard|club card|rewards card|loyalty)\b/],
    ["quote", /\b(quote|quotation|obligation-free quote|life cover quote)\b/],
    ["social", /\b(follow|like|comment|share|tag|social media|instagram|facebook|tiktok|x\/twitter|twitter)\b/],
    ["client", /\b(client|customer|member|subscriber|policyholder|cardholder|eligible user|active user)\b/],
  ];

  return patterns
    .filter(([, pattern]) => pattern.test(searchableText))
    .map(([label]) => label);
}

function getRequirementExcerpt(competition) {
  const text = [
    competition.entryChannel,
    competition.entryFeeLabel,
    competition.summary,
    competition.quickAnswer,
    competition.eligibilitySummary,
  ]
    .filter(Boolean)
    .join(" ");

  return text.length > 150 ? `${text.slice(0, 147)}...` : text;
}

function summarizeCompetition(competition, today, extra = {}) {
  return {
    slug: shared.getCompetitionSlug(competition),
    title: competition.title || "",
    category: competition.category || "",
    entryCostType: competition.entryCostType || "",
    closingDate: competition.closingDate || "",
    daysUntilClose: daysUntilClosing(competition, today),
    lastChecked: getLatestReviewDateLabel(competition),
    lastCheckedAgeDays: daysSinceLastChecked(competition, today),
    ...extra,
  };
}

function getThresholdStatus(count, threshold) {
  if (count < threshold) {
    return "below threshold";
  }

  if (count === threshold) {
    return "at threshold";
  }

  if (count === threshold + 1) {
    return "near threshold";
  }

  return "safe";
}

function isNearThreshold(count, threshold) {
  return count <= threshold + 1;
}

function isStrictFreeEntryCompetition(competition) {
  const tags = Array.isArray(competition.tags) ? competition.tags : [];
  const entryCostType = String(competition.entryCostType || "").trim().toLowerCase();
  const entryContext = [
    competition.entryType,
    competition.entryChannel,
    competition.entryFeeLabel,
    competition.requiredProduct,
    tags.join(" "),
  ]
    .join(" ")
    .toLowerCase();
  const blockedTags = [
    "purchase-required",
    "paid-entry",
    "till-slip",
    "till-slip-required",
    "spend-and-win",
    "subscription",
    "subscription-billing",
    "sms-entry",
    "ussd-entry",
    "recharge-required",
    "qualifying-products",
    "loyalty-required",
  ];

  if (competition.purchaseRequired === true || entryCostType !== "free-entry") {
    return false;
  }

  if (blockedTags.some((tag) => tags.includes(tag))) {
    return false;
  }

  if (Number(competition.entryFeeAmount) > 0) {
    return false;
  }

  if (/sms|ussd/.test(entryContext)) {
    return false;
  }

  if (
    /\b(buy|purchase|required purchase|paid ticket|ticket|till slip|receipt|invoice|minimum spend|spend and win|subscription|billing|recharge|qualifying product|swipe|rewards card|loyalty card)\b/.test(
      entryContext
    )
  ) {
    return false;
  }

  return shared.getEntryCostLabel(competition) === "Free entry";
}

function getHubCount(activeCompetitions, slug, today) {
  const sorted = activeCompetitions.slice().sort((left, right) => new Date(left.closingDate) - new Date(right.closingDate));

  switch (slug) {
    case "competitions":
      return sorted.length;
    case "win-a-car":
      return sorted.filter(shared.isVehicleRelatedCompetition).length;
    case "free-competitions":
      return sorted.filter(isStrictFreeEntryCompetition).length;
    case "competitions-ending-soon":
      return sorted.filter((competition) => {
        const days = daysUntilClosing(competition, today);
        return Number.isFinite(days) && days >= 0 && days <= CLOSING_SOON_DAYS;
      }).length;
    case "new-competitions-south-africa": {
      const recentlyChecked = sorted.filter((competition) => daysSinceLastChecked(competition, today) <= 7).length;
      return recentlyChecked >= 6 ? recentlyChecked : Math.min(sorted.length, 24);
    }
    case "purchase-required-competitions":
      return sorted.filter((competition) => {
        const tags = Array.isArray(competition.tags) ? competition.tags : [];
        return (
          competition.purchaseRequired === true ||
          String(competition.entryCostType || "").trim().toLowerCase() === "purchase-required" ||
          tags.includes("purchase-required")
        );
      }).length;
    case "paid-entry-competitions":
      return sorted.filter((competition) => {
        const tags = Array.isArray(competition.tags) ? competition.tags : [];
        return (
          String(competition.entryCostType || "").trim().toLowerCase() === "paid-entry" ||
          tags.includes("paid-entry") ||
          Number(competition.entryFeeAmount) > 0
        );
      }).length;
    default:
      return sorted.length;
  }
}

function getTagCount(activeCompetitions, tag, today) {
  return activeCompetitions.filter((competition) => {
    const tags = Array.isArray(competition.tags) ? competition.tags : [];

    switch (tag) {
      case "free-entry":
        return shared.getEntryCostLabel(competition) === "Free entry";
      case "purchase-required":
        return competition.purchaseRequired === true;
      case "paid-entry":
        return shared.getEntryCostLabel(competition) === "Paid entry";
      case "ending-soon": {
        const days = daysUntilClosing(competition, today);
        return Number.isFinite(days) && days >= 0 && days <= CLOSING_SOON_DAYS;
      }
      case "high-value":
        return isHighValueCompetition(competition);
      default:
        return tags.includes(tag);
    }
  }).length;
}

function getCollectionThresholdRows(activeCompetitions, today) {
  const rows = [];

  shared.CATEGORY_SLUGS.forEach((slug) => {
    const copy = shared.CATEGORY_COPY[slug];
    const count = activeCompetitions.filter((competition) => competition.category === copy.category).length;
    if (isNearThreshold(count, COLLECTION_THRESHOLD)) {
      rows.push({
        type: "category",
        path: `/category/${slug}/`,
        count,
        threshold: COLLECTION_THRESHOLD,
        status: getThresholdStatus(count, COLLECTION_THRESHOLD),
      });
    }
  });

  shared.TAG_SLUGS.forEach((slug) => {
    const count = getTagCount(activeCompetitions, slug, today);
    if (isNearThreshold(count, COLLECTION_THRESHOLD)) {
      rows.push({
        type: "tag",
        path: `/tag/${slug}/`,
        count,
        threshold: COLLECTION_THRESHOLD,
        status: getThresholdStatus(count, COLLECTION_THRESHOLD),
      });
    }
  });

  shared.HUB_SLUGS.forEach((slug) => {
    const count = getHubCount(activeCompetitions, slug, today);
    if (isNearThreshold(count, COLLECTION_THRESHOLD)) {
      rows.push({
        type: "hub",
        path: `/${slug}/`,
        count,
        threshold: COLLECTION_THRESHOLD,
        status: getThresholdStatus(count, COLLECTION_THRESHOLD),
      });
    }
  });

  shared.BRAND_PAGE_SLUGS.forEach((slug) => {
    const count = shared.getBrandFilteredCompetitions(activeCompetitions, slug).length;
    if (isNearThreshold(count, shared.BRAND_PAGE_MIN_COMPETITIONS)) {
      rows.push({
        type: "brand",
        path: `/brand/${slug}/`,
        count,
        threshold: shared.BRAND_PAGE_MIN_COMPETITIONS,
        status: getThresholdStatus(count, shared.BRAND_PAGE_MIN_COMPETITIONS),
      });
    }
  });

  return rows.sort((left, right) => left.threshold - right.threshold || left.count - right.count || left.path.localeCompare(right.path));
}

function getVerticalThresholdRows() {
  if (!fs.existsSync(VERTICAL_REPORT_PATH)) {
    return [];
  }

  const markdown = fs.readFileSync(VERTICAL_REPORT_PATH, "utf8");
  const sections = markdown.split(/\n## /).slice(1);

  return sections
    .map((section) => {
      const heading = (section.match(/^([^\n]+)/) || [])[1] || "";
      const url = (section.match(/- URL: ([^\n]+)/) || [])[1] || "";
      const count = Number((section.match(/- Matching active public competitions: (\d+)/) || [])[1]);
      const threshold = Number((section.match(/- Publication threshold: (\d+)/) || [])[1]) || VERTICAL_THRESHOLD;
      const safe = (section.match(/- Safe to publish: ([^\n]+)/) || [])[1] || "";
      const status = (section.match(/- Status: ([^\n]+)/) || [])[1] || "";

      return {
        type: "vertical",
        path: url,
        heading,
        count,
        threshold,
        safe,
        status: safe === "yes" ? getThresholdStatus(count, threshold) : status,
      };
    })
    .filter((row) => row.path && Number.isFinite(row.count) && isNearThreshold(row.count, row.threshold))
    .sort((left, right) => left.count - right.count || left.path.localeCompare(right.path));
}

function markdownTable(headers, rows, fields) {
  const lines = [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
  ];

  if (rows.length === 0) {
    lines.push(`| ${headers.map((header, index) => (index === 0 ? "None" : "")).join(" | ")} |`);
    return lines.join("\n");
  }

  rows.forEach((row) => {
    lines.push(`| ${fields.map((field) => escapeMarkdownCell(row[field])).join(" | ")} |`);
  });

  return lines.join("\n");
}

function escapeMarkdownCell(value) {
  if (value === Number.POSITIVE_INFINITY) {
    return "missing";
  }

  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ")
    .trim();
}

function renderCompetitionFlagTable(rows, includeFields = []) {
  const headers = ["Slug", "Title", "Category", "Entry cost", "Closing", "Days left", "Last checked", "Age days", ...includeFields.map((field) => field.label)];
  const fields = ["slug", "title", "category", "entryCostType", "closingDate", "daysUntilClose", "lastChecked", "lastCheckedAgeDays", ...includeFields.map((field) => field.key)];
  return markdownTable(headers, rows, fields);
}

function buildReport({ today, activeCompetitions, flags, thresholdRows, verticalRows }) {
  const generatedAt = new Date().toISOString();
  const todayIso = formatDateLocal(today);

  return [
    "# Active Listing Quality Report",
    "",
    `Generated: ${generatedAt}`,
    `Audit date: ${todayIso}`,
    "",
    "This report reviews active published Freehub listings and indexable inventory thresholds. It is intended as an editorial QA queue, not a publication approval decision.",
    "",
    "## Summary",
    "",
    `- Active published listings: ${activeCompetitions.length}`,
    `- Closing within ${CLOSING_SOON_DAYS} days: ${flags.closingSoon.length}`,
    `- Last checked older than ${STALE_DAYS} days: ${flags.stale.length}`,
    `- High-value listings older than ${HIGH_VALUE_STALE_DAYS} days: ${flags.staleHighValue.length}`,
    `- Missing or unreviewed image: ${flags.missingImage.length}`,
    `- Missing evidenceNotes: ${flags.missingEvidence.length}`,
    `- Missing eligibility and eligibilitySummary: ${flags.missingEligibility.length}`,
    `- Missing entrySteps: ${flags.missingEntrySteps.length}`,
    `- Free-entry listings mentioning app/account/quote/social/client requirements: ${flags.freeEntryRequirementReview.length}`,
    `- Collection/brand pages near indexability threshold: ${thresholdRows.length}`,
    `- Vertical hubs near indexability threshold: ${verticalRows.length}`,
    "",
    "## Active Listings Closing Within 7 Days",
    "",
    renderCompetitionFlagTable(flags.closingSoon),
    "",
    "## Active Listings With lastChecked Older Than 21 Days",
    "",
    renderCompetitionFlagTable(flags.stale),
    "",
    "## High-value Listings Older Than 14 Days",
    "",
    renderCompetitionFlagTable(flags.staleHighValue),
    "",
    "## Listings Missing or Awaiting Image Review",
    "",
    renderCompetitionFlagTable(flags.missingImage),
    "",
    "## Listings Missing evidenceNotes",
    "",
    renderCompetitionFlagTable(flags.missingEvidence),
    "",
    "## Listings Missing Eligibility or Eligibility Summary",
    "",
    renderCompetitionFlagTable(flags.missingEligibility),
    "",
    "## Listings Missing entrySteps",
    "",
    renderCompetitionFlagTable(flags.missingEntrySteps),
    "",
    "## Free-entry Listings Requiring Editorial Review",
    "",
    "These listings are labelled free-entry but mention app, account, quote, social, or client/member/customer requirements. They may still be valid no-purchase listings, but should expose secondary requirement chips or clearer entry-cost copy.",
    "",
    renderCompetitionFlagTable(flags.freeEntryRequirementReview, [
      { key: "requirementMatches", label: "Matched requirement" },
      { key: "excerpt", label: "Excerpt" },
    ]),
    "",
    "## Pages Near Inventory Threshold for Indexable Hubs",
    "",
    "Collection/tag/hub pages use a 2-listing indexability threshold in the page-generation flow. Brand pages use the configured brand-page threshold. Rows below, at, or one listing above threshold should be watched after each expiry cycle.",
    "",
    markdownTable(
      ["Type", "Path", "Active count", "Threshold", "Status"],
      thresholdRows,
      ["type", "path", "count", "threshold", "status"]
    ),
    "",
    "## Vertical Hubs Near Inventory Threshold",
    "",
    "Vertical hubs are parsed from `reports/vertical-page-coverage-report.md`, which is generated by `scripts/generate-pages.js`. Rebuild before relying on this section.",
    "",
    markdownTable(
      ["Type", "Path", "Active count", "Threshold", "Safe", "Status"],
      verticalRows,
      ["type", "path", "count", "threshold", "safe", "status"]
    ),
    "",
    "## Recommended Queue Order",
    "",
    "1. Recheck listings closing within 7 days.",
    "2. Recheck high-value listings older than 14 days.",
    "3. Resolve missing evidenceNotes on car, cash, WhatsApp, SMS, till-slip, purchase-required, and high-value listings.",
    "4. Add image assets for homepage, high-value, car, cash, and voucher listings.",
    "5. Add eligibility summaries and entry steps where missing.",
    "6. Review free-entry listings with secondary app/account/quote/social/client requirements and add clearer chips/copy.",
    "7. Watch near-threshold hubs after expired listings are removed.",
    "",
  ].join("\n");
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const today = options.today ? normalizeDate(options.today) : normalizeDate(new Date());

  if (!today) {
    throw new Error(`Invalid --today value: ${options.today}`);
  }

  const competitions = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const activeCompetitions = competitions
    .filter((competition) => isActiveCompetition(competition, today))
    .sort((left, right) => daysUntilClosing(left, today) - daysUntilClosing(right, today));

  const flags = {
    closingSoon: activeCompetitions
      .filter((competition) => {
        const days = daysUntilClosing(competition, today);
        return Number.isFinite(days) && days >= 0 && days <= CLOSING_SOON_DAYS;
      })
      .map((competition) => summarizeCompetition(competition, today)),
    stale: activeCompetitions
      .filter((competition) => daysSinceLastChecked(competition, today) > STALE_DAYS)
      .map((competition) => summarizeCompetition(competition, today)),
    staleHighValue: activeCompetitions
      .filter((competition) => isHighValueCompetition(competition) && daysSinceLastChecked(competition, today) > HIGH_VALUE_STALE_DAYS)
      .map((competition) => summarizeCompetition(competition, today)),
    missingImage: activeCompetitions
      .filter(
        (competition) =>
          !hasText(competition.image) &&
          !(competition.imageReviewStatus === "neutral-fallback" && hasText(competition.imageFallback))
      )
      .map((competition) => summarizeCompetition(competition, today)),
    missingEvidence: activeCompetitions
      .filter((competition) => !hasText(competition.evidenceNotes))
      .map((competition) => summarizeCompetition(competition, today)),
    missingEligibility: activeCompetitions
      .filter((competition) => !hasText(competition.eligibility) && !hasText(competition.eligibilitySummary))
      .map((competition) => summarizeCompetition(competition, today)),
    missingEntrySteps: activeCompetitions
      .filter((competition) => !Array.isArray(competition.entrySteps) || competition.entrySteps.length === 0)
      .map((competition) => summarizeCompetition(competition, today)),
    freeEntryRequirementReview: activeCompetitions
      .map((competition) => {
        const matches = getFreeEntryRequirementMatches(competition);
        return { competition, matches };
      })
      .filter(({ matches }) => matches.length > 0)
      .map(({ competition, matches }) =>
        summarizeCompetition(competition, today, {
          requirementMatches: matches.join(", "),
          excerpt: getRequirementExcerpt(competition),
        })
      ),
  };

  const thresholdRows = getCollectionThresholdRows(activeCompetitions, today);
  const verticalRows = getVerticalThresholdRows();
  const report = buildReport({ today, activeCompetitions, flags, thresholdRows, verticalRows });

  fs.mkdirSync(path.dirname(options.out), { recursive: true });
  fs.writeFileSync(options.out, report);
  process.stdout.write(`Wrote ${path.relative(ROOT_DIR, options.out)}\n`);
}

main();
