const { getResourceDetailPath, getResourceExitPath } = require("./resource-guides.js");

function createResourceGuideRenderer(ctx) {
  const { escapeHtml: text, escapeAttribute: attr, escapeScript, canonicalOrigin: origin } = ctx;
  function analytics(resource, action, pageType, destinationPath) {
    return `data-discovery-action="${action}" data-entity-kind="resource" data-content-type="${attr(resource.resourceType || resource.category)}" data-content-id="${attr(resource.id)}" data-source-domain="${attr(new URL(resource.officialUrl).hostname)}" data-page-type="${pageType}" data-destination-path="${attr(destinationPath)}"`;
  }

  function document({ guide, path, title, description, indexable, schema = [], hero, content, scripts = "" }) {
    const resource = guide.resource;
    const canonical = origin + path;
    const image = ctx.images[resource.id];
    const socialImage = image ? origin + image.src : ctx.defaultSocialImage;
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${text(title)}</title>
    <meta name="description" content="${attr(description)}" />
    <meta name="robots" content="${indexable ? "index, follow, max-image-preview:large" : "noindex, nofollow"}" />
    <link rel="canonical" href="${attr(canonical)}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="stylesheet" href="${attr(ctx.stylesheetHref)}" />
    ${indexable ? '<link rel="stylesheet" href="/shared/resource-guides.css" />' : ""}
    ${indexable ? `<meta property="og:type" content="article" /><meta property="og:title" content="${attr(title)}" /><meta property="og:description" content="${attr(description)}" /><meta property="og:url" content="${attr(canonical)}" /><meta property="og:image" content="${attr(socialImage)}" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:title" content="${attr(title)}" /><meta name="twitter:description" content="${attr(description)}" /><meta name="twitter:image" content="${attr(socialImage)}" />` : ""}
    ${schema.map(item => `<script type="application/ld+json">${escapeScript(JSON.stringify(item))}</script>`).join("\n    ")}
    ${ctx.guestAdsScript}
    ${indexable ? "" : ctx.outboundHandoffScript}
    ${ctx.renderAnalyticsHead(indexable ? "resource_detail" : "resource_exit", resource)}
  </head>
  <body ${indexable ? 'data-resource-detail' : 'data-resource-exit'} data-resource-id="${attr(resource.id)}" data-resource-content-type="${attr(resource.resourceType || resource.category)}" data-resource-source-domain="${attr(new URL(resource.officialUrl).hostname)}">
    ${ctx.renderAnalyticsBody()}
    <div class="site-shell">
      ${ctx.renderTopNavigation({ active: "free-stuff" })}
      ${hero}
      <main id="main-content" class="main-content${indexable ? " resource-detail" : ""}">
        ${content}
      </main>
      ${ctx.renderSiteFooter({ includeAuthPanel: indexable })}
    </div>
    <script src="/shared/discovery-analytics.js"></script>
    ${indexable ? '<script type="module" src="/shared/auth-ui.js?v=20260917-account-save-v2"></script>' : '<script src="/shared/resource-handoff.js" defer></script>'}
    ${scripts}
  </body>
</html>
`;
  }

  function renderDetail(guide) {
    const resource = guide.resource;
    const path = getResourceDetailPath(resource);
    const canonical = origin + path;
    const image = ctx.images[resource.id];
    const schema = [{
      "@context": "https://schema.org", "@type": "Article", headline: resource.name,
      description: guide.description, mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
      datePublished: resource.datePublished, dateModified: resource.dateModified, inLanguage: "en-ZA",
      image: image ? origin + image.src : ctx.defaultSocialImage,
      author: { "@type": "Organization", name: "Freehub", url: origin + "/" },
      publisher: { "@type": "Organization", name: "Freehub", url: origin + "/" },
      citation: [resource.officialUrl],
    }, {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: origin + "/" },
        { "@type": "ListItem", position: 2, name: "Free Stuff", item: origin + "/free-stuff-south-africa/" },
        { "@type": "ListItem", position: 3, name: guide.provider, item: canonical },
      ],
    }];
    const exitPath = getResourceExitPath(resource);
    const cta = `<a class="btn btn--primary" href="${attr(exitPath)}" ${analytics(resource, "resource-handoff", "resource_detail", exitPath)}>Open ${text(guide.provider)}</a>`;
    return document({ guide, path, title: guide.title, description: guide.description, indexable: true, schema,
      hero: ctx.renderModernHero({
        className: "hero--utility", eyebrow: resource.categoryLabel, heading: resource.name, intro: guide.intro,
        mascotPose: "read", actions: [{ label: `Open ${guide.provider}`, href: exitPath, className: "btn--primary", attributes: analytics(resource, "resource-handoff", "resource_detail", exitPath) }, { label: "Browse Free Stuff", href: "/free-stuff-south-africa/", className: "btn--secondary" }],
        trustItems: ["No subscription", "Data costs apply", "External streams vary"],
      }),
      content: `<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true"> / </span><a href="/free-stuff-south-africa/">Free Stuff</a><span aria-hidden="true"> / </span><span aria-current="page">${text(guide.provider)}</span></nav>
        <section class="state-card resource-detail__facts" aria-labelledby="resource-quick-facts">
          <h2 id="resource-quick-facts">Before you open ${text(guide.provider)}</h2>
          <dl class="free-resource-card__facts">${[["Best for", resource.bestFor], ["What is free", resource.freeDetails], ["Requirements", resource.requirements], ["Check first", resource.watchOut]].map(([label, value]) => `<div><dt>${label}</dt><dd>${text(value)}</dd></div>`).join("")}</dl>
          <p class="resource-detail__review">Official information reviewed ${text(ctx.formatDate(resource.lastReviewed))}. Next review due ${text(ctx.formatDate(resource.reviewDueAt))}.</p>
        </section>
        ${ctx.renderHeroImage(resource)}
        <section class="trust-page__content" aria-label="Using this resource">
          <article><h2>South African access check</h2><p>${text(guide.accessNote)}</p></article>
          <article><h2>How to get started</h2><ol class="resource-detail__steps">${guide.steps.map(step => `<li>${text(step)}</li>`).join("")}</ol></article>
          ${guide.sections.map(section => `<article><h2>${text(section.heading)}</h2>${section.paragraphs.map(paragraph => `<p>${text(paragraph)}</p>`).join("")}</article>`).join("\n")}
          <article><h2>Official information and review scope</h2><p>Our summary uses the About, FAQ, Legal Disclaimer and privacy information available through <a href="${attr(resource.officialUrl)}" target="_blank" rel="nofollow noopener">${text(guide.provider)}'s official website</a>, checked on ${text(ctx.formatDate(resource.lastReviewed))}. FreeHub is an independent guide; individual stream rights and future availability have not been independently verified.</p></article>
        </section>
        ${ctx.renderFaq(guide.faq)}
        <section class="state-card" aria-labelledby="resource-open-title"><h2 id="resource-open-title">Ready to explore?</h2><p>Open the external ${text(guide.provider)} website and choose what to watch or hear. Normal internet costs apply.</p>${cta}<p><a href="/free-stuff-south-africa/">Find more free resources in South Africa</a></p></section>
        ${ctx.renderDatacostPromo({ placement: `resource-${resource.detailSlug}`, compact: true })}`,
    });
  }

  function renderExit(guide) {
    const resource = guide.resource;
    const destination = new URL(resource.officialUrl);
    return document({ guide, path: getResourceExitPath(resource), title: `Continue to ${guide.provider} | Freehub`,
      description: `Leave FreeHub and continue to ${destination.hostname}. Normal internet costs and provider conditions apply.`, indexable: false,
      hero: ctx.renderModernHero({ className: "hero--utility hero--outbound", eyebrow: "External website", heading: "You are leaving Freehub", intro: `Taking you to ${destination.hostname} to explore ${guide.provider}.`, mascotPose: "direct", actions: [], trustItems: ["External provider", "Data costs apply", "Stream availability varies"] }),
      content: `<section class="state-card outbound-notice" aria-label="External resource handoff"><h2>Continue to ${text(guide.provider)}</h2><p>Destination: <strong>${text(destination.hostname)}</strong>. FreeHub does not host the streams. Check the provider's current information before viewing.</p><p>You will continue automatically after a short pause. You can also use the button now.</p><a class="competition-detail__cta" href="${attr(resource.officialUrl)}" rel="nofollow noopener" data-resource-destination ${analytics(resource, "official-source", "resource_exit", destination.pathname)}>Continue to ${text(guide.provider)}</a><p><a href="${attr(getResourceDetailPath(resource))}">Back to ${text(guide.provider)} details</a></p><noscript><p>Automatic navigation needs JavaScript. The Continue button works without it.</p></noscript></section>${ctx.renderDatacostPromo({ placement: `resource-exit-${resource.detailSlug}`, compact: true })}`,
    });
  }
  return { renderDetail, renderExit };
}

module.exports = { createResourceGuideRenderer };
