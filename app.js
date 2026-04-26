const {
  CATEGORY_COPY,
  DEFAULT_OG_IMAGE,
  getCompetitionPath,
  getCompetitionSlug,
  buildStructuredData,
  filterCompetitionsByRoute,
  formatDate,
  getCategoryRoute,
  getEntryMethodLabel,
  getEntryCostLabel,
  getCardHeadline,
  getCardTagLabels,
  getPrizeCue,
  getUrgencyLabel,
  getUrgencyBadgeLabel,
  getPageCopy,
  getRouteContext,
  isClosingSoon,
  shouldShowHotBadge,
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
  setupEngagementTracking();
  setupPageAds();
  setupStickyAd();

  if (state.routeContext.type === "competition") {
    trackDetailPageView();
  }

  if (state.routeContext.type === "home") {
    loadCompetitions();
  }
});

function bindEvents() {
  if (elements.searchInput && state.routeContext.type === "home") {
    elements.searchInput.addEventListener("input", (event) => {
      state.searchQuery = event.target.value.trim().toLowerCase();
      renderCompetitions();
    });
  }

  document.addEventListener("click", (event) => {
    const cardLink = event.target.closest(".competition-card__overlay-link");

    if (!cardLink) {
      return;
    }

    trackCompetitionCardElement(cardLink);
  });

  document.querySelectorAll(".competition-detail__cta").forEach((cta) => {
    cta.addEventListener("click", () => {
      trackEnterCompetitionClick(cta);
    });
  });

  document.querySelectorAll(".hero__cta").forEach((cta) => {
    cta.addEventListener("click", () => {
      trackEnterCompetitionClick(cta);
    });
  });

  [...elements.categoryNavLinks, ...elements.popularSearchLinks].forEach((link) => {
    link.addEventListener("click", () => {
      trackCategoryFilterClick(link.textContent.trim(), link.getAttribute("href") || "");
    });
  });
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
  if (!elements.competitionsGrid) {
    return;
  }

  if (state.routeContext.type === "competition") {
    return;
  }

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
      trackCategoryFilterClick(category, getCategoryRoute(category));

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
  article.dataset.competitionSlug = getCompetitionSlug(competition);
  article.dataset.competitionTitle = competition.title;
  article.dataset.competitionCategory = competition.category;

  const overlayLink = document.createElement("a");
  overlayLink.className = "competition-card__overlay-link";
  overlayLink.href = getCompetitionPath(competition) + "/";
  overlayLink.setAttribute("aria-label", `${competition.title} - view details`);
  const overlayText = document.createElement("span");
  overlayText.className = "visually-hidden";
  overlayText.textContent = `View details for ${competition.title}`;
  overlayLink.appendChild(overlayText);

  const media = document.createElement("div");
  media.className = "competition-card__media";

  const image = document.createElement("img");
  image.src = competition.image || DEFAULT_OG_IMAGE;
  image.alt = competition.title;
  image.loading = "lazy";
  image.onerror = () => { image.src = DEFAULT_OG_IMAGE; image.onerror = null; };

  const badges = document.createElement("div");
  badges.className = "competition-card__badges";

  const badgeStack = document.createElement("div");
  badgeStack.className = "competition-card__badge-stack";

  const categoryBadge = document.createElement("span");
  categoryBadge.className = "badge badge--category";
  categoryBadge.textContent = competition.category;
  badgeStack.appendChild(categoryBadge);

  if (shouldShowHotBadge(competition)) {
    const hotBadge = document.createElement("span");
    hotBadge.className = "badge badge--hot";
    hotBadge.textContent = "HOT";
    badgeStack.appendChild(hotBadge);
  }

  const urgencyBadge = document.createElement("span");
  urgencyBadge.className = "badge badge--closing";
  urgencyBadge.textContent = getUrgencyBadgeLabel(competition.closingDate);

  badges.append(badgeStack, urgencyBadge);
  media.append(image, badges);

  const body = document.createElement("div");
  body.className = "competition-card__body";

  const title = document.createElement("h2");
  title.className = "competition-card__title";
  title.textContent = getCardHeadline(competition);

  const brand = document.createElement("p");
  brand.className = "competition-card__brand";
  brand.textContent = competition.brand || "Official promotion";

  const signals = document.createElement("div");
  signals.className = "competition-card__signals";

  const valueSignal = document.createElement("span");
  valueSignal.className = "competition-card__signal competition-card__signal--value";
  valueSignal.textContent = getPrizeCue(competition);

  const urgencySignal = document.createElement("span");
  urgencySignal.className = "competition-card__signal competition-card__signal--urgency";
  urgencySignal.textContent = getUrgencyLabel(competition.closingDate);

  signals.append(valueSignal, urgencySignal);

  const meta = document.createElement("div");
  meta.className = "competition-card__meta";

  const closingDate = document.createElement("span");
  closingDate.textContent = formatDate(competition.closingDate);

  const entryMethod = document.createElement("span");
  entryMethod.textContent = getEntryMethodLabel(competition.entryType);
  meta.append(entryMethod, closingDate);

  if (competition.summary) {
    const summary = document.createElement("p");
    summary.className = "competition-card__summary";
    summary.textContent = competition.summary;
    body.append(title, brand, signals, summary, meta);
  } else {
    body.append(title, brand, signals, meta);
  }

  const footer = document.createElement("div");
  footer.className = "competition-card__footer";

  const tags = document.createElement("div");
  tags.className = "competition-card__tags";

  getCardTagLabels(competition).forEach((label) => {
    const tag = document.createElement("span");
    tag.className =
      label === getEntryMethodLabel(competition.entryType) ? "competition-card__entry" : "badge badge--soft";
    tag.textContent = label;
    tags.append(tag);
  });

  const cta = document.createElement("span");
  cta.className = "competition-card__cta";
  cta.textContent = "View Details";

  footer.append(tags);
  body.append(footer, cta);
  article.append(media, body, overlayLink);

  return article;
}

