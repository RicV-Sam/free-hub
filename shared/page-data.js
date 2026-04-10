(function (global) {
  const SITE_ORIGIN = "https://ricv-sam.github.io/free-hub";
  const BASE_PATH = "/free-hub";
  const HOME_ROUTE = `${BASE_PATH}/`;
  const CLOSING_SOON_DAYS = 3;
  const ENDING_SOON_TAG_DAYS = 7;
  const DEFAULT_OG_IMAGE =
    "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80";
  const CATEGORY_COPY = {
    cash: {
      category: "Cash",
      title: "Free Cash Competitions UK | Win Money Online",
      description:
        "Browse free cash competitions in the UK and discover live giveaways you can enter online today.",
      heading: "Free Cash Competitions You Can Enter Today",
      intro:
        "Explore free cash competitions and money giveaways with quick entry routes and regularly updated listings.",
    },
    cars: {
      category: "Cars",
      title: "Free Car Competitions UK | Win Cars Online",
      description:
        "Browse free car competitions in the UK and find the latest online giveaways for vehicles and driving bundles.",
      heading: "Free Car Competitions You Can Enter Today",
      intro:
        "Discover free car competitions featuring city cars, SUVs, and transport bundles in one simple listing page.",
    },
    holidays: {
      category: "Holidays",
      title: "Free Holiday Competitions UK | Win Trips Online",
      description:
        "Browse free holiday competitions in the UK and discover online travel giveaways for breaks, escapes, and getaways.",
      heading: "Free Holiday Competitions You Can Enter Today",
      intro:
        "Find free holiday competitions for beach escapes, spa breaks, and travel prizes without leaving the hub.",
    },
    tech: {
      category: "Tech",
      title: "Free Tech Competitions UK | Win Gadgets Online",
      description:
        "Browse free tech competitions in the UK and find online giveaways for gadgets, devices, and smart-home prizes.",
      heading: "Free Tech Competitions You Can Enter Today",
      intro:
        "Explore free tech competitions with gadget bundles and smart-home prizes in a fast category landing page.",
    },
    vouchers: {
      category: "Vouchers",
      title: "Free Voucher Competitions UK | Win Shopping Vouchers",
      description:
        "Browse free voucher competitions in the UK and discover online giveaways for shopping and supermarket vouchers.",
      heading: "Free Voucher Competitions You Can Enter Today",
      intro:
        "Browse free voucher competitions featuring shopping credit, supermarket rewards, and other everyday prize offers.",
    },
  };
  const DEFAULT_COPY = {
    title: "Free Competitions UK | Win Cars, Cash & Holidays",
    description:
      "Browse free competitions in the UK with live categories, search, and fast access to offers for cars, cash, holidays, tech, and vouchers.",
    heading: "Latest Free Competitions in the UK",
    intro:
      "Discover new free competitions for cars, cash, holidays, tech, and vouchers in one fast hub.",
    canonical: `${SITE_ORIGIN}/`,
  };
  const TAG_COPY = {
    "free-entry": {
      title: "Free Entry Competitions UK",
      description:
        "Browse free entry competitions in the UK and discover giveaways you can enter online without paid tickets.",
      heading: "Free Entry Competitions You Can Enter Today",
      intro:
        "Browse free entry competitions across cars, cash, holidays, tech, and vouchers in one lightweight hub.",
    },
    "ending-soon": {
      title: "Competitions Ending Soon UK",
      description:
        "Browse competitions ending soon in the UK and enter before the closing dates pass.",
      heading: "Competitions Ending Soon You Should Enter Today",
      intro: "Browse competitions ending soon and enter before they close.",
    },
    "high-value": {
      title: "High Value Competitions UK",
      description:
        "Browse high value competitions in the UK featuring cash prizes, car giveaways, holidays, and premium offers.",
      heading: "High Value Competitions You Can Enter Today",
      intro:
        "Explore high value competitions featuring stronger prize-led offers and premium giveaway categories.",
    },
    new: {
      title: "New Competitions UK",
      description:
        "Browse new competitions in the UK and discover the latest active giveaways added to the hub.",
      heading: "New Competitions You Can Enter Today",
      intro:
        "Discover the newest competitions in the hub based on the latest active opportunities and earliest upcoming closes.",
    },
  };
  const CATEGORY_SLUGS = Object.keys(CATEGORY_COPY);
  const TAG_SLUGS = Object.keys(TAG_COPY);

  function normalizePath(pathname) {
    const trimmed = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;

    if (trimmed === BASE_PATH) {
      return HOME_ROUTE.slice(0, -1);
    }

    return trimmed;
  }

  function formatDate(dateString) {
    const date = new Date(dateString);

    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  function getCompetitionSlug(competition) {
    if (competition.id) {
      return String(competition.id).toLowerCase();
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

  function isClosingWithinDays(dateString, days) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const closingDate = new Date(dateString);
    closingDate.setHours(0, 0, 0, 0);

    const diffInMs = closingDate.getTime() - today.getTime();
    const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

    return diffInDays >= 0 && diffInDays <= days;
  }

  function isClosingSoon(dateString) {
    return isClosingWithinDays(dateString, CLOSING_SOON_DAYS);
  }

  function isHighValueCompetition(competition) {
    const categoryPriority = ["Cash", "Cars", "Holidays"];
    const keywordPattern = /\b(cash|car|holiday|luxury|suv|bundle|escape|spa)\b/i;
    return categoryPriority.includes(competition.category) || keywordPattern.test(competition.title);
  }

  function sortCompetitions(competitions) {
    return competitions
      .slice()
      .sort((left, right) => new Date(left.closingDate) - new Date(right.closingDate));
  }

  function getTagFilteredCompetitions(competitions, tag) {
    switch (tag) {
      case "free-entry":
        return competitions;
      case "ending-soon":
        return competitions.filter((competition) =>
          isClosingWithinDays(competition.closingDate, ENDING_SOON_TAG_DAYS)
        );
      case "high-value":
        return competitions.filter((competition) => isHighValueCompetition(competition));
      case "new":
        return competitions.slice(0, 4);
      default:
        return competitions;
    }
  }

  function getCategoryRoute(category) {
    if (category === "All") {
      return `${BASE_PATH}/`;
    }

    const slug = CATEGORY_SLUGS.find((key) => CATEGORY_COPY[key].category === category);

    return slug ? `${BASE_PATH}/category/${slug}` : `${BASE_PATH}/`;
  }

  function getRouteContext(pathname) {
    const path = normalizePath(pathname);

    if (path === HOME_ROUTE.slice(0, -1) || path === "/") {
      return { type: "home", slug: null, path: `${BASE_PATH}/` };
    }

    const categoryMatch = path.match(/^\/free-hub\/category\/([a-z0-9-]+)$/);

    if (categoryMatch && CATEGORY_COPY[categoryMatch[1]]) {
      return {
        type: "category",
        slug: categoryMatch[1],
        path: `${BASE_PATH}/category/${categoryMatch[1]}/`,
      };
    }

    const tagMatch = path.match(/^\/free-hub\/tag\/([a-z0-9-]+)$/);

    if (tagMatch && TAG_COPY[tagMatch[1]]) {
      return {
        type: "tag",
        slug: tagMatch[1],
        path: `${BASE_PATH}/tag/${tagMatch[1]}/`,
      };
    }

    return { type: "home", slug: null, path: `${BASE_PATH}/` };
  }

  function getPageCopy(routeContext) {
    if (routeContext.type === "category") {
      const copy = CATEGORY_COPY[routeContext.slug];
      return {
        title: copy.title,
        description: copy.description,
        heading: copy.heading,
        intro: copy.intro,
        canonical: `${SITE_ORIGIN}/category/${routeContext.slug}/`,
      };
    }

    if (routeContext.type === "tag") {
      const copy = TAG_COPY[routeContext.slug];
      return {
        title: copy.title,
        description: copy.description,
        heading: copy.heading,
        intro: copy.intro,
        canonical: `${SITE_ORIGIN}/tag/${routeContext.slug}/`,
      };
    }

    return DEFAULT_COPY;
  }

  function filterCompetitionsByRoute(competitions, routeContext) {
    if (routeContext.type === "category") {
      const targetCategory = CATEGORY_COPY[routeContext.slug].category;
      return competitions.filter((competition) => competition.category === targetCategory);
    }

    if (routeContext.type === "tag") {
      return getTagFilteredCompetitions(competitions, routeContext.slug);
    }

    return competitions;
  }

  function buildStructuredData(competitions, routeContext) {
    const pageCopy = getPageCopy(routeContext);

    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: pageCopy.heading,
      itemListElement: competitions.map((competition, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: getCompetitionAbsoluteUrl(competition),
        name: competition.title,
        description: buildCompetitionDescription(competition),
        image: competition.image || undefined,
      })),
    };
  }

  function getAllStaticRouteContexts() {
    return [
      ...CATEGORY_SLUGS.map((slug) => ({ type: "category", slug, path: `${BASE_PATH}/category/${slug}/` })),
      ...TAG_SLUGS.map((slug) => ({ type: "tag", slug, path: `${BASE_PATH}/tag/${slug}/` })),
    ];
  }

  const api = {
    BASE_PATH,
    SITE_ORIGIN,
    HOME_ROUTE,
    DEFAULT_OG_IMAGE,
    CATEGORY_COPY,
    DEFAULT_COPY,
    TAG_COPY,
    CATEGORY_SLUGS,
    TAG_SLUGS,
    normalizePath,
    formatDate,
    getCompetitionSlug,
    getCompetitionPath,
    getCompetitionAbsoluteUrl,
    buildCompetitionDescription,
    isClosingSoon,
    isClosingWithinDays,
    isHighValueCompetition,
    sortCompetitions,
    getTagFilteredCompetitions,
    getCategoryRoute,
    getRouteContext,
    getPageCopy,
    filterCompetitionsByRoute,
    buildStructuredData,
    getAllStaticRouteContexts,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  global.FreeHubShared = api;
})(typeof window !== "undefined" ? window : globalThis);
