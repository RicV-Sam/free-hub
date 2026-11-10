"use strict";

const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validateSchema = ajv.compile(require("../../data/schemas/promotions.schema.json"));
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

// Destination approval is an independent code-level allowlist, not inferred from config.
const HOUSE_HOSTS = new Set(["datacost.co.za"]);
const PRIVATE_PATH = /^\/(?:out|account|admin|members?|login|signup|404)(?:\/|$)/;

function windowFor(campaign, destination) {
  return {
    start: Math.max(Date.parse(`${destination.reviewedAt}T00:00:00+02:00`), campaign.startsAt ? Date.parse(campaign.startsAt) : 0),
    end: Math.min(Date.parse(`${destination.reviewDueAt}T00:00:00+02:00`) + 86400000, campaign.endsAt ? Date.parse(campaign.endsAt) : Infinity),
  };
}

function validatePromotions(config) {
  if (!validateSchema(config)) throw new Error(`Promotion configuration: ${ajv.errorsText(validateSchema.errors)}`);
  for (const key of ["sponsors", "destinations", "placements", "campaigns"]) {
    if (new Set(config[key].map((row) => row.id)).size !== config[key].length) throw new Error(`Duplicate promotion ${key} ID`);
  }
  if (new Set(config.placements.map((row) => row.path)).size !== config.placements.length) throw new Error("Only one primary promotion placement per path is permitted");
  for (const placement of config.placements) {
    if (PRIVATE_PATH.test(placement.path)) throw new Error(`Excluded promotion path: ${placement.path}`);
  }
  for (const destination of config.destinations) {
    const sponsor = config.sponsors.find((row) => row.id === destination.sponsorId);
    const url = new URL(destination.url);
    if (!sponsor || url.protocol !== "https:" || url.username || url.password || url.port || url.search || url.hash || !sponsor.approvedHosts.includes(url.hostname)) throw new Error(`Unapproved promotion destination: ${destination.id}`);
    if (sponsor.relationship === "owned-site" && !HOUSE_HOSTS.has(url.hostname)) throw new Error(`Unapproved house host: ${url.hostname}`);
    if (destination.reviewDueAt < destination.reviewedAt) throw new Error(`Invalid destination review window: ${destination.id}`);
  }
  for (const campaign of config.campaigns) {
    const sponsor = config.sponsors.find((row) => row.id === campaign.sponsorId);
    const destination = config.destinations.find((row) => row.id === campaign.destinationId);
    if (!sponsor || !destination || destination.sponsorId !== campaign.sponsorId || campaign.placements.some((id) => !config.placements.some((row) => row.id === id))) throw new Error(`Invalid promotion references: ${campaign.id}`);
    if (campaign.status === "active" && (campaign.kind !== "house" || sponsor.relationship !== "owned-site")) throw new Error("Paid, affiliate and external campaigns cannot be activated in this rollout");
    const window = windowFor(campaign, destination);
    if (window.start >= window.end) throw new Error(`Empty promotion schedule: ${campaign.id}`);
  }
  return config;
}

function selectPromotion(config, pathname, { enabled = false, asOf = Date.now(), noindex = false } = {}) {
  if (!enabled || noindex || PRIVATE_PATH.test(pathname)) return null;
  const placement = config.placements.find((row) => row.path === pathname);
  if (!placement) return null;
  const now = typeof asOf === "number" ? asOf : Date.parse(asOf);
  if (!Number.isFinite(now)) return null;
  const campaigns = config.campaigns.filter((row) => row.status === "active" && row.kind === "house" && row.placements.includes(placement.id))
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  for (const campaign of campaigns) {
    const sponsor = config.sponsors.find((row) => row.id === campaign.sponsorId);
    const destination = config.destinations.find((row) => row.id === campaign.destinationId);
    if (!sponsor || sponsor.relationship !== "owned-site" || !destination) continue;
    const window = windowFor(campaign, destination);
    if (now < window.start || now >= window.end) continue;
    const url = new URL(destination.url);
    if (!HOUSE_HOSTS.has(url.hostname)) continue;
    url.searchParams.set("utm_source", "freehub");
    url.searchParams.set("utm_medium", "house_banner");
    url.searchParams.set("utm_campaign", campaign.id);
    url.searchParams.set("utm_content", `${placement.id}__${campaign.creative.id}`);
    return { campaign, sponsor, destination, placement, window, href: url.href, configVersion: config.configVersion };
  }
  return null;
}

