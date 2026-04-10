const fs = require("fs");
const path = require("path");
const shared = require("../shared/page-data.js");

const ROOT_DIR = path.resolve(__dirname, "..");
const MIRROR_DIR = path.join(ROOT_DIR, "free-hub");
const DATA_PATH = path.join(ROOT_DIR, "data", "competitions.json");
const RELATIVE_ASSET_PATH = "../../";
const MIRROR_FILES = ["index.html", "404.html", "app.js", "styles.css", "robots.txt", "sitemap.xml"];
const MIRROR_DIRECTORIES = ["data", "shared", "category", "tag"];
const CATEGORY_LINKS = [
  { label: "All Competitions", href: "/free-hub/" },
  ...shared.CATEGORY_SLUGS.map((slug) => ({
    label: shared.CATEGORY_COPY[slug].category,
    href: `/free-hub/category/${slug}/`,
  })),
];
const TAG_LINKS = [
  { label: "Free Entry", href: "/free-hub/tag/free-entry/" },
  { label: "Ending Soon", href: "/free-hub/tag/ending-soon/" },
  { label: "High Value", href: "/free-hub/tag/high-value/" },
  { label: "New", href: "/free-hub/tag/new/" },
];

function main() {
  const competitions = shared.sortCompetitions(JSON.parse(fs.readFileSync(DATA_PATH, "utf8")));
  const routeContexts = shared.getAllStaticRouteContexts();

  routeContexts.forEach((routeContext) => {
    const filteredCompetitions = shared.filterCompetitionsByRoute(competitions, routeContext);
    const html = renderPage(routeContext, filteredCompetitions);
    const outputDirectory = path.join(
      ROOT_DIR,
      routeContext.type,
      routeContext.slug
    );

    fs.mkdirSync(outputDirectory, { recursive: true });
    fs.writeFileSync(path.join(outputDirectory, "index.html"), html);
  });

  syncMirrorTree();
}

