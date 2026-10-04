const shared = require("../../shared/page-data.js");
const offerData = require("../../shared/offer-data.js");

function createEditorialRenderer({ escapeHtml: text, escapeAttribute: attr, getImage, renderPlaceholder, renderDisclosure }) {
  function renderPick(pick) {
    const item = pick.record;
    const competition = pick.kind === "competition";
    const href = competition ? shared.getCompetitionPath(item) : pick.kind === "offer" ? offerData.getOfferPath(item) : item.officialUrl;
    const title = item.title || item.name;
    const label = { competition: "Competition", offer: "Saving", resource: "Free resource" }[pick.kind];
    const image = competition ? getImage(item) : "";
    return `<article class="editorial-pick" data-editorial-pick="${attr(pick.recordId)}" data-valid-through="${attr(pick.validThrough)}" data-source-reviewed="${attr(item.lastChecked || item.lastReviewed || "")}">
      <p class="section-kicker">${label}</p>
      <h3><a href="${attr(href)}"${pick.kind === "resource" ? ' target="_blank" rel="nofollow noopener"' : ""}>${text(title)}</a></h3>
      <p>${text(pick.reason)}</p>
      <p class="editorial-pick__caution"><strong>Check first:</strong> ${text(pick.caution)}</p>
      ${competition ? `<p class="editorial-pick__facts">${text(shared.getEntryCostLabel(item))} · Closes ${text(shared.formatDate(item.closingDate))}<span data-urgency-date="${attr(item.closingDate)}"></span></p>` : ""}
      <p class="editorial-pick__review">Recommendation reviewed ${text(shared.formatDate(pick.reviewedAt))}; review due ${text(shared.formatDate(pick.reviewDueAt))}.</p>
      ${image ? `<a class="editorial-pick__image" href="${attr(href)}" aria-label="${attr(title)} — view details">${renderPlaceholder(item, "top-pick-card__placeholder")}<img src="${attr(image)}" alt="${attr(item.imageAlt || title)}" loading="lazy" onerror="this.remove()" /></a>${renderDisclosure(item)}` : ""}
      <a class="editorial-pick__link" href="${attr(href)}"${pick.kind === "resource" ? ' target="_blank" rel="nofollow noopener"' : ""}>${competition ? "Check entry details" : pick.kind === "offer" ? "Check reward conditions" : "Browse free books"} →</a>
    </article>`;
  }

  function renderSection(picks, surface) {
    return `<section class="home-section editorial-shortlist" data-editorial-surface="${attr(surface)}" aria-label="Reviewed recommendations">
      <div class="home-section__header"><h2>${surface === "home" ? "Worth a look this week" : "Reviewed recommendations"}</h2></div>
      <div class="editorial-picks-grid">${picks.map(renderPick).join("\n")}</div>
      <p class="editorial-fallback" data-editorial-fallback${picks.length ? " hidden" : ""}>No reviewed recommendations are current. <a href="/free-stuff-south-africa/">Explore free resources</a> or <a href="/competitions/">browse current competitions</a>.</p>
    </section>`;
  }
  return { renderSection };
}
module.exports = { createEditorialRenderer };
