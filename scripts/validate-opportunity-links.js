const fs = require("fs");
const path = require("path");
const opportunityData = require("../shared/opportunity-data.js");
const { classifyOpportunityLinkResult } = require("./lib/opportunity-link-policy.js");

const ROOT_DIR = path.resolve(__dirname, "..");
const opportunities = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "data", "opportunities.json"), "utf8"));
const evidence = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "data", "opportunity-source-evidence.json"), "utf8"));
const asOfDate = process.env.FREEHUB_BUILD_DATE || new Date().toISOString().slice(0, 10);
const timeoutMs = Number(process.env.OPPORTUNITY_LINK_TIMEOUT_MS || 25000);

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});

async function main() {
  const failures = [];
  const reviewedBlocks = [];
  let ok = 0;
  const published = opportunities.filter((record) => record.publicationStatus === "published");

  const ledgerValidation = opportunityData.validateSourceEvidenceLedger(evidence);
  if (!ledgerValidation.valid) {
    failures.push(...ledgerValidation.errors.map((reason) => ({ recordId: "evidence-ledger", field: "ledger", reason })));
  }

  for (const record of published) {
    for (const field of ["sourceUrl", ...(record.termsUrl ? ["termsUrl"] : [])]) {
      const result = await checkUrl(record[field]);
      if (result.outcome === "ok") {
        ok += 1;
        continue;
      }
      if (
        result.outcome === "evidence_allowed" &&
        opportunityData.hasCurrentSourceEvidence(record, field, evidence, asOfDate)
      ) {
        reviewedBlocks.push({ recordId: record.id, field, url: record[field], reason: result.reason });
        continue;
      }
      failures.push({ recordId: record.id, field, url: record[field], reason: result.reason });
    }
  }

  console.log("=== Opportunity Source Link Validation ===");
  console.log(`Published records: ${published.length}`);
  console.log(`Live URLs: ${ok}`);
  console.log(`Reviewed automated-access blocks: ${reviewedBlocks.length}`);
  console.log(`Hard failures: ${failures.length}`);
  reviewedBlocks.forEach((item) => console.log(`- reviewed: ${item.recordId}.${item.field} (${item.reason})`));
  failures.forEach((item) => console.log(`- failure: ${item.recordId}.${item.field} (${item.reason})`));

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

async function checkUrl(url) {
  try {
    const response = await fetchWithTimeout(url);
    const body = await response.text();
    return classifyOpportunityLinkResult({
      status: response.status,
      redirected: response.redirected,
      finalUrl: response.url,
      expectedUrl: url,
      body,
    });
  } catch (error) {
    return classifyOpportunityLinkResult({ error, expectedUrl: url });
  }
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": "Freehub opportunity verifier (+https://freehub.co.za/)" },
    });
  } finally {
    clearTimeout(timer);
  }
}
