(function (global) {
  const SITE_ORIGIN = "https://freehub.co.za";
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
      title: "Free Car Competitions South Africa | Current Car Competitions",
      description:
        "Browse current car competitions in South Africa, including free car competitions and test-drive giveaways you can enter today.",
      heading: "Current Free Car Competitions in South Africa",
      intro:
        "Looking for current car competitions in South Africa? Explore free car competitions, win-a-car promotions, and test-drive entries in one place so you can enter faster and miss fewer closing dates.",
      support:
        "Vehicle giveaways attract a lot of attention in South Africa, especially when trusted brands or retail partners are involved. We highlight free-to-enter car competitions and current car competitions so you can compare opportunities without digging through clutter.",
    },
    holidays: {
      category: "Holidays",
      title: "Win a Holiday South Africa | Holiday Giveaway Competitions",
      description:
        "Browse holiday giveaway competitions and win-a-holiday South Africa opportunities, including local getaway competitions and travel prizes.",
      heading: "Win a Holiday in South Africa",
      intro:
        "Find holiday giveaway listings, local getaway competitions, and free-entry travel prizes. If you want to win a holiday in South Africa, this page helps you compare active offers quickly.",
      support:
        "Travel competitions are popular with South African audiences because they combine accessible entry with high perceived value. This page filters the noise and keeps the focus on holiday giveaway opportunities worth checking today.",
    },
    tech: {
      category: "Tech",
      title: "Tech Giveaways South Africa | Gadget & Smartphone Competitions",
      description:
        "Browse tech giveaways in South Africa, including gadget giveaway and smartphone competition opportunities you can enter online.",
      heading: "Tech Giveaways and Smartphone Competitions",
      intro:
        "Check the latest gadget giveaway and smartphone competition listings in South Africa. From electronics bundles to flagship devices, this page keeps active tech giveaways in one place.",
      support:
        "Electronics giveaways consistently perform well in South Africa, especially when mobile, streaming, or home tech brands are attached. This page focuses on verified tech giveaways so you can browse active options without extra friction.",
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
    title: "Free Competitions South Africa | Current Car, Holiday & Cash Giveaways",
    description:
      "Browse free competitions South Africa users are searching for, including current car competitions, holiday giveaways, cash prizes, tech offers, and vouchers.",
    heading: "Today's Live Competitions in South Africa",
    intro:
      "FreeHub lists vouchers, prizes, cash giveaways and competitions from trusted South African brands so you can find offers worth opening today.",
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
  const CATEGORY_FALLBACK_STYLES = {
    Cash: { start: "#0f766e", end: "#14b8a6", accent: "#99f6e4" },
    Cars: { start: "#1d4ed8", end: "#60a5fa", accent: "#dbeafe" },
    Holidays: { start: "#c2410c", end: "#fb923c", accent: "#ffedd5" },
    Tech: { start: "#4338ca", end: "#818cf8", accent: "#e0e7ff" },
    Vouchers: { start: "#be123c", end: "#fb7185", accent: "#ffe4e6" },
  };

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
    return `${SITE_ORIGIN}${getCompetitionPath(competition)}/`;
  }

  function getCompetitionImageUrl(competition) {
    return competition.image || buildBrandFallbackImage(competition);
  }

  function buildBrandFallbackImage(competition) {
    const brand = String(competition.brand || "Official promotion").trim();
    const category = competition.category || "Competition";
    const styles = CATEGORY_FALLBACK_STYLES[category] || {
      start: "#1f2937",
      end: "#4b5563",
      accent: "#f3f4f6",
    };
    const brandLines = splitBrandLines(brand);
    const categoryLabel = category.toUpperCase();
    const brandInitial = brand.replace(/[^A-Za-z0-9]/g, "").charAt(0).toUpperCase() || "F";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(
      `${brand} ${category} competition`
    )}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${styles.start}" />
      <stop offset="100%" stop-color="${styles.end}" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  <circle cx="970" cy="145" r="170" fill="${styles.accent}" fill-opacity="0.12" />
  <circle cx="1080" cy="520" r="190" fill="${styles.accent}" fill-opacity="0.14" />
  <rect x="72" y="72" width="160" height="160" rx="32" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.26)" />
  <text x="152" y="176" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="88" font-weight="700" fill="#ffffff">${escapeXml(
      brandInitial
    )}</text>
  <text x="72" y="312" font-family="Arial, Helvetica, sans-serif" font-size="28" letter-spacing="6" fill="rgba(255,255,255,0.76)">${escapeXml(
      categoryLabel
    )}</text>
  <text x="72" y="408" font-family="Arial, Helvetica, sans-serif" font-size="76" font-weight="700" fill="#ffffff">${escapeXml(
      brandLines[0]
    )}</text>
  <text x="72" y="492" font-family="Arial, Helvetica, sans-serif" font-size="76" font-weight="700" fill="#ffffff">${escapeXml(
      brandLines[1]
    )}</text>
  <text x="72" y="562" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="rgba(255,255,255,0.9)">FreeHub competition listing</text>
