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
      title: "Win a Car Competitions in South Africa | Current Car Giveaways",
      description:
        "Browse verified win-a-car competitions in South Africa, including Toyota, Suzuki, Hyundai, Isuzu and Chery giveaways.",
      heading: "Win a Car Competitions in South Africa",
      intro:
        "Browse current South African car competitions, including Toyota, Suzuki, Hyundai, Isuzu and Chery giveaways. Some competitions have no separate entry fee, while others require a product purchase, store spend, match ticket or paid raffle ticket.",
      support:
        "Vehicle giveaways attract a lot of attention in South Africa, especially when trusted brands or retail partners are involved. We keep the entry cost, purchase requirement and official source visible so you can compare car competitions without guessing what is required.",
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
    "win-a-car": {
      title: "Win a Car Competitions South Africa",
      description:
        "Browse verified South African win-a-car competitions with official source links, closing dates and entry requirements.",
      heading: "Win a Car Competitions",
      intro:
        "Find current South African car giveaways with clear closing dates, entry channels, cost labels and promoter sources.",
      support:
        "Car competitions can involve free online forms, loyalty-card entries, store purchases, till slips, WhatsApp, USSD or paid tickets. We separate those requirements so the route to enter is clear.",
    },
    "purchase-required": {
      title: "Purchase Required Competitions South Africa",
      description:
        "Browse competitions that require a qualifying product purchase, store spend or till slip before entry.",
      heading: "Purchase Required Competitions",
      intro:
        "These competitions require a qualifying purchase or store spend before you can enter. Check the product, receipt and closing-date rules before taking part.",
      support:
        "A purchase-required competition is not the same as a simple free-entry draw. We label these listings separately so the cost and proof-of-purchase requirement are visible.",
    },
    "paid-entry": {
      title: "Paid Entry Competitions South Africa",
      description:
        "Browse South African competitions that require a paid ticket, raffle entry or similar paid participation.",
      heading: "Paid Entry Competitions",
      intro:
        "These competitions require a paid ticket or raffle-style entry. Review the official terms before buying an entry.",
      support:
        "Paid-entry competitions can still be legitimate, but they need clearer cost labelling than free or purchase-linked promotions.",
    },
    "online-entry": {
      title: "Online Entry Competitions South Africa",
      description:
        "Browse competitions you can enter through online forms, quizzes or promoter websites.",
      heading: "Online Entry Competitions",
      intro:
        "Find competitions with online forms, quizzes or website-based entry mechanics.",
      support:
        "Online-entry listings can be quick to enter, but the official source and eligibility rules still matter.",
    },
    "in-store-entry": {
      title: "In-store Entry Competitions South Africa",
      description:
        "Browse in-store competitions using till slips, loyalty cards, entry boxes or participating retailers.",
      heading: "In-store Entry Competitions",
      intro:
        "Find competitions that require an in-store action such as swiping a rewards card, keeping a till slip or using an entry box.",
      support:
        "In-store competitions often depend on participating branches, qualifying products and proof of purchase.",
    },
    "ussd-entry": {
      title: "USSD Competitions South Africa",
      description:
        "Browse South African competitions that support USSD entry from a mobile phone.",
      heading: "USSD Competitions",
      intro:
        "Find competitions that let you enter by dialling a USSD code from your phone.",
      support:
        "USSD competitions may have network or session charges, so always check the promoter's official terms.",
    },
    "whatsapp-entry": {
      title: "WhatsApp Competitions South Africa",
      description:
        "Browse competitions that support WhatsApp entry through official promoter numbers.",
      heading: "WhatsApp Competitions",
      intro:
        "Find competitions that let you submit an entry through WhatsApp prompts or official promoter numbers.",
      support:
        "WhatsApp entry can be convenient, but users should only use the number listed by the official promoter.",
    },
    toyota: {
      title: "Toyota Competitions South Africa",
      description:
        "Browse verified South African competitions with Toyota vehicle prizes.",
      heading: "Toyota Competitions",
      intro:
        "Find current South African competitions featuring Toyota vehicle prizes.",
      support:
        "Toyota prize pages are useful when several active campaigns use Toyota Vitz or Corolla Cross vehicles.",
    },
    suzuki: {
      title: "Suzuki Competitions South Africa",
      description:
        "Browse verified South African competitions with Suzuki vehicle prizes.",
      heading: "Suzuki Competitions",
      intro:
        "Find current South African competitions featuring Suzuki Swift prizes.",
      support:
        "Suzuki Swift giveaways often appear in product-purchase promotions, so we make the purchase and entry channel clear.",
    },
    hyundai: {
      title: "Hyundai Competitions South Africa",
      description:
        "Browse verified South African competitions with Hyundai vehicle prizes.",
      heading: "Hyundai Competitions",
      intro:
        "Find current South African competitions featuring Hyundai vehicle prizes.",
      support:
        "Hyundai car promotions can draw heavy interest, especially where national retailers are involved.",
    },
    isuzu: {
      title: "Isuzu Competitions South Africa",
      description:
        "Browse verified South African competitions with Isuzu vehicle prizes.",
      heading: "Isuzu Competitions",
      intro:
        "Find current South African competitions featuring Isuzu vehicle prizes.",
      support:
        "Isuzu vehicle prizes may require a valid driver's licence or nominated-driver details before handover.",
    },
    chery: {
      title: "Chery Competitions South Africa",
      description:
        "Browse verified South African competitions with Chery vehicle prizes.",
      heading: "Chery Competitions",
      intro:
        "Find current South African competitions featuring Chery vehicle prizes.",
      support:
        "Chery prize listings are only published when the closing date and official terms are clear.",
    },
    regional: {
      title: "Regional Competitions South Africa",
      description:
        "Browse competitions limited to specific South African regions, stores or participating branches.",
      heading: "Regional Competitions",
      intro:
        "Find competitions limited to specific stores, cities, provinces or participating branches.",
      support:
        "Regional competitions can be useful for local search, but users need branch and eligibility details before entering.",
    },
  };
  const HUB_COPY = {
    competitions: {
      title: "Competitions South Africa – Live Giveaways & Prize Draws | Freehub",
      description:
        "Browse live South African competitions, giveaways and prize draws. Find car, cash, voucher, tech and holiday competitions with clear entry rules and official source links.",
      heading: "Live Competitions in South Africa",
      intro:
        "Freehub lists live competitions from South African brands and promoters so you can compare prizes, closing dates, entry costs and official source links before you click through.",
      support:
        "Freehub does not run these competitions or collect entries. Always confirm the latest terms and deadlines on the official promoter page before entering.",
    },
    "win-a-car": {
      title: "Win a Car in South Africa – Live Car Competitions | Freehub",
      description:
        "Find live win-a-car competitions in South Africa. Compare car prizes, entry costs, purchase requirements, closing dates and official promoter links.",
      heading: "Win a Car Competitions in South Africa",
      intro:
        "Browse current South African car competitions. Some are free-entry, some need a qualifying purchase, and others use paid tickets. Compare the entry cost and source details before entering.",
      support:
        "Check official terms, driver’s licence requirements, qualifying purchase rules and closing dates on the promoter page. Freehub lists the competition and links you to the promoter.",
    },
    "free-competitions": {
      title: "Free Competitions South Africa – No Purchase Entry Giveaways | Freehub",
      description:
        "Browse free-entry competitions in South Africa. Find giveaways that do not require a purchase or paid ticket, with official source links and closing dates.",
      heading: "Free Competitions in South Africa",
      intro:
        "This page is for strict free-entry listings only: no required product purchase and no paid ticket. Use it to find no-purchase giveaways with clear source links and deadlines.",
      support:
        "Free-entry means no required spend and no paid entry ticket. Some offers may still require online access or account steps on the promoter page.",
    },
    "competitions-ending-soon": {
      title: "Competitions Ending Soon in South Africa | Freehub",
      description:
        "Find South African competitions closing soon. Browse live giveaways by closing date and enter through official promoter pages before deadlines pass.",
      heading: "Competitions Ending Soon in South Africa",
      intro:
        "These active listings are approaching their closing dates. Prioritise entries with the nearest deadlines first and confirm the latest closing time on the official source page.",
      support:
        "Competition deadlines can change. Always check the promoter’s current deadline and terms before entering.",
    },
    "purchase-required-competitions": {
      title: "Purchase Required Competitions South Africa | Freehub",
      description:
        "Browse South African competitions that require a qualifying purchase, receipt, rewards card or minimum spend. Check entry rules and official source links before entering.",
      heading: "Purchase Required Competitions in South Africa",
      intro:
        "These competitions require a qualifying purchase, receipt, loyalty-card action, code or minimum spend before entry. Review the requirements before taking part.",
      support:
        "Purchase-required competitions are not free-entry listings. Check qualifying products, participating stores, minimum spend and promoter terms before entering.",
    },
    "paid-entry-competitions": {
      title: "Paid Entry Competitions South Africa | Freehub",
      description:
        "Browse South African competitions that require a paid ticket or paid entry. Check the cost, official promoter and terms before entering.",
      heading: "Paid Entry Competitions in South Africa",
      intro:
        "These listings require a paid ticket or paid entry flow. Compare the prize, fee and source details before paying.",
      support:
        "Only pay through the official promoter or official ticketing route. Freehub does not process payments or sell entries.",
    },
  };
  const BRAND_PAGE_MIN_COMPETITIONS = 3;
  const BRAND_INDEX_COPY = {
    title: "Competition Brands South Africa | Freehub",
    description:
      "Browse South African competition brands with enough active listings on Freehub. Find current giveaways by brand, closing date and official source link.",
    heading: "Competition Brands in South Africa",
    intro:
      "Use this brand index to find South African competition promoters with multiple active listings on Freehub.",
    support:
      "Freehub lists brand competition pages only when there are enough active published listings to make the page useful. Always check the official promoter page before entering.",
    canonical: `${CANONICAL_ORIGIN}/brands/`,
  };
  const APPROVED_BRAND_PAGES = {
    "cell-c": {
      brand: "Cell C",
      title: "Cell C Competitions South Africa | Freehub",
      description:
        "Browse active Cell C competitions in South Africa. Compare prizes, closing dates, entry costs and official source links before entering.",
      heading: "Cell C Competitions",
      intro:
        "Find active Cell C competitions listed on Freehub, including telecom, voucher and cash-style promotions where enough entry information is available.",
      support:
        "Use the official Cell C source link on each listing to confirm current entry rules, costs and closing dates.",
    },
    clicks: {
      brand: "Clicks",
      title: "Clicks Competitions South Africa | Freehub",
      description:
        "Browse active Clicks competitions in South Africa with clear entry requirements, closing dates and official source links.",
      heading: "Clicks Competitions",
      intro:
        "Find current Clicks competitions and ClubCard-style promotions listed on Freehub.",
      support:
        "Clicks promotions can involve products, ClubCard details or app actions, so confirm the official terms before entering.",
    },
    fnb: {
      brand: "FNB",
      title: "FNB Competitions South Africa | Freehub",
      description:
        "Browse active FNB competitions in South Africa. Check entry rules, closing dates and official source links before entering.",
      heading: "FNB Competitions",
      intro:
        "Find active FNB competitions and rewards-linked promotions listed on Freehub.",
      support:
        "Bank and rewards promotions can include qualifying account or payment requirements, so read the official FNB terms before entering.",
    },
    game: {
      brand: "Game",
      title: "Game Competitions South Africa | Freehub",
      description:
        "Browse active Game competitions in South Africa, including tech, retail and voucher promotions with official source links.",
      heading: "Game Competitions",
      intro:
        "Find current Game competitions and retail giveaways listed on Freehub.",
      support:
        "Retail competitions may require a purchase, receipt or loyalty action. Check the official Game source before entering.",
    },
    makro: {
      brand: "Makro",
      title: "Makro Competitions South Africa | Freehub",
      description:
        "Browse active Makro competitions in South Africa with prizes, entry requirements, closing dates and official source links.",
      heading: "Makro Competitions",
      intro:
        "Find current Makro competitions, rewards promotions and retail giveaways listed on Freehub.",
      support:
        "Makro promotions can involve qualifying products or rewards details, so confirm the official terms before entering.",
    },
    travelstart: {
      brand: "Travelstart",
      title: "Travelstart Competitions South Africa | Freehub",
      description:
        "Browse active Travelstart competitions in South Africa, including travel giveaways and holiday-style prize draws.",
      heading: "Travelstart Competitions",
      intro:
        "Find current Travelstart competitions and travel prize opportunities listed on Freehub.",
      support:
        "Travel competitions can include booking, eligibility or date restrictions. Check the official promoter page before entering.",
    },
    vodacom: {
      brand: "Vodacom",
      title: "Vodacom Competitions South Africa | Freehub",
      description:
        "Browse active Vodacom competitions in South Africa. Compare telecom prizes, entry requirements, closing dates and official source links.",
      heading: "Vodacom Competitions",
      intro:
        "Find active Vodacom competitions and recharge or rewards-linked promotions listed on Freehub.",
      support:
        "Telecom competitions can involve recharge, app, SMS or rewards mechanics, so confirm the official Vodacom terms before entering.",
    },
  };
  const BRAND_PAGE_SLUGS = Object.keys(APPROVED_BRAND_PAGES);
  const THIN_PAGE_TIPS = [
    "Enter daily competitions regularly to build more chances over time.",
    "Focus on lower-profile competitions where fewer people are likely to enter.",
    "Check closing dates carefully so you do not miss last-minute deadlines.",
    "Follow South African brands on social media to spot fresh giveaways early.",
  ];
  const CATEGORY_SLUGS = Object.keys(CATEGORY_COPY);
  const TAG_SLUGS = Object.keys(TAG_COPY);
  const HUB_SLUGS = Object.keys(HUB_COPY);
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
    return `/competition/${getCompetitionSlug(competition)}/`;
  }

  function getCompetitionAbsoluteUrl(competition) {
    return `${SITE_ORIGIN}${getCompetitionPath(competition)}`;
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
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" role="img" aria-label="${escapeXml(
      `${brand} ${category} competition`
    )}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${styles.start}" />
      <stop offset="100%" stop-color="${styles.end}" />
    </linearGradient>
  </defs>
  <rect width="1600" height="1000" fill="url(#bg)" />
  <circle cx="1280" cy="180" r="230" fill="${styles.accent}" fill-opacity="0.12" />
  <circle cx="1450" cy="820" r="260" fill="${styles.accent}" fill-opacity="0.14" />
  <rect x="88" y="88" width="190" height="190" rx="38" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.26)" />
  <text x="183" y="212" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="104" font-weight="700" fill="#ffffff">${escapeXml(
      brandInitial
    )}</text>
  <text x="88" y="400" font-family="Arial, Helvetica, sans-serif" font-size="34" letter-spacing="7" fill="rgba(255,255,255,0.76)">${escapeXml(
      categoryLabel
    )}</text>
  <text x="88" y="540" font-family="Arial, Helvetica, sans-serif" font-size="88" font-weight="700" fill="#ffffff">${escapeXml(
      brandLines[0]
    )}</text>
  <text x="88" y="640" font-family="Arial, Helvetica, sans-serif" font-size="88" font-weight="700" fill="#ffffff">${escapeXml(
      brandLines[1]
    )}</text>
  <text x="88" y="860" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="rgba(255,255,255,0.9)">FreeHub competition listing</text>
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
    if (normalized.includes("ussd")) return "USSD";
    if (normalized.includes("whatsapp")) return "WhatsApp";
    if (normalized.includes("qr")) return "QR";
    if (normalized.includes("ticket")) return "Ticket";
    if (normalized.includes("in-store")) return "In-store";
    if (normalized.includes("social")) return "Social";
    if (normalized.includes("survey") || normalized.includes("form")) return "Online";
    if (normalized.includes("free")) return "Online";
    if (normalized.includes("online")) return "Online";

    return entryType || "Online";
  }

  function getPrizeCue(competition) {
    const prizeType = normalizePrizeType(competition.prizeType);
    const prizeName = getPrizeName(competition);
    const prizeValue = formatRandAmount(competition.prizeValueAmount);

    if (prizeType === "cash" && prizeValue) {
      return `${prizeValue} cash`;
    }

    if (prizeType === "voucher" && prizeValue) {
      return `${prizeValue} voucher`;
    }

    if (prizeName) {
      return prizeName;
    }

    switch (prizeType) {
      case "car":
        return "Car prize";
      case "cash":
        return "Cash prize";
      case "voucher":
        return "Voucher prize";
      case "holiday":
        return "Holiday prize";
      case "tech":
        return "Tech prize";
      case "retail":
        return "Retail prize";
      case "food-drink":
        return "Food and drink prize";
      case "experience":
        return "Experience prize";
      default:
        return competition.isHighValue ? "High-value prize" : "Verified prize";
    }
  }

  function getPrimaryPrizeText(competition) {
    return getPrizeName(competition) || getPrizeCue(competition);
  }

  function getCardHeadline(competition) {
    const prizeName = getPrizeName(competition);
    const prizeType = normalizePrizeType(competition.prizeType);
    const prizeValue = formatRandAmount(competition.prizeValueAmount);

    if (prizeName) {
      return buildWinHeadline(prizeName, prizeType);
    }

    if (prizeType === "cash" && prizeValue) {
      return `Win ${prizeValue} Cash`;
    }

    if (prizeType === "voucher" && prizeValue) {
      return `Win ${prizeValue} in Vouchers`;
    }

    switch (prizeType) {
      case "car":
        return "Win a Car";
      case "cash":
        return "Win Cash Prizes";
      case "voucher":
        return "Win Shopping Vouchers";
      case "holiday":
        return "Win a Holiday";
      case "tech":
        return "Win Tech Prizes";
      case "retail":
        return "Win Retail Prizes";
      case "food-drink":
        return "Win Food and Drink Prizes";
      case "experience":
        return "Win an Experience";
      default:
        return "View Competition Details";
    }
  }

  function getEntryCostLabel(competition) {
    const tags = Array.isArray(competition.tags) ? competition.tags : [];
    const entryCostType = String(competition.entryCostType || "").toLowerCase();
    const entryFeeLabel = String(competition.entryFeeLabel || "").toLowerCase();
    const entryFeeAmount = Number(competition.entryFeeAmount);

    if (competition.purchaseRequired === true || entryCostType === "purchase-required") {
      return "Purchase required";
    }

    if (entryCostType === "paid-entry" || tags.includes("paid-entry") || entryFeeAmount > 0) {
      return "Paid entry";
    }

    if (entryCostType === "sms-rate" || tags.includes("standard-rates") || tags.includes("sms-entry")) {
      return "SMS/data rates may apply";
    }

    if (entryCostType === "app-required") {
      return "App required";
    }

    if (entryCostType === "unknown") {
      return "Entry requirements unclear";
    }

    if (
      entryFeeLabel.includes("ticket") ||
      entryFeeLabel.includes("paid") ||
      /^r\s?[1-9]/i.test(entryFeeLabel)
    ) {
      return "Paid entry";
    }

    return "Free entry";
  }

  function getPrizeName(competition) {
    return String(competition.prizeName || "").trim();
  }

  function normalizePrizeType(prizeType) {
    return String(prizeType || "").trim().toLowerCase();
  }

  function formatRandAmount(amount) {
    if (amount === undefined || amount === null || amount === "") {
      return "";
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount)) {
      return "";
    }

    return `R${new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 0 }).format(numericAmount)}`;
  }

  function buildWinHeadline(prizeName, prizeType) {
    if (/^win\b/i.test(prizeName)) {
      return prizeName;
    }

    if (/^(?:1|one|\d+)\s+of\b/i.test(prizeName)) {
      return `Win ${prizeName}`;
    }

    if (/^(shopping\s+)?vouchers?\b/i.test(prizeName)) {
      return `Win ${prizeName}`;
    }

    if (prizeType === "car" && !/^(a|an)\b/i.test(prizeName)) {
      const article = /^[aeiou]/i.test(prizeName) ? "an" : "a";
      return `Win ${article} ${prizeName}`;
    }

    if (prizeType === "holiday" && !/^(a|an)\b/i.test(prizeName)) {
      return `Win a ${prizeName}`;
    }

    return `Win ${prizeName}`;
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

    if (entryMethod === "USSD" || tags.includes("ussd-entry")) {
      labels.add("USSD");
    }

    if (entryMethod === "WhatsApp" || tags.includes("whatsapp-entry")) {
      labels.add("WhatsApp");
    }

    if (tags.includes("purchase-required") || competition.purchaseRequired === true) {
      labels.add("Purchase required");
    }

    return Array.from(labels).slice(0, 5);
  }

  function isPublishedCompetition(competition) {
    return competition && competition.verificationStatus === "published";
  }

  function getPublishedCompetitions(competitions) {
    return competitions.filter(isPublishedCompetition);
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
    return getPublishedCompetitions(competitions).filter((competition) => {
      if (tag === "ending-soon" && typeof competition.isEndingSoon === "boolean") {
        return competition.isEndingSoon;
      }

      if (tag === "high-value" && typeof competition.isHighValue === "boolean") {
        return competition.isHighValue;
      }

      switch (tag) {
        case "free-entry":
          return getEntryCostLabel(competition) === "Free entry";
        case "purchase-required":
          return competition.purchaseRequired === true;
        case "paid-entry":
          return getEntryCostLabel(competition) === "Paid entry";
        case "ending-soon":
          return isClosingWithinDays(competition.closingDate, ENDING_SOON_TAG_DAYS);
        case "high-value":
          return isHighValueCompetition(competition);
        default:
          return Array.isArray(competition.tags) && competition.tags.includes(tag);
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

    const hubMatch = path.match(/^\/([a-z0-9-]+)$/);

    if (hubMatch && HUB_COPY[hubMatch[1]]) {
      return {
        type: "hub",
        slug: hubMatch[1],
        path: `/${hubMatch[1]}/`,
      };
    }

    if (path === "/brands") {
      return { type: "brand-index", slug: "brands", path: "/brands/" };
    }

    const brandMatch = path.match(/^\/brand\/([a-z0-9-]+)$/);

    if (brandMatch && APPROVED_BRAND_PAGES[brandMatch[1]]) {
      return {
        type: "brand",
        slug: brandMatch[1],
        path: `/brand/${brandMatch[1]}/`,
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

    if (routeContext.type === "hub") {
      const copy = HUB_COPY[routeContext.slug];
      return {
        title: copy.title,
        description: copy.description,
        heading: copy.heading,
        intro: copy.intro,
        canonical: `${CANONICAL_ORIGIN}/${routeContext.slug}/`,
      };
    }

    if (routeContext.type === "brand-index") {
      return BRAND_INDEX_COPY;
    }

    if (routeContext.type === "brand") {
      const copy = APPROVED_BRAND_PAGES[routeContext.slug];
      return {
        title: copy.title,
        description: copy.description,
        heading: copy.heading,
        intro: copy.intro,
        canonical: `${CANONICAL_ORIGIN}/brand/${routeContext.slug}/`,
      };
    }

    return DEFAULT_COPY;
  }

  function filterCompetitionsByRoute(competitions, routeContext) {
    const publishedCompetitions = getPublishedCompetitions(competitions);

    if (routeContext.type === "category") {
      const targetCategory = CATEGORY_COPY[routeContext.slug].category;
      return publishedCompetitions.filter((competition) => competition.category === targetCategory);
    }

    if (routeContext.type === "tag") {
      return getTagFilteredCompetitions(publishedCompetitions, routeContext.slug);
    }

    if (routeContext.type === "hub") {
      return getHubFilteredCompetitions(publishedCompetitions, routeContext.slug);
    }

    if (routeContext.type === "brand") {
      return getBrandFilteredCompetitions(publishedCompetitions, routeContext.slug);
    }

    return publishedCompetitions;
  }

  function getHubFilteredCompetitions(competitions, slug) {
    const publishedCompetitions = getPublishedCompetitions(competitions);
    const sortedCompetitions = sortCompetitions(publishedCompetitions);

    if (slug === "competitions") {
      return sortedCompetitions;
    }

    if (slug === "win-a-car") {
      return sortedCompetitions.filter((competition) => {
        const tags = Array.isArray(competition.tags) ? competition.tags : [];
        return (
          competition.category === "Cars" ||
          tags.includes("win-a-car") ||
          normalizePrizeType(competition.prizeType) === "car"
        );
      });
    }

    if (slug === "free-competitions") {
      return sortedCompetitions.filter(isStrictFreeEntryCompetition);
    }

    if (slug === "competitions-ending-soon") {
      return sortedCompetitions.filter((competition) => {
        const tags = Array.isArray(competition.tags) ? competition.tags : [];
        return (
          isClosingWithinDays(competition.closingDate, ENDING_SOON_TAG_DAYS) ||
          competition.isEndingSoon === true ||
          tags.includes("ending-soon")
        );
      });
    }

    if (slug === "purchase-required-competitions") {
      return sortedCompetitions.filter((competition) => {
        const tags = Array.isArray(competition.tags) ? competition.tags : [];
        return (
          competition.purchaseRequired === true ||
          normalizeEntryCostType(competition.entryCostType) === "purchase-required" ||
          tags.includes("purchase-required")
        );
      });
    }

    if (slug === "paid-entry-competitions") {
      return sortedCompetitions.filter((competition) => {
        const tags = Array.isArray(competition.tags) ? competition.tags : [];
        return (
          normalizeEntryCostType(competition.entryCostType) === "paid-entry" ||
          tags.includes("paid-entry") ||
          Number(competition.entryFeeAmount) > 0
        );
      });
    }

    return sortedCompetitions;
  }

  function isStrictFreeEntryCompetition(competition) {
    const tags = Array.isArray(competition.tags) ? competition.tags : [];
    const entryCostType = normalizeEntryCostType(competition.entryCostType);
    const entryContext = [competition.entryType, competition.entryChannel, tags.join(" ")].join(" ").toLowerCase();

    if (competition.purchaseRequired === true) {
      return false;
    }

    if (entryCostType !== "free-entry") {
      return false;
    }

    if (tags.includes("purchase-required") || tags.includes("paid-entry")) {
      return false;
    }

    if (Number(competition.entryFeeAmount) > 0) {
      return false;
    }

    if (/sms|ussd/.test(entryContext)) {
      return false;
    }

    return getEntryCostLabel(competition) === "Free entry";
  }

  function normalizeEntryCostType(entryCostType) {
    return String(entryCostType || "").trim().toLowerCase();
  }

  function getBrandFilteredCompetitions(competitions, slug) {
    const brandPage = APPROVED_BRAND_PAGES[slug];

    if (!brandPage) {
      return [];
    }

    const targetBrand = brandPage.brand.toLowerCase();
    return sortCompetitions(getPublishedCompetitions(competitions)).filter(
      (competition) => String(competition.brand || "").trim().toLowerCase() === targetBrand
    );
  }

  function getGeneratedBrandPageDefinitions(competitions) {
    return BRAND_PAGE_SLUGS.map((slug) => {
      const definition = APPROVED_BRAND_PAGES[slug];
      const filteredCompetitions = getBrandFilteredCompetitions(competitions, slug);
      return {
        ...definition,
        slug,
        path: `/brand/${slug}/`,
        canonical: `${CANONICAL_ORIGIN}/brand/${slug}/`,
        competitionCount: filteredCompetitions.length,
      };
    }).filter((definition) => definition.competitionCount >= BRAND_PAGE_MIN_COMPETITIONS);
  }

  function getGeneratedBrandSlugs(competitions) {
    return getGeneratedBrandPageDefinitions(competitions).map((definition) => definition.slug);
  }

  function getBrandSlugForCompetition(competition, generatedBrandSlugs = BRAND_PAGE_SLUGS) {
    const brandName = String(competition.brand || "").trim().toLowerCase();

    return generatedBrandSlugs.find((slug) => {
      const definition = APPROVED_BRAND_PAGES[slug];
      return definition && definition.brand.toLowerCase() === brandName;
    });
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
      ...HUB_SLUGS.map((slug) => ({ type: "hub", slug, path: `/${slug}/` })),
      { type: "brand-index", slug: "brands", path: "/brands/" },
    ];
  }

  function getPageSupportCopy(routeContext) {
    if (routeContext.type === "category") {
      return CATEGORY_COPY[routeContext.slug].support;
    }

    if (routeContext.type === "tag") {
      return TAG_COPY[routeContext.slug].support;
    }

    if (routeContext.type === "hub") {
      return HUB_COPY[routeContext.slug].support;
    }

    if (routeContext.type === "brand-index") {
      return BRAND_INDEX_COPY.support;
    }

    if (routeContext.type === "brand") {
      return APPROVED_BRAND_PAGES[routeContext.slug].support;
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
    HUB_COPY,
    BRAND_INDEX_COPY,
    APPROVED_BRAND_PAGES,
    BRAND_PAGE_MIN_COMPETITIONS,
    CATEGORY_SLUGS,
    TAG_SLUGS,
    HUB_SLUGS,
    BRAND_PAGE_SLUGS,
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
    formatRandAmount,
    getCardTagLabels,
    isPublishedCompetition,
    getPublishedCompetitions,
    shouldShowHotBadge,
    isHighValueCompetition,
    sortCompetitions,
    getTagFilteredCompetitions,
    getHubFilteredCompetitions,
    getBrandFilteredCompetitions,
    getGeneratedBrandPageDefinitions,
    getGeneratedBrandSlugs,
    getBrandSlugForCompetition,
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
