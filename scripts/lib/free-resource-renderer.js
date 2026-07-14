function createFreeResourceRenderer({ escapeHtml, escapeAttribute, formatDate }) {
  if (![escapeHtml, escapeAttribute, formatDate].every((helper) => typeof helper === "function")) {
    throw new TypeError("FreeResource renderer requires escapeHtml, escapeAttribute, and formatDate helpers.");
  }

  function renderFreeResourceSection({
    resources,
    heading,
    description,
    pageType = "trust",
    kicker = "Official Websites",
  }) {
    if (!Array.isArray(resources) || resources.length === 0) {
      return "";
    }

    return `<section class="free-resource-section" aria-label="${escapeAttribute(heading || "Official free resources")}">
          <div class="free-resource-section__header">
            <p class="section-kicker">${escapeHtml(kicker)}</p>
            <h2>${escapeHtml(heading || "Best free options right now")}</h2>
            <p>${escapeHtml(description || "Use official source links and check what is actually free before signing up.")}</p>
          </div>
          <div class="free-resource-grid">
            ${resources.map((resource) => renderFreeResourceCard(resource, { pageType })).join("\n            ")}
          </div>
        </section>`;
  }

  function renderFreeResourceCard(resource, { pageType = "trust" } = {}) {
    const rel = resource.internal ? "" : ' rel="nofollow noopener" target="_blank"';
    const linkLabel = resource.internal ? "Read guide" : "Official website";
    const analyticsAttributes =
      ["free_stuff_parent", "free_samples_vertical"].includes(pageType) && !resource.internal
        ? renderAnalyticsAttributes({
            action: "official-source",
            entityKind: "resource",
            contentType: resource.sampleResourceType || resource.resourceType || resource.category,
            contentId: resource.id || resource.name,
            sourceDomain: getHostname(resource.officialUrl),
            pageType,
            destinationPath: getDestinationPath(resource.officialUrl),
          })
        : "";

    return `<article class="free-resource-card">
              <div class="free-resource-card__top">
                <span class="free-resource-card__category">${escapeHtml(resource.categoryLabel)}</span>
                <span class="free-resource-card__reviewed">Reviewed ${escapeHtml(formatDate(resource.lastReviewed))}</span>
              </div>
              <h3>${escapeHtml(resource.name)}</h3>
              <dl class="free-resource-card__facts">
                <div>
                  <dt>Best for</dt>
                  <dd>${escapeHtml(resource.bestFor)}</dd>
                </div>
                <div>
                  <dt>What is free</dt>
                  <dd>${escapeHtml(resource.freeDetails)}</dd>
                </div>
                <div>
                  <dt>Requirements</dt>
                  <dd>${escapeHtml(resource.requirements)}</dd>
                </div>
                <div>
                  <dt>Check first</dt>
                  <dd>${escapeHtml(resource.watchOut)}</dd>
                </div>
              </dl>
              <a class="free-resource-card__link" href="${escapeAttribute(resource.officialUrl)}"${rel}${analyticsAttributes}>${escapeHtml(linkLabel)}</a>
            </article>`;
  }

  function buildFreeResourceItemList({ resources, name }) {
    if (!Array.isArray(resources) || resources.length === 0) {
      return null;
    }

    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name,
      itemListElement: resources.map((resource, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "WebSite",
          name: resource.name,
          url: resource.officialUrl,
          description: resource.freeDetails,
        },
      })),
    };
  }

  function renderAnalyticsAttributes({ action, entityKind, contentType, contentId, sourceDomain, pageType, destinationPath }) {
    return [
      ` data-discovery-action="${escapeAttribute(action)}"`,
      ` data-entity-kind="${escapeAttribute(entityKind)}"`,
      ` data-content-type="${escapeAttribute(contentType)}"`,
      ` data-content-id="${escapeAttribute(contentId)}"`,
      ` data-source-domain="${escapeAttribute(sourceDomain)}"`,
      ` data-page-type="${escapeAttribute(pageType)}"`,
      ` data-destination-path="${escapeAttribute(destinationPath)}"`,
    ].join("");
  }

  return {
    buildFreeResourceItemList,
    renderFreeResourceCard,
    renderFreeResourceSection,
  };
}

function getDestinationPath(value) {
  try {
    return new URL(value).pathname || "/";
  } catch (error) {
    return "";
  }
}

function getHostname(value) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch (error) {
    return "";
  }
}

module.exports = { createFreeResourceRenderer };
