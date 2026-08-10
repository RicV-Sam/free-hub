const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Ajv2020 = require("ajv/dist/2020");
const addFormats = require("ajv-formats");
const merchantData = require("../../shared/merchant-data.js");

const merchants = require("../../data/merchants.json");
const offers = require("../../data/offers.json");

test("merchant registry validates and covers every current offer brand", () => {
  assert.equal(merchantData.validateMerchantRegistry(merchants).valid, true);
  assert.equal(merchantData.validateOfferMerchantReferences(offers, merchants).valid, true);
  assert.deepEqual(
    merchants.map((merchant) => merchant.id),
    [...merchants.map((merchant) => merchant.id)].sort()
  );
});

test("merchant references fail closed on missing, inactive, or renamed entities", () => {
  const fixtureOffer = [{ brandSlug: "fixture-store", brand: "Fixture Store" }];
  const fixtureMerchant = [{ id: "fixture-store", name: "Fixture Store", kind: "merchant", officialUrl: "https://example.co.za/", country: "ZA", active: true }];
  assert.equal(merchantData.validateOfferMerchantReferences(fixtureOffer, fixtureMerchant).valid, true);
  assert.equal(merchantData.validateOfferMerchantReferences(fixtureOffer, []).valid, false);
  assert.equal(merchantData.validateOfferMerchantReferences(fixtureOffer, [{ ...fixtureMerchant[0], active: false }]).valid, false);
  assert.equal(merchantData.validateOfferMerchantReferences(fixtureOffer, [{ ...fixtureMerchant[0], name: "Renamed" }]).valid, false);
});

test("the committed merchant schema compiles and matches the registry", () => {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const schema = JSON.parse(fs.readFileSync(path.join(__dirname, "../../data/schemas/merchant.schema.json"), "utf8"));
  const validate = ajv.compile(schema);
  assert.equal(merchants.every((merchant) => validate(merchant)), true);
});
