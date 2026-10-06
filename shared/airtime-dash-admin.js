import { getDashClient } from "./airtime-dash-api.js?v=dash-nickname-1";
const $ = id => document.getElementById(`dash-${id}`);
let client, report;
const status = message => { $("admin-status").textContent = message; };
const localDate = value => new Date(value + 2 * 3600000).toISOString().slice(0, 16);
async function refresh() {
  try {
    report = await client.call("admin.report"); $("admin-tools").hidden = false;
    const form = $("config-form");
    let configuration = report.competition;
    if (!configuration) {
      const response = await fetch("/data/airtime-dash-first-competition.json", { cache: "no-store" });
      if (response.ok) { const draft = await response.json(); configuration = { ...draft, startAt: Date.now() }; }
    }
    if (configuration) for (const [key, value] of Object.entries(configuration)) {
      const input = form.elements.namedItem(key); if (!input) continue;
      if (input.type === "checkbox") input.checked = value === true;
      else input.value = ["startAt", "endAt"].includes(key) ? localDate(value) : value;
    }
    $("activate").disabled = report.competition?.status !== "draft" || report.competition?.legalReviewed !== true;
    $("admin-scores").replaceChildren();
    for (const row of report.sessions.sort((a, b) => b.score - a.score)) {
      const tr = document.createElement("tr");
      for (const value of [row.displayName, row.score, row.level, `${row.status} / ${row.verificationStatus}`]) { const td = document.createElement("td"); td.textContent = value; tr.append(td); }
      const actions = document.createElement("td");
      for (const [label, result] of [["Flag for review", "review_required"], ["Disqualify", "disqualified"], ["Verify / reinstate", "verified"]]) {
        const button = document.createElement("button"); button.type = "button"; button.className = "dash-link"; button.textContent = label;
        button.addEventListener("click", () => perform("admin.review", { sessionId: row.id, status: result, reason: $("review-reason").value })); actions.append(button);
      }
      tr.append(actions); $("admin-scores").append(tr);
    }
    $("admin-metrics").textContent = `${report.termsCount} terms acceptances · ${report.sessions.length} runs · ${report.referrals.length} qualified referrals${report.competition?.winner ? ` · Winner: ${report.competition.winner.displayName}` : ""}${report.competition?.prizeStatus === "sent" ? " · Prize recorded as sent" : ""}`;
    status(client.preview ? "LOCAL PREVIEW · Synthetic accounts and scores. No real prize or live account changes." : "Admin access verified.");
  } catch (error) { $("admin-tools").hidden = true; status(error.message); }
}
async function perform(action, data = {}) {
  const buttons = [...$("admin-tools").querySelectorAll("button")]; buttons.forEach(button => { button.disabled = true; });
  try { await client.call(action, data); await refresh(); }
  catch (error) { status(error.message); }
  finally {
    buttons.forEach(button => { button.disabled = false; });
    $("activate").disabled = report?.competition?.status !== "draft" || report?.competition?.legalReviewed !== true;
  }
}
$("config-form").addEventListener("submit", e => {
  e.preventDefault(); const form = new FormData(e.target), data = Object.fromEntries(form);
  for (const key of ["startAt", "endAt"]) {
    // Preserve locked millisecond precision when the displayed minute was not edited.
    data[key] = report?.competition?.id === data.id && data[key] === localDate(report.competition[key])
      ? report.competition[key] : Date.parse(`${data[key]}:00+02:00`);
  }
  data.claimDays = Number(data.claimDays); data.legalReviewed = form.get("legalReviewed") === "on";
  perform("admin.saveCompetition", data);
});
$("admin-refresh").addEventListener("click", refresh);
$("activate").addEventListener("click", () => perform("admin.activate"));
$("security-check").addEventListener("click", async () => {
  $("security-check").disabled = true;
  try { await client.call("admin.securityCheck"); status("Live security check passed. Prize entry has not been opened by this check."); }
  catch (error) { status(error.message); }
  finally { $("security-check").disabled = false; }
});
$("confirm-winner").addEventListener("click", () => perform("admin.winner"));
$("prize-sent").addEventListener("click", () => perform("admin.prize"));
$("forfeit-winner").addEventListener("click", () => perform("admin.forfeitWinner", { reason: $("review-reason").value }));
$("export").addEventListener("click", () => {
  if (!report) return;
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const link = document.createElement("a"), url = URL.createObjectURL(blob); link.href = url; link.download = "airtime-dash-admin-review.json"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
(async () => {
  try { client = await getDashClient(); if (!client.available) { status("The game backend is not configured yet."); return; }
    if (client.preview) document.querySelector("[data-freehub-auth]").hidden = true;
    client.onAuth(user => { if (user) refresh(); else { $("admin-tools").hidden = true; status("Sign in with an active FreeHub admin account."); } });
  } catch (error) { status(error.message); }
})();
