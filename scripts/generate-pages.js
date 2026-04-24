const fs = require("fs");
const path = require("path");
const shared = require("../shared/page-data.js");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT_DIR, "data", "competitions.json");
const RELATIVE_ASSET_PATH = "/";
const CATEGORY_LINKS = [
  { label: "All Competitions", href: "/" },
  ...shared.CATEGORY_SLUGS.map((slug) => ({
    label: shared.CATEGORY_COPY[slug].category,
    href: `/category/${slug}/`,
  })),
];
const TAG_LINKS = [
  { label: "Free Entry", href: "/tag/free-entry/" },
  { label: "Ending Soon", href: "/tag/ending-soon/" },
  { label: "High Value", href: "/tag/high-value/" },
];

function main() {
  const rawCompetitions = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const allCompetitions = shared.sortCompetitions(
    rawCompetitions.filter((entry, index) => validateCompetition(entry, index))
  );
  const competitions = allCompetitions.filter((competition) => !isExpired(competition.closingDate));
  const routeContexts = shared.getAllStaticRouteContexts();

  fs.writeFileSync(path.join(ROOT_DIR, "index.html"), renderHomepage(competitions));

  routeContexts.forEach((routeContext) => {
    const filteredCompetitions = shared.filterCompetitionsByRoute(competitions, routeContext);
    const html = renderPage(routeContext, filteredCompetitions);
    const outputDirectory = path.join(ROOT_DIR, routeContext.type, routeContext.slug);

    fs.mkdirSync(outputDirectory, { recursive: true });
    fs.writeFileSync(path.join(outputDirectory, "index.html"), html);
  });

  allCompetitions.forEach((competition) => {
    const html = renderCompetitionPage(competition, competitions);
    const slug = shared.getCompetitionSlug(competition);
    const outputDirectory = path.join(ROOT_DIR, "competition", slug);

    fs.mkdirSync(outputDirectory, { recursive: true });
    fs.writeFileSync(path.join(outputDirectory, "index.html"), html);
  });

  allCompetitions.forEach((competition) => {
    const html = renderOutPage(competition);
    const slug = shared.getCompetitionSlug(competition);
    const outputDirectory = path.join(ROOT_DIR, "out", slug);

    fs.mkdirSync(outputDirectory, { recursive: true });
    fs.writeFileSync(path.join(outputDirectory, "index.html"), html);
  });

  fs.writeFileSync(path.join(ROOT_DIR, "sitemap.xml"), generateSitemap(competitions));
  runStaticSeoChecks();
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
    <meta name="robots" content="index, follow, max-image-preview:large" />
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
      gtag('set', { page_type: '${routeContext.type}' });
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

        ${renderInternalLinksSection(routeContext, competitions)}

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
            <p class="site-footer__text">Contact: hello@freehub.co.za</p>
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
  const urgencyBadge = `<span class="badge badge--closing">${escapeHtml(
    shared.getUrgencyBadgeLabel(competition.closingDate)
  )}</span>`;
  const hotBadge = shared.shouldShowHotBadge(competition) ? '<span class="badge badge--hot">HOT</span>' : "";
  const costBadge = `<span class="badge badge--soft">${escapeHtml(shared.getEntryCostLabel(competition))}</span>`;
  const summaryMarkup = competition.summary
    ? `<p class="competition-card__summary">${escapeHtml(competition.summary)}</p>`
    : "";
  const cardClass = `competition-card${featured ? " competition-card--featured" : ""}`;
  const cardImageUrl = competition.image || shared.DEFAULT_OG_IMAGE;
  const urgencyLabel = shared.getUrgencyLabel(competition.closingDate);
  const entryMethodLabel = shared.getEntryMethodLabel(competition.entryType);
  const prizeCue = shared.getPrizeCue(competition);
  const headline = shared.getCardHeadline(competition);
  const brand = competition.brand || "Official promotion";
  const featuredEyebrow = featured ? '<p class="competition-card__eyebrow">Featured pick</p>' : "";
  const ctaClass = featured ? "competition-card__cta competition-card__cta--featured" : "competition-card__cta";

  return `<article class="${cardClass}">
              <div class="competition-card__media">
                <img src="${escapeAttribute(cardImageUrl)}" alt="${escapeAttribute(
    competition.title
  )}" loading="lazy" />
                <div class="competition-card__badges">
                  <div class="competition-card__badge-stack">
                    <span class="badge badge--category">${escapeHtml(competition.category)}</span>
                    ${hotBadge}
                  </div>
                  ${urgencyBadge}
                </div>
              </div>
              <div class="competition-card__body">
                ${featuredEyebrow}
                <h2 class="competition-card__title">${escapeHtml(headline)}</h2>
                <p class="competition-card__brand">${escapeHtml(brand)}</p>
                <div class="competition-card__signals">
                  <span class="competition-card__signal competition-card__signal--value">${escapeHtml(prizeCue)}</span>
                  <span class="competition-card__signal competition-card__signal--urgency">${escapeHtml(urgencyLabel)}</span>
                </div>
                ${summaryMarkup}
                <div class="competition-card__meta">
                  <span>${escapeHtml(entryMethodLabel)}</span>
                  <span>${escapeHtml(shared.formatDate(competition.closingDate))}</span>
                </div>
                <div class="competition-card__footer">
                  <div class="competition-card__tags">
                    <span class="competition-card__entry">${escapeHtml(entryMethodLabel)}</span>
                    ${costBadge}
                  </div>
                </div>
                <span class="${ctaClass}">Enter Now &rarr;</span>
              </div>
              <a class="competition-card__overlay-link" href="${escapeAttribute(internalPath)}/" aria-label="${escapeAttribute(competition.title)} - enter now">
                <span class="visually-hidden">Enter ${escapeHtml(competition.title)} now</span>
              </a>
            </article>`;
}

