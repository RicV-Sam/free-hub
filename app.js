const DATA_URL = new URL("./data/competitions.json", window.location.href);
const CLOSING_SOON_DAYS = 3;

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
};

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  loadCompetitions();
});

function bindEvents() {
  elements.searchInput.addEventListener("input", (event) => {
    state.searchQuery = event.target.value.trim().toLowerCase();
    renderCompetitions();
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
    const cards = filteredCompetitions.map(createCompetitionCard);
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
  link.target = "_blank";
  link.rel = "noreferrer noopener";
  link.setAttribute("aria-label", `${competition.title} - open competition`);
  link.addEventListener("click", () => trackCompetitionClick(competition));

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
    closingSoonBadge.textContent = "Closing Soon";
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

  const entryType = document.createElement("span");
  entryType.textContent = competition.entryType;

  meta.append(closingDate, entryType);

  const entryPill = document.createElement("p");
  entryPill.className = "competition-card__entry";
  entryPill.textContent = competition.entryType;

  body.append(title, meta, entryPill);
  link.append(media, body);
  article.appendChild(link);

  return article;
}

function updateResultsSummary(count) {
  const total = state.competitions.length;
  elements.resultsSummary.textContent =
    count === total
      ? `Showing all ${total} competitions`
      : `Showing ${count} of ${total} competitions`;
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
  console.log("Competition click tracked", {
    id: competition.id,
    title: competition.title,
    category: competition.category,
    url: competition.url,
    timestamp: new Date().toISOString(),
  });
}
