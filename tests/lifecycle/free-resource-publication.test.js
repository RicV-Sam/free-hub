const assert = require("node:assert/strict");
const test = require("node:test");
const { isPublishedFreeResource } = require("../../scripts/lib/free-resource-publication.js");

test("held resources cannot return to public cards, schema or mobile catalog inputs", () => {
  const approved = { id: "approved", verificationStatus: "verified", availability: "manual_check" };
  const records = [approved,
    ...["verification_due", "source_changed", "rejected", "unknown"].map(verificationStatus => ({ ...approved, verificationStatus })),
    { ...approved, availability: "retired" },
    { ...approved, availability: "unknown" }, null];
  assert.deepEqual(records.filter(isPublishedFreeResource), [approved]);
});

test("legacy directory entries retain their existing publication behavior", () => {
  const legacy = Object.freeze({ name: "Existing directory", officialUrl: "https://example.com/" });
  assert.equal(isPublishedFreeResource(legacy), true);
  assert.equal(isPublishedFreeResource({ ...legacy, availability: "retired" }), false);
});