function renderInlineAdCard() {
  return `<article class="sponsored-card">
              <p class="sponsored-card__label">Recommended Opportunities</p>
              <h3 class="sponsored-card__title">Featured offers can live here without interrupting browsing</h3>
              <p class="sponsored-card__text">
                This in-feed slot is ready for promoted competitions, affiliate offers, or partner placements that match the page style.
              </p>
              <p class="sponsored-card__hint">Monetisation-ready placement</p>
              <button class="sponsored-card__cta" type="button">View Featured Offer</button>
            </article>`;
}

function renderHeroSpotlight(competition) {
  if (!competition) {
    return "";
  }

  const title = competition.title;
  const urgency = shared.getUrgencyLabel(competition.closingDate);
  const prizeCue = shared.getPrizeCue(competition);
  const entryPath = `${shared.getCompetitionPath(competition)}/`;
  const cardImageUrl = competition.image || shared.DEFAULT_OG_IMAGE;

  return `<a class="hero-spotlight" href="${escapeAttribute(entryPath)}" aria-label="${escapeAttribute(
    title
  )} - enter now">
            <div class="hero-spotlight__media">
              <img src="${escapeAttribute(cardImageUrl)}" alt="${escapeAttribute(title)}" loading="lazy" />
            </div>
            <div class="hero-spotlight__body">
              <p class="hero-spotlight__eyebrow">Featured prize</p>
              <h2 class="hero-spotlight__title">${escapeHtml(title)}</h2>
              <div class="hero-spotlight__meta">
                <span>${escapeHtml(prizeCue)}</span>
                <span>${escapeHtml(urgency)}</span>
              </div>
              <span class="hero-spotlight__cta">Enter Now</span>
            </div>
          </a>`;
}

function getHeroSpotlightCompetition(competitions) {
  const priorityCategories = ["Cars", "Cash", "Holidays"];

  return competitions
    .filter((competition) => !competition.closingDate || shared.getDaysUntilClosing(competition.closingDate) >= 0)
    .slice()
    .sort((left, right) => {
      const leftCategoryScore = priorityCategories.includes(left.category)
        ? priorityCategories.length - priorityCategories.indexOf(left.category)
        : 0;
      const rightCategoryScore = priorityCategories.includes(right.category)
        ? priorityCategories.length - priorityCategories.indexOf(right.category)
        : 0;
      const leftScore = (left.isHighValue ? 10 : 0) + leftCategoryScore;
      const rightScore = (right.isHighValue ? 10 : 0) + rightCategoryScore;

      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }

      return new Date(left.closingDate) - new Date(right.closingDate);
    })[0];
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

