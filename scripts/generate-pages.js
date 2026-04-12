const fs = require("fs");
const path = require("path");
const shared = require("../shared/page-data.js");

const ROOT_DIR = path.resolve(__dirname, "..");
const MIRROR_DIR = path.join(ROOT_DIR, "free-hub");
const DATA_PATH = path.join(ROOT_DIR, "data", "competitions.json");
const RELATIVE_ASSET_PATH = "../../";
const MIRROR_FILES = ["index.html", "404.html", "app.js", "styles.css", "robots.txt", "sitemap.xml"];
const MIRROR_DIRECTORIES = ["data", "shared", "category", "tag", "competition", "out"];
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
// Canonical-domain links used on competition detail pages (no /free-hub/ prefix)
const CANONICAL_CATEGORY_LINKS = [
  { label: "All Competitions", href: "/" },
  ...shared.CATEGORY_SLUGS.map((slug) => ({
    label: shared.CATEGORY_COPY[slug].category,
    href: `/category/${slug}/`,
  })),
];
const CANONICAL_TAG_LINKS = [
  { label: "Free Entry", href: "/tag/free-entry/" },
  { label: "Ending Soon", href: "/tag/ending-soon/" },
  { label: "High Value", href: "/tag/high-value/" },
  { label: "New", href: "/tag/new/" },
];

