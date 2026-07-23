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
    const cardCopy = getOpportunityCardCopy(opportunity);
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
      ? `<a class="opportunity-card__privacy-link" href="${escapeAttribute(opportunity.details.privacyUrl)}" rel="nofollow noopener" target="_blank"${renderOfficialAnalyticsAttributes(opportunity.details.privacyUrl)}>${escapeHtml(opportunity.provider)} consent and privacy information</a>`
      : "";
    const privacyNotice = getPrivacyNotice(opportunity);

    if (cardVariant === "compact") {
      return `<article class="opportunity-card opportunity-card--compact" data-opportunity-id="${escapeAttribute(opportunity.id)}" data-card-variant="compact">
              <div class="opportunity-card__top">
                <span class="opportunity-card__type">${escapeHtml(cardCopy.compactType)}</span>
                <span class="opportunity-card__verified">Verified ${escapeHtml(formatDate(opportunity.lastVerifiedAt))}</span>
              </div>
              <p class="opportunity-card__provider">${escapeHtml(opportunity.provider)}</p>
              <h3>${escapeHtml(opportunity.title)}</h3>
              <p><strong>${escapeHtml(cardCopy.requirementCue)}.</strong> ${escapeHtml(opportunity.summary)}</p>
              <p><strong>${escapeHtml(costLabel)}.</strong> ${escapeHtml(cardCopy.availabilityCue)}</p>
              ${privacyNotice ? `<p class="opportunity-card__privacy">${escapeHtml(privacyNotice)}</p>` : ""}
              ${privacyLink}
              <a class="opportunity-card__link" href="${escapeAttribute(detailPath)}"${cardAnalyticsAttributes}>${escapeHtml(cardCopy.ctaLabel)}</a>
            </article>`;
    }

    const facts = buildOpportunityFacts(opportunity, costLabel, required, formatDate);
    const boundary = getProviderBoundary(opportunity);

    return `<article class="opportunity-card opportunity-card--full" data-opportunity-id="${escapeAttribute(opportunity.id)}" data-card-variant="full">
              <div class="opportunity-card__top">
                <span class="opportunity-card__type">${escapeHtml(typeLabel)}</span>
                <span class="opportunity-card__verified">Verified ${escapeHtml(formatDate(opportunity.lastVerifiedAt))}</span>
              </div>
              <p class="opportunity-card__provider">${escapeHtml(opportunity.provider)}</p>
              <h3>${escapeHtml(opportunity.title)}</h3>
              <p>${escapeHtml(opportunity.summary)}</p>
              <p class="opportunity-card__eligibility">${escapeHtml(cardCopy.fullEligibilityCue)}</p>
              <dl class="opportunity-card__facts">
                ${facts.map((fact) => `<div><dt>${escapeHtml(fact.label)}</dt><dd>${escapeHtml(fact.value)}</dd></div>`).join("\n                ")}
              </dl>
              ${privacyNotice ? `<p class="opportunity-card__privacy">${escapeHtml(privacyNotice)}</p>` : ""}
              <p class="opportunity-card__medical-boundary">${escapeHtml(boundary)}</p>
              ${privacyLink}
              <a class="opportunity-card__link" href="${escapeAttribute(detailPath)}"${cardAnalyticsAttributes}>${escapeHtml(cardCopy.ctaLabel)}</a>
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

function getOpportunityCardCopy(opportunity) {
  if (opportunity.type === "product_testing") {
    return {
      compactType: "Product-testing application",
      requirementCue: "Selection and creator tasks required",
      availabilityCue: "Applying does not guarantee selection or a product",
      fullEligibilityCue: "This is a selected creator campaign, not a guaranteed free sample. Applying does not guarantee selection or a product. Check every account, audience and content requirement first.",
      ctaLabel: "View product-testing details",
    };
  }

  const medical = isMedicalSample(opportunity);
  return {
    compactType: medical ? "Medical product sample request" : "Free sample request",
    requirementCue: medical ? "Suitability approval required" : "Provider approval may be required",
    availabilityCue: "Application only; fulfilment is not guaranteed",
    fullEligibilityCue: medical
      ? "This medical-product sample is intended for people who meet the provider's suitability requirements."
      : "Availability and fulfilment depend on the provider's current stock and approval rules.",
    ctaLabel: "View verified sample details",
  };
}

function buildOpportunityFacts(opportunity, costLabel, required, formatDate) {
  const details = opportunity.details || {};
  const facts = [{ label: "Cost", value: costLabel }];

  if (opportunity.type === "product_testing") {
    facts.push(
      { label: "Fulfilment", value: formatToken(details.fulfilmentMethod) },
      { label: "Selection", value: formatToken(details.selectionMethod) },
      { label: "Availability", value: details.stockState === "open" ? "Applications open" : formatToken(details.stockState) }
    );
  } else {
    const fulfilment = formatToken(details.fulfilmentMethod);
    const delivery = details.deliveryCharge === "none" ? "No delivery charge" : formatToken(details.deliveryCharge);
    const selection = details.selectionStatus === "selected_participants"
      ? "Selected applicants after provider review"
      : formatToken(details.selectionStatus);
    facts.push(
      { label: "Fulfilment", value: [fulfilment, delivery].filter(Boolean).join("; ") },
      { label: "Availability", value: `Application only; ${selection}` }
    );
    if (details.expectedFulfilmentWindow) {
      facts.push({ label: "Expected fulfilment", value: details.expectedFulfilmentWindow });
    }
  }

  facts.push(
    { label: "Requirements", value: required.length > 0 ? required.map((item) => item.label).join("; ") : "No required actions stated" },
    { label: "Last verified", value: formatDate(opportunity.lastVerifiedAt) },
    { label: "Review due", value: formatDate(opportunity.reviewDueAt) }
  );

  return facts;
}

function getPrivacyNotice(opportunity) {
  if (!isMedicalSample(opportunity)) {
    return "";
  }
  return `You will provide suitability and health-related information directly to ${opportunity.provider}. Freehub does not receive or assess your application.`;
}

function getProviderBoundary(opportunity) {
  if (opportunity.type === "product_testing") {
    return `${opportunity.provider}, not Freehub, selects participants and sets the creator tasks. Freehub does not receive applications or guarantee selection.`;
  }
  if (isMedicalSample(opportunity)) {
    return `${opportunity.provider}, not Freehub, assesses product suitability. Freehub does not provide medical suitability advice.`;
  }
  return `${opportunity.provider}, not Freehub, decides whether a sample request is approved and fulfilled.`;
}

function isMedicalSample(opportunity) {
  return opportunity.type === "free_sample" && Array.isArray(opportunity.tags) && opportunity.tags.includes("medical-product-sample");
}

function formatToken(value) {
  const text = String(value || "").replace(/_/g, " ").trim();
  return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : "Not stated";
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
