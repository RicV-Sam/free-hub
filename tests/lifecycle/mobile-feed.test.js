const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { ALLOWED_ITEM_KEYS, buildMobileCatalog, buildMobileFeed } = require("../../scripts/lib/mobile-feed.js");

const competitions = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "..", "data", "competitions.json"), "utf8")
);

test("mobile feed exports only active public competitions and allowlisted fields", () => {
  const feed = buildMobileFeed(competitions, { asOfDate: "2026-08-30" });

  assert.ok(feed.competitions.length > 0);
  assert.equal(feed.count, feed.competitions.length);
  feed.competitions.forEach((item) => {
    assert.deepEqual(
      Object.keys(item).filter((key) => !ALLOWED_ITEM_KEYS.includes(key)),
      []
    );
    assert.doesNotMatch(item.officialUrl, /freehub\.co\.za/i);
    assert.doesNotMatch(JSON.stringify(item), /verificationStatus|publicationStatus|evidenceNotes|doNotPublish/);
  });
});

test("mobile feed rejects a Freehub redirect as an official entry URL", () => {
  const unsafe = {
    id: "unsafe-entry",
    title: "Unsafe entry",
    brand: "Example",
    summary: "Example competition.",
    image: "https://freehub.co.za/assets/example.png",
    closingDate: "2026-09-30",
    category: "Cash",
    prizeName: "Cash",
    url: "https://freehub.co.za/out/unsafe-entry/",
    verificationStatus: "published",
    entryCostType: "free-entry",
  };

  assert.throws(
    () => buildMobileFeed([unsafe], { asOfDate: "2026-08-30" }),
    /must not route through Freehub/
  );
});

test("mobile catalog includes durable resources but fails closed on overdue strict resources", () => {
  const catalog = buildMobileCatalog({
    resources: [
      {
        name: "Durable guide",
        category: "online-courses",
        categoryLabel: "Free online courses",
        officialUrl: "https://example.org/course",
        bestFor: "Beginners",
        freeDetails: "A free course.",
        requirements: "An account may be required.",
        watchOut: "Certificates may cost extra.",
        lastReviewed: "2026-07-01",
      },
      {
        id: "stale-sample",
        name: "Stale sample",
        category: "samples",
        categoryLabel: "Free samples",
        officialUrl: "https://example.org/sample",
        bestFor: "Adults",
        freeDetails: "A sample request.",
        requirements: "Application required.",
        watchOut: "Stock can change.",
        availability: "active",
        verificationStatus: "verified",
        reviewDueAt: "2026-08-29",
        lastReviewed: "2026-08-20",
      },
    ],
  }, { asOfDate: "2026-08-30" });

  assert.equal(catalog.counts.resources, 1);
  assert.equal(catalog.items[0].title, "Durable guide");
  assert.doesNotMatch(catalog.items[0].officialUrl, /freehub\.co\.za/i);
});

test("mobile catalog exports only pre-approved offers and opportunities passed by the publication gate", () => {
  const catalog = buildMobileCatalog({
    opportunities: [{
      id: "sample-one",
      type: "free_sample",
      title: "Sample one",
      provider: "Provider",
      summary: "Request a sample from the provider.",
      sourceUrl: "https://provider.example/sample",
      requirements: [{ kind: "account", required: true, label: "Account required" }],
      lastVerifiedAt: "2026-08-30",
    }],
    offers: [{
      id: "offer-one",
      type: "coupon",
      brand: "Shop",
      title: "Ten percent off",
      summary: "Save ten percent.",
      destinationUrl: "https://shop.example/",
      sourceUrl: "https://shop.example/terms",
      category: "shopping",
      couponCode: "SAVE10",
      terms: "Selected items only.",
      lastChecked: "2026-08-30",
      affiliate: false,
      sponsored: false,
    }],
  }, { asOfDate: "2026-08-30" });

  assert.equal(catalog.counts.opportunities, 1);
  assert.equal(catalog.counts.offers, 1);
  assert.equal(catalog.items.find((item) => item.kind === "coupon").couponCode, "SAVE10");
});
