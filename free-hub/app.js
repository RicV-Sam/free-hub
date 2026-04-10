const {
  CATEGORY_COPY,
  getCompetitionPath,
  buildStructuredData,
  filterCompetitionsByRoute,
  formatDate,
  getCategoryRoute,
  getPageCopy,
  getRouteContext,
  isClosingSoon,
  sortCompetitions,
} = window.FreeHubShared;

const INLINE_AD_INTERVAL = 6;
const SPONSORED_OFFER_URL = "https://example.com/sponsored-offer";
const STICKY_AD_URL = "https://example.com/mobile-sponsored-offer";
const PAGE_AD_PLACEMENTS = [
  { id: "ad-top", placement: "top" },
  { id: "ad-middle", placement: "middle" },
  { id: "ad-bottom", placement: "bottom" },
];

const state = {
  competitions: [],
  searchQuery: "",
  activeCategory: "All",
  routeContext: getRouteContext(getCurrentRoutePath()),
};

const elements = {
  searchInput: document.querySelector("#searchInput"),
  categoryFilters: document.querySelector("#categoryFilters"),
  categoryNavLinks: Array.from(document.querySelectorAll(".category-nav__link")),
  popularSearchLinks: Array.from(document.querySelectorAll(".popular-searches__link")),
  resultsSummary: document.querySelector("#resultsSummary"),
  competitionsGrid: document.querySelector("#competitionsGrid"),
  loadingState: document.querySelector("#loadingState"),
  errorState: document.querySelector("#errorState"),
  emptyState: document.querySelector("#emptyState"),
  stickyAd: document.querySelector("#ad-sticky"),
  stickyAdClose: document.querySelector("#stickyAdClose"),
  stickyAdCta: document.querySelector("#stickyAdCta"),
  pageTitle: document.querySelector("#pageTitle"),
  pageIntro: document.querySelector("#pageIntro"),
  metaDescription: document.querySelector('meta[name="description"]'),
  canonical: document.querySelector('link[rel="canonical"]'),
  ogTitle: document.querySelector('meta[property="og:title"]'),
  ogDescription: document.querySelector('meta[property="og:description"]'),
  ogUrl: document.querySelector('meta[property="og:url"]'),
  twitterTitle: document.querySelector('meta[name="twitter:title"]'),
  twitterDescription: document.querySelector('meta[name="twitter:description"]'),
};

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  setupPageAds();
  setupStickyAd();
  loadCompetitions();
});

function bindEvents() {
  if (elements.searchInput) {
    elements.searchInput.addEventListener("input", (event) => {
      state.searchQuery = event.target.value.trim().toLowerCase();
      renderCompetitions();
    });
  }
}

function setupPageAds() {
  PAGE_AD_PLACEMENTS.forEach(({ id, placement }) => {
    const element = document.querySelector(`#${id}`);

    if (!element) {
      return;
    }

    element.addEventListener("click", () => trackAdClick(placement));
  });

  const observer = new IntersectionObserver(handleAdVisibility, {
    threshold: 0.35,
  });

  PAGE_AD_PLACEMENTS.forEach(({ id, placement }) => {
    const element = document.querySelector(`#${id}`);

    if (!element) {
      return;
    }

    element.dataset.placement = placement;
    observer.observe(element);
  });
}

function setupStickyAd() {
  if (!elements.stickyAd || !elements.stickyAdClose || !elements.stickyAdCta) {
    return;
  }

  elements.stickyAdClose.addEventListener("click", () => {
    elements.stickyAd.classList.add("ad-sticky--hidden");
  });

  elements.stickyAdCta.addEventListener("click", () => {
    openSponsoredOffer("sticky", STICKY_AD_URL);
  });
}