</svg>`;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function splitBrandLines(brand) {
    const words = brand.split(/\s+/).filter(Boolean);

    if (words.length <= 2) {
      return [brand, ""];
    }

    const midpoint = Math.ceil(words.length / 2);
    return [words.slice(0, midpoint).join(" "), words.slice(midpoint).join(" ")];
  }

  function escapeXml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
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

  function getUrgencyBadgeLabel(dateString) {
    const daysLeft = getDaysUntilClosing(dateString);

    if (daysLeft < 0) {
      return "Closed";
    }

    if (daysLeft === 0) {
      return "Last day";
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

  function getPrimaryPrizeText(competition) {
    const text = [competition.title, competition.summary || ""].join(" ");
    const amountMatch = text.match(/\bR\s?\d{1,3}(?:[,\s]?\d{3})*(?:\.\d+)?\b/);

    if (amountMatch) {
      return amountMatch[0].replace(/\s+/g, " ").trim();
    }

    const phrasePatterns = [
      /\b(Toyota [A-Z][A-Za-z0-9+\- ]{1,24})\b/,
      /\b(Hyundai [A-Z][A-Za-z0-9+\- ]{1,24})\b/,
      /\b(Suzuki [A-Z][A-Za-z0-9+\- ]{1,24})\b/,
      /\b(Volkswagen [A-Z][A-Za-z0-9+\- ]{1,24})\b/,
      /\b(BMW [A-Z][A-Za-z0-9+\- ]{1,24})\b/,
      /\b(Mercedes-Benz [A-Z][A-Za-z0-9+\- ]{1,24})\b/,
      /\b(Kia [A-Z][A-Za-z0-9+\- ]{1,24})\b/,
      /\b(Nissan [A-Z][A-Za-z0-9+\- ]{1,24})\b/,
      /\b(Ford [A-Z][A-Za-z0-9+\- ]{1,24})\b/,
      /\b(Mauritius Holiday)\b/i,
      /\b(Zanzibar (?:Holiday|Getaway))\b/i,
      /\b(Victoria Falls (?:trip|getaway))\b/i,
      /\b(Drakensberg (?:stay|escape|getaway))\b/i,
      /\b(Cape Town (?:weekend|getaway|escape))\b/i,
      /\b(Kruger (?:safari|escape|getaway))\b/i,
      /\b(Sun City (?:holiday|break|getaway))\b/i,
      /\b(iPhone ?\d+)\b/i,
      /\b(Samsung Galaxy [A-Z0-9+ ]+)\b/i,
      /\b(MacBook Air)\b/i,
      /\b(iPad Air?)\b/i,
      /\b(Xbox Series X)\b/i,
      /\b(GoPro HERO)\b/i,
    ];

    for (const pattern of phrasePatterns) {
      const match = text.match(pattern);

      if (match) {
        return match[1].trim();
      }
    }

    switch (competition.category) {
      case "Cash":
        return "Cash prize";
      case "Cars":
        return "Car prize";
      case "Holidays":
        return "Holiday";
      case "Vouchers":
        return "Shopping vouchers";
      case "Tech":
        return "Tech prize";
      default:
        return "Prize";
    }
  }

  function getCardHeadline(competition) {
    const prizeText = getPrimaryPrizeText(competition);

    if (/^R\s?\d/i.test(prizeText)) {
      return `Win ${prizeText} Cash`;
    }

    if (/\b(Car prize|Holiday|Holiday prize|Cash prize|Voucher prize|Shopping vouchers|Tech prize|Prize)\b/i.test(prizeText)) {
      switch (competition.category) {
        case "Cash":
          return "Win Cash Prizes";
        case "Cars":
          return "Win a Car";
        case "Holidays":
          return "Win a Holiday";
        case "Vouchers":
          return "Win Shopping Vouchers";
        case "Tech":
          return "Win Tech Prizes";
        default:
          return `Win ${prizeText}`;
      }
    }

    if (/vouchers?/i.test(prizeText)) {
      return `Win ${prizeText}`;
    }

    if (/holiday|getaway|escape|trip|safari/i.test(prizeText)) {
      return `Win a ${prizeText}`;
    }

    if (/car|toyota|hyundai|suzuki|volkswagen|bmw|mercedes|kia|nissan|ford/i.test(prizeText)) {
      return `Win a ${prizeText}`;
    }

    return `Win ${prizeText}`;
  }

  function getEntryCostLabel(competition) {
    const tags = Array.isArray(competition.tags) ? competition.tags : [];

    if (tags.includes("purchase-required")) {
      return "Purchase required";
    }

    return "Free entry";
  }

  function getCardTagLabels(competition) {
    const tags = Array.isArray(competition.tags) ? competition.tags : [];
    const labels = new Set();
    const entryMethod = getEntryMethodLabel(competition.entryType);

    labels.add(getEntryCostLabel(competition));

    if (isHighValueCompetition(competition) || tags.includes("high-value")) {
      labels.add("High Value");
    }

    if (isClosingWithinDays(competition.closingDate, ENDING_SOON_TAG_DAYS) || tags.includes("ending-soon")) {
      labels.add("Ending Soon");
    }

    if (entryMethod === "App" || tags.includes("app")) {
      labels.add("App");
    }

    if (entryMethod === "SMS" || tags.includes("sms")) {
      labels.add("SMS");
    }

    if (tags.includes("purchase-required") || String(competition.entryType || "").toLowerCase().includes("purchase")) {
      labels.add("Purchase Required");
    }

    return Array.from(labels).slice(0, 5);
  }

  function shouldShowHotBadge(competition) {
    return isClosingSoon(competition.closingDate) || isHighValueCompetition(competition);
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
    getCompetitionImageUrl,
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
    getUrgencyBadgeLabel,
    getEntryMethodLabel,
    getPrizeCue,
    getPrimaryPrizeText,
    getCardHeadline,
    getEntryCostLabel,
    getCardTagLabels,
    shouldShowHotBadge,
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
