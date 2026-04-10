const DATA_URL = new URL("./data/competitions.json", window.location.href);
const CLOSING_SOON_DAYS = 3;
const INLINE_AD_INTERVAL = 6;
const SPONSORED_OFFER_URL = "https://example.com/sponsored-offer";
const STICKY_AD_URL = "https://example.com/mobile-sponsored-offer";
const SITE_ORIGIN = "https://ricv-sam.github.io/free-hub";
const BASE_PATH = "/free-hub";
const HOME_ROUTE = `${BASE_PATH}/`;
const CATEGORY_COPY = {
  cash: {
    category: "Cash",
    title: "Free Cash Competitions UK | Win Money Online",
    description: "Browse free cash competitions in the UK and discover live giveaways you can enter online today.",
    heading: "Free Cash Competitions You Can Enter Today",
    intro: "Explore free cash competitions and money giveaways with quick entry routes and regularly updated listings.",
  },
  cars: {
    category: "Cars",
    title: "Free Car Competitions UK | Win Cars Online",
    description: "Browse free car competitions in the UK and find the latest online giveaways for vehicles and driving bundles.",
    heading: "Free Car Competitions You Can Enter Today",
    intro: "Discover free car competitions featuring city cars, SUVs, and transport bundles in one simple listing page.",
  },
  holidays: {
    category: "Holidays",
    title: "Free Holiday Competitions UK | Win Trips Online",
    description: "Browse free holiday competitions in the UK and discover online travel giveaways for breaks, escapes, and getaways.",
    heading: "Free Holiday Competitions You Can Enter Today",
    intro: "Find free holiday competitions for beach escapes, spa breaks, and travel prizes without leaving the hub.",
  },
  tech: {
    category: "Tech",
    title: "Free Tech Competitions UK | Win Gadgets Online",
    description: "Browse free tech competitions in the UK and find online giveaways for gadgets, devices, and smart-home prizes.",
    heading: "Free Tech Competitions You Can Enter Today",
    intro: "Explore free tech competitions with gadget bundles and smart-home prizes in a fast category landing page.",
  },
  vouchers: {
    category: "Vouchers",
    title: "Free Voucher Competitions UK | Win Shopping Vouchers",
    description: "Browse free voucher competitions in the UK and discover online giveaways for shopping and supermarket vouchers.",
    heading: "Free Voucher Competitions You Can Enter Today",
    intro: "Browse free voucher competitions featuring shopping credit, supermarket rewards, and other everyday prize offers.",
  },
};
const DEFAULT_COPY = {
  title: "Free Competitions UK | Win Cars, Cash & Holidays",
  description: "Browse free competitions in the UK with live categories, search, and fast access to offers for cars, cash, holidays, tech, and vouchers.",
  heading: "Latest Free Competitions in the UK",
  intro: "Discover new free competitions for cars, cash, holidays, tech, and vouchers in one fast hub.",
  canonical: `${SITE_ORIGIN}/`,
};
const TAG_COPY = {
  "free-entry": {
    title: "Free Entry Competitions UK",
    description: "Browse free entry competitions in the UK and discover giveaways you can enter online without paid tickets.",
    heading: "Free Entry Competitions You Can Enter Today",
    intro: "Browse free entry competitions across cars, cash, holidays, tech, and vouchers in one lightweight hub.",
  },
  "ending-soon": {
    title: "Competitions Ending Soon UK",
    description: "Browse competitions ending soon in the UK and enter before the closing dates pass.",
    heading: "Competitions Ending Soon You Should Enter Today",
    intro: "Browse competitions ending soon and enter before they close.",
  },
  "high-value": {
    title: "High Value Competitions UK",
    description: "Browse high value competitions in the UK featuring cash prizes, car giveaways, holidays, and premium offers.",
    heading: "High Value Competitions You Can Enter Today",
    intro: "Explore high value competitions featuring stronger prize-led offers and premium giveaway categories.",
  },
  new: {
    title: "New Competitions UK",
    description: "Browse new competitions in the UK and discover the latest active giveaways added to the hub.",
    heading: "New Competitions You Can Enter Today",
    intro: "Discover the newest competitions in the hub based on the latest active opportunities and earliest upcoming closes.",
  },
};
const PAGE_AD_PLACEMENTS = [
  { id: "ad-top", placement: "top" },
  { id: "ad-middle", placement: "middle" },
  { id: "ad-bottom", placement: "bottom" },
];

