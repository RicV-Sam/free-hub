function classifyOpportunityLinkResult({ status, redirected = false, finalUrl = "", expectedUrl = "", body = "", error = null }) {
  if (error) {
    return { outcome: "evidence_allowed", reason: error.message || String(error) };
  }
  if (redirected || (finalUrl && normalizeUrl(finalUrl) !== normalizeUrl(expectedUrl))) {
    return { outcome: "hard_failure", reason: `redirected to ${finalUrl || "another URL"}` };
  }
  if (status === 404 || status === 410) {
    return { outcome: "hard_failure", reason: `HTTP ${status}` };
  }
  if (status >= 200 && status < 400) {
    if (isSoft404(body)) {
      return { outcome: "hard_failure", reason: "confirmed soft-404 response" };
    }
    return { outcome: "ok", reason: `HTTP ${status}` };
  }
  if ([401, 403, 429].includes(status) || status >= 500) {
    return { outcome: "evidence_allowed", reason: `HTTP ${status}` };
  }
  return { outcome: "hard_failure", reason: `HTTP ${status}` };
}

function isSoft404(body) {
  const sample = String(body || "").slice(0, 200000).toLowerCase();
  return [
    /<title>[^<]*(?:404|page not found|not found)[^<]*<\/title>/,
    /(?:the page|this page|page you requested) (?:could not be found|does not exist|is no longer available)/,
  ].some((pattern) => pattern.test(sample));
}

function normalizeUrl(value) {
  try {
    return new URL(value).toString();
  } catch (error) {
    return String(value || "");
  }
}

module.exports = { classifyOpportunityLinkResult, isSoft404 };
