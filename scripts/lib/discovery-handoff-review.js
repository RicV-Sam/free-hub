const crypto = require("node:crypto");

const SUPPORTED_VERTICALS = Object.freeze([
  "promotion",
  "coupon",
  "free_sample",
  "product_testing",
]);

const FORBIDDEN_SOURCE_FIELDS = new Set([
  "publicationStatus",
  "verificationStatus",
  "publishedAt",
  "doNotPublish",
  "publish",
  "published",
  "public",
  "readyToPublish",
]);

const EDITORIAL_STATUSES = new Set([
  "pending_review",
  "accepted_for_curation",
  "rejected",
  "duplicate_resolved",
]);

function asString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(asString(value));
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch (_error) {
    return false;
  }
}

function findForbiddenFields(value, path = "handoff", found = []) {
  if (!value || typeof value !== "object") return found;
  Object.entries(value).forEach(([key, child]) => {
    const childPath = `${path}.${key}`;
    if (FORBIDDEN_SOURCE_FIELDS.has(key)) found.push(childPath);
    findForbiddenFields(child, childPath, found);
  });
  return found;
}

function validateHandoff(handoff) {
  const errors = [];
  if (!handoff || typeof handoff !== "object" || Array.isArray(handoff)) {
    return { valid: false, errors: ["Handoff must be a JSON object."] };
  }
  if (handoff.handoffVersion !== 1) errors.push("handoffVersion must be 1.");
  if (!isIsoDate(handoff.asOfDate)) errors.push("asOfDate must use YYYY-MM-DD.");
  if (!asString(handoff.generatedAt) || Number.isNaN(Date.parse(handoff.generatedAt))) {
    errors.push("generatedAt must be an ISO timestamp.");
  }
  if (!Array.isArray(handoff.rows)) errors.push("rows must be an array.");
  if (!Array.isArray(handoff.warnings)) errors.push("warnings must be an array.");
  findForbiddenFields(handoff).forEach((field) => {
    errors.push(`Source handoff must not set FreeHub-controlled field ${field}.`);
  });

  const seen = new Set();
  (Array.isArray(handoff.rows) ? handoff.rows : []).forEach((row, index) => {
    const label = `rows[${index}]`;
    if (!Number.isInteger(row.localCandidateId) || row.localCandidateId < 1) {
      errors.push(`${label}.localCandidateId must be a positive integer.`);
    }
    if (!SUPPORTED_VERTICALS.includes(row.vertical)) {
      errors.push(`${label}.vertical is not supported.`);
    }
    if (!asString(row.candidateKey)) errors.push(`${label}.candidateKey is required.`);
    const identity = `${row.vertical}:${row.candidateKey}`;
    if (seen.has(identity)) errors.push(`${label} duplicates ${identity}.`);
    seen.add(identity);
    if (row.reviewStatus !== "approved_for_handoff") {
      errors.push(`${label}.reviewStatus must be approved_for_handoff.`);
    }
    if (!asString(row.reviewerNotes)) errors.push(`${label}.reviewerNotes is required.`);
    if (!row.candidate || typeof row.candidate !== "object" || Array.isArray(row.candidate)) {
      errors.push(`${label}.candidate must be an object.`);
      return;
    }
    if (row.candidate.vertical !== row.vertical) errors.push(`${label}.candidate.vertical does not match.`);
    if (row.candidate.candidateKey !== row.candidateKey) errors.push(`${label}.candidate.candidateKey does not match.`);
    ["title", "summary", "sourceUrl", "destinationUrl", "checkedAt", "country", "evidenceNotes"].forEach((field) => {
      if (!asString(row.candidate[field])) errors.push(`${label}.candidate.${field} is required.`);
    });
    ["sourceUrl", "destinationUrl", "termsUrl", "privacyUrl"].forEach((field) => {
      if (row.candidate[field] !== undefined && !isHttpsUrl(row.candidate[field])) {
        errors.push(`${label}.candidate.${field} must be an HTTPS URL.`);
      }
    });
    if (!isIsoDate(row.candidate.checkedAt)) errors.push(`${label}.candidate.checkedAt must use YYYY-MM-DD.`);
    if (row.candidate.country !== "ZA") errors.push(`${label}.candidate.country must be ZA.`);
    const entityId = asString(row.candidate.merchantId || row.candidate.providerId);
    const entityName = asString(row.candidate.merchantName || row.candidate.providerName);
    if (!entityId || !entityName) errors.push(`${label}.candidate must identify a merchant or provider.`);
  });
  return { valid: errors.length === 0, errors };
}

