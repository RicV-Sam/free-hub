(() => {
  const filters = document.querySelector(".slang-filters");
  const search = filters.querySelector("input");
  const category = filters.querySelector('[name="category"]');
  const region = filters.querySelector('[name="region"]');
  const status = document.querySelector(".slang-status");
  const normalize = (value) => value.toLowerCase().normalize("NFD")
    .replace(/\p{Mark}/gu, "").replace(/[-’']/g, " ").replace(/\s+/g, " ").trim();
  const cards = [...document.querySelectorAll(".slang-card")].map((card) => ({
    card,
    text: normalize(card.textContent),
  }));

  function filterCards() {
    const query = normalize(search.value);
    let count = 0;
    for (const { card, text } of cards) {
      const matchesCategory = !category.value || category.value === card.dataset.slangGroup;
      const matchesRegion = !region.value || region.value === card.dataset.slangRegion;
      card.hidden = !(matchesCategory && matchesRegion && text.includes(query));
      if (!card.hidden) count++;
    }
    status.textContent = count ? `${count} ${count === 1 ? "expression" : "expressions"}`
      : "No matches. Try a different search or change the filters.";
  }

  search.addEventListener("input", filterCards);
  filters.addEventListener("change", filterCards);
  filters.hidden = false;
  filterCards();
})();