function createInlineAdCard(placement) {
  const article = document.createElement("article");
  article.className = "sponsored-card sponsored-card--reserved";
  article.dataset.placement = placement;
  article.setAttribute("aria-hidden", "true");

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
  sendGaEvent("competition_card_click", {
    competition_slug: getCompetitionSlug(competition),
    competition_title: competition.title,
    competition_category: competition.category,
  });
}

function trackCompetitionCardElement(link) {
  const card = link.closest(".competition-card");
  const href = link.getAttribute("href") || "";

  sendGaEvent("competition_card_click", {
    competition_slug: card?.dataset.competitionSlug || href.split("/").filter(Boolean).pop(),
    competition_title: card?.dataset.competitionTitle || link.getAttribute("aria-label") || "",
    competition_category: card?.dataset.competitionCategory || "",
    destination_path: href,
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
  sendGaEvent("ad_view", { placement });
}

function trackAdClick(placement) {
  sendGaEvent("ad_click", { placement });
}

function trackDetailPageView() {
  sendGaEvent("detail_page_view", {
    competition_slug: getCurrentCompetitionSlug(),
  });
}

function trackEnterCompetitionClick(link) {
  const href = link.getAttribute("href") || "";

  if (!href.includes("/out/")) {
    return;
  }

  sendGaEvent("enter_competition_click", {
    page_type: state.routeContext.type,
    competition_slug: getCurrentCompetitionSlug(),
    destination_path: href,
    transport_type: "beacon",
  });
}

function trackCategoryFilterClick(label, href) {
  sendGaEvent("category_filter_click", {
    filter_label: label,
    destination_path: href,
  });
}

function setupEngagementTracking() {
  let scrolled50 = false;

  window.addEventListener("scroll", () => {
    if (scrolled50) {
      return;
    }

    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;

    if (scrollableHeight <= 0) {
      return;
    }

    if (window.scrollY / scrollableHeight >= 0.5) {
      scrolled50 = true;
      sendGaEvent("scroll_50", {
        page_type: state.routeContext.type,
      });
    }
  }, { passive: true });

  window.setTimeout(() => {
    sendGaEvent("time_on_site_30s", {
      page_type: state.routeContext.type,
    });
  }, 30000);
}

function getCurrentCompetitionSlug() {
  return state.routeContext.type === "competition" ? state.routeContext.slug : undefined;
}

function sendGaEvent(name, params) {
  if (typeof gtag !== "function") return;
  gtag("event", name, params);
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
  return pathname.includes("/category/") || pathname.includes("/tag/") || pathname.includes("/competition/");
}