function renderPage(routeContext, competitions) {
  const pageCopy = shared.getPageCopy(routeContext);
  const supportCopy = shared.getPageSupportCopy(routeContext);
  const structuredData = shared.buildStructuredData(competitions, routeContext);
  const ogImage = competitions[0]?.image || shared.DEFAULT_OG_IMAGE;
  const cardsMarkup = competitions
    .flatMap((competition, index) => {
      const items = [renderCompetitionCard(competition)];

      if ((index + 1) % 6 === 0) {
        items.push(renderInlineAdCard());
      }

      return items;
    })
    .join("\n");
  const resultsSummary = `Showing ${competitions.length} competitions`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(pageCopy.title)}</title>
    <meta name="description" content="${escapeAttribute(pageCopy.description)}" />
    <link rel="canonical" href="${escapeAttribute(pageCopy.canonical)}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeAttribute(pageCopy.title)}" />
    <meta property="og:description" content="${escapeAttribute(pageCopy.description)}" />
    <meta property="og:url" content="${escapeAttribute(pageCopy.canonical)}" />
    <meta property="og:image" content="${escapeAttribute(ogImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttribute(pageCopy.title)}" />
    <meta name="twitter:description" content="${escapeAttribute(pageCopy.description)}" />
    <meta name="twitter:image" content="${escapeAttribute(ogImage)}" />
    <script id="structured-data-itemlist" type="application/ld+json">${escapeScript(
      JSON.stringify(structuredData)
    )}</script>
    <link rel="stylesheet" href="${RELATIVE_ASSET_PATH}styles.css" />
  </head>
  <body>
    <div class="site-shell">
      <header class="hero">
        <div class="hero__copy">
          <p class="eyebrow">free-hub</p>
          <h1 id="pageTitle">${escapeHtml(pageCopy.heading)}</h1>
          <p class="hero__text" id="pageIntro">${escapeHtml(pageCopy.intro)}</p>
        </div>
      </header>

      <main class="main-content">
        ${renderSupportSection(supportCopy)}

        <nav class="category-nav" aria-label="Competition categories">
          ${CATEGORY_LINKS.map((link) => renderNavLink(link, routeContext.path)).join("\n          ")}
        </nav>

        <section class="popular-searches" aria-label="Popular searches">
          <p class="popular-searches__title">Popular Searches</p>
          <div class="popular-searches__links">
            ${TAG_LINKS.map((link) => renderPopularLink(link, routeContext.path)).join("\n            ")}
          </div>
        </section>

        ${renderInternalLinksSection(routeContext)}

        <section class="ad-slot" id="ad-top" aria-label="Advertisement">
          <p class="ad-slot__label">Advertisement</p>
          <p class="ad-slot__copy">Top banner placeholder for future monetisation.</p>
        </section>

        <section class="controls" aria-label="Competition filters">
          <label class="search-field" for="searchInput">
            <span class="search-field__label">Search competitions</span>
            <input
              id="searchInput"
              type="search"
              name="search"
              placeholder="Search by title or category"
              autocomplete="off"
            />
          </label>

          <div class="filters">
            <p class="filters__label">Categories</p>
            <div id="categoryFilters" class="filter-list" role="group" aria-label="Categories"></div>
          </div>
        </section>

        <section class="results-header" aria-live="polite">
          <p id="resultsSummary" class="results-header__summary">${escapeHtml(resultsSummary)}</p>
        </section>

        <section id="loadingState" class="state-card state-card--hidden" aria-live="polite">
          <p class="state-card__title">Loading competitions</p>
          <p class="state-card__text">Pulling the latest competition list from the JSON feed.</p>
        </section>

        <section
          id="errorState"
          class="state-card state-card--hidden state-card--error"
          aria-live="assertive"
        >
          <p class="state-card__title">Unable to load competitions</p>
          <p class="state-card__text">Please refresh the page and try again.</p>
        </section>

        <section class="competition-section">
          <div id="competitionsGrid" class="competition-grid" aria-live="polite">
            ${cardsMarkup}
          </div>

          <div id="emptyState" class="state-card state-card--hidden" aria-live="polite">
            <p class="state-card__title">No competitions match</p>
            <p class="state-card__text">Try a different search term or clear the current category filter.</p>
          </div>
        </section>

        ${renderThinPageTips(competitions)}

        <section class="ad-slot ad-slot--compact" id="ad-middle" aria-label="Advertisement">
          <p class="ad-slot__label">Advertisement</p>
          <p class="ad-slot__copy">Mid-page placement designed for sponsored content or display inventory.</p>
        </section>

        <section class="info-strip" aria-label="About this page">
          <div>
            <p class="info-strip__label">Static POC</p>
            <p class="info-strip__text">Browser-only frontend with JSON-powered content rendering.</p>
          </div>
          <div>
            <p class="info-strip__label">Future-ready</p>
            <p class="info-strip__text">Structure leaves room for ads, analytics, and backend integration later.</p>
          </div>
        </section>

        <section class="ad-slot" id="ad-bottom" aria-label="Advertisement">
          <p class="ad-slot__label">Advertisement</p>
          <p class="ad-slot__copy">Bottom placement reserved for future ad network integration.</p>
        </section>
      </main>

      <footer class="site-footer" aria-label="Site footer">
        <div class="site-footer__grid">
          <div>
            <p class="site-footer__title">About</p>
            <p class="site-footer__text">
              We curate free competitions from verified listing sources and brand promotions so you can browse live offers in one place.
            </p>
          </div>
          <div>
            <p class="site-footer__title">Contact</p>
            <p class="site-footer__text">Contact: hello@freehub.datacost.co.za</p>
          </div>
          <div>
            <p class="site-footer__title">Disclaimer</p>
            <p class="site-footer__text">
              No purchase is necessary for many promotions, but always check the promoter's terms and closing date before entering.
            </p>
          </div>
        </div>
      </footer>
    </div>

    <aside class="ad-sticky" id="ad-sticky" aria-label="Advertisement">
      <button class="ad-sticky__close" id="stickyAdClose" type="button" aria-label="Close advertisement">
        &times;
      </button>
      <p class="ad-slot__label">Advertisement</p>
      <p class="ad-slot__copy">Sticky mobile placement for high-visibility monetisation.</p>
      <button class="ad-sticky__cta" id="stickyAdCta" type="button">View Offer</button>
    </aside>

    <script src="${RELATIVE_ASSET_PATH}shared/page-data.js" defer></script>
    <script src="${RELATIVE_ASSET_PATH}app.js" defer></script>
  </body>
