const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { imageSize } = require("image-size");
const manifest = require("../../data/responsive-images.json");
const root = path.resolve(__dirname, "../..");
const hash = bytes => crypto.createHash("sha256").update(bytes).digest("hex");

test("responsive derivatives match recorded sources, hashes and uncropped aspect ratios", () => {
  for (const [source, entry] of Object.entries(manifest)) {
    const original = fs.readFileSync(path.join(root, source));
    assert.equal(hash(original), entry.sourceSha256, source);
    const size = imageSize(original);
    for (const variant of entry.variants) {
      const bytes = fs.readFileSync(path.join(root, variant.src));
      assert.equal(hash(bytes), variant.sha256, variant.src);
      assert.equal(bytes.length, variant.bytes);
      assert.deepEqual({ width: imageSize(bytes).width, height: imageSize(bytes).height }, { width: variant.width, height: variant.height });
      assert.ok(Math.abs(variant.height - size.height * variant.width / size.width) <= 1);
      assert.ok(variant.width <= size.width);
    }
  }
});
