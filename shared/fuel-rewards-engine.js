(function (root, factory) {
  const engine = factory();
  if (typeof module === "object" && module.exports) module.exports = engine;
  else root.FreeHubFuelRewards = engine;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  function number(value, name, min = 0, max = 1000000) {
    if (value === null || value === undefined || typeof value === "boolean" || (typeof value === "string" && !value.trim())) throw new Error(`Enter ${name}.`);
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < min || parsed > max) throw new Error(`${name} must be between ${min} and ${max}.`);
    return parsed;
  }
  function tier(value, rates) {
    const n = number(value, "your reward tier", 1, rates.length);
    if (!Number.isInteger(n)) throw new Error("Choose a whole reward tier.");
    return rates[n - 1];
  }
  function maximumBankPercent(data, asOfDate) {
    return asOfDate >= data.discoveryBankChangeDate ? data.discoveryBankMaximumPercentAfter : data.discoveryBankMaximumPercentBefore;
  }
  function calculate(data, input, asOfDate) {
    const spend = number(input.spend, "monthly fuel spend", 0, 100000);
    const price = number(input.price, "the fuel price per litre", 0.01, 1000);
    const stations = new Set((Array.isArray(input.stations) ? input.stations : []).filter(station => ["shell", "bp", "sasol", "engen", "astron"].includes(station)));
    if (!stations.size) throw new Error("Choose at least one convenient fuel station.");
    const shellIndex = number(input.shellTier ?? 0, "your Shell tier", 0, data.shellRates.length - 1);
    if (!Number.isInteger(shellIndex)) throw new Error("Choose a Shell tier from the list.");
    const shellRate = data.shellRates[shellIndex];
    const litres = spend / price;
    const results = [];
    const add = (name, station, gross, note, costs = 0) => results.push({ name, station, gross, costs, net: gross - costs, note });
    if (stations.has("shell")) add(`Shell V+ ${data.shellTiers[shellIndex]}`, "shell", litres * shellRate, "Spendable at Shell. Assumes your confirmed tier applies to this fuel.");
    if (stations.has("bp")) add(input.smartShopper ? "BP Rewards + Smart Shopper" : "BP Rewards", "bp", litres * (input.smartShopper ? data.bpSmartShopperCombinedRate : data.bpRate), input.smartShopper ? "Combined value in two balances; estimated before transaction rounding." : "BP balance. Minimum R20 BP Rewards balance to redeem.");
    const points = stations.has("sasol") ? { name: "Sasol Rewards", points: litres * data.sasolPointsPerLitre, note: "Before the 100-litre earning cap in any 24 hours. No rand conversion assumed; excluded from the rand ranking." } : null;
    const bank = input.bank || "none";
    let bankError = "";
    if (bank !== "none") {
      try {
        if (input.confirmed !== true) throw new Error("Confirm that your programme is active and that you meet its qualifying rules.");
        const costs = number(input.costs ?? 0, "extra monthly costs", 0, 100000);
        const referencePrice = () => number(input.referencePrice, "your provider’s fuel conversion price", 0.01, 1000);
        const qualifyingSpend = (max = 100000) => Math.min(spend, number(input.qualifyingSpend, "remaining qualifying fuel spend", 0, max));
        const rewardCap = (max = 100000) => number(input.rewardCap, "the remaining reward limit", 0, max);
        const requireStation = station => { if (!stations.has(station)) throw new Error("Choose a convenient station supported by this reward."); };
        if (bank === "absa-shell" || bank === "absa-sasol") {
          const station = bank === "absa-shell" ? "shell" : "sasol";
          requireStation(station);
          if (!data.absaRates[input.card]) throw new Error("Choose your Absa card type.");
          const rate = tier(input.tier, data.absaRates[input.card]);
          const used = number(input.usedSpend ?? 0, "other partner spending this month", 0, 100000);
          const eligible = Math.min(spend, Math.max(0, data.absaSpendCap - used));
          const base = station === "shell" ? litres * shellRate : 0;
          add(station === "shell" ? "Absa Rewards + Shell V+" : "Absa Rewards at Sasol", station, eligible * rate / 100 + base, station === "shell" ? `${rate}% on R${eligible.toFixed(2)} eligible spend, plus V+ value in a separate balance.` : `${rate}% on R${eligible.toFixed(2)} eligible spend. Sasol points are shown separately; no rand conversion added.`, costs);
        } else if (bank === "nedbank") {
          requireStation("bp");
          const bankValue = spend / referencePrice() * data.nedbankRate;
          add("Greenbacks + BP Rewards", "bp", bankValue + litres * data.bpRate, "Nedbank uses its inland ULP 95 price; BP Rewards uses the pump litres. No Smart Shopper reward added. Before Greenbacks rounding.", costs);
        } else if (bank === "fnb") {
          requireStation("engen");
          if (asOfDate > data.fnbRulesThrough) throw new Error("These eBucks rules ended on 30 June 2027. Check the new rules before calculating.");
          const eligible = qualifyingSpend(data.fnbMaximumSpendCap);
          const bankLitres = eligible / referencePrice();
          const baseRate = number(input.rate, "your confirmed base eBucks rate (R/litre)", 0, data.fnbMaximumBaseRate);
          const finance = input.finance === true ? bankLitres * baseRate / 2 : 0;
          const insurance = input.insurance === true ? Math.min(bankLitres * baseRate / 2, Math.max(0, number(input.premium, "your eligible car-insurance premium", 0, 100000) * data.fnbInsurancePremiumCap - number(input.insuranceUsed ?? 0, "insurance fuel reward already earned", 0, 100000))) : 0;
          add("FNB eBucks at Engen", "engen", bankLitres * baseRate + finance + insurance, `Uses R${eligible.toFixed(2)} qualifying spend and your provider’s conversion price. Insurance add-on limited to 30% of the eligible premium. Premier/Private virtual-card route only.`, costs);
        } else if (bank === "ucount") {
          requireStation("astron");
          if (!data.ucountRates[input.card]) throw new Error("Choose your UCount card type.");
          if (input.double === true && input.card === "debit") throw new Error("Debit/Cheque cards do not qualify for double fuel earn.");
          const rate = tier(input.tier, data.ucountRates[input.card]) * (input.double === true ? 2 : 1);
          const cardSpend = number(input.cardSpend, "qualifying card spend in this fixed cycle", 0, 1000000);
          const used = number(input.usedSpend ?? 0, "fuel/oil spend already counted this cycle", 0, 100000);
          const available = Math.max(0, Math.min(data.ucountSpendCap, cardSpend * data.ucountCardSpendShare) - used);
          const eligible = Math.min(spend, available);
          const gross = Math.min(eligible / referencePrice() * rate, rewardCap());
          add("UCount at Astron Energy", "astron", gross, `${rate.toFixed(2)} R/litre on R${eligible.toFixed(2)} eligible spend in one fixed cycle, limited by the reward allowance you entered. Forecourt purchases only.`, costs);
        } else if (bank === "discovery-bank" || bank === "discovery-insure") {
          const station = input.discoveryStation;
          if (!["bp", "shell"].includes(station)) throw new Error("Choose bp or Shell for Discovery.");
          requireStation(station);
          const insure = bank === "discovery-insure";
          const rate = number(input.rate, "your actual fuel reward percentage", 0, insure ? data.discoveryInsureMaximumPercent : maximumBankPercent(data, asOfDate));
          const eligible = qualifyingSpend(insure ? data.discoveryInsureMaximumSpend : 100000);
          let cap = rewardCap(insure ? data.discoveryInsureMaximumReward : 100000);
          if (insure) cap = Math.min(cap, number(input.premium, "relevant vehicle premium excluding VAT", 0, 100000));
          const base = insure && station === "bp" ? litres * data.bpRate : 0;
          add(insure ? `Vitality Drive${station === "bp" ? " + BP Rewards" : " at Shell"}` : "Discovery Bank fuel reward", station, Math.min(eligible * rate / 100, cap) + base, insure ? "Fuel reward limited by qualifying spend, remaining fuel/Gautrain reward allowance and vehicle premium excluding VAT. BP balance, if included, is separate." : "Discovery Miles equivalent using your actual rate and remaining app limits. No Insure, V+ or BP reward added.", costs);
        } else throw new Error("Choose a supported programme.");
      } catch (error) { bankError = error.message; }
    }
    results.sort((a, b) => b.net - a.net || a.name.localeCompare(b.name));
    return { spend, price, litres, results, points, bankError };
  }
  return { calculate, maximumBankPercent };
});
