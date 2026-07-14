const COST_LABELS = Object.freeze({
  completely_free: "Completely free",
  standard_data_may_apply: "Standard data may apply",
  account_required: "Account required",
  membership_required: "Membership required",
  app_required: "App required",
  purchase_required: "Purchase required",
  delivery_fee: "Delivery fee",
  refundable_deposit: "Refundable deposit",
  paid_trial_after_free_period: "Paid after free period",
  card_required: "Card required",
  paid_entry: "Paid entry",
});

const TOMBSTONE_COPY = Object.freeze({
  verification_due: {
    label: "Verification due",
    heading: "This opportunity is being re-verified",
    text: "Freehub has temporarily removed the application route while the official source and current requirements are checked again.",
  },
  expired: {
    label: "Expired opportunity",
    heading: "This opportunity has ended",
    text: "Freehub retains this noindex page as a historical trust reference, but the opportunity is no longer available to apply for.",
  },
  withdrawn: {
    label: "Withdrawn opportunity",
    heading: "This opportunity has been withdrawn",
    text: "Freehub has removed this opportunity from current publication. The application route and official campaign link are no longer available here.",
  },
});

function createOpportunityRouteRenderer({
  escapeHtml,
  escapeAttribute,
  formatDate,
  canonicalOrigin,
  getDetailPath,
  getExitPath,
}) {
  if (![escapeHtml, escapeAttribute, formatDate, getDetailPath, getExitPath].every((helper) => typeof helper === "function")) {
    throw new TypeError("Opportunity route renderer requires escape, date, and path helpers.");
  }
  if (typeof canonicalOrigin !== "string" || !/^https:\/\//.test(canonicalOrigin)) {
    throw new TypeError("Opportunity route renderer requires an HTTPS canonical origin.");
  }

  function getMetadata(opportunity, lifecycleState) {
    const active = lifecycleState === "active";
    const stateLabel = TOMBSTONE_COPY[lifecycleState]?.label;
    const title = active
      ? `${opportunity.title} | Freehub`
      : `${opportunity.title} — ${stateLabel || "Unavailable"} | Freehub`;
    const description = active
      ? `${opportunity.summary} Check eligibility, delivery, privacy and the current official-source verification before applying.`
      : `${opportunity.title} is not currently available. Freehub retains this noindex trust reference without an application link.`;
    return { title, description };
  }

  function buildStructuredData(opportunity, lifecycleState) {
    const detailPath = getDetailPath(opportunity);
    const canonicalUrl = `${canonicalOrigin}${detailPath}`;
    const metadata = getMetadata(opportunity, lifecycleState);
    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${canonicalOrigin}/` },
        { "@type": "ListItem", position: 2, name: "Free Samples", item: `${canonicalOrigin}/free-samples-south-africa/` },
        { "@type": "ListItem", position: 3, name: opportunity.title, item: canonicalUrl },
      ],
    };
    const webPage = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: opportunity.title,
      description: metadata.description,
      url: canonicalUrl,
      inLanguage: "en-ZA",
      isPartOf: { "@type": "WebSite", name: "Freehub", url: `${canonicalOrigin}/` },
    };
    if (lifecycleState !== "active") {
      return { webPage, breadcrumb, thing: null };
    }
    const thing = {
      "@context": "https://schema.org",
      "@type": "Thing",
      identifier: opportunity.id,
      name: opportunity.title,
      description: opportunity.summary,
      url: canonicalUrl,
    };
    webPage.about = { "@type": "Thing", identifier: opportunity.id, name: opportunity.title };
    return { webPage, breadcrumb, thing };
  }

  function renderDetailContent(opportunity, lifecycleState) {
    if (lifecycleState === "active") return renderActiveDetail(opportunity);
    const copy = TOMBSTONE_COPY[lifecycleState];
    if (!copy) throw new TypeError(`Unsupported Opportunity detail lifecycle: ${lifecycleState}.`);
    return `<section class="state-card state-card--error opportunity-lifecycle" aria-label="${escapeAttribute(copy.label)}">
          <p class="state-card__title">${escapeHtml(copy.heading)}</p>
          <p class="state-card__text">${escapeHtml(copy.text)}</p>
          <p class="state-card__text">Last verified ${escapeHtml(formatDate(opportunity.lastVerifiedAt))}. Freehub does not collect applications or assess product suitability.</p>
        </section>

        <article class="state-card opportunity-detail opportunity-detail--tombstone" aria-label="Historical opportunity details">
          <p class="section-kicker">${escapeHtml(copy.label)}</p>
          <h2>Historical listing summary</h2>
          <p><strong>Provider:</strong> ${escapeHtml(opportunity.provider)}</p>
          <p>${escapeHtml(opportunity.summary)}</p>
          <p>No campaign or application link is available from this page.</p>
        </article>

        ${renderReturnLinks()}`;
  }

  function renderActiveDetail(opportunity) {
    const details = opportunity.details || {};
    const required = opportunity.requirements.filter((requirement) => requirement.required);
    const costLabel = COST_LABELS[opportunity.costClassification] || opportunity.costClassification;
    const fulfilment = details.fulfilmentMethod === "delivery" ? "Delivery" : details.fulfilmentMethod;
    const delivery = details.deliveryCharge === "none" ? "No delivery charge" : details.deliveryCharge;
    const selection = details.selectionStatus === "selected_participants"
      ? "Selected applicants after suitability review"
      : details.selectionStatus;
    const officialAttributes = (url, role) => {
      const parsed = new URL(url);
      return [
        'data-discovery-action="official-source"',
        'data-entity-kind="opportunity"',
        `data-content-type="${escapeAttribute(opportunity.type)}"`,
        `data-content-id="${escapeAttribute(opportunity.id)}"`,
        `data-source-domain="${escapeAttribute(parsed.hostname.toLowerCase().replace(/^www\./, ""))}"`,
        'data-page-type="opportunity_detail"',
        `data-destination-path="${escapeAttribute(parsed.pathname || "/")}"`,
        `data-link-role="${escapeAttribute(role)}"`,
      ].join(" ");
    };
    const references = [
      opportunity.termsUrl
        ? `<a href="${escapeAttribute(opportunity.termsUrl)}" target="_blank" rel="nofollow noopener" ${officialAttributes(opportunity.termsUrl, "terms")}>Read Coloplast sample terms</a>`
        : "",
      details.privacyUrl
        ? `<a href="${escapeAttribute(details.privacyUrl)}" target="_blank" rel="nofollow noopener" ${officialAttributes(details.privacyUrl, "privacy")}>Read Coloplast consent and privacy information</a>`
        : "",
    ].filter(Boolean);

    return `<article class="opportunity-card opportunity-detail" aria-label="Verified opportunity details">
          <div class="opportunity-detail__status">
            <span class="badge badge--category">Verified opportunity</span>
            <span class="badge badge--tag">Application only</span>
          </div>
          <p class="opportunity-detail__provider">Provided by ${escapeHtml(opportunity.provider)}</p>
          <p>${escapeHtml(opportunity.summary)}</p>
          <p class="opportunity-detail__eligibility">Intended for people who currently use, or have been prescribed, an intermittent catheter. Coloplast reviews each request to confirm product suitability.</p>
          <dl class="opportunity-card__facts opportunity-detail__facts">
            <div><dt>Cost</dt><dd>${escapeHtml(costLabel)}</dd></div>
            <div><dt>Fulfilment</dt><dd>${escapeHtml(fulfilment)}; ${escapeHtml(delivery)}</dd></div>
            <div><dt>Selection</dt><dd>${escapeHtml(selection)}</dd></div>
            <div><dt>Expected fulfilment</dt><dd>${escapeHtml(details.expectedFulfilmentWindow)}</dd></div>
            <div><dt>Last verified</dt><dd>${escapeHtml(formatDate(opportunity.lastVerifiedAt))}</dd></div>
            <div><dt>Review due</dt><dd>${escapeHtml(formatDate(opportunity.reviewDueAt))}</dd></div>
          </dl>
          <section class="opportunity-detail__requirements" aria-label="Application requirements">
            <h2>What Coloplast requires</h2>
            <ul>${required.map((requirement) => `<li>${escapeHtml(requirement.label)}</li>`).join("")}</ul>
            <p>Coloplast, not Freehub, decides whether the product is suitable and whether a sample request is approved.</p>
          </section>
          <section class="state-card" aria-label="Privacy boundary">
            <p class="state-card__title">Your information goes directly to Coloplast</p>
            <p class="state-card__text">You will provide suitability and health-related information directly to Coloplast. Freehub does not receive, store or assess your application and does not provide medical suitability advice.</p>
          </section>
          <a class="competition-detail__cta opportunity-detail__cta" href="${escapeAttribute(getExitPath(opportunity))}" data-opportunity-action="exit">Continue to the official sample request</a>
          <p class="opportunity-detail__cta-note">The next page explains that you are leaving Freehub before sending you to Coloplast.</p>
          ${references.length > 0 ? `<nav class="opportunity-detail__references" aria-label="Official terms and privacy">${references.join("\n            ")}</nav>` : ""}
        </article>

        ${renderReturnLinks()}`;
  }

  function renderExitContent(opportunity) {
    const target = new URL(opportunity.sourceUrl);
    const analytics = [
      'data-discovery-action="official-source"',
      'data-entity-kind="opportunity"',
      `data-content-type="${escapeAttribute(opportunity.type)}"`,
      `data-content-id="${escapeAttribute(opportunity.id)}"`,
      `data-source-domain="${escapeAttribute(target.hostname.toLowerCase().replace(/^www\./, ""))}"`,
      'data-page-type="opportunity_exit"',
      `data-destination-path="${escapeAttribute(target.pathname || "/")}"`,
      'data-link-role="manual_fallback"',
    ].join(" ");
    return `<section class="state-card outbound-notice opportunity-exit" aria-label="Official provider handoff">
          <p class="state-card__title">Continue to the official Coloplast sample request</p>
          <p class="state-card__text">You will be sent to ${escapeHtml(target.hostname)} in 2 seconds. Coloplast owns the application form and decides product suitability.</p>
          <p class="state-card__text">You may provide suitability and health-related information directly to Coloplast. Freehub does not receive, store or assess it.</p>
          <a class="competition-detail__cta" href="${escapeAttribute(opportunity.sourceUrl)}" data-opportunity-action="handoff" ${analytics}>Continue now</a>
          <p class="competition-detail__cta-note">Use this manual fallback if the automatic handoff does not start.</p>
        </section>`;
  }

  function renderReturnLinks() {
    return `<nav class="internal-links" aria-label="More Freehub resources">
          <p class="internal-links__title">Browse current Freehub resources</p>
          <div class="internal-links__list">
            <a class="internal-links__link" href="/free-samples-south-africa/">Free Samples South Africa</a>
            <a class="internal-links__link" href="/free-stuff-south-africa/">Free Stuff South Africa</a>
          </div>
        </nav>`;
  }

  return {
    buildStructuredData,
    getMetadata,
    renderDetailContent,
    renderExitContent,
  };
}

module.exports = { createOpportunityRouteRenderer };
