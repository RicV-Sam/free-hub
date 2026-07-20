const fs = require("fs");
const path = require("path");
const opportunityData = require("../../shared/opportunity-data.js");
const { parseHtml, walkHtmlFiles } = require("./baseline-utils.js");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const BASELINE_CONFIG_PATH = path.join(ROOT_DIR, "tests", "baselines", "seo-baseline.json");
const DEFAULT_ALLOWED_SOURCE_HOSTS = JSON.parse(fs.readFileSync(BASELINE_CONFIG_PATH, "utf8")).opportunityAllowedSourceHosts;
const REVIEWED_ACCESS_BLOCK_REASON = "official_source_verified_despite_automated_access_block";
const REQUIRED_EVIDENCE_FIELDS = Object.freeze(["sourceUrl", "termsUrl"]);
const FLAG_MATRIX = Object.freeze([
  { label: "absent", rawValue: undefined },
  { label: "false", rawValue: "false" },
  { label: "true", rawValue: "true" },
  { label: "uppercase_true", rawValue: "TRUE" },
  { label: "boolean_true", rawValue: true },
]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
    return null;
  }
  return new Date(`${value}T00:00:00.000Z`);
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function dayDiff(fromDate, toDate) {
  const left = normalizeDate(fromDate);
  const right = normalizeDate(toDate);
  if (!left || !right) return Number.NaN;
  return Math.round((right.getTime() - left.getTime()) / 86400000);
}

function getLocalIsoDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getExpectedRoutes(record, gateOptions, featureEnabled = true) {
  const valid = opportunityData.validateOpportunity(record).valid;
  const typeSupported = opportunityData.validateOpportunity(record).typeSupported === true;
  const active = valid && typeSupported && opportunityData.isPublicOpportunity(record, gateOptions);
  const tombstoneEligible = valid && typeSupported && opportunityData.isOpportunityTombstoneAllowed(record, gateOptions);
  return {
    detailRoute: featureEnabled && (active || tombstoneEligible) ? opportunityData.getOpportunityDetailPath(record) : null,
    exitRoute: featureEnabled && active ? opportunityData.getOpportunityExitPath(record) : null,
    sitemapEligible: featureEnabled && active,
    exitExcluded: !featureEnabled || !active,
    tombstoneEligible,
  };
}

function getReviewState(record, asOfDate) {
  const diff = dayDiff(asOfDate, record.reviewDueAt);
  if (Number.isNaN(diff)) {
    return { label: "invalid", daysUntilReviewDue: null };
  }
  if (diff < 0) {
    return { label: "overdue", daysUntilReviewDue: diff };
  }
  if (diff === 0) {
    return { label: "due_today", daysUntilReviewDue: diff };
  }
  return { label: "current", daysUntilReviewDue: diff };
}

function getLifecycleClassification(record, gateOptions) {
  const validation = opportunityData.validateOpportunity(record);
  const reviewState = getReviewState(record, gateOptions.asOfDate);
  if (!validation.valid || validation.typeSupported !== true) {
    return {
      lifecycle: "ineligible",
      tombstoneEligible: false,
      reviewState,
      validationErrors: validation.errors.slice(),
    };
  }
  return {
    lifecycle: opportunityData.getOpportunityLifecycleState(record, gateOptions),
    tombstoneEligible: opportunityData.isOpportunityTombstoneAllowed(record, gateOptions),
    reviewState,
    validationErrors: [],
  };
}

function newestFirst(left, right) {
  return String(right.verifiedAt || "").localeCompare(String(left.verifiedAt || ""));
}

