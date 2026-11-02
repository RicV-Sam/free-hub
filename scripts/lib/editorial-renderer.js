const shared = require("../../shared/page-data.js");
const offerData = require("../../shared/offer-data.js");
const { getResourceDetailPath } = require("./resource-guides.js");

function createEditorialRenderer({ escapeHtml: text, escapeAttribute: attr, getImage, renderPlaceholder, renderDisclosure, offersEnabled = false, resourceImages = {} }) {
  function renderPick(pick) {
    const item = pick.record;
    const competition = pick.kind === "competition";
    const resourceDetailPath = pick.kind === "resource" ? getResourceDetailPath(item) : "";
    const href = competition ? shared.getCompetitionPath(item) : pick.kind === "offer" ? offerData.getOfferPath(item) : resourceDetailPath || item.officialUrl;
    const resourceLinkAttributes = pick.kind === "resource" && !resourceDetailPath ? ' target="_blank" rel="nofollow noopener"' : "";
    const discoveryAttributes = resourceDetailPath ? ` data-discovery-action="card" data-entity-kind="resource" data-content-type="${attr(item.resourceType || item.category)}" data-content-id="${attr(item.id)}" data-page-type="home" data-destination-path="${attr(href)}"` : "";
    const title = item.title || item.name;
    const label = { competition: "Competition", offer: "Saving", resource: "Free resource" }[pick.kind];
    const resourceImage = resourceDetailPath && resourceImages[item.id];
    const image = competition ? getImage(item) : resourceImage?.src || "";
    return `<article class="editorial-pick" data-editorial-pick="${attr(pick.recordId)}" data-valid-through="${attr(pick.validThrough)}"${competition ? ` data-current-listing data-closing-date="${attr(shared.getEffectiveCompetitionEndDate(item))}"${item.closingAt !== undefined ? ` data-competition-closing-at="${attr(item.closingAt)}"` : ""}` : ""} data-source-reviewed="${attr(item.lastChecked || item.lastReviewed || "")}">
      <p class="section-kicker">${label}</p>
      <h3><a href="${attr(href)}"${resourceLinkAttributes}${discoveryAttributes}>${text(title)}</a></h3>
      <p>${text(pick.reason)}</p>
      <p class="editorial-pick__caution"><strong>Check first:</strong> ${text(pick.caution)}</p>
      ${competition ? `<p class="editorial-pick__facts">${text(shared.getEntryCostLabel(item))} · Closes ${text(shared.formatDate(item.closingDate))}<span data-urgency-date="${attr(item.closingDate)}"></span></p>` : ""}
      <p class="editorial-pick__review">Recommendation reviewed ${text(shared.formatDate(pick.reviewedAt))}; review due ${text(shared.formatDate(pick.reviewDueAt))}.</p>
      ${image ? `<a class="editorial-pick__image" href="${attr(href)}"${discoveryAttributes} aria-label="${attr(title)} — view details">${competition ? renderPlaceholder(item, "top-pick-card__placeholder") : ""}<img src="${attr(image)}" alt="${attr(resourceImage ? resourceImage.alt : item.imageAlt || title)}" loading="lazy" onerror="this.remove()" /></a>${competition ? renderDisclosure(item) : `<p>${text(resourceImage.caption)}</p>`}` : ""}
      <a class="editorial-pick__link" href="${attr(href)}"${resourceLinkAttributes}${discoveryAttributes}>${competition ? "Check entry details" : pick.kind === "offer" ? "Check reward conditions" : resourceDetailPath ? "View details" : "Browse free books"} →</a>
    </article>`;
  }

  function renderSection(picks, surface) {
    return `<section class="home-section editorial-shortlist" data-editorial-surface="${attr(surface)}" aria-label="Reviewed recommendations">
      <div class="home-section__header"><h2 data-editorial-heading>${picks.length ? (surface === "home" ? "Worth a look this week" : "Reviewed recommendations") : "Keep exploring Freehub"}</h2></div>
      <div class="editorial-picks-grid">${picks.map(renderPick).join("\n")}</div>
      <div class="editorial-fallback" data-editorial-fallback${picks.length ? " hidden" : ""}><p>Choose a current listing or a practical resource while we review the next shortlist.</p><nav class="editorial-fallback__links" aria-label="More ways to explore"><a href="/competitions/">Browse current competitions</a><a href="/free-stuff-south-africa/">Find free resources</a>${surface === "home" && offersEnabled ? '<a href="/offers/">Check coupons and deals</a>' : '<a href="/competitions-ending-soon/">See competitions ending soon</a>'}</nav></div>
    </section>`;
  }
  return { renderSection };
}
module.exports = { createEditorialRenderer };
