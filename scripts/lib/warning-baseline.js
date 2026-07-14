const fs = require("fs");
const path = require("path");

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeReason(reason, lifecycle, sourceType) {
  const raw = String(reason || "unknown").trim().toLowerCase();
  if (sourceType === "competition" && lifecycle === "expired-archive" && /^http-\d+$/.test(raw)) {
    return `expired_archive_${raw.replace("http-", "")}`;
  }
  if (sourceType === "free-resource" && raw.startsWith("manual-ok after http ")) {
    return `manual_check_http_${raw.match(/\d+/)?.[0] || "unknown"}`;
  }
  if (sourceType === "free-resource" && raw.startsWith("manual-ok after ")) {
    return `manual_check_${slugify(raw.slice("manual-ok after ".length)).replace(/-/g, "_")}`;
  }
  return slugify(raw).replace(/-/g, "_") || "unknown";
}

function normalizeCompetitionWarning(result) {
  return {
    sourceType: "competition",
    recordId: String(result.id || "").trim(),
    field: String(result.field || "url").trim(),
    reason: normalizeReason(result.reason, result.lifecycle, "competition"),
    url: String(result.url || result.finalUrl || "").trim(),
    lifecycle: String(result.lifecycle || "unknown").trim(),
  };
}

function normalizeResourceWarning(result) {
  const category = slugify(result.category || "uncategorized");
  const name = slugify(result.name || "unnamed");
  return {
    sourceType: "free-resource",
    recordId: `free-resource:${category}:${name}`,
    field: "officialUrl",
    reason: normalizeReason(result.reason, "active-manual-check", "free-resource"),
    url: String(result.url || "").trim(),
    lifecycle: "active-manual-check",
  };
}

function warningKey(warning) {
  return `${warning.recordId}\u0000${warning.field}\u0000${warning.reason}`;
}

function sortWarnings(warnings) {
  return [...warnings].sort((left, right) => {
    const leftValue = `${left.sourceType}:${warningKey(left)}:${left.url}:${left.lifecycle}`;
    const rightValue = `${right.sourceType}:${warningKey(right)}:${right.url}:${right.lifecycle}`;
    return leftValue.localeCompare(rightValue);
  });
}

function loadWarningBaseline(rootDir, baselinePath) {
  const resolved = path.resolve(rootDir, baselinePath);
  const parsed = JSON.parse(fs.readFileSync(resolved, "utf8"));
  if (parsed.version !== 1 || !Array.isArray(parsed.warnings)) {
    throw new Error(`Invalid warning baseline: ${resolved}`);
  }
  return parsed;
}

function compareWarningBaseline(observedWarnings, baseline, sourceType) {
  const expected = baseline.warnings.filter((warning) => warning.sourceType === sourceType);
  const observed = observedWarnings.filter((warning) => warning.sourceType === sourceType);
  const expectedByKey = new Map(expected.map((warning) => [warningKey(warning), warning]));
  const observedByKey = new Map(observed.map((warning) => [warningKey(warning), warning]));
  const known = [];
  const changed = [];
  const added = [];
  const resolved = [];

  observed.forEach((warning) => {
    const prior = expectedByKey.get(warningKey(warning));
    if (!prior) {
      added.push(warning);
      return;
    }
    if (prior.url !== warning.url || prior.lifecycle !== warning.lifecycle) {
      changed.push({ expected: prior, actual: warning });
      return;
    }
    known.push(warning);
  });

  expected.forEach((warning) => {
    if (!observedByKey.has(warningKey(warning))) {
      resolved.push(warning);
    }
  });

  return {
    known: sortWarnings(known),
    added: sortWarnings(added),
    resolved: sortWarnings(resolved),
    changed,
    hasRegression: added.length > 0 || changed.length > 0,
  };
}

function formatWarning(warning) {
  return `${warning.recordId} | ${warning.lifecycle} | ${warning.field} | ${warning.reason} | ${warning.url}`;
}

function printWarningComparison(comparison) {
  console.log("Known warnings:");
  if (comparison.known.length === 0) {
    console.log("- none");
  } else {
    comparison.known.forEach((warning) => console.log(`- ${formatWarning(warning)}`));
  }

  console.log("Resolved warnings (non-failing):");
  if (comparison.resolved.length === 0) {
    console.log("- none");
  } else {
    comparison.resolved.forEach((warning) => console.log(`- ${formatWarning(warning)}`));
  }

  console.log("New warnings (baseline review required):");
  if (comparison.added.length === 0) {
    console.log("- none");
  } else {
    comparison.added.forEach((warning) => console.log(`- ${formatWarning(warning)}`));
  }

  console.log("Changed warnings (baseline review required):");
  if (comparison.changed.length === 0) {
    console.log("- none");
  } else {
    comparison.changed.forEach(({ expected, actual }) => {
      console.log(`- expected: ${formatWarning(expected)}`);
      console.log(`  actual:   ${formatWarning(actual)}`);
    });
  }
}

module.exports = {
  compareWarningBaseline,
  loadWarningBaseline,
  normalizeCompetitionWarning,
  normalizeResourceWarning,
  printWarningComparison,
  sortWarnings,
  warningKey,
};
