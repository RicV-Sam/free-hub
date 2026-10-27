const settings = require("../../data/grocery-savings.json");
const offerData = require("../../shared/offer-data.js");
const shared = require("../../shared/page-data.js");

const money = cents => `R${(cents / 100).toFixed(2)}`;
function unitPriceCents(price) {
  if (!Number.isInteger(price.priceCents) || price.priceCents <= 0 || !Number.isFinite(price.quantity) || price.quantity <= 0 || !["g", "ml"].includes(price.unit)) {
    throw new Error("A grocery price requires positive cents, pack quantity and g/ml units.");
  }
  return Math.round(price.priceCents * 1000 / price.quantity);
}

function getGroceryPages({ preview = false, asOfDate = shared.getReferenceDate(), source = settings } = {}) {
  if (!preview && (source.publicationStatus !== "published" || !source.publishedAt || source.publishedAt > asOfDate)) return [];
  return source.pages.map(page => ({
    ...page, groceryPage: true, requiresOffers: true, noindex: preview,
    article: page.kind !== "hub", dateModified: source.contentUpdatedAt || source.lastReviewed,
    ...(source.publishedAt ? { datePublished: source.publishedAt } : {}),
  }));
}

function getGroceryPrices(offers, { asOfDate, preview = false } = {}) {
  return settings.priceChecks.flatMap(price => {
    const offer = offers.find(item => item.id === price.offerId);
    if (!offer) return [];
    // Preview only an explicitly verified draft. All ordinary freshness and date
    // checks still apply; the original registry object is never promoted.
    const candidate = preview && ["draft", "review"].includes(offer.publicationStatus)
      ? { ...offer, publicationStatus: "published", publishedAt: offer.lastChecked }
      : offer;
    if (!offerData.isPublicOffer(candidate, { asOfDate })) return [];
    unitPriceCents(price);
    return [{ ...price, offer }];
  });
}

function validateGroceryData(offers, images) {
  const seen = new Set();
  for (const price of settings.priceChecks) {
    if (seen.has(price.offerId)) throw new Error(`Duplicate grocery price: ${price.offerId}`);
    seen.add(price.offerId);
    const offer = offers.find(item => item.id === price.offerId);
    if (!offer || offer.category !== "groceries" || offer.type !== "deal") throw new Error(`Missing grocery deal: ${price.offerId}`);
    if (price.sourceUrl !== offer.sourceUrl || !price.checkedAt.startsWith(offer.lastChecked)) throw new Error(`Grocery source/date mismatch: ${price.offerId}`);
    if (!images[price.offerId]?.sourceImage) throw new Error(`Missing official grocery image provenance: ${price.offerId}`);
    if (!price.dateNote || !price.availability || !price.delivery) throw new Error(`Missing grocery limitations: ${price.offerId}`);
    unitPriceCents(price);
  }
}

