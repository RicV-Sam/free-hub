(function () {
  "use strict";
  const form = document.getElementById("fuel-form");
  const dataElement = document.getElementById("fuel-rewards-data");
  if (!form || !dataElement || !window.FreeHubFuelRewards) return;
  const data = JSON.parse(dataElement.textContent);
  const value = name => form.elements.namedItem(name).value;
  const checked = name => form.elements.namedItem(name).checked;
  const money = amount => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 2 }).format(amount);
  const errors = document.getElementById("fuel-errors");
  const results = document.getElementById("fuel-results");
  const rows = document.getElementById("fuel-result-rows");
  const points = document.getElementById("fuel-points");
  const status = document.getElementById("fuel-status");
  const asOfDate = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg", year:"numeric", month:"2-digit", day:"2-digit" }).format(new Date());
  function show(container, visible) {
    container.hidden = !visible;
    if (container.tagName === "FIELDSET") container.disabled = !visible;
    else container.querySelectorAll("input,select").forEach(control => { control.disabled = !visible; });
  }
  function updatePanels() {
    const bank = value("bank");
    form.querySelectorAll("[data-fuel-panel]").forEach(panel => show(panel, panel.dataset.fuelPanel.split(" ").includes(bank)));
    show(form.querySelector("[data-fuel-common]"), bank !== "none");
    show(form.querySelector("[data-fuel-insurance-fields]"), bank === "fnb" && checked("insurance"));
    show(form.querySelector("[data-fuel-insure-fields]"), bank === "discovery-insure");
    form.querySelector("[data-fuel-bank-note]").hidden = bank !== "discovery-bank";
    const rate = form.elements.namedItem("discoveryRate");
    rate.max = bank === "discovery-bank" ? window.FreeHubFuelRewards.maximumBankPercent(data, asOfDate()) : data.discoveryInsureMaximumPercent;
  }
  function readInput() {
    const bank = value("bank");
    const input = {
      spend:value("spend"), price:value("price"), stations:[...form.querySelectorAll('[name="stations"]:checked')].map(el => el.value),
      shellTier:value("shellTier"), smartShopper:checked("smartShopper"), bank,
      costs:value("costs"), confirmed:checked("confirmed"),
    };
    if (bank.startsWith("absa-")) Object.assign(input, {card:value("absaCard"), tier:value("absaTier"), usedSpend:value("absaUsed")});
    if (bank === "nedbank") input.referencePrice = value("nedbankPrice");
    if (bank === "fnb") Object.assign(input, {rate:value("fnbRate"), qualifyingSpend:value("fnbSpend"), referencePrice:value("fnbPrice"), finance:checked("finance"), insurance:checked("insurance"), premium:value("fnbPremium"), insuranceUsed:value("fnbInsuranceUsed")});
    if (bank === "ucount") Object.assign(input, {card:value("ucountCard"), tier:value("ucountTier"), cardSpend:value("ucountSpend"), usedSpend:value("ucountUsed"), referencePrice:value("ucountPrice"), rewardCap:value("ucountCap"), double:checked("double")});
    if (bank.startsWith("discovery-")) Object.assign(input, {discoveryStation:value("discoveryStation"), rate:value("discoveryRate"), qualifyingSpend:value("discoverySpend"), rewardCap:value("discoveryCap"), premium:value("discoveryPremium")});
    return input;
  }
  function render(result) {
    rows.replaceChildren();
    for (const item of result.results) {
      const row = document.createElement("article"); row.className = "fuel-result";
      const heading = document.createElement("h4"); heading.textContent = item.name;
      const amount = document.createElement("strong"); amount.className = "fuel-result__amount"; amount.textContent = money(item.net);
      const label = document.createElement("p"); label.className = "fuel-result__label"; label.textContent = item.costs ? `${money(item.gross)} reward value − ${money(item.costs)} extra costs` : "Estimated monthly reward value";
      const note = document.createElement("p"); note.textContent = item.note;
      row.append(heading, amount, label, note); rows.append(row);
    }
    points.hidden = !result.points;
    if (result.points) points.textContent = `${result.points.name}: about ${new Intl.NumberFormat("en-ZA", {maximumFractionDigits:0}).format(result.points.points)} points. ${result.points.note}`;
    const best = result.results[0];
    const noRandEstimate = result.points ? "No rand-valued programme matches these stations; Sasol points are shown separately." : "No rand estimate is available for this selection. Add a qualifying bank or insurance programme if you have one.";
    status.textContent = `${money(result.spend)} at ${money(result.price)}/litre buys about ${result.litres.toFixed(1)} litres. ${best ? `Highest estimated rand value among these options: ${best.name}, ${money(best.net)}.` : noRandEstimate}`;
    if (best?.net < 0) status.textContent += " Extra costs exceed the estimated reward.";
    errors.hidden = !result.bankError;
    errors.textContent = result.bankError ? `${result.bankError} The selected bank/insurance estimate is excluded; forecourt results remain below.` : "";
    results.hidden = false;
    if (result.bankError) errors.focus();
    else document.getElementById("fuel-result-title").focus();
  }
  form.addEventListener("submit", event => {
    event.preventDefault();
    try { render(window.FreeHubFuelRewards.calculate(data, readInput(), asOfDate())); }
    catch (error) {
      results.hidden = true;
      errors.hidden = false;
      errors.textContent = error.message;
      errors.focus();
    }
  });
  form.addEventListener("change", event => {
    if (["bank", "insurance"].includes(event.target.name)) updatePanels();
    if (!results.hidden) {
      results.hidden = true;
      status.textContent = "";
    }
    errors.hidden = true;
  });
  form.addEventListener("input", () => { results.hidden = true; errors.hidden = true; });
  errors.tabIndex = -1;
  updatePanels();
  form.hidden = false;
})();
