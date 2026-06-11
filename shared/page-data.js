(function (global) {
  const SITE_ORIGIN = "https://freehub.co.za";
  const CANONICAL_ORIGIN = SITE_ORIGIN;
  const BASE_PATH = "";
  const HOME_ROUTE = "/";
  const CLOSING_SOON_DAYS = 3;
  const ENDING_SOON_TAG_DAYS = 7;
  const DEFAULT_OG_IMAGE =
    "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80";
  const CATEGORY_FALLBACK_IMAGES = {
    Cars: "https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1600&q=80",
    Cash: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1600&q=80",
    Holidays: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
    Tech: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=80",
    Vouchers: "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1600&q=80",
    Sports: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1600&q=80",
    Lifestyle: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1600&q=80",
  };
  const BRAND_IMAGE_LOOKUP_KEYS = ["sourceDomain", "brand"];
  const CATEGORY_COPY = {
    cash: {
      category: "Cash",
      title: "Cash Competitions in South Africa | Win Money & Cash Prizes",
      description:
        "Find current South African cash competitions and money giveaways. Compare prizes, closing dates, entry costs and official promoter links before entering.",
      heading: "Cash Competitions in South Africa",
      intro:
        "This page lists current cash-prize competitions in South Africa, including money giveaways, cash draws, instant cash rewards and other published cash-category promotions. Some cash competitions are free to enter, while others may require a purchase, receipt, app, account, rewards card, WhatsApp entry, USSD entry or qualifying action. Freehub does not run these competitions or collect entries; use the official promoter links to enter.",
      support:
        "Cash competitions can be free entry, purchase-required, paid-entry, account-required, app-required, rewards-card, till-slip, WhatsApp, USSD, online or in-store promotions. If you searched for cash competitions South Africa, win cash prizes South Africa, win cash online South Africa, money competitions South Africa or cash giveaways South Africa, compare the promoter, cost label, entry method and official terms before entering.",
    },
    cars: {
      category: "Cars",
      title: "Win a Car Competitions South Africa | Current Car Giveaways",
      description:
        "Browse current win-a-car competitions in South Africa with clear closing dates, entry costs, purchase requirements and official source links.",
      heading: "Win a Car Competitions in South Africa",
      intro:
        "Browse current South African car competitions, including Toyota, Suzuki, Hyundai, Isuzu, Chery and other vehicle giveaways. Compare closing dates, entry costs, purchase requirements and official promoter links before you enter.",
      support:
        "Vehicle giveaways attract a lot of attention in South Africa, especially when trusted brands, retailers or product partners are involved. Check whether you need a purchase, till slip, rewards card, driver's licence or paid ticket before following the official source link.",
    },
    holidays: {
      category: "Holidays",
      title: "Holiday Competitions in South Africa | Win Trips, Getaways & Stays",
      description:
        "Find holiday, travel and getaway competitions in South Africa, including trips, hotel stays, accommodation vouchers and travel prizes. Updated with official entry links.",
      heading: "Holiday Competitions in South Africa",
      intro:
        "Looking for holiday competitions in South Africa? This page lists current travel, getaway and accommodation-related competitions, including trips, hotel stays, weekend breaks, resort vouchers and travel prize draws. Freehub does not run these competitions; we list public competitions from official promoter pages and trusted sources, then link you to the official entry route. Always check the promoter's terms before entering, especially where a purchase, booking, loyalty account, app download or paid entry is required.",
      support:
        "Holiday competitions can include local getaways, hotel stays, resort breaks, flights, travel packages, accommodation vouchers, travel spending money and experience-based trips. If you searched for win a holiday South Africa, holiday giveaway listings or a local getaway competition, compare the closing date, entry cost label, eligibility rules and official terms before entering.",
    },
    tech: {
      category: "Tech",
      title: "Tech Competitions in South Africa | Win Phones, Gadgets & Electronics",
      description:
        "Find current South African tech competitions and electronics giveaways. Compare phone, TV, gadget and gaming prizes with closing dates, entry costs and official promoter links.",
      heading: "Tech Competitions in South Africa",
      intro:
        "This page lists current tech, gadget and electronics competitions in South Africa, including phone, TV, gaming console, electronics bundle, gadget and tech voucher prizes where the active listings support them. Some tech competitions are free to enter, while others may require a purchase, receipt, app, account, rewards card, WhatsApp entry, USSD entry or other qualifying action. Freehub does not run these competitions or collect entries; use the official promoter links to enter.",
      support:
        "Tech competitions can include phones and smartphones, TVs and home theatre prizes, gaming consoles, laptops, tablets, gadgets, electronics vouchers, tech-led appliances and app, account or rewards-based promotions. If you searched for tech competitions South Africa, smartphone competition South Africa, win gadgets South Africa, gadget giveaway listings, win phones South Africa, win electronics South Africa, win TV competitions South Africa or current tech giveaways South Africa, compare the entry label, closing date and official terms before entering.",
    },
    vouchers: {
      category: "Vouchers",
      title: "Voucher Competitions in South Africa | Shopping & Retail Giveaways",
      description:
        "Find current South African voucher competitions, including shopping, grocery, retail and Takealot voucher prizes. Compare closing dates, entry costs and official promoter links.",
      heading: "Voucher Competitions in South Africa",
      intro:
        "This page lists current voucher-prize competitions in South Africa, including shopping vouchers, grocery vouchers, retail vouchers, online shopping vouchers and verified Takealot voucher prizes where supported. Some voucher competitions are free to enter, while others require a purchase, receipt, app, account, rewards card or qualifying action. Freehub does not run these competitions or collect entries; use the official promoter links to enter.",
      support:
        "Voucher giveaways can be free-entry, purchase-required, paid-entry, app-based, account-linked, rewards-card-linked, till-slip, WhatsApp, online or in-store promotions. If you searched for voucher competitions South Africa or Takealot competitions, compare the promoter, cost label and official source before entering; Freehub only uses Takealot wording for online shopping voucher prizes such as Takealot vouchers, where verified.",
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
    football: {
      title: "Football Competitions South Africa | Jerseys, Tickets & Trips",
      description:
        "Browse South African football competitions, including jersey giveaways, football tops, match-day prizes, trips and official promoter campaigns.",
      heading: "Football Competitions",
      intro:
        "Find current football competitions in South Africa, including jersey giveaways, football tops, match-day prizes, club promotions and tournament-linked campaigns.",
      support:
        "Football competitions can involve free online forms, social posts, account requirements, purchases or travel prizes. Check the official promoter terms for closing dates, eligibility, entry costs and prize fulfilment before entering.",
    },
    rugby: {
      title: "Rugby Competitions South Africa | Rugby Tops, Trips & Prizes",
      description:
        "Browse South African rugby competitions, including rugby top giveaways, match-day experiences, travel prizes and official promoter campaigns.",
      heading: "Rugby Competitions",
      intro:
        "Find current rugby competitions in South Africa, including rugby tops, team jersey giveaways, match-day experiences, travel prizes and supporter promotions.",
      support:
        "Rugby prize campaigns can be free-entry, account-linked, purchase-required or experience-based. Compare the promoter, closing date, cost label and official terms before entering.",
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
      title: "Win a Car Competitions in South Africa | Freehub",
      description:
        "Find current South African car competitions, vehicle giveaways and win-a-car promotions. Compare closing dates, entry costs and official promoter links.",
      heading: "Win a Car Competitions in South Africa",
      intro:
        "Find current South African car and vehicle competitions from official promoter sources. Freehub does not run these competitions or collect entries; use each listing to compare the basics, then enter through the official promoter link.",
      support:
        "Compare closing dates, entry costs, purchase requirements and official terms before entering. Car competitions may involve free online forms, qualifying purchases, paid tickets, till slips, licences, insurance or other handover conditions.",
    },
    "free-competitions": {
      title: "Free Competitions in South Africa | No Purchase Required Giveaways",
      description:
        "Find current free-to-enter South African competitions and giveaways with no purchase required. Compare prizes, closing dates, entry methods and official promoter links.",
      heading: "Free Competitions in South Africa",
      intro:
        "This page is for South African competitions that do not require a purchase or paid ticket to enter. Some free competitions still use an online form, WhatsApp message, social action, radio entry or sign-in step where the official terms allow it.",
      support:
        "Freehub does not run these competitions or collect entries. Compare the prize, closing date, entry method and official promoter link, then enter through the promoter's own page or channel.",
    },
    "competitions-ending-soon": {
      title: "Competitions Ending This Week in South Africa | Freehub",
      description:
        "Find South African competitions ending soon, including car, cash, voucher, airtime, holiday and ticket giveaways. Updated regularly with official entry links.",
      heading: "Competitions Ending This Week in South Africa",
      intro:
        "Find published South African competitions closing in the next seven days, sorted by the nearest closing date first. Use this page to prioritise current car, cash, voucher, airtime, holiday, ticket and tech giveaways before deadlines pass.",
      support:
        "Freehub lists competition information from official promoter pages and sends you to the source to enter. We do not run these competitions; some entries may require a purchase, receipt, app, account, paid ticket or qualifying action.",
    },
    "new-competitions-south-africa": {
      title: "New Competitions South Africa | Latest Giveaways This Week",
      description:
        "Browse recently checked South African competitions and latest giveaways, including car, cash, voucher, tech and holiday prize draws with official entry links.",
      heading: "New Competitions in South Africa",
      intro:
        "Browse recently checked and newly surfaced South African competitions, sorted so the freshest Freehub updates appear first. Use this page when you want the latest car, cash, voucher, tech and holiday giveaways before they become crowded.",
      support:
        "New competition pages are useful for discovery, but Freehub still treats the official promoter page as the source of truth. Check the current terms, entry method and closing date before entering.",
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
      aliases: ["Clicks /", "Clicks ClubCard", "Clicks / BabyClub", "Clicks / Protex"],
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
      aliases: ["Vodacom /", "Vodacom4U"],
      title: "Vodacom Competitions South Africa | Freehub",
      description:
        "Browse active Vodacom competitions in South Africa. Compare telecom prizes, entry requirements, closing dates and official source links.",
      heading: "Vodacom Competitions",
      intro:
        "Find active Vodacom competitions and recharge or rewards-linked promotions listed on Freehub.",
      support:
        "Telecom competitions can involve recharge, app, SMS or rewards mechanics, so confirm the official Vodacom terms before entering.",
    },
    boxer: {
      brand: "Boxer",
      aliases: ["Boxer Superstores", "Boxer /"],
      title: "Boxer Competitions South Africa | Freehub",
      description:
        "Browse active Boxer competitions in South Africa. Compare grocery, voucher, tech and lifestyle prizes with entry requirements and official source links.",
      heading: "Boxer Competitions",
      intro:
        "Find current Boxer and Boxer Rewards Club competitions listed on Freehub, including retail promotions, voucher prizes and purchase-linked giveaways.",
      support:
        "Boxer promotions often require qualifying products or Rewards Club details, so check the official terms before entering.",
    },
    toyota: {
      brand: "Toyota",
      aliases: ["Toyota", "Comrades Marathon / Toyota", "Bridgestone South Africa"],
      title: "Toyota Competitions South Africa | Freehub",
      description:
        "Browse active South African competitions featuring Toyota vehicle prizes, with closing dates, entry costs and official promoter links.",
      heading: "Toyota Competitions",
      intro:
        "Find current Toyota vehicle prize competitions listed on Freehub, including Corolla Cross, Vitz and other Toyota-linked campaigns where the source is verified.",
      support:
        "Vehicle prizes can include purchase, licence, paid-ticket or handover requirements. Read the official promoter terms before entering.",
    },
    capitec: {
      brand: "Capitec",
      aliases: ["Capitec Bank"],
      title: "Capitec Competitions South Africa | Freehub",
      description:
        "Browse active Capitec competitions in South Africa with voucher, banking and social-entry details from official sources.",
      heading: "Capitec Competitions",
      intro:
        "Find current Capitec competitions and rewards-style promotions listed on Freehub.",
      support:
        "Bank promotions can involve client, app, account or social media requirements, so confirm the official Capitec terms before entering.",
    },
    mtn: {
      brand: "MTN",
      aliases: ["MTN", "MTN /"],
      title: "MTN Competitions South Africa | Freehub",
      description:
        "Browse active MTN competitions in South Africa with airtime, cash, app and telecom prize details from official source links.",
      heading: "MTN Competitions",
      intro:
        "Find current MTN competitions and telecom promotions listed on Freehub.",
      support:
        "MTN promotions may involve app, recharge, account or transaction requirements. Check the official MTN terms before entering.",
    },
    pep: {
      brand: "PEP",
      aliases: ["PEP", "PEP and +more", "PEP /"],
      title: "PEP Competitions South Africa | Freehub",
      description:
        "Browse active PEP competitions in South Africa with cash, voucher and retail promotion details from official source links.",
      heading: "PEP Competitions",
      intro:
        "Find current PEP and +more competitions listed on Freehub.",
      support:
        "PEP promotions can include purchase, rewards, SMS or in-store requirements, so confirm the official terms before entering.",
    },
    "standard-bank": {
      brand: "Standard Bank",
      aliases: ["Standard Bank"],
      title: "Standard Bank Competitions South Africa | Freehub",
      description:
        "Browse active Standard Bank competitions in South Africa with cash, voucher and banking promotion details.",
      heading: "Standard Bank Competitions",
      intro:
        "Find current Standard Bank competitions and banking-linked promotions listed on Freehub.",
      support:
        "Banking competitions can include account, card, loan or payment requirements. Check the official Standard Bank terms before entering.",
    },
    discovery: {
      brand: "Discovery",
      aliases: ["Discovery Bank", "Discovery /", "Discovery Vitality"],
      title: "Discovery Competitions South Africa | Freehub",
      description:
        "Browse active Discovery competitions in South Africa, including banking, travel and Vitality-linked prize promotions.",
      heading: "Discovery Competitions",
      intro:
        "Find current Discovery, Discovery Bank and Vitality-linked competitions listed on Freehub.",
      support:
        "Discovery promotions can include account, card, booking, Vitality or qualifying-spend requirements. Confirm the official terms before entering.",
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
    Sports: { start: "#047857", end: "#34d399", accent: "#d1fae5" },
    Lifestyle: { start: "#7c2d12", end: "#fb923c", accent: "#ffedd5" },
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

  function getCompetitionImageUrl(competition, competitionPool = []) {
    if (competition && competition.image) {
      return competition.image;
    }

    const brandImage = getBrandAssociatedImage(competition, competitionPool);
    if (brandImage) {
      return brandImage;
    }

    return buildBrandFallbackImage(competition || {});
  }

  function getCompetitionPrimaryImageUrl(competition, competitionPool = []) {
    if (competition && competition.image) {
      return competition.image;
    }

    const brandImage = getBrandAssociatedImage(competition, competitionPool);
    if (brandImage) {
      return brandImage;
    }

    return buildBrandFallbackImage(competition || {});
  }

  function getCompetitionLogoUrl(competition) {
    const explicitLogo = String(
      (competition && (competition.logo || competition.brandLogo || competition.logoUrl || competition.brandLogoUrl)) || ""
    ).trim();

    if (explicitLogo) {
      return explicitLogo;
    }

    const domain = getCompetitionSourceDomain(competition);
    return domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128` : "";
  }

  function getCompetitionSourceDomain(competition) {
    const explicitDomain = String((competition && competition.sourceDomain) || "").trim().replace(/^www\./, "");

    if (explicitDomain) {
      return explicitDomain;
    }

    const sourceUrl = String((competition && (competition.sourceUrl || competition.termsUrl || competition.url)) || "").trim();

    if (!sourceUrl) {
      return "";
    }

    try {
      return new URL(sourceUrl).hostname.replace(/^www\./, "");
    } catch (_error) {
      return "";
    }
  }

  function getBrandInitials(brand) {
    const words = String(brand || "Freehub")
      .trim()
      .replace(/[^a-z0-9\s&-]/gi, "")
      .split(/\s+/)
      .filter(Boolean);

    if (words.length === 0) {
      return "FH";
    }

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return words
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase();
  }

  function getBrandAssociatedImage(competition, competitionPool = []) {
    const candidates = Array.isArray(competitionPool) ? competitionPool : [];
    const keys = BRAND_IMAGE_LOOKUP_KEYS.map((field) =>
      normalizeImageLookupKey(competition && competition[field])
    ).filter(Boolean);

    if (keys.length === 0 || candidates.length === 0) {
      return "";
    }

    for (let i = 0; i < candidates.length; i += 1) {
      const candidate = candidates[i];
      if (!candidate || !candidate.image) {
        continue;
      }

      for (let j = 0; j < keys.length; j += 1) {
        const key = keys[j];
        const sameSourceDomain = normalizeImageLookupKey(candidate.sourceDomain) === key;
        const sameBrand = normalizeImageLookupKey(candidate.brand) === key;

        if (sameSourceDomain || sameBrand) {
          return candidate.image;
        }
      }
    }

    return "";
  }

  function normalizeImageLookupKey(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/^www\./, "");
  }

  function buildBrandFallbackImage(competition) {
    const category = competition.category || "Competition";
    return CATEGORY_FALLBACK_IMAGES[category] || DEFAULT_OG_IMAGE;
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

    if (normalized.includes("sms")) return "SMS";
    if (normalized.includes("ussd")) return "USSD";
    if (normalized.includes("whatsapp")) return "WhatsApp";
    if (normalized.includes("app")) return "App";
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
    const brand = String(competition.brand || "").trim();

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
        return brand ? `${brand} vehicle reward` : "Vehicle reward";
      case "cash":
        return brand ? `${brand} cash reward` : "Cash reward";
      case "voucher":
        return brand ? `${brand} voucher reward` : "Voucher reward";
      case "holiday":
        return brand ? `${brand} getaway` : "Getaway";
      case "tech":
        return brand ? `${brand} tech reward` : "Tech reward";
      case "retail":
        return "Retail prize";
      case "food-drink":
        return "Food and drink prize";
      case "experience":
        return "Experience prize";
      default:
        return brand ? `${brand} competition` : "Competition reward";
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
        return competition.brand ? `Win ${competition.brand} cash rewards` : "Win cash rewards";
      case "voucher":
        return competition.brand ? `Win ${competition.brand} vouchers` : "Win vouchers";
      case "holiday":
        return competition.brand ? `Win a ${competition.brand} getaway` : "Win a getaway";
      case "tech":
        return competition.brand ? `Win ${competition.brand} tech rewards` : "Win tech rewards";
      case "retail":
        return "Win Retail Prizes";
      case "food-drink":
        return "Win Food and Drink Prizes";
      case "experience":
        return "Win an Experience";
      default:
        return competition.title || "Competition details";
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
    const addChannelLabel = (label, condition) => {
      if (condition && label !== entryMethod) {
        labels.add(label);
      }
    };

    if (isHighValueCompetition(competition) || tags.includes("high-value")) {
      labels.add("High Value");
    }

    if (isClosingWithinDays(competition.closingDate, ENDING_SOON_TAG_DAYS) || tags.includes("ending-soon")) {
      labels.add("Ending Soon");
    }

    addChannelLabel("App", entryMethod === "App" || tags.includes("app") || tags.includes("app-entry"));
    addChannelLabel("SMS", entryMethod === "SMS" || tags.includes("sms") || tags.includes("sms-entry"));
    addChannelLabel("USSD", entryMethod === "USSD" || tags.includes("ussd-entry"));
    addChannelLabel("WhatsApp", entryMethod === "WhatsApp" || tags.includes("whatsapp-entry"));

    return Array.from(labels).slice(0, 5);
  }

  function getCardStatusLabels(competition) {
    const labels = new Set(["Verified"]);
    const daysUntilClosing = getDaysUntilClosing(competition && competition.closingDate);

    if (Number.isFinite(daysUntilClosing)) {
      if (daysUntilClosing === 0) {
        labels.add("Last chance");
      } else if (daysUntilClosing <= 3) {
        labels.add("Closing soon");
      }
    }

    if (isRecentlyCheckedCompetition(competition)) {
      labels.add("New");
    }

    if (isHighValueCompetition(competition || {})) {
      labels.add("Trending");
    }

    return Array.from(labels).slice(0, 5);
  }

  function isRecentlyCheckedCompetition(competition) {
    return getLastCheckedAgeDays(competition && competition.lastChecked) <= 7;
  }

  function toTitleCaseLabel(label) {
    return String(label || "")
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function isPublishedCompetition(competition) {
    return (
      competition &&
      competition.verificationStatus === "published" &&
      competition.publicationStatus !== "held" &&
      competition.publicationStatus !== "archived-low-value" &&
      competition.doNotPublish !== true
    );
  }

  function getPublishedCompetitions(competitions) {
    return competitions.filter(isPublishedCompetition);
  }

  function isActiveCompetition(competition) {
    const daysUntilClosing = getDaysUntilClosing(competition && competition.closingDate);

    return isPublishedCompetition(competition) && Number.isFinite(daysUntilClosing) && daysUntilClosing >= 0;
  }

  function getPublishedActiveCompetitions(competitions) {
    return competitions.filter(isActiveCompetition);
  }

  function isExpiredCompetition(competition) {
    const daysUntilClosing = getDaysUntilClosing(competition && competition.closingDate);
    return Number.isFinite(daysUntilClosing) && daysUntilClosing < 0;
  }

  function hasVerifiedArchiveSource(competition) {
    return Boolean(
      competition &&
        (competition.termsUrl || competition.sourceUrl || competition.url) &&
        String(competition.title || "").trim() &&
        String(competition.brand || "").trim() &&
        String(competition.closingDate || "").trim()
    );
  }

  function isExpiredArchiveEligibleCompetition(competition) {
    return (
      isPublishedCompetition(competition) &&
      isExpiredCompetition(competition) &&
      hasVerifiedArchiveSource(competition)
    );
  }

  function isArchivedLowValueCompetition(competition) {
    return (
      competition &&
      competition.verificationStatus === "published" &&
      competition.publicationStatus === "archived-low-value" &&
      competition.doNotPublish !== true &&
      isExpiredCompetition(competition)
    );
  }

  function getExpiredArchiveCompetitions(competitions) {
    return competitions.filter(isExpiredArchiveEligibleCompetition);
  }

  function getArchivedLowValueCompetitions(competitions) {
    return competitions.filter(isArchivedLowValueCompetition);
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
    return getPublishedActiveCompetitions(competitions).filter((competition) => {
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
    const publishedCompetitions = getPublishedActiveCompetitions(competitions);

    if (routeContext.type === "category") {
      const targetCategory = CATEGORY_COPY[routeContext.slug].category;
      return sortCompetitions(publishedCompetitions.filter((competition) => competition.category === targetCategory));
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
    const publishedCompetitions = getPublishedActiveCompetitions(competitions);
    const sortedCompetitions = sortCompetitions(publishedCompetitions);

    if (slug === "competitions") {
      return sortedCompetitions;
    }

    if (slug === "win-a-car") {
      return sortedCompetitions.filter(isVehicleRelatedCompetition);
    }

    if (slug === "free-competitions") {
      return sortedCompetitions.filter(isStrictFreeEntryCompetition);
    }

    if (slug === "competitions-ending-soon") {
      return sortedCompetitions.filter((competition) => {
        const daysUntilClosing = getDaysUntilClosing(competition.closingDate);

        if (!Number.isFinite(daysUntilClosing) || daysUntilClosing < 0) {
          return false;
        }

        return daysUntilClosing <= ENDING_SOON_TAG_DAYS;
      });
    }

    if (slug === "new-competitions-south-africa") {
      const recentlyCheckedCompetitions = sortedCompetitions
        .filter((competition) => getLastCheckedAgeDays(competition.lastChecked) <= 7)
        .sort(compareRecentCompetitionUpdates);

      return recentlyCheckedCompetitions.length >= 6
        ? recentlyCheckedCompetitions
        : sortedCompetitions.slice().sort(compareRecentCompetitionUpdates).slice(0, 24);
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

  function isVehicleRelatedCompetition(competition) {
    const tags = Array.isArray(competition.tags) ? competition.tags : [];
    const prizeType = normalizePrizeType(competition.prizeType);
    const searchableText = [
      competition.title,
      competition.summary,
      competition.prizeName,
      competition.requiredProduct,
      tags.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    return (
      competition.category === "Cars" ||
      prizeType === "car" ||
      tags.includes("win-a-car") ||
      tags.includes("cars") ||
      /\b(win a car|car competition|vehicle giveaway|vehicle prize|motor vehicle|suv competition|bakkie competition)\b/.test(
        searchableText
      )
    );
  }

  function isStrictFreeEntryCompetition(competition) {
    const tags = Array.isArray(competition.tags) ? competition.tags : [];
    const entryCostType = normalizeEntryCostType(competition.entryCostType);
    const entryContext = [
      competition.entryType,
      competition.entryChannel,
      competition.entryFeeLabel,
      competition.requiredProduct,
      tags.join(" "),
    ]
      .join(" ")
      .toLowerCase();
    const blockedTags = [
      "purchase-required",
      "paid-entry",
      "till-slip",
      "till-slip-required",
      "spend-and-win",
      "subscription",
      "subscription-billing",
      "sms-entry",
      "ussd-entry",
      "recharge-required",
      "qualifying-products",
      "loyalty-required",
    ];

    if (competition.purchaseRequired === true) {
      return false;
    }

    if (entryCostType !== "free-entry") {
      return false;
    }

    if (blockedTags.some((tag) => tags.includes(tag))) {
      return false;
    }

    if (Number(competition.entryFeeAmount) > 0) {
      return false;
    }

    if (/sms|ussd/.test(entryContext)) {
      return false;
    }

    if (
      /\b(buy|purchase|required purchase|paid ticket|ticket|till slip|receipt|invoice|minimum spend|spend and win|subscription|billing|recharge|qualifying product|swipe|rewards card|loyalty card)\b/.test(
        entryContext
      )
    ) {
      return false;
    }

    if (
      (tags.includes("app") || tags.includes("app-required") || tags.includes("account-required")) &&
      !(
        tags.includes("online-entry") ||
        tags.includes("social-entry") ||
        tags.includes("whatsapp-entry") ||
        tags.includes("radio") ||
        tags.includes("free-entry")
      )
    ) {
      return false;
    }

    return getEntryCostLabel(competition) === "Free entry";
  }

  function normalizeEntryCostType(entryCostType) {
    return String(entryCostType || "").trim().toLowerCase();
  }

  function getLastCheckedAgeDays(dateString) {
    const rawDate = String(dateString || "").trim();

    if (!rawDate) {
      return Number.POSITIVE_INFINITY;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkedDate = new Date(rawDate);

    if (Number.isNaN(checkedDate.getTime())) {
      return Number.POSITIVE_INFINITY;
    }

    checkedDate.setHours(0, 0, 0, 0);

    return Math.floor((today.getTime() - checkedDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  function compareRecentCompetitionUpdates(left, right) {
    const leftChecked = new Date(left.lastChecked || 0).getTime() || 0;
    const rightChecked = new Date(right.lastChecked || 0).getTime() || 0;

    if (rightChecked !== leftChecked) {
      return rightChecked - leftChecked;
    }

    return new Date(left.closingDate) - new Date(right.closingDate);
  }

  function getBrandFilteredCompetitions(competitions, slug) {
    const brandPage = APPROVED_BRAND_PAGES[slug];

    if (!brandPage) {
      return [];
    }

    const targetBrand = brandPage.brand.toLowerCase();
    return sortCompetitions(getPublishedActiveCompetitions(competitions)).filter(
      (competition) => matchesBrandPage(competition, brandPage, targetBrand)
    );
  }

  function matchesBrandPage(competition, brandPage, targetBrand = "") {
    const brandName = normalizeBrandMatchText(competition && competition.brand);
    const searchableText = normalizeBrandMatchText([
      competition && competition.brand,
      competition && competition.title,
      competition && competition.summary,
      competition && competition.sourceDomain,
      Array.isArray(competition && competition.tags) ? competition.tags.join(" ") : "",
    ].join(" "));
    const primaryBrand = targetBrand || normalizeBrandMatchText(brandPage && brandPage.brand);
    const aliases = ((brandPage && Array.isArray(brandPage.aliases)) ? brandPage.aliases : [])
      .map(normalizeBrandMatchText)
      .filter(Boolean);

    return brandName === primaryBrand || aliases.some((alias) => brandName === alias || searchableText.includes(alias));
  }

  function normalizeBrandMatchText(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/^www\./, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
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
    return generatedBrandSlugs.find((slug) => {
      const definition = APPROVED_BRAND_PAGES[slug];
      return definition && matchesBrandPage(competition, definition);
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
    getCompetitionPrimaryImageUrl,
    getCompetitionLogoUrl,
    getBrandInitials,
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
    getCardStatusLabels,
    isRecentlyCheckedCompetition,
    formatRandAmount,
    getCardTagLabels,
    isPublishedCompetition,
    getPublishedCompetitions,
    isActiveCompetition,
    getPublishedActiveCompetitions,
    isExpiredCompetition,
    hasVerifiedArchiveSource,
    isExpiredArchiveEligibleCompetition,
    isArchivedLowValueCompetition,
    getExpiredArchiveCompetitions,
    getArchivedLowValueCompetitions,
    isVehicleRelatedCompetition,
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
