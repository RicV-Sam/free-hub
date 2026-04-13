(function (global) {
  const SITE_ORIGIN = "https://freehub.datacost.co.za";
  const CANONICAL_ORIGIN = SITE_ORIGIN;
  const BASE_PATH = "";
  const HOME_ROUTE = "/";
  const CLOSING_SOON_DAYS = 3;
  const ENDING_SOON_TAG_DAYS = 7;
  const DEFAULT_OG_IMAGE =
    "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80";
  const CATEGORY_COPY = {
    cash: {
      category: "Cash",
      title: "Free Cash Competitions South Africa | Win Money Online",
      description:
        "Browse free cash competitions in South Africa and discover live giveaways you can enter online today.",
      heading: "Free Cash Competitions You Can Enter Today",
      intro:
        "Browse the latest free-entry cash competitions in South Africa and stand a chance to win real money prizes without paying to enter. From everyday giveaways to bigger seasonal draws, this page helps you spot legit opportunities quickly.",
      support:
        "Free competitions are a big part of the South African prize space, but many offers expire fast or bury the entry rules. This page keeps the focus on no-cost cash competitions so you can browse with more confidence.",
    },
    cars: {
      category: "Cars",
      title: "Free Car Competitions South Africa | Win Cars Online",
      description:
        "Browse free car competitions in South Africa and find the latest online giveaways for vehicles and driving bundles.",
      heading: "Free Car Competitions You Can Enter Today",
      intro:
        "Explore free-entry car competitions in South Africa and find no-cost chances to win everything from compact cars to family SUVs. If you want bigger lifestyle prizes without buying a ticket, this page keeps the strongest options in one place.",
      support:
        "Vehicle giveaways attract a lot of attention in South Africa, especially when trusted brands or retail partners are involved. We highlight free-to-enter car competitions so you can compare current opportunities without digging through clutter.",
    },
    holidays: {
      category: "Holidays",
      title: "Free Holiday Competitions South Africa | Win Trips Online",
      description:
        "Browse free holiday competitions in South Africa and discover online travel giveaways for breaks, escapes, and getaways.",
      heading: "Free Holiday Competitions You Can Enter Today",
      intro:
        "Find free-entry holiday competitions in South Africa and discover no-cost chances to win local getaways, beach escapes, and travel prizes. It is a simple way to browse trip giveaways without wasting time on paid entries.",
      support:
        "Travel competitions are popular with South African audiences because they combine accessible entry with high perceived value. This page filters the noise and keeps the focus on free holiday opportunities worth checking today.",
    },
    tech: {
      category: "Tech",
      title: "Free Tech Competitions South Africa | Win Gadgets Online",
      description:
        "Browse free tech competitions in South Africa and find online giveaways for gadgets, devices, and smart-home prizes.",
      heading: "Free Tech Competitions You Can Enter Today",
      intro:
        "Check the latest free-entry tech competitions in South Africa and enter for gadgets, smart devices, and electronics at no cost. Whether the prize is a bundle or a single standout device, this page helps you find current offers faster.",
      support:
        "Electronics giveaways consistently perform well in South Africa, especially when mobile, streaming, or home tech brands are attached. This page focuses on verified free-entry tech competitions so you can browse active options without extra friction.",
    },
    vouchers: {
      category: "Vouchers",
      title: "Free Voucher Competitions South Africa | Win Shopping Vouchers",
      description:
        "Browse free voucher competitions in South Africa and discover online giveaways for shopping and supermarket vouchers.",
      heading: "Free Voucher Competitions You Can Enter Today",
      intro:
        "Browse free-entry voucher competitions in South Africa and enter for shopping credit, grocery rewards, and everyday savings without paying anything upfront. These no-cost competitions are useful if you want practical prizes that stretch further.",
      support:
        "Voucher giveaways are especially relevant in South Africa because they are easy to use and often linked to familiar brands. This page keeps the listings focused on genuine free-entry offers so you can move quickly when new prizes appear.",
    },
  };
  const DEFAULT_COPY = {
    title: "Free Competitions South Africa | Win Cars, Cash & Holidays",
    description:
      "Browse free competitions in South Africa with live categories, search, and fast access to offers for cars, cash, holidays, tech, and vouchers.",
    heading: "Win Cars, Cash, Holidays and Vouchers in South Africa",
    intro:
      "Browse free competitions from trusted brands. Updated regularly with new giveaways, prize draws and promotions.",
    canonical: `${CANONICAL_ORIGIN}/`,
  };
  const TAG_COPY = {
    "free-entry": {
      title: "Free Entry Competitions South Africa",
      description:
        "Browse free entry competitions in South Africa and discover giveaways you can enter online without paid tickets.",
      heading: "Free Entry Competitions You Can Enter Today",
      intro:
        "Browse free-entry competitions in South Africa and discover no-cost chances to win cash, vouchers, electronics, and more. This page is built for people who want legit competitions without paying for tickets or hidden extras.",
      support:
        "Free-entry competitions are popular across South Africa because they are accessible, quick to enter, and often backed by familiar consumer brands. We keep the focus on no-cost listings so you can browse practical opportunities without second-guessing the entry rules.",
    },
    "ending-soon": {
      title: "Competitions Ending Soon South Africa",
      description:
        "Browse competitions ending soon in South Africa and enter before the closing dates pass.",
      heading: "Competitions Ending Soon You Should Enter Today",
      intro:
        "Do not miss out on free-entry competitions in South Africa that are closing soon. These no-cost giveaways are nearing their deadlines, so this page helps you act quickly before the best opportunities disappear.",
      support:
        "South African competition listings move fast, especially when popular brands or bigger prizes are involved. This page brings together competitions with near-term closing dates so you can prioritise urgent entries first.",
    },
    "high-value": {
      title: "High Value Competitions South Africa",
      description:
        "Browse high value competitions in South Africa featuring cash prizes, car giveaways, holidays, and premium offers.",
      heading: "High Value Competitions You Can Enter Today",
      intro:
        "Explore high-value free-entry competitions in South Africa featuring bigger prizes like cash, cars, holidays, and electronics. If you are chasing standout rewards without paying to participate, this page is where the strongest draws come together.",
      support:
        "Large-prize competitions attract serious interest in South Africa, particularly when the reward feels life-changing or highly practical. This page helps you separate the most valuable no-cost opportunities from lighter everyday giveaways.",
    },
  };
  const THIN_PAGE_TIPS = [
    "Enter daily competitions regularly to build more chances over time.",
    "Focus on lower-profile competitions where fewer people are likely to enter.",
    "Check closing dates carefully so you do not miss last-minute deadlines.",
    "Follow South African brands on social media to spot fresh giveaways early.",
  ];
  const CATEGORY_SLUGS = Object.keys(CATEGORY_COPY);
  const TAG_SLUGS = Object.keys(TAG_COPY);

  function normalizePath(pathname) {
    const trimmed = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;

    if (!trimmed || trimmed === BASE_PATH) {
      return HOME_ROUTE;
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
    return `/competition/${getCompetitionSlug(competition)}`;
  }

  function getCompetitionAbsoluteUrl(competition) {
    return `${SITE_ORIGIN}${getCompetitionPath(competition)}`;
  }

  function getOutPath(competition) {
    return `/out/${getCompetitionSlug(competition)}`;
  }

  function buildCompetitionDescription(competition) {
    if (competition.summary) {
      return competition.summary;
    }

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

  function getDaysUntilClosing(dateString) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const closingDate = new Date(dateString);
    closingDate.setHours(0, 0, 0, 0);

    return Math.ceil((closingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  function getUrgencyLabel(dateString) {
    const daysLeft = getDaysUntilClosing(dateString);

    if (daysLeft < 0) {
      return "Closed";
    }

    if (daysLeft === 0) {
      return "Ends today";
    }

    if (daysLeft === 1) {
      return "Ends in 1 day";
    }

    return `Ends in ${daysLeft} days`;
  }

  function getEntryMethodLabel(entryType) {
    const normalized = String(entryType || "").toLowerCase();

    if (normalized.includes("app")) return "App";
    if (normalized.includes("sms")) return "SMS";
    if (normalized.includes("in-store")) return "In-store";
    if (normalized.includes("social")) return "Social";
    if (normalized.includes("survey") || normalized.includes("form")) return "Online";
    if (normalized.includes("free")) return "Online";
    if (normalized.includes("online")) return "Online";

    return entryType || "Online";
  }

  function getPrizeCue(competition) {
    const titleAndSummary = [competition.title, competition.summary || ""].join(" ");
    const amountMatch = titleAndSummary.match(/\bR\s?\d{1,3}(?:[,\s]?\d{3})*(?:\.\d+)?\b/);

    if (amountMatch) {
      return amountMatch[0].replace(/\s+/g, " ").trim();
    }

    const lower = titleAndSummary.toLowerCase();

    if (/\b(iphone|ipad|samsung|macbook|laptop|tv|tech|gadget|xbox|gopro|airpods|dashcam|power bank)\b/.test(lower)) {
      return "Tech prize";
    }

    if (/\b(cash|cashback|money)\b/.test(lower)) {
      return "Cash prize";
    }

    if (/\b(mauritius|zanzibar|holiday|getaway|trip|cruise|escape|safari)\b/.test(lower)) {
      return "Holiday prize";
    }

    if (/\b(voucher|gift card|shopping)\b/.test(lower)) {
      return "Voucher prize";
    }

    if (/\b(car|toyota|hyundai|starlet|suv|swift|corolla|hilux)\b/.test(lower)) {
      return "Car prize";
    }

    if (competition.isHighValue) {
      return "High-value prize";
    }

    return "Verified prize";
  }

  function isHighValueCompetition(competition) {
    if (typeof competition.isHighValue === "boolean") {
      return competition.isHighValue;
    }

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
    return competitions.filter((competition) => {
      if (Array.isArray(competition.tags) && competition.tags.includes(tag)) {
        return true;
      }

      if (tag === "ending-soon" && typeof competition.isEndingSoon === "boolean") {
        return competition.isEndingSoon;
      }

      if (tag === "high-value" && typeof competition.isHighValue === "boolean") {
        return competition.isHighValue;
      }

      switch (tag) {
        case "free-entry":
          return competition.entryType.toLowerCase().includes("free");
        case "ending-soon":
          return isClosingWithinDays(competition.closingDate, ENDING_SOON_TAG_DAYS);
        case "high-value":
          return isHighValueCompetition(competition);
        default:
          return false;
      }
    });
  }

  function getCategoryRoute(category) {
    if (category === "All") {
      return HOME_ROUTE;
    }

    const slug = CATEGORY_SLUGS.find((key) => CATEGORY_COPY[key].category === category);

    return slug ? `/category/${slug}` : HOME_ROUTE;
  }

  function getRouteContext(pathname) {
    const path = normalizePath(pathname);

    if (path === HOME_ROUTE) {
      return { type: "home", slug: null, path: HOME_ROUTE };
    }

    const categoryMatch = path.match(/^\/category\/([a-z0-9-]+)$/);

    if (categoryMatch && CATEGORY_COPY[categoryMatch[1]]) {
      return {
        type: "category",
        slug: categoryMatch[1],
        path: `/category/${categoryMatch[1]}/`,
      };
    }

    const tagMatch = path.match(/^\/tag\/([a-z0-9-]+)$/);

    if (tagMatch && TAG_COPY[tagMatch[1]]) {
      return {
        type: "tag",
        slug: tagMatch[1],
        path: `/tag/${tagMatch[1]}/`,
      };
    }

    const competitionMatch = path.match(/^\/competition\/([a-z0-9-]+)$/);

    if (competitionMatch) {
      return {
        type: "competition",
        slug: competitionMatch[1],
        path: `/competition/${competitionMatch[1]}/`,
      };
    }

    return { type: "unknown", slug: null, path };
  }

  function getPageCopy(routeContext) {
    if (routeContext.type === "category") {
      const copy = CATEGORY_COPY[routeContext.slug];
      return {
        title: copy.title,
        description: copy.description,
        heading: copy.heading,
        intro: copy.intro,
        canonical: `${CANONICAL_ORIGIN}/category/${routeContext.slug}/`,
      };
    }

    if (routeContext.type === "tag") {
      const copy = TAG_COPY[routeContext.slug];
      return {
        title: copy.title,
        description: copy.description,
        heading: copy.heading,
        intro: copy.intro,
        canonical: `${CANONICAL_ORIGIN}/tag/${routeContext.slug}/`,
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
      { type: "home", slug: "", path: HOME_ROUTE },
      ...CATEGORY_SLUGS.map((slug) => ({ type: "category", slug, path: `/category/${slug}/` })),
      ...TAG_SLUGS.map((slug) => ({ type: "tag", slug, path: `/tag/${slug}/` })),
    ];
  }

  function getPageSupportCopy(routeContext) {
    if (routeContext.type === "category") {
      return CATEGORY_COPY[routeContext.slug].support;
    }

    if (routeContext.type === "tag") {
      return TAG_COPY[routeContext.slug].support;
    }

    return "";
  }

  function shouldShowThinPageTips(competitions) {
    return competitions.length > 0 && competitions.length < 5;
  }

  const api = {
    BASE_PATH,
    SITE_ORIGIN,
    CANONICAL_ORIGIN,
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
    getOutPath,
    buildCompetitionDescription,
    isClosingSoon,
    isClosingWithinDays,
    getDaysUntilClosing,
    getUrgencyLabel,
    getEntryMethodLabel,
    getPrizeCue,
    isHighValueCompetition,
    sortCompetitions,
    getTagFilteredCompetitions,
    getCategoryRoute,
    getRouteContext,
    getPageCopy,
    getPageSupportCopy,
    filterCompetitionsByRoute,
    buildStructuredData,
    getAllStaticRouteContexts,
    THIN_PAGE_TIPS,
    shouldShowThinPageTips,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  global.FreeHubShared = api;
})(typeof window !== "undefined" ? window : globalThis);