async function loadCompetitions() {
  showLoading();

  try {
    const response = await fetch(getDataPath(), { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    state.competitions = sortCompetitions(await response.json());
    state.routeContext = getRouteContext(getCurrentRoutePath());
    state.activeCategory =
      state.routeContext.type === "category"
        ? CATEGORY_COPY[state.routeContext.slug].category
        : "All";

    updatePageChrome();
    renderCategoryFilters();
    renderCompetitions();
  } catch (error) {
    console.error("Unable to load competitions:", error);
    showError();
  }
}

function renderCategoryFilters() {
  if (!elements.categoryFilters) {
    return;
  }

  const categories = ["All", ...new Set(state.competitions.map((competition) => competition.category))];

  elements.categoryFilters.innerHTML = "";

  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter-chip${category === state.activeCategory ? " is-active" : ""}`;
    button.textContent = category;
    button.setAttribute("aria-pressed", String(category === state.activeCategory));
    button.addEventListener("click", () => {
      if (state.routeContext.type !== "home") {
        window.location.href = getCategoryRoute(category);
        return;
      }

      state.activeCategory = category;
      renderCategoryFilters();
      renderCompetitions();
    });

    elements.categoryFilters.appendChild(button);
  });

  updateCategoryNavigation();
  updatePopularSearchNavigation();
}

function renderCompetitions() {
  const routeFilteredCompetitions = getRouteScopedCompetitions();
  const filteredCompetitions = routeFilteredCompetitions.filter((competition) => {
    const searchableText = [
      competition.title,
      competition.category,
      competition.brand || "",
      competition.summary || "",
      Array.isArray(competition.tags) ? competition.tags.join(" ") : "",
    ]
      .join(" ")
      .toLowerCase();
    return searchableText.includes(state.searchQuery);
  });

  hideStatusStates();
  elements.competitionsGrid.innerHTML = "";

  if (filteredCompetitions.length === 0) {
    elements.emptyState.classList.remove("state-card--hidden");
  } else {
    const cards = filteredCompetitions.flatMap((competition, index) => {
      const items = [createCompetitionCard(competition)];

      if ((index + 1) % INLINE_AD_INTERVAL === 0) {
        const placement = `inline-${Math.floor((index + 1) / INLINE_AD_INTERVAL)}`;
        items.push(createInlineAdCard(placement));
      }

      return items;
    });

    elements.competitionsGrid.append(...cards);
  }

  injectStructuredData(filteredCompetitions);
  updateResultsSummary(filteredCompetitions.length);
}

function createCompetitionCard(competition) {
  const article = document.createElement("article");
  article.className = "competition-card";

  const overlayLink = document.createElement("a");
  overlayLink.className = "competition-card__overlay-link";
  overlayLink.href = competition.url;
  overlayLink.setAttribute("aria-label", `${competition.title} - open competition`);
  overlayLink.addEventListener("click", (event) => {
    event.preventDefault();
    openCompetition(competition);
  });
  overlayLink.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openCompetition(competition);
    }
  });

  const overlayText = document.createElement("span");
  overlayText.className = "visually-hidden";
  overlayText.textContent = `Open ${competition.title}`;
  overlayLink.appendChild(overlayText);

  const media = document.createElement("div");
  media.className = "competition-card__media";

  const image = document.createElement("img");
  image.src = competition.image;
  image.alt = competition.title;
  image.loading = "lazy";

  const badges = document.createElement("div");
  badges.className = "competition-card__badges";

  const categoryBadge = document.createElement("span");
  categoryBadge.className = "badge badge--category";
  categoryBadge.textContent = competition.category;
  badges.appendChild(categoryBadge);

  if (isClosingSoon(competition.closingDate)) {
    const closingSoonBadge = document.createElement("span");
    closingSoonBadge.className = "badge badge--closing";
    closingSoonBadge.textContent = "\u{1F525} Closing Soon";
    badges.appendChild(closingSoonBadge);
  }

  media.append(image, badges);

  const body = document.createElement("div");
  body.className = "competition-card__body";

  const title = document.createElement("h2");
  title.className = "competition-card__title";
  title.textContent = competition.title;

  const meta = document.createElement("div");
  meta.className = "competition-card__meta";

  if (competition.brand) {
    const brand = document.createElement("span");
    brand.textContent = competition.brand;
    meta.append(brand);
  }

  const closingDate = document.createElement("span");
  closingDate.textContent = `Closes ${formatDate(competition.closingDate)}`;
  meta.append(closingDate);

  if (competition.summary) {
    const summary = document.createElement("p");
    summary.className = "competition-card__summary";
    summary.textContent = competition.summary;
    body.append(title, meta, summary);
  } else {
    body.append(title, meta);
  }

  const entryPill = document.createElement("p");
  entryPill.className = "competition-card__entry";
  entryPill.textContent = competition.entryType;

  const externalHint = document.createElement("span");
  externalHint.className = "competition-card__hint";
  externalHint.textContent = competition.entrySteps || "Opens in new tab";

  const internalLink = document.createElement("a");
  internalLink.className = "competition-card__internal-link";
  internalLink.href = getCompetitionPath(competition);
  internalLink.textContent = "Competition page";
  internalLink.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  body.append(entryPill, externalHint, internalLink);
  article.append(media, body, overlayLink);

  return article;
}

function createInlineAdCard(placement) {
  const article = document.createElement("article");
  article.className = "sponsored-card";

  const label = document.createElement("p");
  label.className = "sponsored-card__label";
  label.textContent = "Sponsored";

  const title = document.createElement("h3");
  title.className = "sponsored-card__title";
  title.textContent = "Promote your offer here";

  const text = document.createElement("p");
  text.className = "sponsored-card__text";
  text.textContent =
    "Inline monetisation slot designed to blend with the card grid without disrupting browsing.";

  const hint = document.createElement("p");
  hint.className = "sponsored-card__hint";
  hint.textContent = "Reserved ad placement";

  const cta = document.createElement("button");
  cta.type = "button";
  cta.className = "sponsored-card__cta";
  cta.textContent = "View Offer";
  cta.setAttribute("aria-label", "View sponsored offer");
  cta.addEventListener("click", () => {
    openSponsoredOffer(placement, SPONSORED_OFFER_URL);
  });

  article.append(label, title, text, hint, cta);

  return article;
}

function updateResultsSummary(count) {
  elements.resultsSummary.textContent = `Showing ${count} competitions`;
}

function showLoading() {
  const hasPrerenderedContent = elements.competitionsGrid.children.length > 0;

  elements.loadingState.classList.toggle("state-card--hidden", hasPrerenderedContent);
  elements.errorState.classList.add("state-card--hidden");
  elements.emptyState.classList.add("state-card--hidden");

  if (!hasPrerenderedContent) {
    elements.competitionsGrid.innerHTML = "";
    elements.resultsSummary.textContent = "Loading competitions...";
  }
}

function showError() {
  elements.loadingState.classList.add("state-card--hidden");
  elements.errorState.classList.remove("state-card--hidden");
  elements.emptyState.classList.add("state-card--hidden");

  if (elements.competitionsGrid.children.length === 0) {
    elements.resultsSummary.textContent = "Competitions unavailable";
  }
}

function hideStatusStates() {
  elements.loadingState.classList.add("state-card--hidden");
  elements.errorState.classList.add("state-card--hidden");
  elements.emptyState.classList.add("state-card--hidden");
}

function trackCompetitionClick(competition) {
  console.log({
    event: "competition_click",
    id: competition.id,
    title: competition.title,
    category: competition.category,
    timestamp: new Date().toISOString(),
  });
}

function openCompetition(competition) {
  trackCompetitionClick(competition);
  window.open(competition.url, "_blank", "noopener,noreferrer");
}

function handleAdVisibility(entries, observer) {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) {
      return;
    }

    const placement = entry.target.dataset.placement;
    trackAdView(placement);
    observer.unobserve(entry.target);
  });
}

function trackAdView(placement) {
  console.log({
    event: "ad_view",
    placement,
    timestamp: new Date().toISOString(),
  });
}

function trackAdClick(placement) {
  console.log({
    event: "ad_click",
    placement,
    timestamp: new Date().toISOString(),
  });
}

function openSponsoredOffer(placement, url) {
  trackAdClick(placement);
  window.open(url, "_blank", "noopener,noreferrer");
}

function injectStructuredData(competitions) {
  const existingScript = document.querySelector("#structured-data-itemlist");

  if (existingScript) {
    existingScript.remove();
  }

  const script = document.createElement("script");
  script.id = "structured-data-itemlist";
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(buildStructuredData(competitions, state.routeContext));
  document.head.appendChild(script);
}

function getRouteScopedCompetitions() {
  const routeScopedCompetitions = filterCompetitionsByRoute(state.competitions, state.routeContext);

  if (state.routeContext.type === "home" && state.activeCategory !== "All") {
    return routeScopedCompetitions.filter(
      (competition) => competition.category === state.activeCategory
    );
  }

  return routeScopedCompetitions;
}

function updatePageChrome() {
  const pageCopy = getPageCopy(state.routeContext);

  document.title = pageCopy.title;
  elements.pageTitle.textContent = pageCopy.heading;
  elements.pageIntro.textContent = pageCopy.intro;
  elements.metaDescription.setAttribute("content", pageCopy.description);
  elements.canonical.setAttribute("href", pageCopy.canonical);
  elements.ogTitle.setAttribute("content", pageCopy.title);
  elements.ogDescription.setAttribute("content", pageCopy.description);
  elements.ogUrl.setAttribute("content", pageCopy.canonical);
  elements.twitterTitle.setAttribute("content", pageCopy.title);
  elements.twitterDescription.setAttribute("content", pageCopy.description);
}

function updateCategoryNavigation() {
  const currentPath = getCurrentRoutePath();

  elements.categoryNavLinks.forEach((link) => {
    const targetPath = getRouteContext(new URL(link.href).pathname).path;
    link.classList.toggle("is-active", targetPath === currentPath);
  });
}

function updatePopularSearchNavigation() {
  const currentPath = getCurrentRoutePath();

  elements.popularSearchLinks.forEach((link) => {
    const targetPath = getRouteContext(new URL(link.href).pathname).path;
    link.classList.toggle("is-active", targetPath === currentPath);
  });
}

function getCurrentRoutePath() {
  return getRouteContext(window.location.pathname).path;
}

function getDataPath() {
  if (isNestedRoutePath(window.location.pathname)) {
    return "../../data/competitions.json";
  }

  return "data/competitions.json";
}

function isNestedRoutePath(pathname) {
  return pathname.includes("/category/") || pathname.includes("/tag/");
}
