const assert = require("node:assert/strict");
const test = require("node:test");
const { compareWarningBaseline } = require("../../scripts/lib/warning-baseline.js");

const expectedWarning = {
  sourceType: "competition",
  recordId: "fixture-record",
  field: "url",
  reason: "expired_archive_404",
  url: "https://example.com/old-source",
  lifecycle: "expired-archive",
};
const baseline = { version: 1, warnings: [expectedWarning] };

test("unchanged warnings remain known", () => {
  const comparison = compareWarningBaseline([expectedWarning], baseline, "competition");
  assert.equal(comparison.known.length, 1);
  assert.equal(comparison.hasRegression, false);
});

test("resolved warnings pass without freezing the warning count", () => {
  const comparison = compareWarningBaseline([], baseline, "competition");
  assert.equal(comparison.resolved.length, 1);
  assert.equal(comparison.hasRegression, false);
});

test("a different warning with the same total count is a regression", () => {
  const replacement = { ...expectedWarning, recordId: "different-record" };
  const comparison = compareWarningBaseline([replacement], baseline, "competition");
  assert.equal(comparison.added.length, 1);
  assert.equal(comparison.resolved.length, 1);
  assert.equal(comparison.hasRegression, true);
});

test("reason and context changes require baseline review", () => {
  const reasonChange = compareWarningBaseline(
    [{ ...expectedWarning, reason: "expired_archive_timeout" }],
    baseline,
    "competition"
  );
  assert.equal(reasonChange.hasRegression, true);

  const contextChange = compareWarningBaseline(
    [{ ...expectedWarning, url: "https://example.com/different-source" }],
    baseline,
    "competition"
  );
  assert.equal(contextChange.changed.length, 1);
  assert.equal(contextChange.hasRegression, true);
});
