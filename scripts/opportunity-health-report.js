const fs = require("fs");
const path = require("path");
const { buildOpportunityHealthReport, renderOpportunityHealthMarkdown, ROOT_DIR } = require("./lib/opportunity-health-report.js");

function parseArgs(argv) {
  const options = {
    asOfDate: null,
    rawFeatureValue: process.env.FREEHUB_ENABLE_OPPORTUNITIES,
    jsonOut: null,
    markdownOut: null,
    heading: "Opportunity operational health report",
  };

  argv.forEach((arg) => {
    if (arg.startsWith("--as-of-date=")) {
      options.asOfDate = arg.slice("--as-of-date=".length);
      return;
    }
    if (arg.startsWith("--feature-value=")) {
      options.rawFeatureValue = arg.slice("--feature-value=".length);
      return;
    }
    if (arg.startsWith("--json-out=")) {
      options.jsonOut = path.resolve(ROOT_DIR, arg.slice("--json-out=".length));
      return;
    }
    if (arg.startsWith("--markdown-out=")) {
      options.markdownOut = path.resolve(ROOT_DIR, arg.slice("--markdown-out=".length));
      return;
    }
    if (arg.startsWith("--heading=")) {
      options.heading = arg.slice("--heading=".length);
    }
  });

  return options;
}

function ensureParent(filePath) {
  if (!filePath) return;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

const options = parseArgs(process.argv.slice(2));
const report = buildOpportunityHealthReport(options);
const markdown = renderOpportunityHealthMarkdown(report, options.heading);

if (options.jsonOut) {
  ensureParent(options.jsonOut);
  fs.writeFileSync(options.jsonOut, `${JSON.stringify(report, null, 2)}\n`);
}

if (options.markdownOut) {
  ensureParent(options.markdownOut);
  fs.writeFileSync(options.markdownOut, `${markdown}\n`);
}

console.log(JSON.stringify({
  ok: report.ok,
  asOfDate: report.asOfDate,
  featureEnabled: report.featureFlag.parsedEnabled,
  actionableErrors: report.actionableErrors.length,
  reviewedWarnings: report.reviewedWarnings.length,
  counts: report.counts,
}, null, 2));

if (!report.ok) {
  process.exitCode = 1;
}