</html>
`;
}

function renderCompetitionCard(competition) {
  const internalPath = shared.getCompetitionPath(competition);
  const closingSoonBadge = shared.isClosingSoon(competition.closingDate)
    ? '<span class="badge badge--closing">&#x1F525; Closing Soon</span>'
    : "";
  const brandMarkup = competition.brand
    ? `<span>${escapeHtml(competition.brand)}</span>`
    : "";
  const summaryMarkup = competition.summary
    ? `<p class="competition-card__summary">${escapeHtml(competition.summary)}</p>`
    : "";
  const hintText = competition.entrySteps || "Opens in new tab";

  return `<article class="competition-card">
              <div class="competition-card__media">
                <img src="${escapeAttribute(competition.image)}" alt="${escapeAttribute(
    competition.title
  )}" loading="lazy" />
                <div class="competition-card__badges">
                  <span class="badge badge--category">${escapeHtml(competition.category)}</span>
                  ${closingSoonBadge}
                </div>
              </div>
              <div class="competition-card__body">
                <h2 class="competition-card__title">${escapeHtml(competition.title)}</h2>
                <div class="competition-card__meta">
                  ${brandMarkup}
                  <span>Closes ${escapeHtml(shared.formatDate(competition.closingDate))}</span>
                </div>
                ${summaryMarkup}
                <p class="competition-card__entry">${escapeHtml(competition.entryType)}</p>
                <span class="competition-card__hint">${escapeHtml(hintText)}</span>
                <a class="competition-card__internal-link" href="${escapeAttribute(internalPath)}">Competition page</a>
              </div>
              <a class="competition-card__overlay-link" href="${escapeAttribute(
                competition.url
              )}" aria-label="${escapeAttribute(competition.title)} - open competition">
                <span class="visually-hidden">Open ${escapeHtml(competition.title)}</span>
              </a>
            </article>`;
}

function renderInlineAdCard() {
  return `<article class="sponsored-card">
              <p class="sponsored-card__label">Sponsored</p>
              <h3 class="sponsored-card__title">Promote your offer here</h3>
              <p class="sponsored-card__text">
                Inline monetisation slot designed to blend with the card grid without disrupting browsing.
              </p>
              <p class="sponsored-card__hint">Reserved ad placement</p>
              <button class="sponsored-card__cta" type="button">View Offer</button>
            </article>`;
}

function renderNavLink(link, currentPath) {
  const isActive = currentPath === normalizeStaticPath(link.href);
  const className = isActive ? "category-nav__link is-active" : "category-nav__link";
  return `<a class="${className}" href="${escapeAttribute(link.href)}">${escapeHtml(link.label)}</a>`;
}

function renderPopularLink(link, currentPath) {
  const isActive = currentPath === normalizeStaticPath(link.href);
  const className = isActive ? "popular-searches__link is-active" : "popular-searches__link";
  return `<a class="${className}" href="${escapeAttribute(link.href)}">${escapeHtml(link.label)}</a>`;
}

function renderInternalLinksSection(routeContext) {
  const section =
    routeContext.type === "category"
      ? {
          title: "Related Searches",
          links: [
            { label: "Ending soon competitions", href: "/free-hub/tag/ending-soon/" },
            { label: "High value competitions", href: "/free-hub/tag/high-value/" },
          ],
        }
      : routeContext.type === "tag"
        ? {
            title: "Explore Categories",
            links: [
              { label: "Cash competitions", href: "/free-hub/category/cash/" },
              { label: "Car competitions", href: "/free-hub/category/cars/" },
            ],
          }
        : null;

  if (!section) {
    return "";
  }

  return `<section class="internal-links" aria-label="${escapeAttribute(section.title)}">
          <p class="internal-links__title">${escapeHtml(section.title)}</p>
          <div class="internal-links__list">
            ${section.links
              .map(
                (link) =>
                  `<a class="internal-links__link" href="${escapeAttribute(link.href)}">${escapeHtml(link.label)}</a>`
              )
              .join("\n            ")}
          </div>
        </section>`;
}

function renderSupportSection(supportCopy) {
  if (!supportCopy) {
    return "";
  }

  return `<section class="state-card" aria-label="Why this page matters">
          <p class="state-card__title">Why This Page Matters</p>
          <p class="state-card__text">${escapeHtml(supportCopy)}</p>
        </section>`;
}

function renderThinPageTips(competitions) {
  if (!shared.shouldShowThinPageTips(competitions)) {
    return "";
  }

  return `<section class="state-card" aria-label="Winning tips">
          <p class="state-card__title">Tips to improve your chances of winning</p>
          <ul class="state-card__list">
            ${shared.THIN_PAGE_TIPS.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("\n            ")}
          </ul>
        </section>`;
}

function normalizeStaticPath(pathname) {
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function escapeScript(value) {
  return String(value).replace(/<\/script/gi, "<\\/script");
}

function syncMirrorTree() {
  fs.rmSync(MIRROR_DIR, { recursive: true, force: true });
  fs.mkdirSync(MIRROR_DIR, { recursive: true });

  MIRROR_FILES.forEach((file) => {
    copyIntoMirror(path.join(ROOT_DIR, file), path.join(MIRROR_DIR, file));
  });

  MIRROR_DIRECTORIES.forEach((directory) => {
    copyIntoMirror(path.join(ROOT_DIR, directory), path.join(MIRROR_DIR, directory));
  });
}

function copyIntoMirror(source, destination) {
  const stats = fs.statSync(source);

  if (stats.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true });

    fs.readdirSync(source).forEach((entry) => {
      copyIntoMirror(path.join(source, entry), path.join(destination, entry));
    });

    return;
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

main();