function renderInternalLinksSection(routeContext, competitions) {
  const section =
    routeContext.type === "category"
      ? getCategoryInternalLinks(routeContext.slug, competitions)
      : routeContext.type === "tag"
        ? {
            title: "Explore Categories",
            links: [
              { label: "Cash competitions", href: "/category/cash/" },
              { label: "Car competitions", href: "/category/cars/" },
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

function getCategoryInternalLinks(slug, competitions) {
  const firstCategoryCompetition = competitions[0]
    ? `${shared.getCompetitionPath(competitions[0])}/`
    : `/category/${slug}/`;
  const byIdPath = (id) => {
    const target = competitions.find((competition) => shared.getCompetitionSlug(competition) === id);
    return target ? `${shared.getCompetitionPath(target)}/` : firstCategoryCompetition;
  };

  if (slug === "cars") {
    return {
      title: "Car Competition Searches",
      links: [
        { label: "Current car competitions in South Africa", href: "/category/cars/" },
        { label: "Free car competitions South Africa", href: "/tag/free-entry/" },
        { label: "Win a car competition free entry", href: byIdPath("spar-win-a-car") },
      ],
    };
  }

  if (slug === "holidays") {
    return {
      title: "Holiday Competition Searches",
      links: [
        { label: "Win a holiday South Africa", href: byIdPath("sanlam-plan-win-mauritius") },
        { label: "Holiday giveaway competitions", href: byIdPath("makro-rewards-zanzibar-getaway") },
        { label: "Local getaway competition ideas", href: byIdPath("sixty60-getaway-giveaway") },
      ],
    };
  }

  if (slug === "tech") {
    return {
      title: "Tech Giveaway Searches",
      links: [
        { label: "Gadget giveaway competitions", href: byIdPath("game-store-gadget-giveaway") },
        { label: "Smartphone competition entries", href: byIdPath("vodacom-recharge-win-galaxy-s25") },
        { label: "Tech giveaways South Africa", href: "/category/tech/" },
      ],
    };
  }

  if (slug === "cash") {
    return {
      title: "Cash Competition Searches",
      links: [
        { label: "Cash competitions South Africa", href: "/category/cash/" },
        { label: "Win cash online South Africa", href: byIdPath("fnb-pay-to-win-grand-cash-prize") },
        { label: "Ending soon cash giveaways", href: "/tag/ending-soon/" },
      ],
    };
  }

  if (slug === "vouchers") {
    return {
      title: "Voucher Competition Searches",
      links: [
        { label: "Voucher giveaway competitions", href: "/category/vouchers/" },
        { label: "Takealot competitions and vouchers", href: byIdPath("cell-c-takealot-voucher-giveaway") },
        { label: "Voucher competitions South Africa", href: "/tag/free-entry/" },
      ],
    };
  }

  return {
    title: "Related Searches",
    links: [
      { label: "Ending soon competitions", href: "/tag/ending-soon/" },
      { label: "High value competitions", href: "/tag/high-value/" },
    ],
  };
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
  const homeRouteContext = { type: "home", slug: null, path: "/" };
  const structuredData = shared.buildStructuredData(competitions, homeRouteContext);
  const ogImage = competitions[0]?.image || shared.DEFAULT_OG_IMAGE;
  const featured = getFeaturedCompetitions(competitions, 4);
  const featuredCardsMarkup = featured.map((c) => renderCompetitionCard(c, true)).join("\n            ");
  const heroSpotlightMarkup = renderHeroSpotlight(getHeroSpotlightCompetition(competitions));

  const noscriptLinks = competitions
    .slice(0, 6)
    .map((c) => {
      const slug = shared.getCompetitionSlug(c);
      return `          <li><a href="${escapeAttribute(`/competition/${slug}/`)}">${escapeHtml(c.title)}</a></li>`;
    })
    .join("\n");

  const categoryNavMarkup = [
    `<a class="category-nav__link is-active" href="/">All</a>`,
    `<a class="category-nav__link" href="/tag/free-entry/">Free Entry</a>`,
    `<a class="category-nav__link" href="/tag/ending-soon/">Ending Soon</a>`,
    `<a class="category-nav__link" href="/tag/high-value/">High Value</a>`,
    ...shared.CATEGORY_SLUGS.map(
      (slug) =>
        `<a class="category-nav__link" href="${escapeAttribute(`/category/${slug}/`)}">${escapeHtml(
          shared.CATEGORY_COPY[slug].category
        )}</a>`
    ),
  ].join("\n          ");
  const homeIntentLinksMarkup = `<section class="internal-links" aria-label="Popular competition searches">
          <p class="internal-links__title">Popular Competition Searches</p>
          <div class="internal-links__list">
            <a class="internal-links__link" href="/category/cars/">Current car competitions in South Africa</a>
            <a class="internal-links__link" href="/category/holidays/">Win a holiday South Africa</a>
            <a class="internal-links__link" href="/category/tech/">Gadget giveaway and smartphone competition ideas</a>
          </div>
        </section>`;

  const homepageSeoCopy = `FreeHub helps you discover competitions in South Africa without wading through scattered social posts, outdated promo pages, or low-trust listing sites. Whether you want to win cars, cash, holidays, vouchers, or the latest tech, the homepage is designed to surface the most exciting opportunities quickly. You can browse featured competitions, jump into free-entry giveaways, or prioritise promotions that are ending soon so you do not miss valuable prizes.

Many South African competitions are tied to official brand promotions, retail campaigns, app offers, and seasonal giveaways. FreeHub makes those easier to compare by showing the entry method, closing date, and prize cues in one clean view. That means less hesitation and fewer wasted clicks before you decide which competition is worth your time.

If you are looking for free entry competitions in South Africa, practical voucher giveaways, high-value cash promotions, or travel prizes worth entering this week, FreeHub is built to help you move faster. Browse today, check the official rules on each competition page, and come back regularly for fresh opportunities.`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Free Competitions South Africa | Current Car, Holiday &amp; Cash Giveaways</title>
    <meta name="description" content="Browse free competitions South Africa users search for, including current car competitions, holiday giveaways, cash prizes, tech offers, and vouchers." />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${escapeAttribute(shared.CANONICAL_ORIGIN)}/" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Free Competitions South Africa | Current Car, Holiday &amp; Cash Giveaways" />
    <meta property="og:description" content="Browse free competitions South Africa users search for, including current car competitions, holiday giveaways, cash prizes, tech offers, and vouchers." />
    <meta property="og:url" content="${escapeAttribute(shared.CANONICAL_ORIGIN)}/" />
    <meta property="og:image" content="${escapeAttribute(ogImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Free Competitions South Africa | Current Car, Holiday &amp; Cash Giveaways" />
    <meta name="twitter:description" content="Browse free competitions South Africa users search for, including current car competitions, holiday giveaways, cash prizes, tech offers, and vouchers." />
    <meta name="twitter:image" content="${escapeAttribute(ogImage)}" />
    <script id="structured-data-itemlist" type="application/ld+json">${escapeScript(JSON.stringify(structuredData))}</script>
    <link rel="stylesheet" href="/styles.css" />
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-23P37R20FY"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('set', { page_type: 'home' });
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
        <div class="hero__layout">
          <div class="hero__copy">
            <p class="eyebrow">FREEHUB</p>
            <h1 id="pageTitle">Free Competitions South Africa: Cars, Holidays, Cash, Tech &amp; Vouchers</h1>
            <p class="hero__text" id="pageIntro">Find current car competitions, holiday giveaways, cash prizes, and voucher offers from trusted brands in one place.</p>
            <div class="hero__actions">
              <a class="btn btn--primary" href="#all-competitions">Browse All</a>
              <a class="btn btn--secondary" href="/tag/ending-soon/">Ending Soon</a>
            </div>
            <div class="trust-row" aria-label="Trust signals">
              <span class="trust-row__item">Verified</span>
              <span class="trust-row__item">No sign-up needed</span>
              <span class="trust-row__item">100% free to enter</span>
            </div>
          </div>
          ${heroSpotlightMarkup}
        </div>
      </header>

      <main class="main-content">
        <nav class="category-nav" aria-label="Competition categories">
          ${categoryNavMarkup}
        </nav>

        <section class="popular-searches" aria-label="Popular searches">
          <p class="popular-searches__title">Quick Paths</p>
          <div class="popular-searches__links">
            <a class="popular-searches__link" href="/tag/free-entry/">Free entry</a>
            <a class="popular-searches__link" href="/tag/ending-soon/">Ending soon</a>
            <a class="popular-searches__link" href="/tag/high-value/">High value</a>
          </div>
        </section>

        ${homeIntentLinksMarkup}

        <section class="home-section home-section--featured" aria-label="Featured competitions">
          <div class="home-section__header">
            <div>
              <p class="section-kicker">Featured This Week</p>
              <h2 class="home-section__title">Standout competitions worth opening first</h2>
            </div>
            <a class="home-section__link" href="/tag/high-value/">See high-value picks</a>
          </div>
          <p class="home-section__intro">A premium shortlist of aspirational prizes with strong value, trusted brands, and enough urgency to act now.</p>
          <div class="competition-grid competition-grid--featured">
            ${featuredCardsMarkup}
          </div>
        </section>

        <section class="ad-slot" id="ad-top" aria-label="Advertisement">
          <p class="ad-slot__label">Featured Offers</p>
          <p class="ad-slot__copy">A premium placement reserved for promoted competitions, brand campaigns, or affiliate-style opportunities that fit the page naturally.</p>
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
          <p class="ad-slot__label">Recommended Opportunities</p>
          <p class="ad-slot__copy">Use this mid-page section later for promoted competitions, native cards, or partner offers without breaking the browsing flow.</p>
        </section>

        <section class="home-section home-section--steps" aria-label="How FreeHub Works">
          <h2 class="home-section__title">How FreeHub Works</h2>
          <p class="home-section__intro">FreeHub is built to help you move from browsing to entering with less hesitation and more confidence.</p>
          <div class="steps-grid">
            <article class="step-card">
              <span class="step-card__number">1</span>
              <h3 class="step-card__title">Browse competitions</h3>
              <p class="step-card__text">Start with featured picks, free entry offers, or categories like cars, cash, holidays, tech, and vouchers.</p>
            </article>
            <article class="step-card">
              <span class="step-card__number">2</span>
              <h3 class="step-card__title">Open the competition page</h3>
              <p class="step-card__text">Each listing gives you the key details first so you can decide quickly which competitions are worth the click.</p>
            </article>
            <article class="step-card">
              <span class="step-card__number">3</span>
              <h3 class="step-card__title">Follow the official entry method</h3>
              <p class="step-card__text">We point you to the promoter's page so you can follow the real entry instructions, terms, and closing dates.</p>
            </article>
            <article class="step-card">
              <span class="step-card__number">4</span>
              <h3 class="step-card__title">Check back for new prizes</h3>
              <p class="step-card__text">Fresh competitions appear regularly, so returning visitors always have something new to explore.</p>
            </article>
          </div>
          <div class="trust-note">
            <p class="trust-note__title">Trust note</p>
            <p class="trust-note__text">We link to official brand promotions and we do not require sign-up on our site to browse the listings.</p>
          </div>
        </section>

        <section class="newsletter-block" aria-label="Competition alerts">
          <div>
            <p class="section-kicker">Alerts</p>
            <h2 class="newsletter-block__title">Get the latest competitions in your inbox</h2>
            <p class="newsletter-block__text">A lightweight alert block ready for email integration later. Use it for weekly roundups, high-value prizes, or ending-soon reminders.</p>
          </div>
          <form class="newsletter-form" action="#" method="post" novalidate>
            <label class="visually-hidden" for="newsletterEmail">Email address</label>
            <input id="newsletterEmail" name="email" type="email" placeholder="Enter your email address" />
            <button type="button">Notify Me</button>
          </form>
          <p class="newsletter-block__hint">Integration-ready placeholder only. No backend wiring has been added yet.</p>
        </section>

        <section class="ad-slot" id="ad-bottom" aria-label="Advertisement">
          <p class="ad-slot__label">Partner Placement</p>
          <p class="ad-slot__copy">Bottom-of-page space ready for sponsorships, house offers, or a larger editorial-style native unit.</p>
        </section>

        <section class="seo-copy-block" aria-label="About competitions in South Africa">
          <h2 class="seo-copy-block__title">Competitions in South Africa, all in one place</h2>
          <div class="seo-copy-block__content">
            <p>${escapeHtml(homepageSeoCopy.split("\n\n")[0])}</p>
            <p>${escapeHtml(homepageSeoCopy.split("\n\n")[1])}</p>
            <p>${escapeHtml(homepageSeoCopy.split("\n\n")[2])}</p>
          </div>
        </section>

        <section class="home-cta" aria-label="Find more competitions">
          <h2 class="home-cta__title">Browse more prizes before the best ones disappear</h2>
          <div class="home-cta__actions">
            <a class="btn btn--primary" href="#all-competitions">Browse All</a>
            <a class="btn btn--secondary" href="/tag/ending-soon/">Ending Soon</a>
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
            <p class="site-footer__text">Contact: hello@freehub.co.za</p>
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

    <script src="/shared/page-data.js" defer></script>
    <script src="/app.js" defer></script>
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

function buildHowToEnterSteps(competition) {
  const type = (competition.entryType || "").toLowerCase();
  const brand = competition.brand || "the brand";
  const date = shared.formatDate(competition.closingDate);
  const purchaseRequired = Array.isArray(competition.tags) && competition.tags.includes("purchase-required");

  if (type.includes("app")) {
    return [
      `Download or open the ${brand} app on your smartphone.`,
      "Log in or create your account if you don't have one.",
      `Navigate to the competition or promotions section and find this offer.`,
      purchaseRequired
        ? "Make the qualifying purchase or complete the required action to unlock your entry."
        : "Tap the entry tile and follow the in-app prompts to submit your entry.",
      "Confirm your entry has been submitted successfully.",
      `Competition closes ${date}. Winners will be notified via the app or email.`,
    ];
  }

  if (type.includes("sms")) {
    return [
      purchaseRequired
        ? `Purchase the qualifying product(s) from a participating ${brand} store.`
        : "Obtain your entry reference as per the competition terms.",
      "Keep your till slip or entry reference number safe.",
      "Compose an SMS with the required keyword and/or reference number as instructed.",
      "Send your SMS to the competition shortcode displayed in-store or on promotional material.",
      "Standard SMS rates apply. You will receive a confirmation SMS if your entry is valid.",
      `Entries close ${date}.`,
    ];
  }

  if (type.includes("in-store")) {
    return [
      `Visit a participating ${brand} store near you.`,
      purchaseRequired
        ? "Make the qualifying purchase as specified in the competition terms."
        : "Pick up an entry form at the customer service desk or till point.",
      "Complete the entry form with your details and, if required, attach your till slip.",
      "Drop your entry into the competition box in-store or hand it to a cashier.",
      "Keep a copy of your till slip as proof of your entry.",
      `Competition closes ${date}.`,
    ];
  }

  // Default: Online
  return [
    `Visit the official ${brand} competition page using the link below.`,
    "Complete the online entry form with your personal details.",
    purchaseRequired
      ? "Ensure you have made the qualifying purchase and have your proof of purchase ready."
      : "No purchase is necessary to enter — simply fill in and submit the form.",
    "Submit your entry before the closing date.",
    "Check your email for an entry confirmation.",
    `Competition closes ${date}.`,
  ];
}

function renderCompetitionPage(competition, allCompetitions) {
  const slug = shared.getCompetitionSlug(competition);
  const canonicalUrl = `${shared.CANONICAL_ORIGIN}/competition/${slug}/`;
  const officialUrl = competition.url;
  const description = shared.buildCompetitionDescription(competition);
  const formattedDate = shared.formatDate(competition.closingDate);
  const ogImage = competition.image || shared.DEFAULT_OG_IMAGE;
  if (!competition.image) {
    console.warn(`[generate-pages] Competition "${competition.title}" (slug: ${slug}) has no image — hero will use fallback background.`);
  }
  const relatedCompetitions = getRelatedCompetitions(competition, allCompetitions);

  const categorySlug = shared.CATEGORY_SLUGS.find(
    (key) => shared.CATEGORY_COPY[key].category === competition.category
  );
  const categoryPath = categorySlug ? `/category/${categorySlug}/` : "/";
  const expired = isExpired(competition.closingDate);
  const year = new Date(competition.closingDate).getFullYear();
  const heroTitle = /\bcompetition\b/i.test(competition.title)
    ? `${competition.title} ${year}`
    : `${competition.title} Competition ${year}`;
  const robotsDirective = expired
    ? "noindex, follow"
    : "index, follow, max-image-preview:large";
  const officialSource = getSafeHostname(officialUrl);

  const closingSoonBadge = shared.isClosingSoon(competition.closingDate)
    ? '<span class="badge badge--closing">&#x1F525; Closing Soon</span>'
    : "";
  const brandBadge = competition.brand
    ? `<span class="badge badge--category">${escapeHtml(competition.brand)}</span>`
    : "";
  const entryStepsMarkup = buildHowToEnterSteps(competition);
  const tagsMarkup = (competition.tags || []).length > 0
    ? `<div class="competition-detail__tags">
              ${competition.tags.map(tag => `<span class="badge badge--tag">${escapeHtml(tag)}</span>`).join(' ')}
            </div>`
    : "";
  const heroSubline = competition.brand ? `By ${competition.brand}` : competition.category;
  const closingSoon = shared.isClosingSoon(competition.closingDate);
  const purchaseRequired = Array.isArray(competition.tags) && competition.tags.includes("purchase-required");
  const outPath = shared.getOutPath(competition) + "/";

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
  const webPageData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: competition.title,
    description,
    url: canonicalUrl,
    inLanguage: "en-ZA",
    isPartOf: {
      "@type": "WebSite",
      name: "FreeHub",
      url: `${shared.CANONICAL_ORIGIN}/`,
    },
    about: {
      "@type": "Thing",
      name: `${competition.category} competition`,
    },
  };

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(competition.title)} – Enter Now | Free Competitions South Africa</title>
    <meta name="description" content="${escapeAttribute(description)}" />
    <meta name="robots" content="${robotsDirective}" />
    <link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeAttribute(competition.title)}" />
    <meta property="og:description" content="${escapeAttribute(description)}" />
    <meta property="og:url" content="${escapeAttribute(canonicalUrl)}" />
    <meta property="og:image" content="${escapeAttribute(ogImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttribute(competition.title)}" />
    <meta name="twitter:description" content="${escapeAttribute(description)}" />
    <meta name="twitter:image" content="${escapeAttribute(ogImage)}" />
    <script id="structured-data-webpage" type="application/ld+json">${escapeScript(JSON.stringify(webPageData))}</script>
    <script id="structured-data-offer" type="application/ld+json">${escapeScript(JSON.stringify(structuredData))}</script>
    <script id="structured-data-breadcrumb" type="application/ld+json">${escapeScript(JSON.stringify(breadcrumbData))}</script>
    <link rel="stylesheet" href="${RELATIVE_ASSET_PATH}styles.css" />
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-23P37R20FY"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('set', { page_type: 'competition', competition_slug: ${escapeScript(JSON.stringify(slug))}, competition_category: ${escapeScript(JSON.stringify(competition.category))} });
      gtag('config', 'G-23P37R20FY');
    </script>
  </head>
  <body>
    <div class="site-shell">
      <header class="hero hero--competition"${competition.image ? ` style="background-image: url('${escapeAttribute(competition.image)}')"` : ''}>
        <div class="hero__overlay" aria-hidden="true"></div>
        <div class="hero__content">
          <p class="eyebrow">free-hub</p>
          <h1 id="pageTitle">${escapeHtml(heroTitle)}</h1>
          <p class="hero__text">${escapeHtml(heroSubline)}</p>
          <p class="hero__closing${closingSoon && !expired ? " hero__closing--urgent" : ""}">${expired ? "Closed" : "Closes"} ${escapeHtml(formattedDate)}${closingSoon && !expired ? " · Ending soon" : ""}</p>
          ${!expired ? `<a class="hero__cta" href="${escapeAttribute(outPath)}" target="_blank" rel="noopener noreferrer">Enter Competition</a>` : ""}
        </div>
      </header>

      <main class="main-content">
        <nav class="category-nav" aria-label="Competition categories">
          ${CATEGORY_LINKS.map((link) => renderNavLink(link, "/competition/")).join("\n          ")}
        </nav>

        <section class="popular-searches" aria-label="Popular searches">
          <p class="popular-searches__title">Popular Searches</p>
          <div class="popular-searches__links">
            ${TAG_LINKS.map((link) => renderPopularLink(link, "/competition/")).join("\n            ")}
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
            <img src="${escapeAttribute(ogImage)}" alt="${escapeAttribute(competition.title)}" onerror="this.onerror=null;this.src='${escapeAttribute(shared.DEFAULT_OG_IMAGE)}'" />
          </div>
          <div class="competition-detail__body">
            <div class="competition-detail__meta">
              <span class="badge badge--category">${escapeHtml(competition.category)}</span>
              ${brandBadge}
              ${closingSoonBadge}
            </div>
            <div class="competition-detail__info">
              <p${closingSoon && !expired ? ` class="competition-detail__info--urgent"` : ""}><strong>Closes:</strong> ${escapeHtml(formattedDate)}${closingSoon && !expired ? " · ending soon" : ""}</p>
              <p><strong>Entry:</strong> ${escapeHtml(competition.entryType)}</p>
              <p><strong>Source:</strong> ${escapeHtml(officialSource)}</p>
            </div>
            <div class="competition-detail__summary">
              <p>${escapeHtml(description)}</p>
            </div>
            ${tagsMarkup}
            ${entryStepsMarkup}
            <div class="trust-chips">
              <span class="trust-chip">Official promotion</span>
              <span class="trust-chip">No sign-up on this site</span>
              ${!purchaseRequired ? '<span class="trust-chip">Free to enter</span>' : ""}
            </div>
            <a
              class="competition-detail__cta"
              href="${escapeAttribute(outPath)}"
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

        ${!expired ? `<section class="competition-cta-repeat" aria-label="Enter this competition">
          <p>Ready to enter? Head to the official competition page.</p>
          <a class="competition-detail__cta" href="${escapeAttribute(outPath)}" target="_blank" rel="noopener noreferrer">Enter Competition</a>
        </section>` : ""}

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
            <p class="site-footer__text">Contact: hello@freehub.co.za</p>
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
      gtag('set', { page_type: 'outbound', competition_slug: ${escapeScript(JSON.stringify(slug))}, competition_category: ${escapeScript(JSON.stringify(competition.category))} });
      gtag('config', 'G-23P37R20FY');
    </script>
    <script>
      (function () {
        var SLUG = ${escapeScript(JSON.stringify(slug))};
        var TITLE = ${escapeScript(JSON.stringify(competition.title))};
        var CATEGORY = ${escapeScript(JSON.stringify(competition.category))};
        var TARGET = ${escapeScript(JSON.stringify(externalUrl))};
        gtag('event', 'outbound_click', {
          competition_slug: SLUG,
          competition_title: TITLE,
          competition_category: CATEGORY,
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

  const competitionEntries = competitions
    .filter((competition) => !isExpired(competition.closingDate))
    .map((competition) => {
    const slug = shared.getCompetitionSlug(competition);
    return `  <url>\n    <loc>${origin}/competition/${slug}/</loc>\n    <lastmod>${today}</lastmod>\n  </url>`;
    });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticEntries, ...competitionEntries].join("\n")}
</urlset>
`;
}

function getSafeHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (_error) {
    return "official promoter site";
  }
}

function runStaticSeoChecks() {
  const errors = [];
  const sitemapPath = path.join(ROOT_DIR, "sitemap.xml");
  const sitemap = fs.readFileSync(sitemapPath, "utf8");
  const locMatches = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1].trim());

  if (locMatches.some((url) => url.includes("/out/"))) {
    errors.push("Sitemap contains /out/ URLs, which must stay non-indexable.");
  }

  locMatches.forEach((url) => {
    const pathname = new URL(url).pathname;
    if (pathname !== "/" && !pathname.endsWith("/")) {
      errors.push(`Sitemap URL missing trailing slash (likely redirect): ${url}`);
    }

    const filePath =
      pathname === "/"
        ? path.join(ROOT_DIR, "index.html")
        : path.join(ROOT_DIR, pathname.replace(/^\//, ""), "index.html");

    if (!fs.existsSync(filePath)) {
      errors.push(`Sitemap URL points to missing file: ${url}`);
      return;
    }

    const html = fs.readFileSync(filePath, "utf8");
    const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)"/i);
    if (!canonicalMatch) {
      errors.push(`Missing canonical tag in: ${filePath}`);
      return;
    }

    if (canonicalMatch[1] !== url) {
      errors.push(`Canonical mismatch for ${url}. Found: ${canonicalMatch[1]}`);
    }
  });

  const htmlFiles = [
    path.join(ROOT_DIR, "index.html"),
    ...getNestedIndexFiles(path.join(ROOT_DIR, "category")),
    ...getNestedIndexFiles(path.join(ROOT_DIR, "tag")),
    ...getNestedIndexFiles(path.join(ROOT_DIR, "competition")),
  ];

  htmlFiles.forEach((filePath) => {
    const html = fs.readFileSync(filePath, "utf8");
    const badStructuredDataUrl = html.match(/"url":"https:\/\/freehub\.co\.za\/competition\/[^"]*[^\/]"/);
    if (badStructuredDataUrl) {
      errors.push(`Structured data competition URL missing trailing slash in: ${filePath}`);
    }
  });

  if (errors.length > 0) {
    throw new Error(`[SEO checks failed]\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }
}

function getNestedIndexFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(directory, entry.name, "index.html"))
    .filter((filePath) => fs.existsSync(filePath));
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

main();