function getEvidenceStatus(record, field, ledger, asOfDate) {
  const currentUrl = record[field];
  if (!currentUrl) {
    return {
      field,
      required: false,
      status: "not_required",
      newestUsable: null,
      newestMatching: null,
      reviewedWarnings: [],
      actionableErrors: [],
    };
  }

  const currentHost = new URL(currentUrl).hostname;
  const matches = ledger
    .filter((entry) => entry.recordId === record.id && entry.field === field)
    .slice()
    .sort(newestFirst);
  const exactMatches = matches.filter((entry) => entry.url === currentUrl && entry.hostname === currentHost);
  const usableMatches = exactMatches.filter(
    (entry) => entry.verifiedAt <= asOfDate && entry.expiresAt >= asOfDate && opportunityData.validateSourceEvidenceEntry(entry).valid
  );
  const newestMatching = exactMatches[0] || null;
  const newestUsable = usableMatches[0] || null;
  const actionableErrors = [];
  const reviewedWarnings = [];

  if (matches.length === 0) {
    actionableErrors.push(`Missing evidence for ${record.id}.${field}.`);
  } else if (exactMatches.length === 0) {
    actionableErrors.push(`Evidence for ${record.id}.${field} does not exactly match the current URL and host.`);
  } else if (!newestUsable) {
    actionableErrors.push(`No current usable evidence for ${record.id}.${field} on ${asOfDate}.`);
  }

  if (newestUsable && newestUsable.reason === REVIEWED_ACCESS_BLOCK_REASON) {
    reviewedWarnings.push(`${record.id}.${field} uses reviewed manual evidence because automated access is blocked.`);
  }

  if (newestUsable) {
    const daysRemaining = dayDiff(asOfDate, newestUsable.expiresAt);
    if (daysRemaining <= 2) {
      reviewedWarnings.push(`${record.id}.${field} evidence expires in ${daysRemaining} day(s).`);
    }
  }

  return {
    field,
    required: true,
    currentUrl,
    currentHost,
    status: newestUsable ? "current" : exactMatches.length > 0 ? "stale" : matches.length > 0 ? "mismatched" : "missing",
    newestMatching,
    newestUsable,
    reviewedWarnings,
    actionableErrors,
  };
}

function countGeneratedRoutes(rootDir, relativeDirectory) {
  const directory = path.join(rootDir, relativeDirectory);
  if (!fs.existsSync(directory)) return 0;
  return walkHtmlFiles(directory).filter((filePath) => path.basename(filePath) === "index.html").length;
}

function readPageInfo(rootDir, relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return { exists: false, html: "", parsed: null };
  }
  const html = fs.readFileSync(absolutePath, "utf8");
  return { exists: true, html, parsed: parseHtml(html) };
}

function getSchemaItemCount(parsedPage, name) {
  if (!parsedPage) return 0;
  const item = parsedPage.jsonLd.find((entry) => entry && entry.name === name);
  return Array.isArray(item && item.itemListElement) ? item.itemListElement.length : 0;
}