function createGroceryRenderer({ escapeHtml: esc, escapeAttribute: attr, escapeScript, images, stylesheet, navigation, footer, trackingHead = "", trackingBody = "", preview = false }) {
  const origin = "https://freehub.co.za";
  const hub = "/grocery-savings/";
  const retailerHosts = new Set(["best-before.co.za", "looters.co.za", "foodeez.co.za"]);
  function analytics(action, id, href, role = "") {
    const destination = new URL(href, origin);
    return ` data-discovery-action="${attr(action)}" data-entity-kind="grocery" data-content-type="grocery_savings" data-page-type="grocery_savings" data-content-id="${attr(id)}" data-destination-path="${attr(destination.pathname)}"${action === "official-source" ? ` data-source-domain="${attr(destination.hostname)}" data-link-role="${attr(role)}"` : ""}`;
  }
  const link = item => `<a href="${attr(item.href)}"${item.role && retailerHosts.has(new URL(item.href, origin).hostname.replace(/^www\./, "")) ? analytics("official-source", item.id || new URL(item.href).hostname, item.href, item.role) : ""}${/^https:/.test(item.href) ? ' target="_blank" rel="noopener noreferrer"' : ""}>${esc(item.label)}</a>`;
  const sources = items => `<div class="grocery-sources">${items.map(item => link({ role: "retailer_information", ...item })).join(" ")}</div>`;
  const date = value => new Intl.DateTimeFormat("en-ZA", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
  function image(id, { hero = false } = {}) {
    const item = images[id];
    if (!item) return "";
    return `<figure class="grocery-photo${hero ? " grocery-photo--hero" : ""}"><img src="${attr(item.src)}" width="${item.width}" height="${item.height}" alt="${attr(item.alt)}" ${hero ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"><figcaption>${esc(item.caption)} ${link({ label: "Image source", href: item.sourcePage })}</figcaption></figure>`;
  }
  function nav(active) {
    return `<nav class="grocery-nav" aria-label="Grocery Savings">${settings.pages.map(page => `<a href="/${attr(page.slug)}/"${page.kind === active ? ' aria-current="page"' : ""}>${page.kind === "hub" ? "Grocery Savings" : page.kind === "stores" ? "Discount stores guide" : "Best Before explained"}</a>`).join("")}</nav>`;
  }
  function shell(page, content, imageId) {
    const canonical = `${origin}/${page.slug}/`;
    const schema = { "@context": "https://schema.org", "@type": page.kind === "hub" ? "CollectionPage" : page.kind === "deal" ? "WebPage" : "Article", name: page.heading, description: page.description, url: canonical, inLanguage: "en-ZA", dateModified: page.dateModified || settings.lastReviewed };
    if (["stores", "explainer"].includes(page.kind)) {
      schema.headline = page.heading;
      schema.author = { "@type": "Organization", name: "FreeHub", url: `${origin}/about/` };
      if (settings.publishedAt) schema.datePublished = settings.publishedAt;
    }
    const crumbItems = [{ name: "Home", item: `${origin}/` }];
    if (page.kind !== "hub") crumbItems.push({ name: "Grocery Savings", item: origin + hub });
    crumbItems.push({ name: page.kind === "hub" ? "Grocery Savings" : page.heading, item: canonical });
    const breadcrumb = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbItems.map((item, index) => ({ "@type": "ListItem", position: index + 1, ...item })) };
    const social = images[imageId];
    return `<!DOCTYPE html><html lang="en-ZA"><head><meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(page.title)}</title>
      <meta name="description" content="${attr(page.description)}"><meta name="robots" content="${preview ? "noindex, nofollow" : "index, follow, max-image-preview:large"}">
      <link rel="canonical" href="${attr(canonical)}"><link rel="icon" type="image/svg+xml" href="/favicon.svg">
      <meta property="og:title" content="${attr(page.title)}"><meta property="og:description" content="${attr(page.description)}"><meta property="og:url" content="${attr(canonical)}"><meta property="og:type" content="${schema["@type"] === "Article" ? "article" : "website"}">
      ${social ? `<meta property="og:image" content="${attr(origin + social.src)}"><meta property="og:image:alt" content="${attr(social.alt)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${attr(origin + social.src)}">` : ""}
      <script type="application/ld+json">${escapeScript(JSON.stringify(schema))}</script><script type="application/ld+json">${escapeScript(JSON.stringify(breadcrumb))}</script>
      <link rel="stylesheet" href="${attr(stylesheet)}"><link rel="stylesheet" href="/assets/grocery-savings.css?v=20261027-v2">${preview ? "" : trackingHead}
      </head><body>${preview ? "" : trackingBody}<div class="site-shell">${navigation}
      <main id="main-content" class="grocery-main">${nav(page.kind)}${content}
      <div class="grocery-independence"><strong>Independent information from FreeHub.</strong> We do not sell these products or take grocery payments. These listings are not sponsored and contain no affiliate links. Recheck the retailer's price, pack date and delivery charge before paying.</div>
      </main>${footer}</div>${preview ? "" : '<script src="/shared/discovery-analytics.js" defer></script><script type="module" src="/shared/auth-ui.js?v=20260917-account-save-v2"></script>'}</body></html>`;
  }
  function priceCard(price) {
    const item = images[price.offerId];
    return `<article class="grocery-find"><a class="grocery-find__image" href="${attr(offerData.getOfferPath(price.offer))}"${analytics("card", price.offerId, offerData.getOfferPath(price.offer))}><img src="${attr(item.src)}" width="${item.width}" height="${item.height}" alt="${attr(item.alt)}" loading="lazy" decoding="async"></a>
      <div class="grocery-find__body"><p class="grocery-kicker">${esc(price.offer.brand)} · ${price.quantity}${esc(price.unit)}</p><h3><a href="${attr(offerData.getOfferPath(price.offer))}"${analytics("card", price.offerId, offerData.getOfferPath(price.offer))}>${esc(price.product)}</a></h3>
      <p class="grocery-price">${money(price.priceCents)} <span>${money(unitPriceCents(price))}/${price.unit === "g" ? "kg" : "litre"}</span></p>
      <p class="grocery-find__checked">Online price checked ${esc(date(price.offer.lastChecked))}</p>
      <p class="grocery-date-note"><strong>Batch date unavailable.</strong> ${esc(price.dateNote)}</p><p class="grocery-small">Delivery extra. Online availability can change.</p>
      <a class="grocery-text-link" href="${attr(offerData.getOfferPath(price.offer))}"${analytics("card", price.offerId, offerData.getOfferPath(price.offer))}>Price and shopping details <span aria-hidden="true">→</span></a></div></article>`;
  }
  function pricesSection(prices) {
    return `<section class="grocery-section" id="price-checked-finds"><div class="grocery-section-heading"><div><p class="grocery-kicker">Start with the pack price</p><h2>Price-checked grocery finds</h2></div><p>Product prices only. Unit prices use net pack weight or volume. No supermarket price saving has been established.</p></div>
      ${prices.length ? `<div class="grocery-find-grid">${prices.map(priceCard).join("")}</div>` : '<div class="grocery-empty"><h3>No current price checks to show</h3><p>Our last checks are due for review. Use the store guide to browse official shops and confirm their latest prices.</p></div>'}</section>`;
  }
  function hero(page) {
    return `<header class="grocery-hero${page.kind === "hub" ? " grocery-hero--hub" : ""}"><div><p class="grocery-kicker">FreeHub Grocery Savings</p><h1>${esc(page.heading)}</h1><p class="grocery-intro">${esc(page.intro)}</p><p class="grocery-reviewed">Sources checked ${esc(date(settings.lastReviewed))}</p>
      ${page.kind === "hub" ? '<div class="grocery-actions"><a class="btn btn--primary" href="#price-checked-finds">See price-checked finds</a><a class="grocery-text-link" href="/discount-grocery-stores-south-africa/">Compare the stores →</a></div>' : ""}</div>${image(page.imageId, { hero: true })}</header>`;
  }
  function storeRows() {
    return `<section id="stores-compared" class="grocery-stores" aria-labelledby="stores-heading"><h2 id="stores-heading">Three retailers to compare</h2><p class="grocery-muted">Locations and policies checked on ${esc(date(settings.lastReviewed))}. These are shopping options, not a cheapest-store ranking.</p>${settings.stores.map((store, index) => `<article class="grocery-store"><div><span class="grocery-store__number">0${index + 1}</span><h3>${esc(store.name)}</h3><p class="grocery-store__area">${esc(store.area)}</p></div><div><p>${esc(store.summary)}</p><dl><div><dt>Where to shop</dt><dd>${esc(store.locations)}</dd></div><div><dt>Delivery & collection</dt><dd>${esc(store.delivery)}</dd></div><div><dt>Date information</dt><dd>${esc(store.dates)}</dd></div></dl>${sources(store.links)}${index === 0 ? '<p><a href="/best-before-south-africa-explained/">Read our Best Before explainer →</a></p>' : ""}</div></article>`).join("")}</section>`;
  }
  function areaComparison() {
    return `<section class="grocery-section grocery-area" id="where-to-shop" aria-labelledby="area-heading"><p class="grocery-kicker">Start with your area</p><h2 id="area-heading">Where can you shop?</h2><p class="grocery-muted">Store and delivery information checked ${esc(date(settings.lastReviewed))}. Confirm your branch or delivery address before making a trip.</p>
      <div class="grocery-area-grid">${settings.stores.map(store => `<article><h3>${esc(store.area)}</h3><p><strong>${esc(store.name)}</strong></p><p>${esc(store.locations)}</p><p class="grocery-small">${esc(store.delivery)}</p>${link({ ...store.links[0], label: `Find ${store.name} stores`, id: store.name, role: "store_directory" })}</article>`).join("")}</div>
      <p class="grocery-small">Shopping from another province? Best Before advertises courier delivery to supported addresses. Looters quotes by province and order weight; Foodeez nationwide delivery has not been verified. <a href="/discount-grocery-stores-south-africa/">Compare the full store details →</a></p></section>`;
  }
  function renderPage(page, prices) {
    let body;
    if (page.kind === "hub") {
      body = `${hero(page)}${areaComparison()}<section class="grocery-reading grocery-section" aria-labelledby="reading-heading"><div><p class="grocery-kicker">Plan before you shop</p><h2 id="reading-heading">Find a store that works for you.</h2><p>Check your area, the range and the cost of getting the groceries home.</p></div><div class="grocery-reading__links"><a href="/discount-grocery-stores-south-africa/"><span>Start here</span><h3>Discount grocery stores in South Africa</h3><p>Best Before, Foodeez and Looters: locations, shopping options and the details to check.</p><b aria-hidden="true">→</b></a><a href="/best-before-south-africa-explained/"><span>Retailer explained</span><h3>How shopping at Best Before works</h3><p>Clearance stock, delivery, date labels and what the reported basket saving tells you.</p><b aria-hidden="true">→</b></a></div></section>${pricesSection(prices)}
      <section class="grocery-method grocery-section" aria-labelledby="method-heading"><h2 id="method-heading">A lower shelf price is the starting point.</h2><div><p><strong>Match the pack.</strong> Compare the brand, variant and size. Use a unit price when sizes differ.</p><p><strong>Check the date.</strong> A missing batch date is a question for the retailer, not evidence of fresh stock.</p><p><strong>Add the journey.</strong> Include delivery, travel and any qualifying spend in your decision.</p></div></section>`;
    } else {
      const toc = [...(page.kind === "stores" ? [{ id: "stores-compared", heading: "Compare the retailers" }] : []), ...page.sections];
      body = `${hero(page)}<div class="grocery-article-layout"><aside class="grocery-toc"><p>In this guide</p><nav aria-label="On this page">${toc.map(section => `<a href="#${attr(section.id)}">${esc(section.heading)}</a>`).join("")}</nav></aside><div class="grocery-article">${page.kind === "stores" ? storeRows() : ""}${page.sections.map(section => `<section id="${attr(section.id)}"><h2>${esc(section.heading)}</h2>${section.paragraphs.map(text => `<p>${esc(text)}</p>`).join("")}${section.sources ? sources(section.sources) : ""}</section>`).join("")}</div></div>${pricesSection(page.kind === "explainer" ? prices.filter(price => price.offer.brandSlug === "best-before") : prices)}`;
    }
    return shell(page, body, page.imageId);
  }
  function renderOffer(price) {
    const offer = price.offer;
    const page = { slug: `deal/${offer.slug}`, kind: "deal", title: `${offer.title} | FreeHub`, heading: `${price.product} · ${price.quantity}${price.unit}`, description: offer.summary, dateModified: offer.lastChecked };
    const body = `<div class="grocery-product"><div>${image(offer.id, { hero: true })}</div><article><p class="grocery-kicker">${esc(offer.brand)} · price checked online</p><h1>${esc(page.heading)}</h1><p class="grocery-price grocery-price--large">${money(price.priceCents)} <span>${money(unitPriceCents(price))}/${price.unit === "g" ? "kg" : "litre"}</span></p><p class="grocery-reviewed">Checked ${esc(date(offer.lastChecked))}. Product price excludes delivery.</p>
      <div class="grocery-date-note"><h2>Check the batch date before paying</h2><p>${esc(price.dateNote)} We have not inspected the supplied product or verified its condition.</p></div>
      <dl class="grocery-product-facts"><div><dt>Online availability</dt><dd>${esc(price.availability)}</dd></div><div><dt>Delivery & collection</dt><dd>${esc(price.delivery)}</dd></div><div><dt>End date</dt><dd>No promotional end date stated. Recheck price and availability before ordering.</dd></div><div><dt>How we compare</dt><dd>Unit price uses ${price.quantity}${esc(price.unit)} net pack ${price.unit === "g" ? "weight" : "volume"}. This is a checked retailer price, not a verified saving against another supermarket.</dd></div></dl>
      <a class="btn btn--primary" href="${attr(preview ? offer.destinationUrl : offerData.getOfferExitPath(offer))}"${analytics("official-source", offer.id, offer.destinationUrl, "retailer_handoff")} target="_blank" rel="noopener noreferrer">Check current price at ${esc(offer.brand)} <span aria-hidden="true">↗</span></a><p class="grocery-small">Opens the retailer's website. Purchase required; no coupon needed.</p>${sources([{ label: "Product source", href: offer.sourceUrl, id: offer.id, role: "product_source" }, { label: "Delivery terms", href: price.deliveryUrl, id: offer.id, role: "delivery_terms" }])}</article></div><section class="grocery-section grocery-prose"><h2>Conditions recorded in our check</h2><p>${esc(offer.terms)}</p><p><a href="${hub}#price-checked-finds">Back to price-checked grocery finds →</a></p></section>`;
    return shell(page, body, offer.id);
  }
  return { renderPage, renderOffer };
}

module.exports = { settings, getGroceryPages, getGroceryPrices, validateGroceryData, unitPriceCents, money, createGroceryRenderer };