function renderPromotion(selected) {
  if (!selected) return "";
  const { campaign, sponsor, destination, placement, window, href, configVersion } = selected;
  const creative = campaign.creative;
  const url = new URL(destination.url);
  const attributes = {
    "campaign-id": campaign.id, "sponsor-id": sponsor.id, "creative-id": creative.id,
    "placement-id": placement.id, "promotion-kind": campaign.kind, "page-type": placement.pageType,
    "format": placement.format, "destination-id": destination.id, "destination-host": url.hostname,
    "destination-path": url.pathname, "source-path": placement.path, "config-version": configVersion,
    "valid-from": window.start, "valid-until": window.end,
  };
  return `<aside class="fh-promotion fh-promotion--${escape(placement.format)}" data-freehub-promotion ${Object.entries(attributes).map(([key, value]) => `data-${key}="${escape(value)}"`).join(" ")} aria-labelledby="promotion-${escape(placement.id)}">
          <div class="fh-promotion__identity">${placement.format === "category" ? '<span class="fh-promotion__support">Supported by</span>' : ""}<span class="fh-promotion__brand">${escape(sponsor.name)}</span><span class="fh-promotion__disclosure">House promotion · FreeHub’s sister site</span></div>
          <div class="fh-promotion__body">${placement.format === "card" ? `<p class="fh-promotion__eyebrow">${escape(creative.eyebrow)}</p>` : ""}<h2 id="promotion-${escape(placement.id)}">${escape(creative.title)}</h2><p class="fh-promotion__message">${escape(creative.message)}</p></div>
          <div class="fh-promotion__action"><a class="fh-promotion__link" data-promotion-link href="${escape(href)}" rel="sponsored noopener">${escape(creative.cta)}<span aria-hidden="true"> ↗</span></a><span class="fh-promotion__destination">${escape(url.hostname)}</span></div>
        </aside>`;
}

function createPromotionRenderer(config, options) {
  validatePromotions(config);
  return {
    replacesLegacy: (pathname) => options.enabled && config.placements.some((row) => row.path === pathname),
    render: (pathname, pageOptions = {}) => renderPromotion(selectPromotion(config, pathname, { ...options, ...pageOptions })),
  };
}

function injectPromotionAssets(content) {
  const modules = [...content.matchAll(/<aside\b[^>]*\bdata-freehub-promotion\s[^>]*>/g)];
  const stylesheet = '<link rel="stylesheet" href="/assets/promotions.css?v=20261110-v2" />';
  if (!modules.length) {
    // Page hierarchy stays styled when a campaign is paused or outside its review window.
    return content.includes('data-promotion-layout="') ? content.replace(/\s*<\/head>/i, `\n    ${stylesheet}\n  </head>`) : content;
  }
  if (modules.length > 1) throw new Error("A page cannot contain multiple primary promotions");
  if (/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/i.test(content)) throw new Error("Promotions cannot appear on noindex pages");
  const start = modules[0][0].match(/data-valid-from="(\d+)"/)[1];
  const end = modules[0][0].match(/data-valid-until="(\d+)"/)[1];
  // Evaluate the finite review window in the head, before layout. No late insertion or carousel.
  const head = `<meta name="freehub-promotion-window" content="${start},${end}" />\n    ${stylesheet}\n    <script src="/shared/promotion-runtime.js?v=20261110-v1"></script>\n    <script src="/shared/promotion-analytics.js?v=20261110-v1" defer></script>`;
  return content.replace(/\s*<\/head>/i, `\n    ${head}\n  </head>`);
}

module.exports = { validatePromotions, selectPromotion, renderPromotion, createPromotionRenderer, injectPromotionAssets };