const state = {
  competitions: [],
  searchQuery: "",
  activeCategory: "All",
  routeCategory: null,
  routeTag: null,
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
  elements.searchInput.addEventListener("input", (event) => {
    state.searchQuery = event.target.value.trim().toLowerCase();
    renderCompetitions();
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
  showLoading();

  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const competitions = await response.json();

    state.competitions = competitions
      .slice()
      .sort((left, right) => new Date(left.closingDate) - new Date(right.closingDate));

    state.routeCategory = getRouteCategory();
    state.routeTag = getRouteTag();
    state.activeCategory = state.routeCategory ? CATEGORY_COPY[state.routeCategory].category : "All";

    updatePageChrome();
    renderCategoryFilters();
    renderCompetitions();
  } catch (error) {
    console.error("Unable to load competitions:", error);
    showError();
  }
}

function renderCategoryFilters() {
  const categories = ["All", ...new Set(state.competitions.map((competition) => competition.category))];

  elements.categoryFilters.innerHTML = "";

  categories.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter-chip${category === state.activeCategory ? " is-active" : ""}`;
    button.textContent = category;
    button.setAttribute("aria-pressed", String(category === state.activeCategory));
    button.addEventListener("click", () => {
      if (state.routeCategory || state.routeTag) {
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
    const searchableText = `${competition.title} ${competition.category}`.toLowerCase();
    const matchesSearch = searchableText.includes(state.searchQuery);

    return matchesSearch;
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
  const internalPath = getCompetitionPath(competition);

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

  const closingDate = document.createElement("span");
  closingDate.textContent = `Closes ${formatDate(competition.closingDate)}`;

  meta.append(closingDate);

  const entryPill = document.createElement("p");
  entryPill.className = "competition-card__entry";
  entryPill.textContent = competition.entryType;

  const externalHint = document.createElement("span");
  externalHint.className = "competition-card__hint";
  externalHint.textContent = "Opens in new tab";

  const internalLink = document.createElement("a");
  internalLink.className = "competition-card__internal-link";
  internalLink.href = internalPath;
  internalLink.textContent = "Competition page";
  internalLink.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  body.append(title, meta, entryPill, externalHint, internalLink);
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
  text.textContent = "Inline monetisation slot designed to blend with the card grid without disrupting browsing.";

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
  elements.loadingState.classList.remove("state-card--hidden");
  elements.errorState.classList.add("state-card--hidden");
  elements.emptyState.classList.add("state-card--hidden");
  elements.competitionsGrid.innerHTML = "";
  elements.resultsSummary.textContent = "Loading competitions...";
}

function showError() {
  elements.loadingState.classList.add("state-card--hidden");
  elements.errorState.classList.remove("state-card--hidden");
  elements.emptyState.classList.add("state-card--hidden");
  elements.competitionsGrid.innerHTML = "";
  elements.resultsSummary.textContent = "Competitions unavailable";
}

function hideStatusStates() {
  elements.loadingState.classList.add("state-card--hidden");
  elements.errorState.classList.add("state-card--hidden");
  elements.emptyState.classList.add("state-card--hidden");
}

function formatDate(dateString) {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function isClosingSoon(dateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const closingDate = new Date(dateString);
  closingDate.setHours(0, 0, 0, 0);

  const diffInMs = closingDate.getTime() - today.getTime();
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

  return diffInDays >= 0 && diffInDays <= CLOSING_SOON_DAYS;
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

function getCompetitionSlug(competition) {
  if (competition.id) {
    return competition.id;
  }

  return competition.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getCompetitionPath(competition) {
  return `${BASE_PATH}/competition/${getCompetitionSlug(competition)}`;
}

function getCompetitionAbsoluteUrl(competition) {
  return `${SITE_ORIGIN}/competition/${getCompetitionSlug(competition)}`;
}

function buildCompetitionDescription(competition) {
  return `${competition.category} competition with ${competition.entryType.toLowerCase()} entry. Closes ${formatDate(
    competition.closingDate
  )}.`;
}

function injectStructuredData(competitions) {
  const existingScript = document.querySelector("#structured-data-itemlist");

  if (existingScript) {
    existingScript.remove();
  }

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "free-hub competitions",
    itemListElement: competitions.map((competition, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: getCompetitionAbsoluteUrl(competition),
      name: competition.title,
      description: buildCompetitionDescription(competition),
      image: competition.image || undefined,
    })),
  };

  const script = document.createElement("script");
  script.id = "structured-data-itemlist";
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(itemList);
  document.head.appendChild(script);
}

function getRouteCategory() {
  const path = normalizePath(window.location.pathname);
  const categoryMatch = path.match(/^\/free-hub\/category\/([a-z0-9-]+)$/);

  if (!categoryMatch) {
    return null;
  }

  const slug = categoryMatch[1];

  return CATEGORY_COPY[slug] ? slug : null;
}

function getRouteTag() {
  const path = normalizePath(window.location.pathname);
  const tagMatch = path.match(/^\/free-hub\/tag\/([a-z0-9-]+)$/);

  if (!tagMatch) {
    return null;
  }

  const slug = tagMatch[1];

  return TAG_COPY[slug] ? slug : null;
}

function normalizePath(pathname) {
  const trimmed = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;

  if (trimmed === `${BASE_PATH}`) {
    return HOME_ROUTE.slice(0, -1);
  }

  return trimmed;
}

function getRouteScopedCompetitions() {
  if (state.routeTag) {
    return getTagFilteredCompetitions(state.routeTag);
  }

  if (!state.routeCategory) {
    return state.competitions;
  }

  const targetCategory = CATEGORY_COPY[state.routeCategory].category;
  return state.competitions.filter((competition) => competition.category === targetCategory);
}

function updatePageChrome() {
  const routeCopy = state.routeTag
    ? TAG_COPY[state.routeTag]
    : state.routeCategory
      ? CATEGORY_COPY[state.routeCategory]
      : null;
  const pageTitle = routeCopy ? routeCopy.title : DEFAULT_COPY.title;
  const pageDescription = routeCopy ? routeCopy.description : DEFAULT_COPY.description;
  const pageHeading = routeCopy ? routeCopy.heading : DEFAULT_COPY.heading;
  const pageIntro = routeCopy ? routeCopy.intro : DEFAULT_COPY.intro;
  const canonical = routeCopy
    ? state.routeTag
      ? `${SITE_ORIGIN}/tag/${state.routeTag}`
      : `${SITE_ORIGIN}/category/${state.routeCategory}`
    : DEFAULT_COPY.canonical;

  document.title = pageTitle;
  elements.pageTitle.textContent = pageHeading;
  elements.pageIntro.textContent = pageIntro;
  elements.metaDescription.setAttribute("content", pageDescription);
  elements.canonical.setAttribute("href", canonical);
  elements.ogTitle.setAttribute("content", pageTitle);
  elements.ogDescription.setAttribute("content", pageDescription);
  elements.ogUrl.setAttribute("content", canonical);
  elements.twitterTitle.setAttribute("content", pageTitle);
  elements.twitterDescription.setAttribute("content", pageDescription);
}

function updateCategoryNavigation() {
  elements.categoryNavLinks.forEach((link) => {
    const targetPath = normalizePath(new URL(link.href).pathname);
    const currentPath = normalizePath(window.location.pathname);
    link.classList.toggle("is-active", targetPath === currentPath);
  });
}

function updatePopularSearchNavigation() {
  elements.popularSearchLinks.forEach((link) => {
    const targetPath = normalizePath(new URL(link.href).pathname);
    const currentPath = normalizePath(window.location.pathname);
    link.classList.toggle("is-active", targetPath === currentPath);
  });
}

function getCategoryRoute(category) {
  if (category === "All") {
    return `${BASE_PATH}/`;
  }

  const slug = Object.keys(CATEGORY_COPY).find(
    (key) => CATEGORY_COPY[key].category === category
  );

  return slug ? `${BASE_PATH}/category/${slug}` : `${BASE_PATH}/`;
}

function getTagFilteredCompetitions(tag) {
  switch (tag) {
    case "free-entry":
      return state.competitions;
    case "ending-soon":
      return state.competitions.filter((competition) => isClosingWithinDays(competition.closingDate, 7));
    case "high-value":
      return state.competitions.filter((competition) => isHighValueCompetition(competition));
    case "new":
      return state.competitions.slice(0, 4);
    default:
      return state.competitions;
  }
}

function isClosingWithinDays(dateString, days) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const closingDate = new Date(dateString);
  closingDate.setHours(0, 0, 0, 0);

  const diffInMs = closingDate.getTime() - today.getTime();
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

  return diffInDays >= 0 && diffInDays <= days;
}

function isHighValueCompetition(competition) {
  const categoryPriority = ["Cash", "Cars", "Holidays"];
  const keywordPattern = /\b(cash|car|holiday|luxury|suv|bundle|escape|spa)\b/i;
  return categoryPriority.includes(competition.category) || keywordPattern.test(competition.title);
}
