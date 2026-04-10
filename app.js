const DATA_URL = new URL("./data/competitions.json", window.location.href);
const CLOSING_SOON_DAYS = 3;
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
};

const elements = {
  searchInput: document.querySelector("#searchInput"),
  categoryFilters: document.querySelector("#categoryFilters"),
  resultsSummary: document.querySelector("#resultsSummary"),
  competitionsGrid: document.querySelector("#competitionsGrid"),
  loadingState: document.querySelector("#loadingState"),
  errorState: document.querySelector("#errorState"),
  emptyState: document.querySelector("#emptyState"),
  stickyAd: document.querySelector("#ad-sticky"),
  stickyAdClose: document.querySelector("#stickyAdClose"),
  stickyAdCta: document.querySelector("#stickyAdCta"),
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
      state.activeCategory = category;
      renderCategoryFilters();
      renderCompetitions();
    });

    elements.categoryFilters.appendChild(button);
  });
}

function renderCompetitions() {
  const filteredCompetitions = state.competitions.filter((competition) => {
    const matchesCategory =
      state.activeCategory === "All" || competition.category === state.activeCategory;
    const searchableText = `${competition.title} ${competition.category}`.toLowerCase();
    const matchesSearch = searchableText.includes(state.searchQuery);

    return matchesCategory && matchesSearch;
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

  updateResultsSummary(filteredCompetitions.length);
}

function createCompetitionCard(competition) {
  const article = document.createElement("article");
  article.className = "competition-card";

  const link = document.createElement("a");
  link.className = "competition-card__link";
  link.href = competition.url;
  link.setAttribute("role", "link");
  link.setAttribute("tabindex", "0");
  link.setAttribute("aria-label", `${competition.title} - open competition`);
  link.addEventListener("click", (event) => {
    event.preventDefault();
    openCompetition(competition);
  });
  link.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openCompetition(competition);
    }
  });

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

  body.append(title, meta, entryPill, externalHint);
  link.append(media, body);
  article.appendChild(link);

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
