const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const test = require("node:test");
const { imageSize } = require("image-size");
const artwork = require("../../scripts/lib/mascot-artwork.json");
const provenance = require("../../scripts/lib/mascot-provenance.json");
const { renderMascot } = require("../../scripts/lib/mascot-renderer.js");
const root = path.resolve(__dirname, "../..");

test("all five mascot poses have verified transparent responsive assets within budget", () => {
  assert.deepEqual(Object.keys(artwork.poses), ["welcome", "browse", "read", "direct", "recover"]);
  assert.equal(artwork.sourceSha256, "cfe4fabf0083d602092c8f9a13062b23ce36fddbf3b0d9a83a3d895b38f381a8");
  assert.equal(provenance.sourceSha256, artwork.sourceSha256);
  for (const [pose, art] of Object.entries(artwork.poses)) {
    assert.deepEqual(art.variants.map(v => v.width), [160, 320, 640]);
    assert.equal(provenance.poses[pose].accepted, true);
    assert.ok(provenance.poses[pose].prompt);
    for (const variant of art.variants) {
      assert.match(variant.src, /^\/assets\/mascot\/[a-z]+-v1-\d+\.webp$/);
      const buffer = fs.readFileSync(path.join(root, variant.src));
      assert.equal(buffer.length, variant.bytes);
      assert.ok(buffer.length <= 90000);
      assert.equal(crypto.createHash("sha256").update(buffer).digest("hex"), variant.sha256);
      assert.equal(imageSize(buffer).width, variant.width);
      assert.equal(imageSize(buffer).height, variant.height);
      assert.equal(buffer.toString("ascii", 12, 16), "VP8X");
      assert.ok(buffer[20] & 0x10, `${variant.src} must contain alpha`);
    }
  }
});

test("mascot rendering reserves dimensions, uses decorative alt and never gates navigation", () => {
  const welcome = renderMascot("welcome", { heading: true });
  assert.match(welcome, /alt=""/);
  assert.match(welcome, /width="160" height="200"/);
  assert.match(welcome, /srcset=/);
  assert.match(welcome, /mascot--greet/);
  for (const pose of ["browse", "read", "direct"]) assert.doesNotMatch(renderMascot(pose), /mascot--greet/);
  assert.match(renderMascot("welcome", { alt: 'FreeHub "hadeda"' }), /alt="FreeHub &quot;hadeda&quot;"/);
  assert.doesNotMatch(welcome, /<script|onload=|onclick=|<a |tabindex=/);
  assert.throws(() => renderMascot("unreviewed"), /Unknown/);
});