function createPublicIndexes(offers = [], opportunities = []) {
  const byUrl = new Map();
  function add(records, entityKind) {
    records.forEach((record) => {
      [record.sourceUrl, record.destinationUrl].filter(Boolean).forEach((url) => {
        if (!byUrl.has(url)) byUrl.set(url, []);
        byUrl.get(url).push({ entityKind, id: record.id, title: record.title });
      });
    });
  }
  add(offers, "offer");
  add(opportunities, "opportunity");
  return { byUrl };
}

function getPublicMatches(candidate, indexes) {
  const matches = [];
  const seen = new Set();
  [candidate.sourceUrl, candidate.destinationUrl].filter(Boolean).forEach((url) => {
    (indexes.byUrl.get(url) || []).forEach((match) => {
      const key = `${match.entityKind}:${match.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        matches.push(match);
      }
    });
  });
  return matches;
}

function sourceFingerprint(row) {
  return crypto.createHash("sha256").update(JSON.stringify(row)).digest("hex");
}

function mapRow(row, handoff, indexes, existing, nowIso) {
  const matches = getPublicMatches(row.candidate, indexes);
  const identity = `${row.vertical}:${row.candidateKey}`;
  const preserveStatus = existing && EDITORIAL_STATUSES.has(existing.editorialStatus);
  return {
    id: identity,
    sourceSystem: "za-comp-engine",
    sourceHandoffVersion: handoff.handoffVersion,
    sourceCandidateId: row.localCandidateId,
    vertical: row.vertical,
    candidateKey: row.candidateKey,
    sourceReviewStatus: row.reviewStatus,
    sourceReviewerNotes: row.reviewerNotes,
    candidate: row.candidate,
    sourceFingerprint: sourceFingerprint(row),
    matchState: matches.length > 0 ? "existing_public_match" : "new_candidate",
    publicMatches: matches,
    editorialStatus: preserveStatus ? existing.editorialStatus : "pending_review",
    editorialNotes: existing ? asString(existing.editorialNotes) : "",
    assignedTo: existing ? asString(existing.assignedTo) : "",
    firstImportedAt: existing && existing.firstImportedAt ? existing.firstImportedAt : nowIso,
    lastImportedAt: nowIso,
    publicationDecision: false,
  };
}

function buildReviewRegistry({ handoff, offers = [], opportunities = [], existingRegistry = null, nowIso }) {
  const validation = validateHandoff(handoff);
  if (!validation.valid) throw new Error(validation.errors.join("\n"));
  const indexes = createPublicIndexes(offers, opportunities);
  const existingById = new Map(
    existingRegistry && Array.isArray(existingRegistry.records)
      ? existingRegistry.records.map((record) => [record.id, record])
      : []
  );
  const records = handoff.rows.map((row) => {
    const id = `${row.vertical}:${row.candidateKey}`;
    return mapRow(row, handoff, indexes, existingById.get(id), nowIso);
  });
  return {
    registryVersion: 1,
    generatedAt: nowIso,
    source: {
      system: "za-comp-engine",
      handoffVersion: handoff.handoffVersion,
      generatedAt: handoff.generatedAt,
      asOfDate: handoff.asOfDate,
      warningCount: handoff.warnings.length,
    },
    publicationPolicy: "private_editorial_review_only",
    records,
  };
}

function summarizeRegistry(registry) {
  const summary = {
    records: registry.records.length,
    newCandidates: 0,
    existingPublicMatches: 0,
    pendingReview: 0,
    byVertical: {},
  };
  registry.records.forEach((record) => {
    summary.byVertical[record.vertical] = (summary.byVertical[record.vertical] || 0) + 1;
    if (record.matchState === "existing_public_match") summary.existingPublicMatches += 1;
    else summary.newCandidates += 1;
    if (record.editorialStatus === "pending_review") summary.pendingReview += 1;
  });
  return summary;
}

module.exports = {
  EDITORIAL_STATUSES,
  FORBIDDEN_SOURCE_FIELDS,
  SUPPORTED_VERTICALS,
  buildReviewRegistry,
  summarizeRegistry,
  validateHandoff,
};
