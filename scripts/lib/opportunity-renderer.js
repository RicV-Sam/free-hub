const OPPORTUNITY_TYPE_LABELS = Object.freeze({
  free_sample: "Free sample",
  product_testing: "Product testing",
  birthday_freebie: "Birthday freebie",
  free_course: "Free course",
});

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

function createOpportunityRenderer({ escapeHtml, escapeAttribute, formatDate, canonicalOrigin, getDetailPath }) {
  if (![escapeHtml, escapeAttribute, formatDate, getDetailPath].every((helper) => typeof helper === "function")) {
    throw new TypeError("Opportunity renderer requires escape, date, and detail-path helpers.");
  }
  if (typeof canonicalOrigin !== "string" || !/^https:\/\//.test(canonicalOrigin)) {
    throw new TypeError("Opportunity renderer requires an HTTPS canonical origin.");
  }

  function renderOpportunitySection({ opportunities, heading, pageType, cardVariant = "full" }) {
    assertEligibleInput(opportunities);
    assertCardVariant(cardVariant);
    if (opportunities.length === 0) {
      return "";
    }

    return `<section class="opportunity-section" aria-label="${escapeAttribute(heading)}">
          <div class="opportunity-section__header">
            <p class="section-kicker">Current opportunities</p>
            <h2>${escapeHtml(heading)}</h2>
            <p>Only verified opportunities with current official-source evidence appear here.</p>
          </div>
          <div class="opportunity-grid">
            ${opportunities.map((opportunity) => renderOpportunityCard(opportunity, { pageType, cardVariant })).join("\n            ")}
          </div>
        </section>`;
  }

  function renderOpportunityCard(opportunity, { pageType, cardVariant = "full" } = {}) {
    assertEligibleInput([opportunity]);
    assertCardVariant(cardVariant);
    const typeLabel = OPPORTUNITY_TYPE_LABELS[opportunity.type] || opportunity.type;
    const costLabel = COST_LABELS[opportunity.costClassification] || opportunity.costClassification;
    const required = opportunity.requirements.filter((requirement) => requirement.required);
    const detailPath = getDetailPath(opportunity);
    const renderOfficialAnalyticsAttributes = (url) => [
      ' data-discovery-action="official-source"',
      ' data-entity-kind="opportunity"',
      ` data-content-type="${escapeAttribute(opportunity.type)}"`,
      ` data-content-id="${escapeAttribute(opportunity.id)}"`,
      ` data-source-domain="${escapeAttribute(getHostname(url))}"`,
      ` data-page-type="${escapeAttribute(pageType)}"`,
      ` data-destination-path="${escapeAttribute(getDestinationPath(url))}"`,
    ].join("");
    const cardAnalyticsAttributes = [
      ' data-discovery-action="card"',
      ' data-entity-kind="opportunity"',
      ` data-content-type="${escapeAttribute(opportunity.type)}"`,
      ` data-content-id="${escapeAttribute(opportunity.id)}"`,
      ` data-page-type="${escapeAttribute(pageType)}"`,
      ` data-destination-path="${escapeAttribute(detailPath)}"`,
    ].join("");
    const privacyLink = opportunity.details?.privacyUrl
      ? `<a class="opportunity-card__privacy-link" href="${escapeAttribute(opportunity.details.privacyUrl)}" rel="nofollow noopener" target="_blank"${renderOfficialAnalyticsAttributes(opportunity.details.privacyUrl)}>Coloplast consent and privacy information</a>`
      : "";
    const privacyNotice = "You will provide suitability and health-related information directly to Coloplast. Freehub does not receive or assess your application.";

    if (cardVariant === "compact") {
      return `<article class="opportunity-card opportunity-card--compact" data-opportunity-id="${escapeAttribute(opportunity.id)}" data-card-variant="compact">
              <div class="opportunity-card__top">
                <span class="opportunity-card__type">Medical product sample request</span>
                <span class="opportunity-card__verified">Verified ${escapeHtml(formatDate(opportunity.lastVerifiedAt))}</span>
              </div>
              <p class="opportunity-card__provider">${escapeHtml(opportunity.provider)}</p>
              <h3>${escapeHtml(opportunity.title)}</h3>
              <p><strong>Suitability approval required.</strong> ${escapeHtml(opportunity.summary)}</p>
              <p><strong>${escapeHtml(costLabel)}.</strong> Application only; fulfilment is not guaranteed.</p>
              <p class="opportunity-card__privacy">${escapeHtml(privacyNotice)}</p>
              ${privacyLink}
              <a class="opportunity-card__link" href="${escapeAttribute(detailPath)}"${cardAnalyticsAttributes}>View verified sample details</a>
            </article>`;
    }

    const details = opportunity.details || {};
    const fulfilmentLabel = details.fulfilmentMethod === "delivery" ? "Delivery" : details.fulfilmentMethod;
    const deliveryLabel = details.deliveryCharge === "none" ? "No delivery charge" : details.deliveryCharge;
    const selectionLabel = details.selectionStatus === "selected_participants" ? "Selected applicants after suitability review" : details.selectionStatus;

    return `<article class="opportunity-card opportunity-card--full" data-opportunity-id="${escapeAttribute(opportunity.id)}" data-card-variant="full">
              <div class="opportunity-card__top">
                <span class="opportunity-card__type">${escapeHtml(typeLabel)}</span>
                <span class="opportunity-card__verified">Verified ${escapeHtml(formatDate(opportunity.lastVerifiedAt))}</span>
              </div>
              <p class="opportunity-card__provider">${escapeHtml(opportunity.provider)}</p>
              <h3>${escapeHtml(opportunity.title)}</h3>
              <p>${escapeHtml(opportunity.summary)}</p>
              <p class="opportunity-card__eligibility">Intended for people who currently use, or have been prescribed, an intermittent catheter. Coloplast reviews each request to confirm product suitability.</p>
              <dl class="opportunity-card__facts">
                <div><dt>Cost</dt><dd>${escapeHtml(costLabel)}</dd></div>
                <div><dt>Fulfilment</dt><dd>${escapeHtml(fulfilmentLabel)}; ${escapeHtml(deliveryLabel)}</dd></div>
                <div><dt>Availability</dt><dd>Application only; ${escapeHtml(selectionLabel)}</dd></div>
                <div><dt>Requirements</dt><dd>${escapeHtml(required.length > 0 ? required.map((item) => item.label).join("; ") : "No required actions stated")}</dd></div>
                <div><dt>Expected fulfilment</dt><dd>${escapeHtml(details.expectedFulfilmentWindow)}</dd></div>
                <div><dt>Last verified</dt><dd>${escapeHtml(formatDate(opportunity.lastVerifiedAt))}</dd></div>
                <div><dt>Review due</dt><dd>${escapeHtml(formatDate(opportunity.reviewDueAt))}</dd></div>
              </dl>
              <p class="opportunity-card__privacy">${escapeHtml(privacyNotice)}</p>
              <p class="opportunity-card__medical-boundary">Coloplast, not Freehub, assesses product suitability. Freehub does not provide medical suitability advice.</p>
              ${privacyLink}
              <a class="opportunity-card__link" href="${escapeAttribute(detailPath)}"${cardAnalyticsAttributes}>View verified sample details</a>
            </article>`;
  }

  function buildOpportunityItemList({ opportunities, name }) {
    assertEligibleInput(opportunities);
    if (opportunities.length === 0) {
      return null;
    }

    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name,
      itemListElement: opportunities.map((opportunity, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Thing",
          identifier: opportunity.id,
          name: opportunity.title,
          description: opportunity.summary,
          url: `${canonicalOrigin}${getDetailPath(opportunity)}`,
        },
      })),
    };
  }

  return {
    buildOpportunityItemList,
    renderOpportunityCard,
    renderOpportunitySection,
  };
}

function assertCardVariant(cardVariant) {
  if (!["full", "compact"].includes(cardVariant)) {
    throw new TypeError(`Unsupported Opportunity card variant: ${cardVariant}.`);
  }
}

function assertEligibleInput(opportunities) {
  if (!Array.isArray(opportunities)) {
    throw new TypeError("Opportunity renderer requires an approved opportunities array.");
  }
  opportunities.forEach((opportunity, index) => {
    if (!opportunity || opportunity.publicationStatus !== "published" || opportunity.verificationStatus !== "verified") {
      throw new Error(`Opportunity renderer received an ineligible record at index ${index}.`);
    }
  });
}

function getHostname(value) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch (error) {
    return "";
  }
}

function getDestinationPath(value) {
  try {
    return new URL(value).pathname || "/";
  } catch (error) {
    return "";
  }
}

module.exports = { createOpportunityRenderer };
