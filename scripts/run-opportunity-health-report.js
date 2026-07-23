const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { buildOpportunityHealthReport, renderOpportunityHealthMarkdown, ROOT_DIR } = require("./lib/opportunity-health-report.js");

const OUTPUT_DIR = path.join(ROOT_DIR, "output", "opportunity-health");
const REPORT_PATH = path.join(ROOT_DIR, "reports", "opportunity-health-report.md");
const SUMMARY_JSON_PATH = path.join(OUTPUT_DIR, "summary.json");
const STATES = Object.freeze([
  { name: "disabled", rawFeatureValue: "false" },
  { name: "enabled", rawFeatureValue: "true" },
]);

function parseArgs(argv) {
  const options = {
    asOfDate: process.env.FREEHUB_BUILD_DATE || null,
  };
  argv.forEach((arg) => {
    if (arg.startsWith("--as-of-date=")) {
      options.asOfDate = arg.slice("--as-of-date=".length);
    }
  });
  return options;
}

function runNodeScript(scriptPath, env) {
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: ROOT_DIR,
    env,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `Command failed: ${scriptPath}`);
  }
}

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

const options = parseArgs(process.argv.slice(2));
ensureDirectory(OUTPUT_DIR);
ensureDirectory(path.dirname(REPORT_PATH));

const reports = STATES.map((state) => {
  runNodeScript(path.join(ROOT_DIR, "scripts", "generate-pages.js"), {
    ...process.env,
    FREEHUB_BUILD_DATE: options.asOfDate || process.env.FREEHUB_BUILD_DATE,
    FREEHUB_ENABLE_OPPORTUNITIES: state.rawFeatureValue,
  });
  const report = buildOpportunityHealthReport({
    asOfDate: options.asOfDate || process.env.FREEHUB_BUILD_DATE,
    rawFeatureValue: state.rawFeatureValue,
  });
  fs.writeFileSync(path.join(OUTPUT_DIR, `${state.name}.json`), `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, `${state.name}.md`),
    `${renderOpportunityHealthMarkdown(report, `Opportunity operational health report (${state.name})`)}\n`
  );
  return { state: state.name, report };
});

const summary = {
  asOfDate: options.asOfDate || process.env.FREEHUB_BUILD_DATE || null,
  states: reports.map(({ state, report }) => ({
    state,
    ok: report.ok,
    actionableErrors: report.actionableErrors.length,
    reviewedWarnings: report.reviewedWarnings.length,
    counts: report.counts,
  })),
};

const markdown = [
  "# Opportunity operational health report",
  "",
  ...reports.flatMap(({ state, report }) => [
    `## ${state}`,
    "",
    `- OK: ${report.ok ? "yes" : "no"}`,
    `- Feature enabled: ${report.featureFlag.parsedEnabled ? "yes" : "no"}`,
    `- Generated files: ${report.counts.generatedFiles}`,
    `- Sitemap URLs: ${report.counts.sitemapUrls}`,
    `- Opportunity cards: ${report.counts.renderedCards}`,
    `- Opportunity detail routes: ${report.counts.detailRoutes}`,
    `- Opportunity exit routes: ${report.counts.exitRoutes}`,
    `- Opportunity sitemap entries: ${report.counts.sitemapOpportunityEntries}`,
    `- Actionable errors: ${report.actionableErrors.length}`,
    `- Reviewed warnings: ${report.reviewedWarnings.length}`,
    "",
  ]),
].join("\n");

fs.writeFileSync(REPORT_PATH, `${markdown}\n`);
fs.writeFileSync(SUMMARY_JSON_PATH, `${JSON.stringify(summary, null, 2)}\n`);

console.log(JSON.stringify(summary, null, 2));

if (reports.some(({ report }) => !report.ok)) {
  process.exitCode = 1;
}
