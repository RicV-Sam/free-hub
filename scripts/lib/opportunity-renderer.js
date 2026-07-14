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

function createOpportunityRenderer({ escapeHtml, escapeAttribute, formatDate }) {
  if (![escapeHtml, escapeAttribute, formatDate].every((helper) => typeof helper === "function")) {
    throw new TypeError("Opportunity renderer requires escapeHtml, escapeAttribute, and formatDate helpers.");
  }

  function renderOpportunitySection({ opportunities, heading, pageType }) {
    assertEligibleInput(opportunities);
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
            ${opportunities.map((opportunity) => renderOpportunityCard(opportunity, { pageType })).join("\n            ")}
          </div>
        </section>`;
  }

  function renderOpportunityCard(opportunity, { pageType } = {}) {
    assertEligibleInput([opportunity]);
    const typeLabel = OPPORTUNITY_TYPE_LABELS[opportunity.type] || opportunity.type;
    const costLabel = COST_LABELS[opportunity.costClassification] || opportunity.costClassification;
    const required = opportunity.requirements.filter((requirement) => requirement.required);
    const analyticsAttributes =
      pageType === "free_stuff_parent"
        ? [
            ' data-discovery-action="official-source"',
            ' data-entity-kind="opportunity"',
            ` data-content-type="${escapeAttribute(opportunity.type)}"`,
            ` data-content-id="${escapeAttribute(opportunity.id)}"`,
            ` data-source-domain="${escapeAttribute(getHostname(opportunity.sourceUrl))}"`,
          ].join("")
        : "";

    return `<article class="opportunity-card" data-opportunity-id="${escapeAttribute(opportunity.id)}">
              <div class="opportunity-card__top">
                <span class="opportunity-card__type">${escapeHtml(typeLabel)}</span>
                <span class="opportunity-card__verified">Verified ${escapeHtml(formatDate(opportunity.lastVerifiedAt))}</span>
              </div>
              <p class="opportunity-card__provider">${escapeHtml(opportunity.provider)}</p>
              <h3>${escapeHtml(opportunity.title)}</h3>
              <p>${escapeHtml(opportunity.summary)}</p>
              <dl class="opportunity-card__facts">
                <div><dt>Cost</dt><dd>${escapeHtml(costLabel)}</dd></div>
                <div><dt>Availability</dt><dd>${escapeHtml(opportunity.regions.join(", "))}</dd></div>
                <div><dt>Requirements</dt><dd>${escapeHtml(required.length > 0 ? required.map((item) => item.label).join("; ") : "No required actions stated")}</dd></div>
                <div><dt>Review due</dt><dd>${escapeHtml(formatDate(opportunity.reviewDueAt))}</dd></div>
              </dl>
              <a class="opportunity-card__link" href="${escapeAttribute(opportunity.sourceUrl)}" rel="nofollow noopener" target="_blank"${analyticsAttributes}>Official source</a>
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
          name: opportunity.title,
          description: opportunity.summary,
          url: opportunity.sourceUrl,
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

module.exports = { createOpportunityRenderer };
