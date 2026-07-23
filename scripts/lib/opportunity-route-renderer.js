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
      : `${opportunity.title} - ${stateLabel || "Unavailable"} | Freehub`;
    const activeDescription = opportunity.type === "product_testing"
      ? `${opportunity.summary} Check selection, requirements and the current official-source verification before applying.`
      : `${opportunity.summary} Check eligibility, delivery, privacy and the current official-source verification before applying.`;
    const description = active
      ? activeDescription
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
          <p class="state-card__text">Last verified ${escapeHtml(formatDate(opportunity.lastVerifiedAt))}. Freehub does not collect applications or choose participants.</p>
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
    const required = opportunity.requirements.filter((requirement) => requirement.required);
    const costLabel = COST_LABELS[opportunity.costClassification] || opportunity.costClassification;
    const routeCopy = getRouteCopy(opportunity);
    const facts = buildDetailFacts(opportunity, costLabel, formatDate);
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
        ? `<a href="${escapeAttribute(opportunity.termsUrl)}" target="_blank" rel="nofollow noopener" ${officialAttributes(opportunity.termsUrl, "terms")}>${escapeHtml(routeCopy.termsLabel)}</a>`
        : "",
      opportunity.details?.privacyUrl
        ? `<a href="${escapeAttribute(opportunity.details.privacyUrl)}" target="_blank" rel="nofollow noopener" ${officialAttributes(opportunity.details.privacyUrl, "privacy")}>Read ${escapeHtml(opportunity.provider)} consent and privacy information</a>`
        : "",
    ].filter(Boolean);

    return `<article class="opportunity-card opportunity-detail" aria-label="Verified opportunity details">
          <div class="opportunity-detail__status">
            <span class="badge badge--category">Verified opportunity</span>
            <span class="badge badge--tag">${escapeHtml(routeCopy.statusLabel)}</span>
          </div>
          <p class="opportunity-detail__provider">Provided by ${escapeHtml(opportunity.provider)}</p>
          <p>${escapeHtml(opportunity.summary)}</p>
          <p class="opportunity-detail__eligibility">${escapeHtml(routeCopy.eligibilityCue)}</p>
          <dl class="opportunity-card__facts opportunity-detail__facts">
            ${facts.map((fact) => `<div><dt>${escapeHtml(fact.label)}</dt><dd>${escapeHtml(fact.value)}</dd></div>`).join("\n            ")}
          </dl>
          <section class="opportunity-detail__requirements" aria-label="Application requirements">
            <h2>What ${escapeHtml(opportunity.provider)} requires</h2>
            <ul>${required.map((requirement) => `<li>${escapeHtml(requirement.label)}</li>`).join("")}</ul>
            <p>${escapeHtml(routeCopy.selectionBoundary)}</p>
          </section>
          <section class="state-card" aria-label="Application and privacy boundary">
            <p class="state-card__title">${escapeHtml(routeCopy.privacyHeading)}</p>
            <p class="state-card__text">${escapeHtml(routeCopy.privacyText)}</p>
          </section>
          <a class="competition-detail__cta opportunity-detail__cta" href="${escapeAttribute(getExitPath(opportunity))}" data-opportunity-action="exit">${escapeHtml(routeCopy.ctaLabel)}</a>
          <p class="opportunity-detail__cta-note">The next page explains that you are leaving Freehub before sending you to ${escapeHtml(opportunity.provider)}.</p>
          ${references.length > 0 ? `<nav class="opportunity-detail__references" aria-label="Official terms and privacy">${references.join("\n            ")}</nav>` : ""}
        </article>

        ${renderReturnLinks()}`;
  }

  function renderExitContent(opportunity) {
    const target = new URL(opportunity.sourceUrl);
    const routeCopy = getRouteCopy(opportunity);
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
          <p class="state-card__title">${escapeHtml(routeCopy.exitHeading)}</p>
          <p class="state-card__text">You will be sent to ${escapeHtml(target.hostname)} in 2 seconds. ${escapeHtml(opportunity.provider)} owns the application and decides selection or fulfilment.</p>
          <p class="state-card__text">${escapeHtml(routeCopy.exitPrivacyText)}</p>
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

function getRouteCopy(opportunity) {
  if (opportunity.type === "product_testing") {
    return {
      statusLabel: "Selection required",
      eligibilityCue: "This is a creator product-testing application, not a guaranteed free sample. Check the account, audience and content requirements before applying.",
      selectionBoundary: `${opportunity.provider}, not Freehub, chooses participants and confirms the campaign tasks. Applying does not guarantee selection or a gifted product.`,
      privacyHeading: `Your application goes directly to ${opportunity.provider}`,
      privacyText: `Freehub does not receive, store or assess your application, social account details or questionnaire answers. ${opportunity.provider} controls the application and selection process.`,
      ctaLabel: "Continue to the official product-testing application",
      termsLabel: "Read the official product-testing terms",
      exitHeading: `Continue to the official ${opportunity.provider} application`,
      exitPrivacyText: "Freehub does not receive, store or assess the application or decide who is selected.",
    };
  }

  const medical = isMedicalSample(opportunity);
  return {
    statusLabel: "Application only",
    eligibilityCue: medical
      ? "This medical-product sample is intended for people who meet the provider's suitability requirements."
      : "The provider may limit availability or approve requests based on its current sample rules.",
    selectionBoundary: medical
      ? `${opportunity.provider}, not Freehub, decides whether the product is suitable and whether a sample request is approved.`
      : `${opportunity.provider}, not Freehub, decides whether the sample request is approved and fulfilled.`,
    privacyHeading: medical
      ? `Your information goes directly to ${opportunity.provider.replace(/\s+South Africa$/i, "")}`
      : `Your request goes directly to ${opportunity.provider}`,
    privacyText: medical
      ? `You will provide suitability and health-related information directly to ${opportunity.provider}. Freehub does not receive, store or assess your application and does not provide medical suitability advice.`
      : `Freehub does not receive, store or assess your request. ${opportunity.provider} controls approval and fulfilment.`,
    ctaLabel: "Continue to the official sample request",
    termsLabel: "Read the official sample terms",
    exitHeading: `Continue to the official ${opportunity.provider} sample request`,
    exitPrivacyText: medical
      ? "You may provide suitability and health-related information directly to the provider. Freehub does not receive, store or assess it."
      : "Freehub does not receive, store or assess the sample request.",
  };
}

function buildDetailFacts(opportunity, costLabel, formatDate) {
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
      { label: "Selection", value: selection }
    );
    if (details.expectedFulfilmentWindow) {
      facts.push({ label: "Expected fulfilment", value: details.expectedFulfilmentWindow });
    }
  }

  facts.push(
    { label: "Last verified", value: formatDate(opportunity.lastVerifiedAt) },
    { label: "Review due", value: formatDate(opportunity.reviewDueAt) }
  );
  return facts;
}

function isMedicalSample(opportunity) {
  return opportunity.type === "free_sample" && Array.isArray(opportunity.tags) && opportunity.tags.includes("medical-product-sample");
}

function formatToken(value) {
  const text = String(value || "").replace(/_/g, " ").trim();
  return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : "Not stated";
}

module.exports = { createOpportunityRouteRenderer };