function main() {
  const rawCompetitions = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const competitions = shared.sortCompetitions(
    rawCompetitions.filter((entry, index) => validateCompetition(entry, index))
  );
  const routeContexts = shared.getAllStaticRouteContexts();

  fs.writeFileSync(path.join(ROOT_DIR, "index.html"), renderHomepage(competitions));

  routeContexts.forEach((routeContext) => {
    const filteredCompetitions = shared.filterCompetitionsByRoute(competitions, routeContext);
    const html = renderPage(routeContext, filteredCompetitions);
    const outputDirectory = path.join(ROOT_DIR, routeContext.type, routeContext.slug);

    fs.mkdirSync(outputDirectory, { recursive: true });
    fs.writeFileSync(path.join(outputDirectory, "index.html"), html);
  });

  competitions.forEach((competition) => {
    const html = renderCompetitionPage(competition, competitions);
    const slug = shared.getCompetitionSlug(competition);
    const outputDirectory = path.join(ROOT_DIR, "competition", slug);

    fs.mkdirSync(outputDirectory, { recursive: true });
    fs.writeFileSync(path.join(outputDirectory, "index.html"), html);
  });

  competitions.forEach((competition) => {
    const html = renderOutPage(competition);
    const slug = shared.getCompetitionSlug(competition);
    const outputDirectory = path.join(ROOT_DIR, "out", slug);

    fs.mkdirSync(outputDirectory, { recursive: true });
    fs.writeFileSync(path.join(outputDirectory, "index.html"), html);
  });

  fs.writeFileSync(path.join(ROOT_DIR, "sitemap.xml"), generateSitemap(competitions));

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
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-23P37R20FY"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-23P37R20FY');
    </script>
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

function renderCompetitionCard(competition, featured = false) {
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
  const cardClass = `competition-card${featured ? " competition-card--featured" : ""}`;

  return `<article class="${cardClass}">
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
              </div>
              <a class="competition-card__overlay-link" href="${escapeAttribute(internalPath)}/" aria-label="${escapeAttribute(competition.title)} - view competition details">
                <span class="visually-hidden">View details for ${escapeHtml(competition.title)}</span>
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

function renderHomepage(competitions) {
  const homeRouteContext = { type: "home", slug: null, path: `${shared.BASE_PATH}/` };
  const structuredData = shared.buildStructuredData(competitions, homeRouteContext);
  const ogImage = competitions[0]?.image || shared.DEFAULT_OG_IMAGE;
  const featured = getFeaturedCompetitions(competitions, 3);
  const endingSoon = getEndingSoonCompetitions(competitions, 6);

  const categoryCounts = {};
  shared.CATEGORY_SLUGS.forEach((slug) => {
    const cat = shared.CATEGORY_COPY[slug].category;
    categoryCounts[slug] = competitions.filter((c) => c.category === cat).length;
  });

  const featuredCardsMarkup = featured.map((c) => renderCompetitionCard(c, true)).join("\n            ");
  const endingSoonCardsMarkup = endingSoon.map((c) => renderCompetitionCard(c)).join("\n            ");

  const noscriptLinks = competitions
    .slice(0, 6)
    .map((c) => {
      const slug = shared.getCompetitionSlug(c);
      return `          <li><a href="${escapeAttribute(`${shared.BASE_PATH}/competition/${slug}/`)}">${escapeHtml(c.title)}</a></li>`;
    })
    .join("\n");

  const categoryShortcutsMarkup = shared.CATEGORY_SLUGS.map((slug) => {
    const count = categoryCounts[slug];
    const label = shared.CATEGORY_COPY[slug].category;
    return `<a class="category-shortcut" href="${escapeAttribute(`/free-hub/category/${slug}/`)}">
              <span class="category-shortcut__name">${escapeHtml(label)}</span>
              <span class="category-shortcut__count">${count} competition${count !== 1 ? "s" : ""}</span>
            </a>`;
  }).join("\n            ");

  const categoryNavMarkup = shared.CATEGORY_SLUGS.map((slug) =>
    `<a class="category-nav__link" href="${escapeAttribute(`/free-hub/category/${slug}/`)}">${escapeHtml(shared.CATEGORY_COPY[slug].category)}</a>`
  ).join("\n          ");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Free Competitions South Africa | Win Cars, Cash &amp; Holidays</title>
    <meta name="description" content="Browse free competitions in South Africa with live categories, search, and fast access to offers for cars, cash, holidays, tech, and vouchers." />
    <link rel="canonical" href="https://freehub.datacost.co.za/" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Free Competitions South Africa | Win Cars, Cash &amp; Holidays" />
    <meta property="og:description" content="Browse free competitions in South Africa with live categories, search, and fast access to offers for cars, cash, holidays, tech, and vouchers." />
    <meta property="og:url" content="https://freehub.datacost.co.za/" />
    <meta property="og:image" content="${escapeAttribute(ogImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Free Competitions South Africa | Win Cars, Cash &amp; Holidays" />
    <meta name="twitter:description" content="Browse free competitions in South Africa with live categories, search, and fast access to offers for cars, cash, holidays, tech, and vouchers." />
    <meta name="twitter:image" content="${escapeAttribute(ogImage)}" />
    <script id="structured-data-itemlist" type="application/ld+json">${escapeScript(JSON.stringify(structuredData))}</script>
    <link rel="stylesheet" href="styles.css" />
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-23P37R20FY"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-23P37R20FY');
    </script>
  </head>
  <body>
    <noscript>
      <section class="noscript-shell" aria-label="Competition links">
        <h2>Competition links</h2>
        <p>Browse a quick set of competition pages if JavaScript is unavailable.</p>
        <ul class="noscript-links">
${noscriptLinks}
        </ul>
      </section>
    </noscript>

    <div class="site-shell">
      <header class="hero hero--home">
        <div class="hero__copy">
          <p class="eyebrow">free-hub</p>
          <h1 id="pageTitle">Win Cars, Cash, Holidays and Vouchers in South Africa</h1>
          <p class="hero__text" id="pageIntro">Browse free competitions from trusted brands. Updated regularly with new giveaways, prize draws and promotions.</p>
          <div class="hero__actions">
            <a class="btn btn--primary" href="#all-competitions">Browse Competitions</a>
            <a class="btn btn--secondary" href="/free-hub/tag/ending-soon/">View Ending Soon</a>
          </div>
          <div class="trust-chips">
            <span class="trust-chip">Verified competitions</span>
            <span class="trust-chip">Direct links to official brands</span>
            <span class="trust-chip">Free to enter</span>
            <span class="trust-chip">No sign-up required on our site</span>
          </div>
        </div>
      </header>

      <main class="main-content">
        <nav class="category-nav" aria-label="Competition categories">
          <a class="category-nav__link is-active" href="/free-hub/">All Competitions</a>
          ${categoryNavMarkup}
        </nav>

        <section class="popular-searches" aria-label="Popular searches">
          <p class="popular-searches__title">Popular Searches</p>
          <div class="popular-searches__links">
            <a class="popular-searches__link" href="/free-hub/tag/free-entry/">Free Entry</a>
            <a class="popular-searches__link" href="/free-hub/tag/ending-soon/">Ending Soon</a>
            <a class="popular-searches__link" href="/free-hub/tag/high-value/">High Value</a>
            <a class="popular-searches__link" href="/free-hub/tag/new/">New</a>
          </div>
        </section>

        <section class="home-section" aria-label="Featured Competitions">
          <h2 class="home-section__title">Featured Competitions</h2>
          <div class="competition-grid">
            ${featuredCardsMarkup}
          </div>
        </section>

        <section class="home-section" aria-label="Ending Soon">
          <div class="home-section__header">
            <h2 class="home-section__title">Ending Soon</h2>
            <a class="home-section__link" href="/free-hub/tag/ending-soon/">View all</a>
          </div>
          <p class="home-section__intro">Enter these before they close</p>
          <div class="competition-grid competition-grid--scroll">
            ${endingSoonCardsMarkup}
          </div>
        </section>

        <section class="home-section" aria-label="Browse by Category">
          <h2 class="home-section__title">Browse by Category</h2>
          <div class="category-shortcuts__grid">
            ${categoryShortcutsMarkup}
          </div>
        </section>

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
          <p id="resultsSummary" class="results-header__summary">Loading competitions...</p>
        </section>

        <section id="loadingState" class="state-card" aria-live="polite">
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

        <section class="competition-section" id="all-competitions">
          <div id="competitionsGrid" class="competition-grid" aria-live="polite"></div>

          <div id="emptyState" class="state-card state-card--hidden" aria-live="polite">
            <p class="state-card__title">No competitions match</p>
            <p class="state-card__text">Try a different search term or clear the current category filter.</p>
          </div>
        </section>

        <section class="ad-slot ad-slot--compact" id="ad-middle" aria-label="Advertisement">
          <p class="ad-slot__label">Advertisement</p>
          <p class="ad-slot__copy">Mid-page placement designed for sponsored content or display inventory.</p>
        </section>

        <section class="home-section" aria-label="Why use FreeHub">
          <h2 class="home-section__title">Why use FreeHub?</h2>
          <p class="home-section__intro">FreeHub helps you discover free competitions from official South African brands and promotions. We do not ask you to sign up on our site to enter. We simply help you find verified opportunities faster.</p>
          <ul class="home-trust-list">
            <li>Verified competition listings</li>
            <li>Direct links to official brand promotions</li>
            <li>Free to browse</li>
            <li>Updated regularly</li>
          </ul>
        </section>

        <section class="home-section" aria-label="How FreeHub Works">
          <h2 class="home-section__title">How FreeHub Works</h2>
          <p class="home-section__intro">Browse competitions, open the full details, and then visit the official brand page to enter. Always check the official terms, entry rules, and closing dates before submitting your entry.</p>
        </section>

        <section class="ad-slot" id="ad-bottom" aria-label="Advertisement">
          <p class="ad-slot__label">Advertisement</p>
          <p class="ad-slot__copy">Bottom placement reserved for future ad network integration.</p>
        </section>

        <section class="home-cta" aria-label="Find more competitions">
          <h2 class="home-cta__title">Don't miss the latest free competitions in South Africa</h2>
          <div class="home-cta__actions">
            <a class="btn btn--primary" href="#all-competitions">Browse All Competitions</a>
            <a class="btn btn--secondary" href="/free-hub/tag/new/">View New Competitions</a>
          </div>
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

    <script src="shared/page-data.js" defer></script>
    <script src="app.js" defer></script>
  </body>
</html>
`;
}

function getFeaturedCompetitions(competitions, n) {
  const PRIORITY_CATEGORIES = ["Cars", "Cash", "Holidays"];

  const scored = competitions.map((c) => ({
    competition: c,
    score: (c.isHighValue ? 10 : 0) + (PRIORITY_CATEGORIES.includes(c.category) ? 5 : 0),
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(a.competition.closingDate) - new Date(b.competition.closingDate);
  });

  // Prefer category diversity in the top N
  const result = [];
  const usedCategories = new Set();

  for (const { competition } of scored) {
    if (result.length >= n) break;
    if (!usedCategories.has(competition.category)) {
      result.push(competition);
      usedCategories.add(competition.category);
    }
  }

  for (const { competition } of scored) {
    if (result.length >= n) break;
    if (!result.includes(competition)) result.push(competition);
  }

  return result;
}

function getEndingSoonCompetitions(competitions, n) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return competitions
    .filter((c) => new Date(c.closingDate) >= today)
    .sort((a, b) => new Date(a.closingDate) - new Date(b.closingDate))
    .slice(0, n);
}

function renderCompetitionPage(competition, allCompetitions) {
  const slug = shared.getCompetitionSlug(competition);
  const canonicalUrl = `${shared.CANONICAL_ORIGIN}/competition/${slug}/`;
  const description = shared.buildCompetitionDescription(competition);
  const formattedDate = shared.formatDate(competition.closingDate);
  const ogImage = competition.image || shared.DEFAULT_OG_IMAGE;
  const relatedCompetitions = getRelatedCompetitions(competition, allCompetitions);

  const categorySlug = shared.CATEGORY_SLUGS.find(
    (key) => shared.CATEGORY_COPY[key].category === competition.category
  );
  const categoryPath = categorySlug ? `/category/${categorySlug}/` : "/";
  const expired = isExpired(competition.closingDate);
  const year = new Date(competition.closingDate).getFullYear();

  const closingSoonBadge = shared.isClosingSoon(competition.closingDate)
    ? '<span class="badge badge--closing">&#x1F525; Closing Soon</span>'
    : "";
  const brandBadge = competition.brand
    ? `<span class="badge badge--category">${escapeHtml(competition.brand)}</span>`
    : "";
  const entryStepsMarkup = buildHowToEnterSteps(competition);
  const heroSubline = competition.brand ? `By ${competition.brand}` : competition.category;

  const relatedCardsMarkup = relatedCompetitions.map((c) => renderCompetitionCard(c)).join("\n            ");
  const relatedSection = relatedCardsMarkup
    ? `<section class="competition-section" aria-label="Related Competitions">
          <div class="internal-links">
            <p class="internal-links__title">Related Competitions</p>
          </div>
          <div class="competition-grid">
            ${relatedCardsMarkup}
          </div>
        </section>`
    : "";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: competition.title,
    description,
    url: canonicalUrl,
    image: competition.image || undefined,
    offeredBy: competition.brand ? { "@type": "Organization", name: competition.brand } : undefined,
    availabilityEnds: competition.closingDate,
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${shared.CANONICAL_ORIGIN}/` },
      ...(categorySlug
        ? [{ "@type": "ListItem", position: 2, name: competition.category, item: `${shared.CANONICAL_ORIGIN}/category/${categorySlug}/` }]
        : []),
      { "@type": "ListItem", position: categorySlug ? 3 : 2, name: competition.title },
    ],
  };

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(competition.title)} – Enter Now | Free Competitions South Africa</title>
    <meta name="description" content="${escapeAttribute(description)}" />
    <link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />${expired ? `
    <meta name="robots" content="noindex" />` : ""}
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeAttribute(competition.title)}" />
    <meta property="og:description" content="${escapeAttribute(description)}" />
    <meta property="og:url" content="${escapeAttribute(canonicalUrl)}" />
    <meta property="og:image" content="${escapeAttribute(ogImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttribute(competition.title)}" />
    <meta name="twitter:description" content="${escapeAttribute(description)}" />
    <meta name="twitter:image" content="${escapeAttribute(ogImage)}" />
    <script id="structured-data-offer" type="application/ld+json">${escapeScript(JSON.stringify(structuredData))}</script>
    <script id="structured-data-breadcrumb" type="application/ld+json">${escapeScript(JSON.stringify(breadcrumbData))}</script>
    <link rel="stylesheet" href="${RELATIVE_ASSET_PATH}styles.css" />
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-23P37R20FY"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-23P37R20FY');
    </script>
  </head>
  <body>
    <div class="site-shell">
      <header class="hero">
        <div class="hero__copy">
          <p class="eyebrow">free-hub</p>
          <h1 id="pageTitle">${escapeHtml(competition.title)} Competition ${year}</h1>
          <p class="hero__text">${escapeHtml(heroSubline)}</p>
        </div>
      </header>

      <main class="main-content">
        <nav class="category-nav" aria-label="Competition categories">
          ${CANONICAL_CATEGORY_LINKS.map((link) => renderNavLink(link, "/competition/")).join("\n          ")}
        </nav>

        <section class="popular-searches" aria-label="Popular searches">
          <p class="popular-searches__title">Popular Searches</p>
          <div class="popular-searches__links">
            ${CANONICAL_TAG_LINKS.map((link) => renderPopularLink(link, "/competition/")).join("\n            ")}
          </div>
        </section>

        ${expired ? `<section class="state-card state-card--error" aria-label="Competition closed">
          <p class="state-card__title">This competition has closed</p>
          <p class="state-card__text">The closing date was ${escapeHtml(formattedDate)}. Browse related competitions below.</p>
        </section>` : ""}

        ${renderCompetitionInternalLinks(competition.category, categoryPath)}

        <section class="ad-slot" id="ad-top" aria-label="Advertisement">
          <p class="ad-slot__label">Advertisement</p>
          <p class="ad-slot__copy">Top banner placeholder for future monetisation.</p>
        </section>

        <article class="competition-detail" aria-label="${escapeAttribute(competition.title)}">
          <div class="competition-detail__media">
            <img src="${escapeAttribute(ogImage)}" alt="${escapeAttribute(competition.title)}" />
          </div>
          <div class="competition-detail__body">
            <div class="competition-detail__meta">
              <span class="badge badge--category">${escapeHtml(competition.category)}</span>
              ${brandBadge}
              ${closingSoonBadge}
            </div>
            <div class="competition-detail__info">
              <p><strong>Closing Date:</strong> ${escapeHtml(formattedDate)}</p>
              <p><strong>Entry Type:</strong> ${escapeHtml(competition.entryType)}</p>
            </div>
            <div class="competition-detail__summary">
              <p>${escapeHtml(description)}</p>
            </div>
            ${entryStepsMarkup}
            <a
              class="competition-detail__cta"
              href="${escapeAttribute(shared.getOutPath(competition) + "/")}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Enter Competition
            </a>
            <a
              class="competition-detail__whatsapp"
              href="https://wa.me/?text=${encodeURIComponent(`Enter the ${competition.title} competition – ${canonicalUrl}`)}"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on WhatsApp"
            >
              Share on WhatsApp
            </a>
          </div>
        </article>

        <section class="state-card" aria-label="About this listing">
          <p class="state-card__title">About This Listing</p>
          <p class="state-card__text">
            We link directly to official brand competitions and promoter pages. No account or sign-up is required on our site. Always check the promoter's terms and closing date before entering.
          </p>
        </section>

        <section class="ad-slot ad-slot--compact" id="ad-middle" aria-label="Advertisement">
          <p class="ad-slot__label">Advertisement</p>
          <p class="ad-slot__copy">Mid-page placement designed for sponsored content or display inventory.</p>
        </section>

        ${relatedSection}

        ${competition.brand ? `<section class="internal-links" aria-label="More from ${escapeAttribute(competition.brand)}">
          <p class="internal-links__title">More from ${escapeHtml(competition.brand)}</p>
          <div class="internal-links__list">
            <a class="internal-links__link" href="${escapeAttribute(categoryPath)}">Browse ${escapeHtml(competition.category)} competitions</a>
          </div>
        </section>` : ""}

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

function renderOutPage(competition) {
  const slug = shared.getCompetitionSlug(competition);
  const externalUrl = competition.url;
  const canonicalUrl = `${shared.CANONICAL_ORIGIN}/out/${slug}/`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Redirecting to ${escapeHtml(competition.title)} | Free Hub SA</title>
    <meta name="robots" content="noindex, nofollow" />
    <link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />
    <link rel="stylesheet" href="${RELATIVE_ASSET_PATH}styles.css" />
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-23P37R20FY"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-23P37R20FY');
    </script>
    <script>
      (function () {
        var SLUG = ${escapeScript(JSON.stringify(slug))};
        var TARGET = ${escapeScript(JSON.stringify(externalUrl))};
        gtag('event', 'outbound_click', {
          event_label: SLUG,
          event_category: 'outbound',
          transport_type: 'beacon',
        });
        setTimeout(function () {
          window.location.replace(TARGET);
        }, 2000);
      })();
    </script>
  </head>
  <body>
    <div class="site-shell">
      <header class="hero">
        <div class="hero__copy">
          <p class="eyebrow">free-hub</p>
          <h1>Redirecting you now&hellip;</h1>
          <p class="hero__text">Taking you to <strong>${escapeHtml(competition.title)}</strong>. If you are not redirected automatically, use the link below.</p>
        </div>
      </header>

      <main class="main-content">
        <section class="state-card" aria-label="Redirect notice">
          <p class="state-card__title">You are being redirected</p>
          <p class="state-card__text">
            You will be taken to the official competition page in 2 seconds.
          </p>
          <a class="competition-detail__cta" href="${escapeAttribute(externalUrl)}" rel="nofollow noopener" target="_blank">
            Click here if the redirect does not work
          </a>
        </section>

        <section class="ad-slot" id="ad-top" aria-label="Advertisement">
          <p class="ad-slot__label">Advertisement</p>
          <p class="ad-slot__copy">Top banner placeholder for future monetisation.</p>
        </section>

        <section class="ad-slot ad-slot--compact" id="ad-middle" aria-label="Advertisement">
          <p class="ad-slot__label">Advertisement</p>
          <p class="ad-slot__copy">Mid-page placement designed for sponsored content or display inventory.</p>
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
            <p class="site-footer__title">Disclaimer</p>
            <p class="site-footer__text">
              No purchase is necessary for many promotions, but always check the promoter's terms and closing date before entering.
            </p>
          </div>
        </div>
      </footer>
    </div>
  </body>
</html>
`;
}

function renderCompetitionInternalLinks(category, categoryPath) {
  const links = [
    { label: `All ${category} competitions`, href: categoryPath },
    { label: "Ending soon competitions", href: "/tag/ending-soon/" },
    { label: "High value competitions", href: "/tag/high-value/" },
  ];

  return `<section class="internal-links" aria-label="Explore More">
          <p class="internal-links__title">Explore More</p>
          <div class="internal-links__list">
            ${links
              .map(
                (link) =>
                  `<a class="internal-links__link" href="${escapeAttribute(link.href)}">${escapeHtml(link.label)}</a>`
              )
              .join("\n            ")}
          </div>
        </section>`;
}

function getRelatedCompetitions(competition, allCompetitions) {
  const currentSlug = shared.getCompetitionSlug(competition);
  const competitionTagSet = new Set(competition.tags || []);

  const scored = allCompetitions
    .filter((c) => shared.getCompetitionSlug(c) !== currentSlug)
    .map((c) => {
      let score = 0;
      if (c.category === competition.category) score += 2;
      (c.tags || []).forEach((tag) => {
        if (competitionTagSet.has(tag)) score += 1;
      });
      return { competition: c, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 5).map((item) => item.competition);
}

const REQUIRED_FIELDS = ["id", "title", "brand", "category", "closingDate", "url"];

function validateCompetition(entry, index) {
  const missing = REQUIRED_FIELDS.filter(
    (field) => !entry[field] || String(entry[field]).trim() === ""
  );
  if (missing.length > 0) {
    console.warn(`[SKIP] Entry at index ${index} missing required fields: ${missing.join(", ")}`);
    return false;
  }
  return true;
}

function isExpired(dateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const closing = new Date(dateString);
  closing.setHours(0, 0, 0, 0);
  return closing < today;
}

function buildHowToEnterSteps(competition) {
  const type = (competition.entryType || "").toLowerCase();
  let steps;

  if (type.includes("sms")) {
    steps = [
      "Buy a qualifying product from the participating retailer.",
      "SMS the required keyword and your details to the competition number.",
      "Keep your receipt as proof of purchase.",
      "Winners are drawn at random and contacted directly.",
    ];
  } else if (type.includes("app")) {
    steps = [
      `Download or open the ${competition.brand || "brand"} app.`,
      "Navigate to the competition or promotions section.",
      "Follow the in-app entry instructions.",
      "Submit your entry before the closing date.",
    ];
  } else if (type.includes("in-store") || type.includes("purchase")) {
    steps = [
      `Purchase a qualifying product at a participating ${competition.brand || "brand"} store.`,
      "Collect your receipt or any on-pack promotional material.",
      "Follow the in-store or on-pack entry instructions.",
      "Submit your entry before the closing date.",
    ];
  } else if (type.includes("survey") || type.includes("form")) {
    steps = [
      "Visit the official competition page using the link below.",
      "Complete the entry form with your details.",
      "Submit the form before the closing date.",
      "Check your email — winners are notified directly.",
    ];
  } else if (type.includes("social")) {
    steps = [
      "Follow the brand on their official social media account.",
      "Like or share the competition post as instructed.",
      "Tag any required friends in the comments.",
      "Winners are selected and announced on the brand's social page.",
    ];
  } else {
    steps = [
      "Visit the official competition page using the link below.",
      "Read the entry requirements and terms carefully.",
      "Complete and submit your entry.",
      "Winners are notified by the promoter — check back for results.",
    ];
  }

  return `<div class="competition-detail__steps">
              <p class="competition-detail__steps-title"><strong>How to Enter</strong></p>
              <ol class="competition-detail__steps-list">
                ${steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("\n                ")}
              </ol>
            </div>`;
}

function generateSitemap(competitions) {
  const today = new Date().toISOString().split("T")[0];
  const origin = shared.CANONICAL_ORIGIN;

  const staticEntries = [
    `  <url>\n    <loc>${origin}/</loc>\n  </url>`,
    ...shared.CATEGORY_SLUGS.map(
      (slug) => `  <url>\n    <loc>${origin}/category/${slug}/</loc>\n  </url>`
    ),
    ...shared.TAG_SLUGS.map(
      (slug) => `  <url>\n    <loc>${origin}/tag/${slug}/</loc>\n  </url>`
    ),
  ];

  const competitionEntries = competitions.map((competition) => {
    const slug = shared.getCompetitionSlug(competition);
    return `  <url>\n    <loc>${origin}/competition/${slug}/</loc>\n    <lastmod>${today}</lastmod>\n  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticEntries, ...competitionEntries].join("\n")}
</urlset>
`;
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
