const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const data = require("../../data/fuel-rewards.json");
const { calculate, maximumBankPercent } = require("../../shared/fuel-rewards-engine.js");
const { getReviewedGuides } = require("../../scripts/lib/research-guides.js");
const base = { spend:2500, price:25, stations:["shell","bp","sasol","engen","astron"] };
const calc = changes => calculate(data, {...base, ...changes}, "2026-10-11");
const bankResult = result => result.results.find(row => !["Shell V+ Regular", "BP Rewards", "BP Rewards + Smart Shopper"].includes(row.name));

test("forecourt value uses the supplied pump price; Sasol points are not ranked as rands", () => {
  const result = calc({});
  assert.equal(result.litres, 100);
  assert.equal(result.results[0].name, "BP Rewards");
  assert.equal(result.results[0].net, 20);
  assert.equal(result.results[1].net, 15);
  assert.equal(result.points.points, 3000);
  assert.match(result.points.note, /100-litre/);
  assert.equal(calc({smartShopper:true}).results[0].net, 30);
  assert.equal(calc({stations:["sasol"]}).results.length, 0);
  const engenWithoutBank = calc({stations:["engen"]});
  assert.equal(engenWithoutBank.results.length, 0);
  assert.equal(engenWithoutBank.points, null);
  assert.equal(calc({spend:0}).results[0].net, 0);
});
test("invalid or missing primary inputs fail without a fabricated result", () => {
  for (const price of [0, -1, "", "  ", NaN, Infinity, "<script>"]) assert.throws(() => calc({price}));
  assert.throws(() => calc({spend:-10}));
  assert.throws(() => calc({stations:[]}));
  assert.throws(() => calc({stations:["invented-station"]}));
  assert.throws(() => calc({shellTier:0.5}));
});
test("unknown or unconfirmed bank eligibility excludes its estimate and retains forecourt options", () => {
  const result = calc({bank:"fnb"});
  assert.match(result.bankError, /Confirm/);
  assert.equal(result.results.length, 2);
  const missing = calc({bank:"fnb", confirmed:true, rate:4, referencePrice:25, qualifyingSpend:""});
  assert.match(missing.bankError, /remaining qualifying/);
  assert.equal(bankResult(missing), undefined);
});
test("Absa applies the card tier, consumed partner allowance and explicitly supported V+ combination", () => {
  const credit = calc({spend:4000, bank:"absa-shell", confirmed:true, card:"credit", tier:5, usedSpend:500});
  assert.equal(bankResult(credit).gross, 774); // R2,500 × 30% plus 160 litres × 15c.
  const debit = calc({bank:"absa-sasol", confirmed:true, card:"debit", tier:5});
  assert.equal(bankResult(debit).gross, 112.5);
  assert.ok(!bankResult(debit).name.includes("+ Sasol"));
  assert.match(bankResult(debit).note, /Sasol points are shown separately; no rand conversion added/);
  assert.equal(bankResult(calc({bank:"absa-sasol", confirmed:true, card:"credit", tier:5, usedSpend:3000})).gross, 0);
  assert.match(calc({bank:"absa-shell", confirmed:true, card:"credit", tier:5, stations:["bp"]}).bankError, /station/);
});
test("Greenbacks and BP use distinct conversion prices without adding Smart Shopper", () => {
  const row = bankResult(calc({spend:1000, price:20, bank:"nedbank", confirmed:true, referencePrice:25, smartShopper:true}));
  assert.equal(row.gross, 20); // 40 bank-equivalent litres × 25c + 50 pump litres × 20c.
  assert.match(row.note, /No Smart Shopper/);
});
test("FNB add-ons scale with the base rate and apply the remaining insurance-premium cap", () => {
  const input = {bank:"fnb", confirmed:true, rate:4, qualifyingSpend:1500, referencePrice:25, finance:true, insurance:true, premium:200};
  assert.equal(bankResult(calc(input)).gross, 420);
  assert.equal(bankResult(calc({...input, insuranceUsed:50})).gross, 370);
  assert.equal(bankResult(calc({...input, insuranceUsed:100})).gross, 360);
  assert.equal(bankResult(calc({...input, rate:0.8, insurance:false})).gross, 72);
  assert.match(calc({...input, premium:""}).bankError, /premium/);
  assert.match(calc({...input, qualifyingSpend:3001}).bankError, /3000/);
  assert.match(calculate(data, {...base, ...input}, "2027-07-01").bankError, /ended/);
});
test("UCount limits earning by fixed-cycle card spend, used fuel allowance and reward cap", () => {
  const input = {bank:"ucount", confirmed:true, card:"credit", tier:5, cardSpend:5000, usedSpend:200, referencePrice:25, rewardCap:300, double:true, costs:50};
  const row = bankResult(calc(input));
  assert.equal(row.gross, 300);
  assert.equal(row.net, 250);
  assert.match(row.note, /800.00/);
  assert.match(calc({...input, card:"debit"}).bankError, /do not qualify/);
  assert.equal(bankResult(calc({...input, card:"evolve", rewardCap:1000, costs:0})).gross, 160);
  assert.match(calc({...input, rewardCap:""}).bankError, /remaining reward limit/);
});
test("Vitality Drive applies spend, reward and vehicle-premium caps; BP alone is stacked", () => {
  const input = {bank:"discovery-insure", confirmed:true, discoveryStation:"bp", rate:50, qualifyingSpend:1500, rewardCap:1000, premium:500, smartShopper:true};
  assert.equal(bankResult(calc(input)).gross, 520);
  assert.equal(bankResult(calc({...input, discoveryStation:"shell"})).gross, 500);
  assert.equal(bankResult(calc({...input, rewardCap:100})).gross, 120);
  assert.match(calc({...input, qualifyingSpend:3001}).bankError, /3000/);
  assert.match(calc({...input, premium:""}).bankError, /premium/);
});
test("Discovery Bank switches the permitted percentage on 1 November without inferring an actual rate", () => {
  const input = {...base, bank:"discovery-bank", confirmed:true, discoveryStation:"shell", rate:20, qualifyingSpend:2000, rewardCap:500};
  assert.equal(maximumBankPercent(data, "2026-10-31"), 20);
  assert.equal(maximumBankPercent(data, "2026-11-01"), 15);
  assert.equal(bankResult(calculate(data, input, "2026-10-31")).gross, 400);
  assert.match(calculate(data, input, "2026-11-01").bankError, /15/);
  assert.equal(bankResult(calculate(data, {...input,rate:15}, "2026-11-01")).gross, 300);
  assert.match(calc({...input,rate:""}).bankError, /percentage/);
});
test("extra costs can outweigh a reward and do not change unrelated alternatives", () => {
  const result = calc({bank:"absa-sasol", confirmed:true, card:"debit", tier:1, costs:30});
  const row = bankResult(result);
  assert.equal(row.gross, 17.5);
  assert.equal(row.net, -12.5);
  assert.equal(result.results[0].net, 20);
});
test("the indexable evergreen guide provides static sources, methods and a progressive calculator", () => {
  const guide = getReviewedGuides("2026-11-01").find(row => row.fuelRewards);
  assert.equal(guide.slug, "guides/best-fuel-rewards-south-africa");
  assert.equal(guide.noindex, false);
  assert.equal(guide.dateModified, "2026-10-11");
  const html = fs.readFileSync(path.join(__dirname,"../../guides/best-fuel-rewards-south-africa/index.html"),"utf8");
  assert.equal([...html.matchAll(/<h1\b/g)].length,1);
  assert.ok(html.includes('href="https://freehub.co.za/guides/best-fuel-rewards-south-africa/"'));
  assert.ok(html.includes("<noscript>"));
  assert.ok(html.includes('id="method"'));
  assert.equal(data.programmes.length,9);
  assert.ok(!html.includes("R30.25"));
  assert.ok(html.includes('id="fuel-form" hidden'));
  assert.ok(html.includes('/shared/fuel-rewards-ui.js?v='));
  assert.ok(html.includes('https://sasolrewards.co.za/partners/ABSA'));
  assert.ok(!html.includes('We have not confirmed a current override'));
});