function inspectGeneratedState(rootDir, records, gateOptions, featureEnabled) {
  const samplePage = readPageInfo(rootDir, path.join("free-samples-south-africa", "index.html"));
  const parentPage = readPageInfo(rootDir, path.join("free-stuff-south-africa", "index.html"));
  const sitemapPath = path.join(rootDir, "sitemap.xml");
  const sitemap = fs.existsSync(sitemapPath) ? fs.readFileSync(sitemapPath, "utf8") : "";
  const sampleHtml = samplePage.html;
  const parentHtml = parentPage.html;
  const renderedIds = [...sampleHtml.matchAll(/data-opportunity-id="([^"]+)"/g), ...parentHtml.matchAll(/data-opportunity-id="([^"]+)"/g)].map(
    (match) => match[1]
  );
  const counts = {
    generatedFiles: walkHtmlFiles(rootDir).length + (fs.existsSync(sitemapPath) ? 1 : 0),
    sitemapUrls: [...sitemap.matchAll(/<loc>/g)].length,
    sampleCards: [...sampleHtml.matchAll(/<article class="opportunity-card\b/g)].length,
    parentCards: [...parentHtml.matchAll(/<article class="opportunity-card\b/g)].length,
    sampleSchemaItems: getSchemaItemCount(samplePage.parsed, "Current verified samples"),
    parentSchemaItems: getSchemaItemCount(parentPage.parsed, "Current verified opportunities"),
    detailRoutes: countGeneratedRoutes(rootDir, "opportunity"),
    exitRoutes: countGeneratedRoutes(rootDir, path.join("out", "opportunity")),
    sitemapOpportunityEntries: [...sitemap.matchAll(/<loc>https:\/\/freehub\.co\.za\/opportunity\//g)].length,
    renderedCards: renderedIds.length,
    uniqueRenderedRecords: new Set(renderedIds).size,
    discoverySurfacesWithCards: [sampleHtml, parentHtml].filter((html) => html.includes('data-opportunity-id="')).length,
  };

  const routeChecks = records.map((record) => {
    const expected = getExpectedRoutes(record, gateOptions, featureEnabled);
    const detailRoute = opportunityData.getOpportunityDetailPath(record);
    const exitRoute = opportunityData.getOpportunityExitPath(record);
    const detailFile = path.join(rootDir, detailRoute.replace(/^\//, ""), "index.html");
    const exitFile = path.join(rootDir, exitRoute.replace(/^\//, ""), "index.html");
    return {
      id: record.id,
      lifecycle: getLifecycleClassification(record, gateOptions).lifecycle,
      expected,
      generated: {
        detailRoute,
        exitRoute,
        detailFileExists: fs.existsSync(detailFile),
        exitFileExists: fs.existsSync(exitFile),
        detailInSitemap: sitemap.includes(`<loc>https://freehub.co.za${detailRoute}</loc>`),
        exitInSitemap: sitemap.includes(`<loc>https://freehub.co.za${exitRoute}</loc>`),
        renderedOnSamples: sampleHtml.includes(`data-opportunity-id="${record.id}"`),
        renderedOnParent: parentHtml.includes(`data-opportunity-id="${record.id}"`),
      },
    };
  });

  return {
    counts,
    routeChecks,
    renderedIds,
  };
}

function buildOpportunityHealthReport(options = {}) {
  const rootDir = options.rootDir ? path.resolve(options.rootDir) : ROOT_DIR;
  const asOfDate = options.asOfDate || getLocalIsoDate(new Date());
  const rawFeatureValue = options.rawFeatureValue;
  const opportunities = readJson(path.join(rootDir, "data", "opportunities.json")).filter(Boolean);
  const ledger = readJson(path.join(rootDir, "data", "opportunity-source-evidence.json")).filter(Boolean);
  const gateOptions = {
    asOfDate,
    strictFreeOnly: false,
    allowedSourceHosts: options.allowedSourceHosts || DEFAULT_ALLOWED_SOURCE_HOSTS,
    sourceEvidence: ledger,
    requireSourceEvidence: true,
  };
  const featureFlag = {
    rawValue: rawFeatureValue,
    parsedEnabled: opportunityData.isOpportunityFeatureEnabled(rawFeatureValue),
    parserMatrix: FLAG_MATRIX.map((entry) => ({
      label: entry.label,
      rawValue: entry.rawValue,
      parsedEnabled: opportunityData.isOpportunityFeatureEnabled(entry.rawValue),
    })),
  };
  const generatedState = inspectGeneratedState(rootDir, opportunities, gateOptions, featureFlag.parsedEnabled);
  const records = opportunities.map((record) => {
    const lifecycle = getLifecycleClassification(record, gateOptions);
    const evidence = Object.fromEntries(
      REQUIRED_EVIDENCE_FIELDS.map((field) => [field, getEvidenceStatus(record, field, ledger, asOfDate)])
    );
    return {
      id: record.id,
      slug: record.slug,
      type: record.type,
      publicationStatus: record.publicationStatus,
      verificationStatus: record.verificationStatus,
      lifecycle,
      expected: getExpectedRoutes(record, gateOptions, featureFlag.parsedEnabled),
      evidence,
    };
  });

  const actionableErrors = [];
  const reviewedWarnings = [];

  if (featureFlag.parserMatrix.find((entry) => entry.label === "absent").parsedEnabled !== false) {
    actionableErrors.push("Feature flag parser no longer fail-closes when the value is absent.");
  }
  if (featureFlag.parserMatrix.find((entry) => entry.label === "false").parsedEnabled !== false) {
    actionableErrors.push("Feature flag parser no longer fail-closes when the value is 'false'.");
  }
  if (featureFlag.parserMatrix.find((entry) => entry.label === "true").parsedEnabled !== true) {
    actionableErrors.push("Feature flag parser no longer enables only for the exact string 'true'.");
  }

  records.forEach((recordReport) => {
    REQUIRED_EVIDENCE_FIELDS.forEach((field) => {
      actionableErrors.push(...recordReport.evidence[field].actionableErrors);
      reviewedWarnings.push(...recordReport.evidence[field].reviewedWarnings);
    });
  });

  generatedState.routeChecks.forEach((routeCheck) => {
    const { expected, generated } = routeCheck;
    if (Boolean(expected.detailRoute) !== generated.detailFileExists) {
      actionableErrors.push(
        `${routeCheck.id} detail route mismatch: expected ${expected.detailRoute ? "present" : "absent"}, found ${
          generated.detailFileExists ? "present" : "absent"
        }.`
      );
    }
    if (Boolean(expected.exitRoute) !== generated.exitFileExists) {
      actionableErrors.push(
        `${routeCheck.id} exit route mismatch: expected ${expected.exitRoute ? "present" : "absent"}, found ${
          generated.exitFileExists ? "present" : "absent"
        }.`
      );
    }
    if (expected.sitemapEligible !== generated.detailInSitemap) {
      actionableErrors.push(
        `${routeCheck.id} sitemap mismatch: expected detail route ${expected.sitemapEligible ? "in" : "out of"} sitemap.`
      );
    }
    if (generated.exitInSitemap) {
      actionableErrors.push(`${routeCheck.id} exit route is present in sitemap.`);
    }
  });

  const expectedRenderedRecords = records.filter((record) => record.expected.detailRoute && record.expected.exitRoute).map((record) => record.id);
  const unexpectedRenderedIds = generatedState.renderedIds.filter((id) => !expectedRenderedRecords.includes(id));
  if (generatedState.counts.uniqueRenderedRecords !== new Set(expectedRenderedRecords).size && featureFlag.parsedEnabled) {
    actionableErrors.push("Rendered Opportunity unique-record count does not match the active record set.");
  }
  if (!featureFlag.parsedEnabled && generatedState.counts.renderedCards !== 0) {
    actionableErrors.push("Opportunity cards rendered while the feature flag is disabled.");
  }
  if (unexpectedRenderedIds.length > 0) {
    actionableErrors.push(`Unexpected rendered Opportunity ids: ${Array.from(new Set(unexpectedRenderedIds)).join(", ")}.`);
  }

  return {
    generatedAt: new Date().toISOString(),
    asOfDate,
    featureFlag,
    counts: generatedState.counts,
    records,
    routeChecks: generatedState.routeChecks,
    actionableErrors,
    reviewedWarnings: Array.from(new Set(reviewedWarnings)).sort(),
    ok: actionableErrors.length === 0,
  };
}

function renderOpportunityHealthMarkdown(report, heading) {
  const lines = [
    `# ${heading}`,
    "",
    `- As of date: ${report.asOfDate}`,
    `- Feature flag raw value: ${String(report.featureFlag.rawValue)}`,
    `- Feature flag enabled: ${report.featureFlag.parsedEnabled ? "yes" : "no"}`,
    `- Generated files: ${report.counts.generatedFiles}`,
    `- Sitemap URLs: ${report.counts.sitemapUrls}`,
    `- Opportunity cards: ${report.counts.renderedCards}`,
    `- Unique rendered records: ${report.counts.uniqueRenderedRecords}`,
    `- Opportunity detail routes: ${report.counts.detailRoutes}`,
    `- Opportunity exit routes: ${report.counts.exitRoutes}`,
    `- Opportunity sitemap entries: ${report.counts.sitemapOpportunityEntries}`,
    "",
    "## Feature flag parsing",
    "",
    "| Raw value | Enabled |",
    "| --- | --- |",
    ...report.featureFlag.parserMatrix.map((entry) => `| ${String(entry.rawValue)} | ${entry.parsedEnabled ? "yes" : "no"} |`),
    "",
    "## Records",
    "",
  ];

  report.records.forEach((record) => {
    lines.push(`### ${record.id}`);
    lines.push("");
    lines.push(`- Lifecycle: ${record.lifecycle.lifecycle}`);
    lines.push(`- Tombstone eligible: ${record.lifecycle.tombstoneEligible ? "yes" : "no"}`);
    lines.push(`- Review state: ${record.lifecycle.reviewState.label}`);
    lines.push(`- Review due: ${record.expected.sitemapEligible || record.lifecycle.tombstoneEligible ? "reviewed" : "private/ineligible"}`);
    REQUIRED_EVIDENCE_FIELDS.forEach((field) => {
      const evidence = record.evidence[field];
      lines.push(
        `- ${field}: ${evidence.status}${evidence.newestUsable ? ` (usable through ${evidence.newestUsable.expiresAt})` : ""}`
      );
    });
    lines.push("");
  });

  lines.push("## Actionable errors", "");
  if (report.actionableErrors.length === 0) {
    lines.push("- None");
  } else {
    report.actionableErrors.forEach((entry) => lines.push(`- ${entry}`));
  }

  lines.push("", "## Reviewed warnings", "");
  if (report.reviewedWarnings.length === 0) {
    lines.push("- None");
  } else {
    report.reviewedWarnings.forEach((entry) => lines.push(`- ${entry}`));
  }

  lines.push("");
  return lines.join("\n");
}

module.exports = {
  ROOT_DIR,
  buildOpportunityHealthReport,
  renderOpportunityHealthMarkdown,
};
