const assert = require("node:assert/strict");
const test = require("node:test");
const { classifyOpportunityLinkResult } = require("../../scripts/lib/opportunity-link-policy.js");

const expectedUrl = "https://products.coloplast.co.za/campaign/";

test("manual evidence may cover access blocking but never broken or redirected pages", () => {
  assert.equal(classifyOpportunityLinkResult({ status: 403, finalUrl: expectedUrl, expectedUrl }).outcome, "evidence_allowed");
  assert.equal(classifyOpportunityLinkResult({ status: 429, finalUrl: expectedUrl, expectedUrl }).outcome, "evidence_allowed");
  assert.equal(classifyOpportunityLinkResult({ error: new Error("blocked"), expectedUrl }).outcome, "evidence_allowed");
  assert.equal(classifyOpportunityLinkResult({ status: 404, finalUrl: expectedUrl, expectedUrl }).outcome, "hard_failure");
  assert.equal(classifyOpportunityLinkResult({ status: 410, finalUrl: expectedUrl, expectedUrl }).outcome, "hard_failure");
  assert.equal(
    classifyOpportunityLinkResult({ status: 200, redirected: true, finalUrl: "https://products.coloplast.co.za/error/", expectedUrl }).outcome,
    "hard_failure"
  );
});

test("confirmed soft-404 text overrides an HTTP success", () => {
  assert.equal(
    classifyOpportunityLinkResult({
      status: 200,
      finalUrl: expectedUrl,
      expectedUrl,
      body: "<html><title>404 - Page not found</title></html>",
    }).outcome,
    "hard_failure"
  );
  assert.equal(
    classifyOpportunityLinkResult({ status: 200, finalUrl: expectedUrl, expectedUrl, body: "<title>Request a sample</title>" }).outcome,
    "ok"
  );
});
