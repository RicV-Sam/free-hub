const assert = require("node:assert/strict");
const test = require("node:test");
const { getCiNetworkInconclusiveReason } = require("../../scripts/lib/ci-network-policy.js");

test("CI network policy is disabled by default", () => {
  assert.equal(getCiNetworkInconclusiveReason({ status: 403 }), "");
  assert.equal(getCiNetworkInconclusiveReason({ status: 503 }), "");
  assert.equal(getCiNetworkInconclusiveReason({ error: new Error("fetch failed") }), "");
});

test("CI network policy identifies runner access blocks and transient failures", () => {
  for (const status of [401, 403, 429, 500, 502, 503, 504]) {
    assert.equal(
      getCiNetworkInconclusiveReason({ status }, true),
      `ci-network-inconclusive-http-${status}`
    );
  }

  const timeout = new Error("timed out");
  timeout.name = "AbortError";
  assert.equal(getCiNetworkInconclusiveReason({ error: timeout }, true), "ci-network-inconclusive-timeout");
  assert.equal(
    getCiNetworkInconclusiveReason({ error: new Error("fetch failed") }, true),
    "ci-network-inconclusive-fetch-error"
  );
});

test("CI network policy never downgrades confirmed broken responses", () => {
  for (const status of [400, 404, 410, 422]) {
    assert.equal(getCiNetworkInconclusiveReason({ status }, true), "");
  }
});
