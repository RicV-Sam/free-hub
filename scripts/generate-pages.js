const fs = require("fs");
const path = require("path");
const shared = require("../shared/page-data.js");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT_DIR, "data", "competitions.json");
const ARCHIVE_DATA_PATH = path.join(ROOT_DIR, "data", "archive", "competitions-expired.json");
const RELATIVE_ASSET_PATH = "/";
const ADSENSE_SCRIPT =
  '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6084410613829318" crossorigin="anonymous"></script>';
const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/0029Vb7mS1VE50UlOc2yOe2H";
const BUILD_DATE_ISO = process.env.FREEHUB_BUILD_DATE || getLocalIsoDate(new Date());
const CATEGORY_LINKS = [
  { label: "All Competitions", href: "/" },
  ...shared.CATEGORY_SLUGS.map((slug) => ({
    label: shared.CATEGORY_COPY[slug].category,
    href: `/category/${slug}/`,
  })),
];
const TAG_LINKS = [
  { label: "Free Entry", href: "/tag/free-entry/" },
  { label: "Ending Soon", href: "/tag/ending-soon/" },
  { label: "High Value", href: "/tag/high-value/" },
];
const HUB_LINKS = [
  { label: "All competitions", href: "/competitions/" },
  { label: "New competitions", href: "/new-competitions-south-africa/" },
  { label: "Win a car", href: "/win-a-car/" },
  { label: "Free competitions", href: "/free-competitions/" },
  { label: "Ending soon", href: "/competitions-ending-soon/" },
  { label: "Purchase required", href: "/purchase-required-competitions/" },
  { label: "Paid entry", href: "/paid-entry-competitions/" },
];
let brandImageLookup = new Map();
const TRUST_PAGE_DEFINITIONS = [
  {
    slug: "about",
    title: "About Freehub | South African Competition Discovery",
    description:
      "Learn what Freehub does, how it helps South Africans discover competitions, and why every listing points users to the official promoter.",
    heading: "About Freehub",
    intro:
      "Freehub is a South African competition discovery site. We help people find live competitions, giveaways, prize draws and brand promotions, then point them to the official promoter to enter.",
    sections: [
      {
        heading: "What Freehub does",
        paragraphs: [
          "Freehub organises competition information so users can compare closing dates, entry methods, purchase requirements and source links before clicking through.",
          "We list competitions from South African brands, retailers, media companies and official promotion pages where the listing has enough information to be useful.",
        ],
      },
      {
        heading: "What Freehub does not do",
        paragraphs: [
          "Freehub does not run the competitions listed on this site, choose winners, collect entries for promoters or guarantee that a promoter will accept an entry.",
          "Competition details can change on official promoter pages, so users should always read the promoter's current terms before entering.",
        ],
      },
    ],
  },
  {
    slug: "contact",
    title: "Contact Freehub | Report Competition Issues",
    description:
      "Contact Freehub about broken links, expired competitions, suspicious listings, corrections, or brand removal requests.",
    heading: "Contact Freehub",
    intro:
      "Use this page to contact Freehub about listing corrections, broken links, expired competitions, suspicious promotions or brand-related requests.",
    sections: [
      {
        heading: "Email",
        paragraphs: [
          "Send listing corrections and general messages to hello@freehub.co.za.",
          "Include the competition title, the Freehub page URL and the official source URL if your message is about a specific listing.",
        ],
      },
      {
        heading: "Before you enter",
        paragraphs: [
          "Freehub does not accept competition entries by email. To enter a competition, open the listing and follow the official promoter link.",
        ],
      },
    ],
  },
  {
    slug: "privacy-policy",
    title: "Privacy Policy | Freehub",
    description:
      "Read Freehub's privacy policy, including basic analytics, cookies, outbound links and competition entry responsibility.",
    heading: "Privacy Policy",
    intro:
      "This privacy policy explains how Freehub handles basic site usage information. Freehub is a listing site and does not collect competition entries for promoters.",
    sections: [
      {
        heading: "Information Freehub may process",
        paragraphs: [
          "Freehub may use analytics tools to understand page views, clicks, device types and broad usage patterns. This helps us improve pages and find broken journeys.",
          "If you contact us by email, we receive the information you choose to send, such as your email address, message and any page URLs included.",
        ],
      },
      {
        heading: "Competition entries",
        paragraphs: [
          "Freehub does not collect or process entries for the competitions listed on the site. When you click through, the promoter's own privacy policy and terms apply.",
          "Do not send identity numbers, banking details, passwords or competition entries to Freehub unless we have specifically requested information for a listing correction.",
        ],
      },
      {
        heading: "Cookies and analytics",
        paragraphs: [
          "The site may use cookies or similar technologies through analytics and measurement tools. These are used to understand site performance and user journeys.",
        ],
      },
    ],
  },
  {
    slug: "terms-of-use",
    title: "Terms of Use | Freehub",
    description:
      "Read the Freehub terms of use for browsing competition listings, official promoter links, accuracy limits and user responsibility.",
    heading: "Terms of Use",
    intro:
      "These terms explain how to use Freehub as a competition discovery site. By browsing Freehub, you understand that listings are informational and entries happen with the official promoter.",
    sections: [
      {
        heading: "Listings are informational",
        paragraphs: [
          "Freehub aims to present useful competition information, but promoter pages, eligibility rules, entry methods and closing dates can change.",
          "Before entering, check the official promoter page and any terms and conditions linked by the promoter.",
        ],
      },
      {
        heading: "Freehub is not the promoter",
        paragraphs: [
          "Freehub does not run the listed competitions, select winners, verify winner messages, collect entries or manage prize fulfilment.",
          "Questions about entry acceptance, winner selection or prize delivery should be directed to the official promoter.",
        ],
      },
      {
        heading: "Sponsored or affiliate content",
        paragraphs: [
          "If Freehub adds sponsored placements or affiliate links in future, they should be labelled clearly. Competition cards and ads should not be presented in a way that confuses users.",
        ],
      },
    ],
  },
  {
    slug: "how-we-verify-competitions",
    title: "How Freehub Checks Competition Listings",
    description:
      "Learn how Freehub reviews competition listings, official sources, dates and entry requirements before publishing.",
    heading: "How We Check Competition Listings",
    intro:
      "Freehub uses a cautious listing process so users can see the source, entry route and basic requirements before they leave the site.",
    sections: [
      {
        heading: "What we check",
        paragraphs: [
          "We look for an official promoter page, a credible brand or retailer source, a closing date, an entry method and enough entry information to help users decide whether to continue.",
          "Listings marked for internal verification should not be published as public competition pages until they are safe to expose.",
        ],
      },
      {
        heading: "What verified means here",
        paragraphs: [
          "A verified listing means Freehub found enough source information to publish the listing. It does not mean Freehub runs the competition or guarantees the prize.",
          "Promoters can update or remove campaigns, so users should still check the official page before entering.",
        ],
      },
    ],
  },
  {
    slug: "how-to-enter-competitions-safely",
    title: "How to Enter Competitions Safely in South Africa",
    description:
      "Safety guidance for entering South African competitions, checking official sources, reading terms and avoiding suspicious requests.",
    heading: "How to Enter Competitions Safely",
    intro:
      "Competitions can be useful and fun, but it is worth checking the basics before sharing information or spending money.",
    sections: [
      {
        heading: "Before you enter",
        paragraphs: [
          "Check that the entry link goes to the official promoter or a trusted campaign partner. Read the terms, closing date, eligibility rules and entry costs.",
          "If a purchase, till slip, rewards card, SMS, USSD session or paid ticket is required, make sure you understand the cost before entering.",
        ],
      },
      {
        heading: "Red flags",
        paragraphs: [
          "Be careful with messages that ask for banking passwords, card PINs, upfront release fees, remote access apps or unnecessary identity documents.",
          "If a winner message looks suspicious, contact the promoter through the official website or verified social channel rather than replying directly.",
        ],
      },
    ],
  },
  {
    slug: "legit-competitions-south-africa",
    title: "Legit Competitions in South Africa | Safety Guide",
    description:
      "A practical guide to spotting legitimate South African competitions and understanding Freehub's role as a listing site.",
    heading: "Legit Competitions in South Africa",
    intro:
      "A legitimate competition should make it possible to identify the promoter, entry method, prize, closing date and important conditions before you enter.",
    sections: [
      {
        heading: "What to look for",
        paragraphs: [
          "Look for a recognisable promoter, a clear source page, understandable entry rules, a closing date and transparent cost information.",
          "Purchase-required competitions should explain the qualifying product, spend, receipt or loyalty-card requirement. Paid-entry competitions should make the ticket cost clear.",
        ],
      },
      {
        heading: "Freehub's role",
        paragraphs: [
          "Freehub helps users discover and compare competitions, but the promoter remains responsible for the competition, entry process, winner selection and prize fulfilment.",
        ],
      },
    ],
  },
  {
    slug: "competition-closing-date-checklist",
    title: "Competition Closing Date Checklist South Africa | Freehub",
    description:
      "Use this checklist to confirm South African competition closing dates, times, eligibility, costs and official source links before entering.",
    heading: "Competition Closing Date Checklist",
    intro:
      "A competition can still be live but close quickly, so it helps to check the deadline details before you spend time entering.",
    article: true,
    datePublished: "2026-05-10",
    dateModified: "2026-05-10",
    sections: [
      {
        heading: "Check the closing details",
        paragraphs: [
          "Look for the closing date, closing time and timezone in the promoter's terms. Some campaigns close at midnight, while others close during business hours or after a live event.",
          "If Freehub shows a competition as ending soon, treat it as a prompt to verify the latest deadline on the official source before entering.",
        ],
      },
      {
        heading: "Check eligibility before rushing",
        paragraphs: [
          "Confirm age limits, region limits, account requirements, purchase rules and whether a till slip or proof of purchase is needed.",
          "For car, cash, voucher, holiday and tech prizes, also check winner contact rules so you know how the promoter will reach legitimate winners.",
        ],
      },
      {
        heading: "Use official links only",
        paragraphs: [
          "Do not rely on copied forms, comment threads or screenshots when the deadline is close. Open the official promoter link and follow the current entry instructions there.",
          "Freehub does not accept entries or choose winners; it points users to promoter pages where entries actually happen.",
        ],
      },
    ],
    links: [
      { label: "Competitions ending soon", href: "/competitions-ending-soon/" },
      { label: "All current competitions", href: "/competitions/" },
      { label: "Free competitions", href: "/free-competitions/" },
      { label: "Report an expired competition", href: "/report-a-competition/" },
    ],
  },
  {
    slug: "competition-entry-cost-labels",
    title: "Competition Entry Cost Labels Explained | Freehub",
    description:
      "Understand Freehub labels such as free entry, purchase required, paid entry, account required, app required and till slip required.",
    heading: "Competition Entry Cost Labels Explained",
    intro:
      "South African competitions use different entry mechanics. These labels help you see the likely cost or action before opening the official promoter page.",
    article: true,
    datePublished: "2026-05-10",
    dateModified: "2026-05-10",
    sections: [
      {
        heading: "Free entry, purchase required and paid entry",
        paragraphs: [
          "Free entry means the listing does not show a required product purchase or paid ticket. You may still need internet access, an account or the promoter's entry form.",
          "Purchase required means you may need to buy a qualifying product, meet a minimum spend, swipe a loyalty card or keep proof of purchase. Paid entry means a ticket, raffle entry or similar paid flow appears to be required.",
        ],
      },
      {
        heading: "Account, app and till slip requirements",
        paragraphs: [
          "Account required means the promoter may ask you to sign in or use a loyalty, retailer or platform account before entry.",
          "App required means the promoter routes entries through its official app. Till slip required means you should keep your receipt because it may be needed for entry, validation or claiming a prize.",
        ],
      },
      {
        heading: "Always check the promoter terms",
        paragraphs: [
          "Cost labels are a browsing aid, not a replacement for the promoter's terms. Confirm the latest entry cost, qualifying products, closing date and eligibility rules on the official source.",
          "Freehub does not process payments, sell tickets or collect competition entries.",
        ],
      },
    ],
    links: [
      { label: "Free competitions", href: "/free-competitions/" },
      { label: "Purchase required competitions", href: "/purchase-required-competitions/" },
      { label: "Paid entry competitions", href: "/paid-entry-competitions/" },
      { label: "Competitions ending soon", href: "/competitions-ending-soon/" },
    ],
  },
  {
    slug: "till-slip-competitions-south-africa",
    title: "Till Slip Competitions South Africa | Freehub",
    description:
      "Learn how till slip competitions work in South Africa, what proof of purchase to keep, and which current listings may require receipts.",
    heading: "Till Slip Competitions in South Africa",
    intro:
      "Many South African retail competitions need a till slip, invoice or receipt before your entry can be accepted or verified.",
    article: true,
    datePublished: "2026-05-10",
    dateModified: "2026-05-10",
    sections: [
      {
        heading: "How till slip competitions work",
        paragraphs: [
          "A till slip competition usually asks you to buy a qualifying product or spend a minimum amount at a participating store.",
          "The receipt may contain a reference number, prove that you bought the right product, or confirm that your loyalty card was used before the closing date.",
        ],
      },
      {
        heading: "What to keep",
        paragraphs: [
          "Keep the original till slip, online invoice or app receipt until winners are announced and prizes are awarded.",
          "Check the promoter's terms for product names, pack sizes, participating retailers, minimum spend and whether a copy or photo of the slip is acceptable.",
        ],
      },
      {
        heading: "Before you enter",
        paragraphs: [
          "Make sure the receipt date falls inside the competition period and that the official entry route belongs to the promoter.",
          "Freehub does not collect receipts or validate entries. Always submit proof of purchase only through the official promoter process.",
        ],
      },
    ],
    links: [
      { label: "Purchase required competitions", href: "/purchase-required-competitions/" },
      { label: "Entry cost labels explained", href: "/competition-entry-cost-labels/" },
      { label: "Competitions ending soon", href: "/competitions-ending-soon/" },
      { label: "How to enter safely", href: "/how-to-enter-competitions-safely/" },
    ],
  },
  {
    slug: "whatsapp-competitions-south-africa",
    title: "WhatsApp Competitions South Africa | Freehub",
    description:
      "Understand WhatsApp competition entries in South Africa, including official numbers, prompts, costs, privacy checks and safe entry habits.",
    heading: "WhatsApp Competitions in South Africa",
    intro:
      "WhatsApp competitions can be quick to enter, but it is important to use the official promoter number and check the full terms first.",
    article: true,
    datePublished: "2026-05-10",
    dateModified: "2026-05-10",
    sections: [
      {
        heading: "Use the official number",
        paragraphs: [
          "Only message the WhatsApp number shown on the promoter's official website, pack, receipt, verified social post or terms page.",
          "Avoid numbers copied into comment threads unless you can match them back to the official promoter source.",
        ],
      },
      {
        heading: "Watch the prompts",
        paragraphs: [
          "The promoter may ask for a keyword, product code, till slip reference, name, phone number or consent to terms.",
          "Read each prompt before sending personal information, and stop if the flow asks for banking passwords, card PINs or remote access apps.",
        ],
      },
      {
        heading: "Costs and privacy",
        paragraphs: [
          "WhatsApp entry may use data, require an account or depend on a purchase-linked code. Check the cost label and promoter privacy terms.",
          "Freehub links to promoter sources but does not operate any WhatsApp competition entry line.",
        ],
      },
    ],
    links: [
      { label: "How to enter safely", href: "/how-to-enter-competitions-safely/" },
      { label: "Purchase required competitions", href: "/purchase-required-competitions/" },
      { label: "Competitions ending soon", href: "/competitions-ending-soon/" },
      { label: "Report a suspicious listing", href: "/report-a-competition/" },
    ],
  },
  {
    slug: "app-competitions-south-africa",
    title: "App Competitions South Africa | Freehub",
    description:
      "Learn how app competitions work in South Africa, including official app checks, account requirements, purchase rules and safer entry tips.",
    heading: "App Competitions in South Africa",
    intro:
      "Some competitions require an official retailer, bank, telecom or promoter app before you can enter.",
    article: true,
    datePublished: "2026-05-10",
    dateModified: "2026-05-10",
    sections: [
      {
        heading: "Confirm the official app",
        paragraphs: [
          "Install apps from the Apple App Store, Google Play Store or a link from the promoter's official website.",
          "Do not install APK files or unofficial app links sent by unknown accounts pretending to be competition promoters.",
        ],
      },
      {
        heading: "Check the entry requirement",
        paragraphs: [
          "App competitions may require an account, loyalty profile, purchase, recharge, payment, scan, opt-in or in-app form.",
          "Read the terms before entering so you know whether the competition is free entry, purchase required or linked to a paid action.",
        ],
      },
      {
        heading: "Keep your account safe",
        paragraphs: [
          "Never share one-time PINs, app passwords, card PINs or remote access permissions with anyone claiming you have won.",
          "If a winner message arrives, verify it through the app or the promoter's official support channel.",
        ],
      },
    ],
    links: [
      { label: "Free competitions", href: "/free-competitions/" },
      { label: "Entry cost labels explained", href: "/competition-entry-cost-labels/" },
      { label: "Fake winner message guide", href: "/fake-competition-winner-messages/" },
      { label: "Tech competitions", href: "/category/tech/" },
    ],
  },
  {
    slug: "fake-competition-winner-messages",
    title: "Fake Competition Winner Messages South Africa | Freehub",
    description:
      "Learn how to spot fake competition winner messages, suspicious prize claims, upfront-fee scams and unsafe requests in South Africa.",
    heading: "How to Spot Fake Competition Winner Messages",
    intro:
      "A real competition win should be verifiable through the promoter's official channels and should not require unsafe payments or sensitive passwords.",
    article: true,
    datePublished: "2026-05-10",
    dateModified: "2026-05-10",
    sections: [
      {
        heading: "Common warning signs",
        paragraphs: [
          "Be careful with messages that ask for banking passwords, card PINs, remote access apps, release fees, courier fees or urgent payment before a prize can be delivered.",
          "Poor spelling is not the only red flag. Some fake messages copy real brand names and use convincing logos or screenshots.",
        ],
      },
      {
        heading: "How to verify a prize claim",
        paragraphs: [
          "Check the competition terms for winner contact rules, then contact the promoter through its official website, app or verified social profile.",
          "Do not reply directly with sensitive information until you have confirmed that the message came from the real promoter or agency.",
        ],
      },
      {
        heading: "What Freehub can do",
        paragraphs: [
          "Freehub can review and update listing information, but it does not choose winners or confirm private prize claims on behalf of promoters.",
          "If a Freehub listing appears suspicious or outdated, report it so the page can be checked.",
        ],
      },
    ],
    links: [
      { label: "Report a competition", href: "/report-a-competition/" },
      { label: "How to enter safely", href: "/how-to-enter-competitions-safely/" },
      { label: "Legit competitions guide", href: "/legit-competitions-south-africa/" },
      { label: "All competitions", href: "/competitions/" },
    ],
  },
  {
    slug: "purchase-required-competitions-explained",
    title: "Purchase Required Competitions Explained | Freehub",
    description:
      "Learn what purchase required competitions mean in South Africa, including qualifying products, minimum spend, loyalty cards and proof of purchase.",
    heading: "Purchase Required Competitions Explained",
    intro:
      "Purchase required competitions are not the same as free-entry giveaways, because you need to complete a qualifying purchase or store action first.",
    article: true,
    datePublished: "2026-05-10",
    dateModified: "2026-05-10",
    sections: [
      {
        heading: "What purchase required means",
        paragraphs: [
          "A purchase required competition may ask you to buy a specific product, spend a minimum amount, swipe a loyalty card, recharge, scan a code or keep a receipt.",
          "The purchase must usually happen inside the campaign period and through a participating store, website, app or merchant.",
        ],
      },
      {
        heading: "What to check first",
        paragraphs: [
          "Check the official terms for qualifying products, excluded stores, minimum spend, receipt rules, entry limits and closing date.",
          "If the listing also uses WhatsApp, USSD, SMS or an app, check whether data or network rates may apply.",
        ],
      },
      {
        heading: "Freehub's cost labels",
        paragraphs: [
          "Freehub labels purchase required competitions separately so users can see the likely cost before opening the promoter page.",
          "The promoter's current terms remain the source of truth, so always confirm the latest rules before buying anything to enter.",
        ],
      },
    ],
    links: [
      { label: "Purchase required competitions", href: "/purchase-required-competitions/" },
      { label: "Till slip competitions", href: "/till-slip-competitions-south-africa/" },
      { label: "Entry cost labels", href: "/competition-entry-cost-labels/" },
      { label: "Competitions ending soon", href: "/competitions-ending-soon/" },
    ],
  },
  {
    slug: "report-a-competition",
    title: "Report a Competition | Freehub",
    description:
      "Report a broken link, expired listing, suspicious competition, incorrect entry information or brand removal request to Freehub.",
    heading: "Report a Competition",
    intro:
      "Help keep Freehub useful by reporting broken links, expired campaigns, suspicious listings, incorrect details or brand concerns.",
    sections: [
      {
        heading: "What to send",
        paragraphs: [
          "Email hello@freehub.co.za with the Freehub page URL, the official source URL if available, and a short explanation of the issue.",
          "Useful report types include expired listing, broken outbound link, wrong closing date, missing purchase requirement, suspicious promoter page or brand removal request.",
        ],
      },
      {
        heading: "What happens next",
        paragraphs: [
          "Freehub will review the report and may update, remove or hold the listing for verification. We cannot resolve promoter disputes or confirm winner messages on behalf of brands.",
        ],
      },
    ],
  },
];

function main() {
  const rawCompetitions = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const rawArchiveCompetitions = fs.existsSync(ARCHIVE_DATA_PATH)
    ? JSON.parse(fs.readFileSync(ARCHIVE_DATA_PATH, "utf8"))
    : [];
  const validCompetitions = shared.sortCompetitions(
    rawCompetitions.filter((entry, index) => validateCompetition(entry, index))
  );
  const validArchiveCompetitions = shared.sortCompetitions(
    rawArchiveCompetitions.filter((entry, index) => validateCompetition(entry, index))
  );
  runDataSafetyChecks(validCompetitions);
  const activeCompetitions = shared.getPublishedActiveCompetitions(validCompetitions);
  const expiredArchiveCompetitions = uniqueCompetitionsBySlug(
    shared.getExpiredArchiveCompetitions([...validCompetitions, ...validArchiveCompetitions])
  );
  const expiredLowValueCompetitions = shared.getArchivedLowValueCompetitions(validCompetitions);
  const detailCompetitions = shared.sortCompetitions([
    ...activeCompetitions,
    ...expiredArchiveCompetitions,
    ...expiredLowValueCompetitions,
  ]);
  brandImageLookup = buildBrandImageLookup(activeCompetitions);
  const validCompetitionSlugs = new Set(detailCompetitions.map((competition) => shared.getCompetitionSlug(competition)));
  const validOutSlugs = new Set(activeCompetitions.map((competition) => shared.getCompetitionSlug(competition)));
  removeStaleCompetitionDirectories(validCompetitionSlugs, validOutSlugs);
  const generatedBrandPages = shared.getGeneratedBrandPageDefinitions(activeCompetitions);
  const generatedBrandSlugs = generatedBrandPages.map((brandPage) => brandPage.slug);
  const routeContexts = getGeneratedRouteContexts(activeCompetitions, generatedBrandPages);
  removeStaleTagDirectories(routeContexts);
  removeStaleBrandDirectories(generatedBrandPages);
  removeLegacyHomeDirectory();

  fs.writeFileSync(path.join(ROOT_DIR, "index.html"), renderHomepage(activeCompetitions));
  fs.writeFileSync(path.join(ROOT_DIR, "404.html"), renderNotFoundPage());

  routeContexts.filter((routeContext) => routeContext.type !== "home").forEach((routeContext) => {
    const filteredCompetitions = shared.filterCompetitionsByRoute(activeCompetitions, routeContext);
    const html =
      routeContext.type === "brand-index"
        ? renderBrandIndexPage(generatedBrandPages)
        : renderPage(routeContext, filteredCompetitions);
    const outputDirectory = path.join(ROOT_DIR, routeContext.path.replace(/^\//, "").replace(/\/$/, ""));

    fs.mkdirSync(outputDirectory, { recursive: true });
    fs.writeFileSync(path.join(outputDirectory, "index.html"), html);
  });

  detailCompetitions.forEach((competition) => {
    const html = renderCompetitionPage(competition, activeCompetitions, generatedBrandSlugs);
    const slug = shared.getCompetitionSlug(competition);
    const outputDirectory = path.join(ROOT_DIR, "competition", slug);

    fs.mkdirSync(outputDirectory, { recursive: true });
    fs.writeFileSync(path.join(outputDirectory, "index.html"), html);
  });

  activeCompetitions.forEach((competition) => {
    const html = renderOutPage(competition);
    const slug = shared.getCompetitionSlug(competition);
    const outputDirectory = path.join(ROOT_DIR, "out", slug);

    fs.mkdirSync(outputDirectory, { recursive: true });
    fs.writeFileSync(path.join(outputDirectory, "index.html"), html);
  });

  TRUST_PAGE_DEFINITIONS.forEach((page) => {
    const outputDirectory = path.join(ROOT_DIR, page.slug);

    fs.mkdirSync(outputDirectory, { recursive: true });
    fs.writeFileSync(path.join(outputDirectory, "index.html"), renderTrustPage(page));
  });

  fs.writeFileSync(
    path.join(ROOT_DIR, "sitemap.xml"),
    generateSitemap(activeCompetitions, routeContexts, [...activeCompetitions, ...expiredArchiveCompetitions])
  );
  fs.writeFileSync(path.join(ROOT_DIR, "robots.txt"), renderRobotsTxt());
  runLifecycleStaticChecks(validCompetitions, activeCompetitions, expiredArchiveCompetitions, expiredLowValueCompetitions);
  runStaticSeoChecks();
  runImageQualityChecks();
}

function uniqueCompetitionsBySlug(competitions) {
  const seen = new Set();
  return competitions.filter((competition) => {
    const slug = shared.getCompetitionSlug(competition);
    if (seen.has(slug)) {
      return false;
    }

    seen.add(slug);
    return true;
  });
}

function getGeneratedRouteContexts(competitions, generatedBrandPages = []) {
  const categoryRouteContexts = shared.CATEGORY_SLUGS.map((slug) => ({
    type: "category",
    slug,
    path: `/category/${slug}/`,
  }));
  const activeTagRouteContexts = shared.TAG_SLUGS
    .filter((slug) => shared.getTagFilteredCompetitions(competitions, slug).length > 0)
    .map((slug) => ({ type: "tag", slug, path: `/tag/${slug}/` }));
  const hubRouteContexts = shared.HUB_SLUGS.map((slug) => ({
    type: "hub",
    slug,
    path: `/${slug}/`,
  }));
  const brandRouteContexts = generatedBrandPages.map((brandPage) => ({
    type: "brand",
    slug: brandPage.slug,
    path: brandPage.path,
  }));

  return [
    { type: "home", slug: "", path: "/" },
    ...categoryRouteContexts,
    ...activeTagRouteContexts,
    ...hubRouteContexts,
    { type: "brand-index", slug: "brands", path: "/brands/" },
    ...brandRouteContexts,
  ];
}

function renderSiteFooter() {
  return `<footer class="site-footer" aria-label="Site footer">
        <div class="site-footer__grid">
          <div>
            <p class="site-footer__title">Freehub</p>
            <p class="site-footer__text">
              Freehub lists South African competitions and links users to official promoter pages. We do not run the competitions or collect entries.
            </p>
          </div>
          <div>
            <p class="site-footer__title">Trust &amp; Safety</p>
            <nav class="site-footer__links" aria-label="Trust and safety links">
              <a href="/how-we-verify-competitions/">How we check listings</a>
              <a href="/how-to-enter-competitions-safely/">Enter safely</a>
              <a href="/legit-competitions-south-africa/">Legit competition guide</a>
              <a href="/competition-closing-date-checklist/">Closing date checklist</a>
              <a href="/competition-entry-cost-labels/">Entry cost labels</a>
              <a href="/till-slip-competitions-south-africa/">Till slip competitions</a>
              <a href="/whatsapp-competitions-south-africa/">WhatsApp competitions</a>
              <a href="/app-competitions-south-africa/">App competitions</a>
              <a href="/fake-competition-winner-messages/">Fake winner messages</a>
              <a href="/purchase-required-competitions-explained/">Purchase required guide</a>
              <a href="/report-a-competition/">Report a competition</a>
            </nav>
          </div>
          <div>
            <p class="site-footer__title">Explore Competitions</p>
            <nav class="site-footer__links" aria-label="Explore competition hubs">
              <a href="/competitions/">All competitions</a>
              <a href="/new-competitions-south-africa/">New competitions</a>
              <a href="/win-a-car/">Win a car</a>
              <a href="/free-competitions/">Free competitions</a>
              <a href="/competitions-ending-soon/">Ending soon</a>
              <a href="/purchase-required-competitions/">Purchase required</a>
              <a href="/paid-entry-competitions/">Paid entry</a>
              <a href="${escapeAttribute(WHATSAPP_CHANNEL_URL)}" target="_blank" rel="noopener noreferrer">WhatsApp channel</a>
              <a href="/brands/">Browse by brand</a>
            </nav>
          </div>
          <div>
            <p class="site-footer__title">Site</p>
            <nav class="site-footer__links" aria-label="Site links">
              <a href="/about/">About</a>
              <a href="/contact/">Contact</a>
              <a href="/privacy-policy/">Privacy policy</a>
              <a href="/terms-of-use/">Terms of use</a>
            </nav>
          </div>
        </div>
      </footer>`;
}

function renderStatusPlaceholders() {
  return `<section id="loadingState" class="state-card state-card--hidden" aria-live="polite"></section>

        <section
          id="errorState"
          class="state-card state-card--hidden state-card--error"
          aria-live="assertive"
        ></section>`;
}

const CATEGORY_FALLBACK_STYLES = {
  Cash: { start: "#0f766e", end: "#14b8a6", accent: "#99f6e4" },
  Cars: { start: "#1d4ed8", end: "#60a5fa", accent: "#dbeafe" },
  Holidays: { start: "#c2410c", end: "#fb923c", accent: "#ffedd5" },
  Tech: { start: "#4338ca", end: "#818cf8", accent: "#e0e7ff" },
  Vouchers: { start: "#be123c", end: "#fb7185", accent: "#ffe4e6" },
};
const CATEGORY_FALLBACK_IMAGES = {
  Cars: "https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1600&q=80",
  Cash: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1600&q=80",
  Holidays: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
  Tech: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=80",
  Vouchers: "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1600&q=80",
};

function getCompetitionImageUrl(competition) {
  if (competition && competition.image) {
    return competition.image;
  }

  return getBrandAssociatedImage(competition);
}

function getMetadataImageUrl(competition) {
  if (competition && competition.image) {
    return competition.image;
  }

  const brandImage = getBrandAssociatedImage(competition);
  return brandImage || shared.DEFAULT_OG_IMAGE;
}

function getCollectionMetadataImageUrl(competitions) {
  const firstCompetitionWithImage = competitions.find((competition) => competition.image);
  return getMetadataImageUrl(firstCompetitionWithImage);
}

function buildBrandFallbackImage(competition) {
  const category = competition.category || "Competition";
  return CATEGORY_FALLBACK_IMAGES[category] || shared.DEFAULT_OG_IMAGE;
}

function splitBrandLines(brand) {
  const words = brand.split(/\s+/).filter(Boolean);

  if (words.length <= 2) {
    return [brand, ""];
  }

  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(" "), words.slice(midpoint).join(" ")];
}

function buildBrandImageLookup(competitions) {
  const lookup = new Map();

  competitions.forEach((competition) => {
    if (!competition || !competition.image) {
      return;
    }

    const sourceDomainKey = normalizeImageLookupKey(competition.sourceDomain);
    const brandKey = normalizeImageLookupKey(competition.brand);

    if (sourceDomainKey && !lookup.has(sourceDomainKey)) {
      lookup.set(sourceDomainKey, competition.image);
    }

    if (brandKey && !lookup.has(brandKey)) {
      lookup.set(brandKey, competition.image);
    }
  });

  return lookup;
}

function getBrandAssociatedImage(competition) {
  if (!competition) {
    return "";
  }

  const sourceDomainKey = normalizeImageLookupKey(competition.sourceDomain);
  if (sourceDomainKey && brandImageLookup.has(sourceDomainKey)) {
    return brandImageLookup.get(sourceDomainKey);
  }

  const brandKey = normalizeImageLookupKey(competition.brand);
  if (brandKey && brandImageLookup.has(brandKey)) {
    return brandImageLookup.get(brandKey);
  }

  return "";
}

function normalizeImageLookupKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");
}

function isEndingSoonHub(routeContext) {
  return routeContext.type === "hub" && routeContext.slug === "competitions-ending-soon";
}

function isWinACarHub(routeContext) {
  return routeContext.type === "hub" && routeContext.slug === "win-a-car";
}

function isFreeCompetitionsHub(routeContext) {
  return routeContext.type === "hub" && routeContext.slug === "free-competitions";
}

function isFlagshipSeoHub(routeContext) {
  return isEndingSoonHub(routeContext) || isWinACarHub(routeContext);
}

function renderUpdatedNotice() {
  return `<p class="hero__updated">Updated: ${escapeHtml(shared.formatDate(BUILD_DATE_ISO))}</p>`;
}

function renderHeroActions(actions = []) {
  if (!Array.isArray(actions) || actions.length === 0) {
    return "";
  }

  return `<div class="hero__actions">
              ${actions
                .map((action) => {
                  const className = action.className || "btn--secondary";
                  const target = action.target ? ` target="${escapeAttribute(action.target)}"` : "";
                  const rel = action.rel ? ` rel="${escapeAttribute(action.rel)}"` : "";
                  const extraAttributes = action.attributes ? ` ${action.attributes}` : "";

                  return `<a class="btn ${escapeAttribute(className)}" href="${escapeAttribute(
                    action.href
                  )}"${target}${rel}${extraAttributes}>${escapeHtml(action.label)}</a>`;
                })
                .join("\n              ")}
            </div>`;
}

function renderTrustRow(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return "";
  }

  return `<div class="trust-row" aria-label="Trust signals">
              ${items.map((item) => `<span class="trust-row__item">${escapeHtml(item)}</span>`).join("\n              ")}
            </div>`;
}

function renderModernHero({
  className = "",
  eyebrow = "Freehub discovery",
  heading,
  intro,
  headingId = "",
  introId = "",
  updatedMarkup = "",
  actions = [],
  trustItems = [],
  previewMarkup = "",
}) {
  const headingAttribute = headingId ? ` id="${escapeAttribute(headingId)}"` : "";
  const introAttribute = introId ? ` id="${escapeAttribute(introId)}"` : "";
  const safeClassName = className ? ` ${className}` : "";
  const updatedSection = updatedMarkup ? `\n            ${updatedMarkup}` : "";
  const actionsMarkup = renderHeroActions(actions);
  const actionsSection = actionsMarkup ? `\n            ${actionsMarkup}` : "";
  const trustMarkup = renderTrustRow(trustItems);
  const trustSection = trustMarkup ? `\n            ${trustMarkup}` : "";
  const previewSection = previewMarkup ? `\n          ${previewMarkup}` : "";

  return `<header class="hero hero--collection hero--modern${safeClassName}">
        <div class="hero__layout">
          <div class="hero__copy">
            <p class="eyebrow">${escapeHtml(eyebrow)}</p>
            <h1${headingAttribute}>${escapeHtml(heading)}</h1>
            <p class="hero__text"${introAttribute}>${escapeHtml(intro)}</p>${updatedSection}${actionsSection}${trustSection}
          </div>${previewSection}
        </div>
      </header>`;
}

function renderCollectionHero(routeContext, pageCopy, competitions) {
  const flagship = isFlagshipSeoHub(routeContext);
  const actions = flagship ? getFlagshipHeroActions(routeContext) : getCollectionHeroActions(routeContext);
  const trustItems = flagship ? getFlagshipTrustItems(routeContext) : getCollectionTrustItems(routeContext);
  const previewCopy = getCollectionPreviewCopy(routeContext, pageCopy);
  const previewMarkup = renderHeroPreviewPanel(competitions, {
    title: previewCopy.title,
    intro: previewCopy.intro,
    className: "hero-preview-panel--collection",
  });
  const className = [
    flagship ? "hero--flagship" : "hero--standard",
    previewMarkup ? "hero--with-preview" : "hero--no-preview",
    routeContext.slug ? `hero--${routeContext.slug}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return renderModernHero({
    className,
    eyebrow: "Freehub discovery",
    heading: pageCopy.heading,
    intro: pageCopy.intro,
    headingId: "pageTitle",
    introId: "pageIntro",
    updatedMarkup: renderUpdatedNotice(),
    actions,
    trustItems,
    previewMarkup,
  });
}

function getCollectionHeroActions(routeContext) {
  const actions = [{ label: "View Listings", href: "#competitionsGrid", className: "btn--primary" }];

  if (routeContext.type !== "hub" || routeContext.slug !== "competitions") {
    actions.push({ label: "All Competitions", href: "/competitions/", className: "btn--secondary" });
  }

  if (routeContext.type === "category") {
    actions.push({ label: "Ending Soon", href: "/competitions-ending-soon/", className: "btn--secondary" });
  }

  if (routeContext.type === "brand") {
    actions.push({ label: "Browse Brands", href: "/brands/", className: "btn--secondary" });
  }

  return actions.slice(0, 3);
}

function getCollectionTrustItems(routeContext) {
  if (routeContext.type === "brand") {
    return ["Active brand page", "Official source links", "Freehub is not the promoter"];
  }

  if (routeContext.type === "category") {
    return ["Published listings", "Official source links", "Freehub is not the promoter"];
  }

  if (routeContext.type === "tag") {
    return ["Filtered active listings", "Official source links", "Freehub does not collect entries"];
  }

  return ["Published competitions", "Official source links", "Freehub is not the promoter"];
}

function getCollectionPreviewCopy(routeContext, pageCopy) {
  if (isWinACarHub(routeContext)) {
    return {
      title: "Vehicle Prize Watch",
      intro: "Published car and vehicle prizes with official entry routes.",
    };
  }

  if (isEndingSoonHub(routeContext)) {
    return {
      title: "Closing Soon Watch",
      intro: "Nearest active deadlines from the current Freehub data.",
    };
  }

  if (routeContext.type === "category") {
    return {
      title: `${pageCopy.heading} Watch`,
      intro: "Active listings from this category with prize, deadline and entry cues.",
    };
  }

  if (routeContext.type === "brand") {
    return {
      title: "Brand Prize Watch",
      intro: "Current published competitions from this brand or promoter.",
    };
  }

  return {
    title: "Prize Watch",
    intro: "Active listings worth checking before you click through.",
  };
}

function getFlagshipHeroActions(routeContext) {
  if (isWinACarHub(routeContext)) {
    return [
      { label: "View Car Competitions", href: "#competitionsGrid", className: "btn--primary" },
      { label: "Free Entry Picks", href: "/free-competitions/", className: "btn--secondary" },
    ];
  }

  return [
    { label: "View Closing Soon", href: "#competitionsGrid", className: "btn--primary" },
    { label: "All Competitions", href: "/competitions/", className: "btn--secondary" },
  ];
}

function getFlagshipTrustItems(routeContext) {
  if (isWinACarHub(routeContext)) {
    return ["Published listings", "Vehicle prize focus", "Freehub is not the promoter"];
  }

  return ["Active listings only", "Sorted by closing date", "Official source links"];
}

function renderHubIntroEditorial(routeContext) {
  if (isEndingSoonHub(routeContext)) {
    return `<section class="seo-copy-block seo-copy-block--intro" aria-label="About competitions ending this week">
          <h2 class="seo-copy-block__title">Current competitions ending this week</h2>
          <div class="seo-copy-block__content hub-editorial">
            <section class="hub-editorial__section">
              <p>This page is built for South African competitions with near deadlines. Listings are sorted by closing date so the most urgent opportunities appear first.</p>
              <p>Freehub sources listing details from official promoter pages where available, including the entry route, closing date, prize type and any visible cost signal. Freehub does not run the competitions, collect entries, choose winners or process payments.</p>
              <p>Some competitions may require purchases, receipts, app installs, paid tickets, accounts, loyalty cards or other qualifying actions. Needs-verification and expired listings are kept out of this page, but you should still confirm the full terms on the official promoter source before entering.</p>
            </section>
          </div>
        </section>`;
  }

  if (isWinACarHub(routeContext)) {
    return `<section class="seo-copy-block seo-copy-block--intro" aria-label="About win a car competitions">
          <h2 class="seo-copy-block__title">Current South African vehicle giveaways in one place</h2>
          <div class="seo-copy-block__content hub-editorial">
            <section class="hub-editorial__section">
              <p>This hub lists current South African car competitions, vehicle giveaways and win-a-car promotions from official promoter sources. Only active published listings are shown here, sorted by closing date so nearer deadlines are easier to spot.</p>
              <p>Freehub is not the promoter and does not collect entries, sell tickets, choose winners or handle prize delivery. We organise the listing details and link you to the official promoter so you can check the vehicle model, entry method, cost, draw rules and closing date before entering.</p>
            </section>
          </div>
        </section>`;
  }

  if (isFreeCompetitionsHub(routeContext)) {
    return `<section class="seo-copy-block seo-copy-block--intro" aria-label="About free competitions">
          <h2 class="seo-copy-block__title">No-purchase competitions from official sources</h2>
          <div class="seo-copy-block__content hub-editorial">
            <section class="hub-editorial__section">
              <p>This page is for current South African competitions and giveaways that do not require a product purchase, minimum spend or paid ticket to enter. Listings must pass Freehub's strict free-entry filter before appearing here.</p>
              <p>Some free competitions still use an online form, WhatsApp message, social media action, radio entry, survey, quote request or account sign-in where the official terms allow it. Freehub does not run these competitions or collect entries; use the official promoter link on each listing to enter.</p>
            </section>
          </div>
        </section>`;
  }

  return "";
}

function renderEndingSoonEditorial(routeContext) {
  if (!isEndingSoonHub(routeContext)) {
    return "";
  }

  return `<section class="seo-copy-block seo-copy-block--hub" aria-label="Guide to competitions ending soon">
          <h2 class="seo-copy-block__title">How to use competitions ending this week</h2>
          <div class="seo-copy-block__content hub-editorial">
            <section class="hub-editorial__section">
              <h3>Why ending-soon competitions matter</h3>
              <p>Competition entry forms often close at a fixed date and time, and some promoters remove the form as soon as the deadline passes. Checking closing-soon listings first helps you avoid missing current competitions while they are still open.</p>
              <p>This page keeps the focus on published, non-expired listings. For the full active index, browse the wider <a href="/competitions/">competitions</a> hub.</p>
              <p>If you want a narrower starting point, compare <a href="/free-competitions/">free competitions</a>, <a href="/purchase-required-competitions/">purchase required competitions</a>, <a href="/win-a-car/">win-a-car competitions</a>, or category pages for <a href="/category/cars/">cars</a>, <a href="/category/cash/">cash</a>, <a href="/category/vouchers/">vouchers</a>, <a href="/category/holidays/">holidays</a> and <a href="/category/tech/">tech</a>.</p>
            </section>
            <section class="hub-editorial__section">
              <h3>What to check before entering</h3>
              <ul class="hub-editorial__list">
                <li>Confirm the closing date, closing time and timezone on the official promoter page.</li>
                <li>Check eligibility, age limits, regional limits, purchase rules and how winners are contacted.</li>
                <li>Use the official promoter link from each Freehub listing instead of unofficial social comments or copied forms.</li>
                <li>Use the <a href="/competition-closing-date-checklist/">competition closing date checklist</a> when a deadline is close.</li>
              </ul>
            </section>
            <section class="hub-editorial__section">
              <h3>Understanding entry labels</h3>
              <ul class="hub-editorial__list">
                <li><strong>Free entry:</strong> no required product purchase or paid ticket is shown in the listing.</li>
                <li><strong>Purchase required:</strong> you may need a qualifying product, minimum spend, receipt or proof of purchase.</li>
                <li><strong>Paid entry:</strong> the promotion appears to require a paid ticket, raffle entry or similar paid participation.</li>
                <li><strong>App required:</strong> entry is completed through the promoter's official app or app-linked flow.</li>
                <li><strong>Till slip required:</strong> keep the receipt because it may be needed for entry validation or prize claims.</li>
                <li><strong>Account required:</strong> you may need a promoter, retailer, loyalty or platform account before entry.</li>
              </ul>
              <p>For a fuller breakdown, read the <a href="/competition-entry-cost-labels/">competition entry cost labels guide</a>.</p>
            </section>
            <section class="hub-editorial__section">
              <h3>How Freehub verifies competitions</h3>
              <p>Freehub checks that a listing has enough source information to publish, including a promoter source, closing date, prize cue and entry method where available. Listings that are unclear can be held for verification instead of appearing on public hub pages.</p>
              <p>Verification does not mean Freehub runs the competition or guarantees the prize. The official promoter remains responsible for entries, winner selection and prize fulfilment. Read more about <a href="/how-we-verify-competitions/">how Freehub checks listings</a>.</p>
            </section>
          </div>
        </section>`;
}

function renderWinACarEditorial(routeContext) {
  if (!isWinACarHub(routeContext)) {
    return "";
  }

  return `<section class="seo-copy-block seo-copy-block--hub" aria-label="Guide to win a car competitions">
          <h2 class="seo-copy-block__title">How to compare car competitions</h2>
          <div class="seo-copy-block__content hub-editorial hub-editorial--split">
            <section class="hub-editorial__section">
              <h3>How car competitions usually work</h3>
              <p>Vehicle giveaways attract strong interest because the prize is practical, high value and easy to understand. South African car competitions can include hatchbacks, SUVs, bakkies, luxury vehicles, fuel-linked prizes or cash alternatives.</p>
              <p>Promoters often use online forms, till-slip uploads, unique codes, loyalty-card swipes, finance applications, charity tickets, app tasks, social entries, WhatsApp flows or in-store product purchases. The official terms explain which entries qualify.</p>
            </section>
            <section class="hub-editorial__section">
              <h3>Free, purchase-required and paid-entry mechanics</h3>
              <p>Free-entry car competitions usually involve an online form, account action, loyalty-card step or brand promotion. Purchase-required competitions may need a qualifying product, minimum spend, till slip, invoice or rewards-card swipe. Paid-entry competitions may use tickets, raffle-style entries or a paid campaign platform.</p>
              <p>Compare free listings with <a href="/free-competitions/">free competitions</a>, purchase mechanics with <a href="/purchase-required-competitions/">purchase required competitions</a>, or ticket mechanics with <a href="/paid-entry-competitions/">paid entry competitions</a>.</p>
            </section>
            <section class="hub-editorial__section">
              <h3>What to check before entering</h3>
              <ul class="hub-editorial__list">
                <li>The exact vehicle model, derivative, colour, year and whether a cash alternative is offered.</li>
                <li>Whether you need a purchase, till slip, account, rewards card, app install, SMS, WhatsApp entry or paid ticket.</li>
                <li>The closing date, draw date, winner notification method and how long the promoter gives winners to respond.</li>
                <li>Whether you need a valid driver's licence, South African ID, proof of residence or a specific province or store purchase.</li>
                <li>Whether registration, licensing, insurance, delivery, collection, transfer fees, roadworthy costs, fuel or taxes are included.</li>
              </ul>
            </section>
            <section class="hub-editorial__section">
              <h3>Keep proof and read the official terms</h3>
              <p>If a car competition needs a purchase, keep the original till slip, invoice, code or app receipt until winners are announced and prizes are awarded. Promoters may reject entries if proof is missing, dated outside the campaign period or does not match the qualifying products.</p>
              <p>Read the official terms before entering because car prizes often have extra eligibility rules, including South African residency, age limits, driver's licence requirements, insurance conditions or nominated-driver rules.</p>
            </section>
            <section class="hub-editorial__section">
              <h3>Avoid unofficial winner fees</h3>
              <p>Be careful with messages that ask for unofficial release fees, banking passwords, card PINs, remote access apps or payment to claim a car prize. If you receive a winner message, verify it through the promoter's official website or support channel before responding.</p>
              <p>You can also compare urgent vehicle listings on <a href="/competitions-ending-soon/">competitions ending soon</a>, browse all <a href="/competitions/">current competitions</a>, or use related prize categories such as <a href="/category/cars/">cars</a>, <a href="/category/cash/">cash</a> and <a href="/category/vouchers/">vouchers</a>.</p>
            </section>
          </div>
        </section>`;
}

function renderFreeCompetitionsEditorial(routeContext) {
  if (!isFreeCompetitionsHub(routeContext)) {
    return "";
  }

  return `<section class="seo-copy-block seo-copy-block--hub" aria-label="Guide to free competitions">
          <h2 class="seo-copy-block__title">How to compare free competitions</h2>
          <div class="seo-copy-block__content hub-editorial hub-editorial--split">
            <section class="hub-editorial__section">
              <h3>What free to enter means on Freehub</h3>
              <p>Freehub treats a free competition as a listing where the available source information shows no required product purchase, paid ticket, minimum spend, till slip, subscription billing, SMS or USSD cost to enter.</p>
              <p>If the cost route is unclear, the listing should not appear on this page. Browse the full <a href="/competitions/">competitions</a> hub when you want to compare every active published listing.</p>
            </section>
            <section class="hub-editorial__section">
              <h3>Free entry vs purchase required</h3>
              <p>A purchase-required competition can still be legitimate, but it belongs on a different page because users must buy something, keep proof of purchase, swipe a loyalty card or meet a spend threshold. Free-entry listings should not require those actions.</p>
              <p>Compare purchase mechanics separately on <a href="/purchase-required-competitions/">purchase required competitions</a>, or scan urgent deadlines on <a href="/competitions-ending-soon/">competitions ending soon</a>.</p>
            </section>
            <section class="hub-editorial__section">
              <h3>Common free-entry methods</h3>
              <ul class="hub-editorial__list">
                <li>Online forms on the promoter's official website.</li>
                <li>WhatsApp prompts or social media actions where the official source confirms the route.</li>
                <li>Radio entries, surveys, quote requests or skill entries that do not require a purchase.</li>
                <li>App or account forms only where the entry is clearly free and not materially conditional or unclear.</li>
              </ul>
            </section>
            <section class="hub-editorial__section">
              <h3>What to check before entering</h3>
              <ul class="hub-editorial__list">
                <li>Confirm the promoter, prize, closing date, winner contact method and eligibility rules.</li>
                <li>Check whether standard data, platform access, age, region, account or privacy terms apply.</li>
                <li>Use the official promoter link rather than copied forms, comment threads or unofficial messages.</li>
                <li>Read the official terms even when the listing is marked free entry.</li>
              </ul>
            </section>
            <section class="hub-editorial__section">
              <h3>Avoid unofficial winner fees</h3>
              <p>A free competition should not require unofficial release fees, banking passwords, card PINs or remote access apps to claim a prize. Verify any winner message through the promoter's official website or support channel before responding.</p>
              <p>Freehub does not collect entries, choose winners or manage prize fulfilment. You can also browse related prize categories such as <a href="/category/cash/">cash</a>, <a href="/category/vouchers/">vouchers</a>, <a href="/category/tech/">tech</a> and <a href="/category/holidays/">holidays</a>.</p>
            </section>
          </div>
        </section>`;
}

function renderDeadlineBuckets(routeContext, competitions) {
  if (!isEndingSoonHub(routeContext)) {
    return "";
  }

  const bucketDefinitions = [
    {
      title: "Closing today",
      description: "Last-day competitions to check first.",
      filter: (competition) => getBuildDaysUntilClosing(competition.closingDate) === 0,
    },
    {
      title: "Closing tomorrow",
      description: "Near-deadline competitions with one more day to review.",
      filter: (competition) => getBuildDaysUntilClosing(competition.closingDate) === 1,
    },
    {
      title: "Closing this weekend",
      description: "Weekend deadlines can be easy to miss.",
      filter: (competition) => {
        const daysUntilClosing = getBuildDaysUntilClosing(competition.closingDate);
        return daysUntilClosing >= 0 && daysUntilClosing <= 7 && isWeekendDate(competition.closingDate);
      },
    },
    {
      title: "Closing in the next 7 days",
      description: "A quick scan of competitions with the most urgent deadlines.",
      filter: (competition) => {
        const daysUntilClosing = getBuildDaysUntilClosing(competition.closingDate);
        return daysUntilClosing >= 0 && daysUntilClosing <= 7;
      },
    },
  ];

  const bucketMarkup = bucketDefinitions
    .map((bucket) => {
      const matches = competitions.filter(bucket.filter).slice(0, 5);

      if (matches.length === 0) {
        return "";
      }

      return `<div class="deadline-buckets__group">
              <p class="deadline-buckets__heading">${escapeHtml(bucket.title)}</p>
              <p class="deadline-buckets__text">${escapeHtml(bucket.description)}</p>
              <div class="internal-links__list">
                ${matches
                  .map(
                    (competition) =>
                      `<a class="internal-links__link" href="${escapeAttribute(shared.getCompetitionPath(competition))}">${escapeHtml(
                        shared.getCardHeadline(competition)
                      )}</a>`
                  )
                  .join("\n                ")}
              </div>
            </div>`;
    })
    .filter(Boolean)
    .join("\n            ");

  if (!bucketMarkup) {
    return "";
  }

  return `<section class="internal-links deadline-buckets" aria-label="Competitions by closing window">
          <p class="internal-links__title">Quick Deadline Paths</p>
          <div class="deadline-buckets__grid">
            ${bucketMarkup}
          </div>
        </section>`;
}

function renderCategoryEditorial(routeContext, competitions) {
  if (routeContext.type !== "category") {
    return "";
  }

  const editorial = getCategoryEditorial(routeContext.slug, competitions);

  if (!editorial) {
    return "";
  }

  return `<section class="seo-copy-block seo-copy-block--category" aria-label="${escapeAttribute(editorial.ariaLabel)}">
          <h2 class="seo-copy-block__title">${escapeHtml(editorial.title)}</h2>
          <div class="seo-copy-block__content hub-editorial">
            ${editorial.sections
              .map(
                (section) => `<section class="hub-editorial__section">
              <h3>${escapeHtml(section.heading)}</h3>
              ${section.paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join("\n              ")}
            </section>`
              )
              .join("\n            ")}
          </div>
        </section>`;
}

function getCategoryEditorial(slug, competitions) {
  const categoryName = shared.CATEGORY_COPY[slug] ? shared.CATEGORY_COPY[slug].category : "Competition";
  const liveCount = competitions.length;
  const liveCopy = liveCount === 1 ? "1 live listing" : `${liveCount} live listings`;
  const editorials = {
    cars: {
      ariaLabel: "Guide to car competitions in South Africa",
      title: "How to choose a car competition in South Africa",
      sections: [
        {
          heading: "Why car competitions get so much search demand",
          paragraphs: [
            `Car giveaways are high-value, practical prizes, so they attract heavy interest from South African searchers. This page currently groups ${escapeHtml(liveCopy)} with visible closing dates, source links and entry-cost labels.`,
            `If you only want vehicle listings, compare this category with the dedicated <a href="/win-a-car/">win-a-car competitions</a> hub and the <a href="/competitions-ending-soon/">ending-soon competitions</a> page.`,
          ],
        },
        {
          heading: "What to check before entering",
          paragraphs: [
            "Read the promoter terms for the exact vehicle model, prize value, draw date, qualifying product, store list, rewards-card rule, licence requirement and handover conditions.",
            `If a campaign needs proof of purchase, keep the receipt and use the <a href="/till-slip-competitions-south-africa/">till slip competitions guide</a> before entering.`,
          ],
        },
        {
          heading: "Freehub's role",
          paragraphs: [
            "Freehub does not run the car competitions or choose winners. We help you compare the listings and then send you to the official promoter source.",
          ],
        },
      ],
    },
    cash: {
      ariaLabel: "Guide to cash competitions in South Africa",
      title: "How to compare cash competitions",
      sections: [
        {
          heading: "What cash competitions are",
          paragraphs: [
            `Cash competitions are prize draws, giveaways or promotions where the reward is money, a cash voucher, an instant cash reward or a cash-style payout. This page currently groups ${escapeHtml(liveCopy)} from the active published Freehub data with visible closing dates, entry labels and official promoter links.`,
            "Common cash prize formats include once-off cash prizes, weekly cash draws, instant cash rewards, grand-prize cash draws and campaign-linked money giveaways.",
          ],
        },
        {
          heading: "Free entry and purchase-required cash prizes",
          paragraphs: [
            "Not every cash competition is free. Some use a free online form, social action or account flow, while others require a qualifying purchase, receipt, rewards-card swipe, app action, USSD session, WhatsApp entry, paid ticket or minimum spend.",
            `Use the labels on each listing to separate free entry from purchase-required or paid-entry mechanics. You can also compare <a href="/free-competitions/">free competitions</a> and <a href="/purchase-required-competitions/">purchase required competitions</a> separately.`,
          ],
        },
        {
          heading: "Entry methods to check",
          paragraphs: [
            "Cash promotions can use WhatsApp, USSD, online forms, app flows, account dashboards, till-slip uploads, in-store entry boxes or automatic loyalty-card entries. Check whether the promoter requires an official app, account, rewards card, receipt or specific product before entering.",
            "If a till slip or proof of purchase is required, keep the original receipt until the draw and prize-claim process are finished. Promoters may ask for it to verify that the purchase happened during the campaign period.",
          ],
        },
        {
          heading: "Official terms and cash prize safety",
          paragraphs: [
            "Read the official terms for the prize amount, draw date, tax or banking requirements, eligibility, winner-contact process, payment method and whether the cash prize can be substituted or split.",
            `Do not pay unofficial winner fees, release fees, admin fees, courier fees or delivery fees to claim a cash prize. For safer entry habits, read the <a href="/fake-competition-winner-messages/">fake winner message guide</a> before responding to any prize claim.`,
          ],
        },
        {
          heading: "Freehub's role",
          paragraphs: [
            `Freehub does not run cash competitions, collect entries, choose winners, contact winners or pay prizes. We organise active published listings and link to official promoter sources; you can also browse <a href="/competitions/">all current competitions</a>, <a href="/competitions-ending-soon/">competitions ending soon</a>, <a href="/win-a-car/">win-a-car competitions</a>, <a href="/category/vouchers/">voucher competitions</a>, <a href="/category/tech/">tech competitions</a> and <a href="/category/holidays/">holiday competitions</a>.`,
          ],
        },
      ],
    },
    holidays: {
      ariaLabel: "Guide to holiday competitions in South Africa",
      title: "How to compare holiday competitions",
      sections: [
        {
          heading: "What counts as a holiday competition?",
          paragraphs: [
            `Holiday competitions are prize draws, giveaways or promotions where the reward is travel or accommodation-led. This page currently groups ${escapeHtml(liveCopy)} from the active published Freehub data with visible closing dates, entry labels and official promoter links.`,
            "Common holiday prize types include local holidays, weekend getaways, hotel stays, resort breaks, accommodation vouchers, flights or travel packages, travel spending money and experience-based trips.",
          ],
        },
        {
          heading: "What to check before entering",
          paragraphs: [
            "Read the promoter terms for the closing date, eligibility rules, fixed travel dates, departure city, booking process, companion rules and whether the prize is transferable.",
            "Check whether flights are included, whether the prize is accommodation-only, whether meals, transfers, spending money, taxes, visas or resort fees are excluded, and whether a purchase, booking, receipt, loyalty account or app download is required.",
            `If you only want no-cost routes, compare <a href="/free-competitions/">free competitions</a>. If a listing needs a qualifying purchase, booking, receipt or minimum spend, compare it with <a href="/purchase-required-competitions/">purchase required competitions</a>.`,
          ],
        },
        {
          heading: "Freehub's role",
          paragraphs: [
            `Freehub does not run holiday competitions, collect entries, choose winners, book travel or manage prize fulfilment. We organise active published listings and link to official promoter sources; you can also browse <a href="/competitions/">all current competitions</a>, <a href="/competitions-ending-soon/">competitions ending soon</a>, <a href="/category/cars/">car competitions</a>, <a href="/category/cash/">cash competitions</a>, <a href="/category/vouchers/">voucher competitions</a> and <a href="/category/tech/">tech competitions</a>.`,
            "Always enter through the official promoter link and read the full terms before submitting details. Prize details can change, and travel prizes often include date, availability, route, partner or redemption conditions.",
          ],
        },
      ],
    },
    tech: {
      ariaLabel: "Guide to tech competitions in South Africa",
      title: "How to compare tech competitions",
      sections: [
        {
          heading: "What tech competitions are",
          paragraphs: [
            `Tech competitions are prize draws, giveaways or promotions where the reward is technology-led, such as a device, electronics bundle, home entertainment prize or tech voucher. This page currently groups ${escapeHtml(liveCopy)} from the active published Freehub data with visible closing dates, entry labels and official promoter links.`,
            "Common tech prizes include phones, smartphones, TVs, gaming consoles, laptops, tablets, gadgets, electronics vouchers, appliances where the prize is electronics-led, and home entertainment bundles where the active listing supports that prize type.",
          ],
        },
        {
          heading: "Free entry and purchase-required tech prizes",
          paragraphs: [
            "Not every tech competition is free. Some use a free online form, social entry or account action, while others require a qualifying purchase, till slip, recharge, rewards-card swipe, app task, USSD session, WhatsApp entry, paid ticket or minimum spend.",
            `Use the label on each listing to separate free entry, purchase required, paid entry, account required, app required, rewards card required, till slip required, WhatsApp entry, USSD entry, online entry and in-store entry routes. You can also compare <a href="/free-competitions/">free competitions</a> and <a href="/purchase-required-competitions/">purchase required competitions</a> separately.`,
          ],
        },
        {
          heading: "Entry methods to check",
          paragraphs: [
            "Tech giveaways can use online forms, app flows, account dashboards, rewards-card profiles, WhatsApp prompts, USSD menus, till-slip uploads, in-store entries, social tasks or automatic qualifying-purchase entries. Check the official source before sharing personal details or installing an app.",
            `If an app is required, use the <a href="/app-competitions-south-africa/">app competitions guide</a> to check that you are using the official promoter app. If a purchase or receipt is required, keep the original proof until the draw and claim process are complete.`,
          ],
        },
        {
          heading: "Official terms and prize details",
          paragraphs: [
            "Read the official terms for the exact model, colour, storage size, bundle contents, voucher value, delivery method, warranty position, draw date, winner-contact process and whether the promoter may substitute the prize.",
            "Model details and substitution rules matter because a phone, TV, console or electronics bundle can vary widely by version, size, network status, accessories and availability.",
          ],
        },
        {
          heading: "Tech prize safety",
          paragraphs: [
            "Do not pay unofficial winner fees, delivery fees, release fees or admin fees to claim a gadget, phone, TV or electronics prize. Verify winner messages through the promoter's official website, app, social page or support channel before responding.",
            `Freehub does not run tech competitions, collect entries, choose winners, supply prizes or manage prize delivery. We organise active published listings and link to official promoter sources; you can also browse <a href="/competitions/">all current competitions</a>, <a href="/competitions-ending-soon/">competitions ending soon</a>, <a href="/win-a-car/">win-a-car competitions</a>, <a href="/category/cash/">cash competitions</a>, <a href="/category/vouchers/">voucher competitions</a> and <a href="/category/holidays/">holiday competitions</a>.`,
          ],
        },
      ],
    },
    vouchers: {
      ariaLabel: "Guide to voucher competitions in South Africa",
      title: "How to compare voucher competitions",
      sections: [
        {
          heading: "What voucher competitions are",
          paragraphs: [
            `Voucher competitions are prize draws or giveaways where the reward is a voucher, gift card, credit, store spend or similar redeemable value. This page currently groups ${escapeHtml(liveCopy)} across shopping voucher competitions, grocery voucher competitions, online shopping voucher competitions, retail voucher giveaways, account-linked offers and rewards-style promotions.`,
            "Common voucher prize types include retail vouchers, grocery vouchers, online shopping vouchers, beauty vouchers, food or restaurant vouchers, fuel vouchers and airtime or data vouchers where the active listing supports that prize type.",
          ],
        },
        {
          heading: "Free entry and purchase-required entries",
          paragraphs: [
            "Voucher giveaways can be free entry, purchase required, paid entry, account required, app required, rewards card required, till slip required, WhatsApp entry, online entry or in-store entry. Check the label on each card before opening the promoter page.",
            `If you only want no-cost routes, compare <a href="/free-competitions/">free competitions</a>. If a listing needs a qualifying product, receipt, rewards-card swipe or minimum spend, compare it with <a href="/purchase-required-competitions/">purchase required competitions</a>.`,
          ],
        },
        {
          heading: "What to check before entering",
          paragraphs: [
            "Read the official terms for the voucher value, expiry date, redemption rules, participating stores, exclusions, delivery method, draw date, winner-contact process and whether the voucher can be split, transferred or converted to cash.",
            "Do not pay unofficial winner, courier, delivery, admin or release fees to claim a voucher prize. Verify prize messages through the promoter's official website, social page, app or support channel before sharing personal information.",
          ],
        },
        {
          heading: "Takealot voucher prizes",
          paragraphs: [
            "Where an active verified partner campaign offers Takealot vouchers, Freehub describes the prize as a Takealot voucher prize and keeps the promoter separate. Freehub does not describe partner promotions as Takealot-run campaigns unless the official source supports that claim.",
            `For urgent options, also compare <a href="/competitions-ending-soon/">competitions ending soon</a>, <a href="/competitions/">all current competitions</a>, <a href="/win-a-car/">win-a-car competitions</a>, <a href="/category/cash/">cash competitions</a>, <a href="/category/tech/">tech competitions</a> and <a href="/category/holidays/">holiday competitions</a>.`,
          ],
        },
        {
          heading: "Freehub's role",
          paragraphs: [
            "Freehub does not run voucher competitions, collect entries, choose winners or manage voucher fulfilment. Each listing points you to the official promoter source, where the entry must be completed and the current terms apply.",
          ],
        },
      ],
    },
  };

  return (
    editorials[slug] || {
      ariaLabel: `Guide to ${categoryName.toLowerCase()} competitions`,
      title: `How to compare ${categoryName.toLowerCase()} competitions`,
      sections: [
        {
          heading: "Check the basics first",
          paragraphs: [
            `This page currently groups ${escapeHtml(liveCopy)} with closing dates, entry methods and official source links where available.`,
          ],
        },
      ],
    }
  );
}

function getBuildDaysUntilClosing(dateString) {
  const today = new Date(`${BUILD_DATE_ISO}T00:00:00`);
  const closingDate = new Date(dateString);

  if (Number.isNaN(closingDate.getTime())) {
    return Number.POSITIVE_INFINITY;
  }

  closingDate.setHours(0, 0, 0, 0);

  return Math.ceil((closingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function isWeekendDate(dateString) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const day = date.getDay();
  return day === 0 || day === 6;
}

function getCollectionFaqItems(routeContext) {
  if (isEndingSoonHub(routeContext)) {
    return [
      {
        question: "Are these competitions free to enter?",
        answer:
          "Not always. Some competitions are free entry, while others require a purchase, paid entry, an account, an app or a till slip. Check the cost label on Freehub and confirm the full terms on the official promoter page.",
      },
      {
        question: "How often is this page updated?",
        answer:
          "Freehub updates competition listings regularly and regenerates this page during site updates. The updated date near the top shows when the page was last built.",
      },
      {
        question: "Does Freehub run these competitions?",
        answer:
          "No. Freehub is a competition discovery site. The promoter runs the competition, accepts entries, chooses winners and handles prize fulfilment.",
      },
      {
        question: "What should I check before entering?",
        answer:
          "Check the closing date and time, eligibility rules, entry cost, purchase or till slip requirements, official terms, privacy requirements and the promoter's real entry link.",
      },
      {
        question: "What happens when a competition expires?",
        answer:
          "Expired competitions are removed from live competition hub pages and should no longer appear as current opportunities. Maintenance may archive or mark listings as closed depending on the data state.",
      },
    ];
  }

  if (isWinACarHub(routeContext)) {
    return [
      {
        question: "Are car competitions free to enter?",
        answer:
          "Some car competitions are free to enter, but others require a qualifying purchase, loyalty-card action, app step, paid ticket or proof of purchase. Check the Freehub cost label and confirm the latest terms on the official promoter page.",
      },
      {
        question: "Do I need to buy something to win a car?",
        answer:
          "Not always. Some vehicle giveaways use free online forms, while purchase-required campaigns may need a specific product, minimum spend, till slip, invoice or rewards-card swipe. The promoter terms are the source of truth.",
      },
      {
        question: "Does Freehub run these car competitions?",
        answer:
          "No. Freehub is a competition discovery site. The promoter runs the competition, accepts entries, chooses winners and handles prize fulfilment. Use the official promoter link on each listing to enter.",
      },
      {
        question: "What should I check before entering a car competition?",
        answer:
          "Check the closing date, vehicle model, entry method, cost, purchase or paid-ticket requirement, eligibility rules, licence or insurance conditions, winner contact process and whether registration, delivery or transfer costs are included.",
      },
      {
        question: "What happens when a car competition expires?",
        answer:
          "Expired car competitions are removed from active hub listings and should no longer appear as current opportunities. Freehub may archive or mark expired listings as inactive so users focus on live competitions.",
      },
    ];
  }

  if (isFreeCompetitionsHub(routeContext)) {
    return [
      {
        question: "Are these competitions really free to enter?",
        answer:
          "These listings pass Freehub's strict free-entry filter, which excludes purchase-required, paid-entry, paid-ticket, till-slip, SMS, USSD and unclear-cost competitions. Always confirm the latest terms on the official promoter page.",
      },
      {
        question: "What does no purchase required mean?",
        answer:
          "No purchase required means the available source information does not show a required product purchase, minimum spend, receipt, invoice, loyalty-card purchase or paid ticket before entry.",
      },
      {
        question: "Can a free competition still require a WhatsApp message or online form?",
        answer:
          "Yes. A competition can be free to enter and still use an official online form, WhatsApp prompt, social media action, radio entry, survey or similar no-purchase route.",
      },
      {
        question: "Does Freehub run these competitions?",
        answer:
          "No. Freehub is a competition discovery site. The promoter runs the competition, accepts entries, chooses winners and handles prize fulfilment. Use the official promoter link on each listing to enter.",
      },
      {
        question: "What should I check before entering a free competition?",
        answer:
          "Check the promoter name, closing date, prize, entry method, eligibility rules, privacy terms, winner contact process and whether any account, app, data or platform requirements apply.",
      },
    ];
  }

  if (routeContext.type === "hub" && routeContext.slug === "new-competitions-south-africa") {
    return [
      {
        question: "Are these all brand-new competitions?",
        answer:
          "This page highlights competitions that were recently checked or newly surfaced on Freehub. Always open the listing and official source to confirm the current entry period.",
      },
      {
        question: "How are new competitions sorted?",
        answer:
          "Freehub prioritises recently checked listings first, then uses closing dates to keep urgent opportunities visible.",
      },
      {
        question: "Can a new competition also be ending soon?",
        answer:
          "Yes. A competition can be newly checked and still close soon, especially when a promoter publishes a short campaign or Freehub discovers it close to the deadline.",
      },
      {
        question: "Does Freehub run these competitions?",
        answer:
          "No. Freehub lists competitions and links to official promoter pages. The promoter manages entries, winner selection and prize fulfilment.",
      },
    ];
  }

  if (routeContext.type !== "category") {
    return [];
  }

  const faqByCategory = {
    cars: [
      {
        question: "Are car competitions in South Africa free to enter?",
        answer:
          "Some car competitions are free entry, but many require a product purchase, till slip, rewards card, app action or paid ticket. Check the cost label and official terms before entering.",
      },
      {
        question: "What should I check before entering a win-a-car competition?",
        answer:
          "Check the closing date, promoter name, vehicle model, entry method, purchase rules, driver's licence requirements, delivery or registration conditions and the official source link.",
      },
      {
        question: "Why do some car competitions need a till slip?",
        answer:
          "Retail car giveaways often use a till slip, invoice or rewards card swipe as proof that you bought a qualifying product during the campaign period.",
      },
      {
        question: "Does Freehub choose the winners?",
        answer:
          "No. Freehub does not run car competitions, accept entries or choose winners. Enter through the official promoter page linked from each listing.",
      },
    ],
    cash: [
      {
        question: "Are cash competitions free to enter?",
        answer:
          "Some cash competitions are free to enter, while others require a purchase, receipt, app, account, rewards card, WhatsApp entry, USSD entry, paid ticket or qualifying action. Check the Freehub label and the official promoter terms before entering.",
      },
      {
        question: "What types of cash prizes can I win?",
        answer:
          "Cash prizes can include once-off cash payouts, weekly cash draws, instant cash rewards, grand-prize cash draws, voucher-style cash rewards and campaign-linked money giveaways where the active listing supports that prize type.",
      },
      {
        question: "Do I need to buy something to enter a cash competition?",
        answer:
          "Sometimes. Purchase-required cash competitions may need a qualifying product, minimum spend, till slip, rewards-card swipe or account action, while free-entry cash competitions should not require a purchase. The official terms are the source of truth.",
      },
      {
        question: "How do I avoid fake cash prize messages?",
        answer:
          "Use only official promoter links and contact channels. Do not share banking passwords, card PINs, one-time PINs or remote-access permissions, and do not pay unofficial winner, release, admin, courier or delivery fees to claim a prize.",
      },
      {
        question: "Does Freehub run these cash competitions?",
        answer:
          "No. Freehub is a competition discovery site. The promoter runs the competition, accepts entries, chooses winners and pays or fulfils cash prizes through its own official process.",
      },
    ],
    holidays: [
      {
        question: "Are holiday competitions free to enter?",
        answer:
          "Some holiday competitions are free to enter, while others may require a purchase, booking, account, app download, till slip, loyalty membership or paid entry. Check the Freehub label and the official promoter terms before entering.",
      },
      {
        question: "Does Freehub run these holiday competitions?",
        answer:
          "No. Freehub lists competitions and links to official promoter pages. The promoter runs the competition, accepts entries, chooses winners and fulfils the prize.",
      },
      {
        question: "What should I check before entering a travel competition?",
        answer:
          "Check the travel dates, whether flights, accommodation, meals, transfers or spending money are included, eligibility rules, closing date and full terms before entering.",
      },
      {
        question: "Are flights always included in holiday prizes?",
        answer:
          "No. Not all holiday prizes include flights. Some are accommodation-only, voucher-based or limited to local getaways, so check the official prize details before entering.",
      },
      {
        question: "What happens when a holiday competition expires?",
        answer:
          "Expired holiday competitions are removed from active public listings or no longer shown as live competitions, so users can focus on current prize draws.",
      },
    ],
    tech: [
      {
        question: "Are tech competitions free to enter?",
        answer:
          "Some tech competitions are free to enter, while others require a purchase, receipt, app, account, rewards card, WhatsApp entry, USSD entry, paid ticket or qualifying action. Check the Freehub label and the official promoter terms before entering.",
      },
      {
        question: "What types of tech prizes can I win?",
        answer:
          "Tech prizes can include phones, smartphones, TVs, gaming consoles, laptops, tablets, gadgets, electronics vouchers, home entertainment bundles and tech-led appliances where the active listing supports that prize type.",
      },
      {
        question: "Do I need to buy something to enter a tech competition?",
        answer:
          "Sometimes. Purchase-required tech competitions may need a qualifying product, minimum spend, till slip, rewards-card swipe, recharge or account action, while free-entry tech competitions should not require a purchase. The official terms are the source of truth.",
      },
      {
        question: "How do I know if a gadget giveaway is legitimate?",
        answer:
          "Use official promoter links, check the closing date and terms, confirm the entry method, and verify winner messages through the promoter's official website, app, social page or support channel. Do not pay unofficial winner, delivery, release or admin fees.",
      },
      {
        question: "Does Freehub run these tech competitions?",
        answer:
          "No. Freehub is a competition discovery site. The promoter runs the competition, accepts entries, chooses winners and supplies or fulfils tech prizes through its own official process.",
      },
    ],
    vouchers: [
      {
        question: "Are voucher competitions free to enter?",
        answer:
          "Some voucher competitions are free to enter, while others require a purchase, paid entry, account, app, rewards card, till slip, WhatsApp message, online form or in-store action. Check the Freehub cost label and the official promoter terms before entering.",
      },
      {
        question: "What types of vouchers can I win?",
        answer:
          "Voucher prizes can include shopping, grocery, retail, beauty, food, fuel, airtime, data, online shopping and partner campaign Takealot voucher prizes where the active source supports the listing.",
      },
      {
        question: "Are Takealot voucher competitions listed on Freehub?",
        answer:
          "Freehub may list active verified partner campaigns offering Takealot voucher prizes. We do not describe partner promotions as Takealot-run campaigns unless an official source clearly supports that wording.",
      },
      {
        question: "What should I check before entering a voucher competition?",
        answer:
          "Check the closing date, promoter, entry cost, purchase or account requirements, voucher value, expiry date, redemption rules, official terms and winner-contact process. Do not pay unofficial winner or delivery fees.",
      },
      {
        question: "Does Freehub run these voucher competitions?",
        answer:
          "No. Freehub is a competition discovery site. The promoter runs the competition, accepts entries, chooses winners and handles voucher fulfilment through its own official process.",
      },
    ],
  };

  return faqByCategory[routeContext.slug] || [];
}

function renderCollectionFaq(routeContext, items) {
  if (items.length === 0) {
    return "";
  }

  return `<section class="detail-faq detail-faq--hub" aria-label="${escapeAttribute(getCollectionFaqTitle(routeContext))}">
          <p class="detail-section-title">${escapeHtml(getCollectionFaqTitle(routeContext))}</p>
          ${items
            .map(
              (item) => `<details>
            <summary>${escapeHtml(item.question)}</summary>
            <p>${escapeHtml(item.answer)}</p>
          </details>`
            )
            .join("\n          ")}
        </section>`;
}

function getCollectionFaqTitle(routeContext) {
  if (isEndingSoonHub(routeContext)) {
    return "Competitions ending soon FAQ";
  }

  if (isWinACarHub(routeContext)) {
    return "Win a car competitions FAQ";
  }

  if (isFreeCompetitionsHub(routeContext)) {
    return "Free competitions FAQ";
  }

  if (routeContext.type === "hub" && routeContext.slug === "new-competitions-south-africa") {
    return "New competitions FAQ";
  }

  if (routeContext.type === "category") {
    return `${shared.CATEGORY_COPY[routeContext.slug].category} competitions FAQ`;
  }

  return "Competition FAQ";
}

function renderPage(routeContext, competitions) {
  const pageCopy = shared.getPageCopy(routeContext);
  const supportCopy = shared.getPageSupportCopy(routeContext);
  const structuredData = shared.buildStructuredData(competitions, routeContext);
  const ogImage = getCollectionMetadataImageUrl(competitions);
  const isCollectionPage = ["category", "tag", "hub", "brand"].includes(routeContext.type);
  const collectionPageStructuredData =
    isCollectionPage
      ? {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: pageCopy.heading,
          description: pageCopy.description,
          url: pageCopy.canonical,
          inLanguage: "en-ZA",
          isPartOf: {
            "@type": "WebSite",
            name: "Freehub",
            url: `${shared.CANONICAL_ORIGIN}/`,
          },
        }
      : null;
  const breadcrumbData =
    isCollectionPage
      ? {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${shared.CANONICAL_ORIGIN}/` },
            { "@type": "ListItem", position: 2, name: pageCopy.heading, item: pageCopy.canonical },
          ],
        }
      : null;
  const collectionPageScript = collectionPageStructuredData
    ? `<script id="structured-data-collectionpage" type="application/ld+json">${escapeScript(
        JSON.stringify(collectionPageStructuredData)
      )}</script>`
    : "";
  const breadcrumbScript = breadcrumbData
    ? `<script id="structured-data-breadcrumb" type="application/ld+json">${escapeScript(
        JSON.stringify(breadcrumbData)
      )}</script>`
    : "";
  const collectionFaqItems = getCollectionFaqItems(routeContext);
  const collectionFaqStructuredData =
    collectionFaqItems.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: collectionFaqItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }
      : null;
  const collectionFaqScript = collectionFaqStructuredData
    ? `<script id="structured-data-faq" type="application/ld+json">${escapeScript(
        JSON.stringify(collectionFaqStructuredData)
      )}</script>`
    : "";
  const cardsMarkup = competitions
    .map((competition) => renderCompetitionCard(competition))
    .join("\n");
  const resultsSummary = `Showing ${competitions.length} competitions`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(pageCopy.title)}</title>
    <meta name="description" content="${escapeAttribute(pageCopy.description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${escapeAttribute(pageCopy.canonical)}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeAttribute(pageCopy.title)}" />
    <meta property="og:description" content="${escapeAttribute(pageCopy.description)}" />
    <meta property="og:url" content="${escapeAttribute(pageCopy.canonical)}" />
    <meta property="og:image" content="${escapeAttribute(ogImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttribute(pageCopy.title)}" />
    <meta name="twitter:description" content="${escapeAttribute(pageCopy.description)}" />
    <meta name="twitter:image" content="${escapeAttribute(ogImage)}" />
    ${collectionPageScript}
    ${breadcrumbScript}
    ${collectionFaqScript}
    <script id="structured-data-itemlist" type="application/ld+json">${escapeScript(
      JSON.stringify(structuredData)
    )}</script>
    <link rel="stylesheet" href="${RELATIVE_ASSET_PATH}styles.css" />
    ${ADSENSE_SCRIPT}
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-23P37R20FY"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('set', { page_type: '${routeContext.type}'${routeContext.type === "hub" ? `, hub_slug: '${routeContext.slug}'` : ""}${routeContext.type === "brand" ? `, brand_slug: '${routeContext.slug}'` : ""} });
      gtag('config', 'G-23P37R20FY');
    </script>
  </head>
  <body>
    <div class="site-shell">
      ${renderCollectionHero(routeContext, pageCopy, competitions)}

      <main class="main-content">
        ${isCollectionPage ? renderCollectionBreadcrumb(pageCopy.heading) : ""}

        ${renderSupportSection(supportCopy)}
        ${renderHubIntroEditorial(routeContext)}

        <nav class="category-nav" aria-label="Competition categories">
          ${CATEGORY_LINKS.map((link) => renderNavLink(link, routeContext.path)).join("\n          ")}
        </nav>

        <section class="popular-searches" aria-label="Popular searches">
          <p class="popular-searches__title">Popular Searches</p>
          <div class="popular-searches__links">
            ${TAG_LINKS.map((link) => renderPopularLink(link, routeContext.path)).join("\n            ")}
          </div>
        </section>

        ${renderInternalLinksSection(routeContext, competitions)}
        ${renderHubSupportLinks(routeContext, competitions)}
        ${renderDeadlineBuckets(routeContext, competitions)}
        ${renderWhatsAppChannelCta(routeContext)}

        ${renderAdZone("ad-top", "top")}

        <section class="controls" aria-label="Competition filters">
          <label class="search-field" for="searchInput">
            <span class="search-field__label">Search competitions</span>
            <input
              id="searchInput"
              type="search"
              name="search"
              placeholder="Search by title or category"
              autocomplete="off"
            />
          </label>

          <div class="filters">
            <p class="filters__label">Categories</p>
            <div id="categoryFilters" class="filter-list" role="group" aria-label="Categories"></div>
          </div>
        </section>

        <section class="results-header" aria-live="polite">
          <p id="resultsSummary" class="results-header__summary">${escapeHtml(resultsSummary)}</p>
        </section>

        ${renderStatusPlaceholders()}

        <section class="competition-section">
          <div id="competitionsGrid" class="competition-grid" aria-live="polite">
            ${cardsMarkup}
          </div>

          ${renderCollectionEmptyState(routeContext, competitions)}
        </section>

        ${renderCategoryEditorial(routeContext, competitions)}
        ${renderEndingSoonEditorial(routeContext)}
        ${renderWinACarEditorial(routeContext)}
        ${renderFreeCompetitionsEditorial(routeContext)}
        ${renderCollectionFaq(routeContext, collectionFaqItems)}

        ${renderThinPageTips(competitions)}

        ${renderAdZone("ad-middle", "middle", true)}

        <section class="info-strip" aria-label="About this page">
          <div>
            <p class="info-strip__label">Verified listings</p>
            <p class="info-strip__text">We organise live South African competitions and link through to official promoter pages.</p>
          </div>
          <div>
            <p class="info-strip__label">No FreeHub sign-up</p>
            <p class="info-strip__text">Open a listing, review the details, then follow the official entry method when it suits you.</p>
          </div>
        </section>

        ${renderAdZone("ad-bottom", "bottom")}
      </main>

      ${renderSiteFooter()}
    </div>

    <aside class="ad-sticky ad-sticky--reserved" id="ad-sticky" aria-hidden="true"></aside>

    <script src="${RELATIVE_ASSET_PATH}shared/page-data.js" defer></script>
    <script src="${RELATIVE_ASSET_PATH}app.js" defer></script>
  </body>
</html>
`;
}

function renderBrandIndexPage(brandPages) {
  const pageCopy = shared.BRAND_INDEX_COPY;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: pageCopy.heading,
    itemListElement: brandPages.map((brandPage, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${shared.CANONICAL_ORIGIN}${brandPage.path}`,
      name: `${brandPage.brand} competitions`,
      description: brandPage.description,
    })),
  };
  const collectionPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: pageCopy.heading,
    description: pageCopy.description,
    url: pageCopy.canonical,
    inLanguage: "en-ZA",
    isPartOf: {
      "@type": "WebSite",
      name: "Freehub",
      url: `${shared.CANONICAL_ORIGIN}/`,
    },
  };
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${shared.CANONICAL_ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: pageCopy.heading, item: pageCopy.canonical },
    ],
  };
  const brandLinksMarkup = brandPages
    .map(
      (brandPage) =>
        `<a class="internal-links__link" href="${escapeAttribute(brandPage.path)}" data-brand-page-slug="${escapeAttribute(
          brandPage.slug
        )}">${escapeHtml(brandPage.brand)} competitions (${brandPage.competitionCount})</a>`
    )
    .join("\n            ");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(pageCopy.title)}</title>
    <meta name="description" content="${escapeAttribute(pageCopy.description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${escapeAttribute(pageCopy.canonical)}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeAttribute(pageCopy.title)}" />
    <meta property="og:description" content="${escapeAttribute(pageCopy.description)}" />
    <meta property="og:url" content="${escapeAttribute(pageCopy.canonical)}" />
    <meta property="og:image" content="${escapeAttribute(shared.DEFAULT_OG_IMAGE)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttribute(pageCopy.title)}" />
    <meta name="twitter:description" content="${escapeAttribute(pageCopy.description)}" />
    <meta name="twitter:image" content="${escapeAttribute(shared.DEFAULT_OG_IMAGE)}" />
    <script id="structured-data-collectionpage" type="application/ld+json">${escapeScript(
      JSON.stringify(collectionPageStructuredData)
    )}</script>
    <script id="structured-data-breadcrumb" type="application/ld+json">${escapeScript(
      JSON.stringify(breadcrumbData)
    )}</script>
    <script id="structured-data-itemlist" type="application/ld+json">${escapeScript(
      JSON.stringify(structuredData)
    )}</script>
    <link rel="stylesheet" href="${RELATIVE_ASSET_PATH}styles.css" />
    ${ADSENSE_SCRIPT}
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-23P37R20FY"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('set', { page_type: 'brand-index' });
      gtag('config', 'G-23P37R20FY');
    </script>
  </head>
  <body>
    <div class="site-shell">
      ${renderModernHero({
        className: "hero--utility hero--brand-index",
        eyebrow: "Freehub brands",
        heading: pageCopy.heading,
        intro: pageCopy.intro,
        headingId: "pageTitle",
        introId: "pageIntro",
        actions: [
          { label: "Browse Brands", href: "#brandPages", className: "btn--primary" },
          { label: "All Competitions", href: "/competitions/", className: "btn--secondary" },
        ],
        trustItems: ["Active brand pages", "Official source links", "Thin pages avoided"],
      })}

      <main class="main-content">
        ${renderCollectionBreadcrumb(pageCopy.heading)}
        ${renderSupportSection(pageCopy.support)}

        <section class="internal-links" id="brandPages" aria-label="Generated brand pages">
          <p class="internal-links__title">Brands with active competition pages</p>
          <div class="internal-links__list">
            ${brandLinksMarkup}
          </div>
        </section>

        <section class="state-card" aria-label="About brand pages">
          <p class="state-card__title">Why these brands appear</p>
          <p class="state-card__text">Freehub only creates brand pages when there are at least ${shared.BRAND_PAGE_MIN_COMPETITIONS} active published competitions for that brand. This keeps brand pages useful and avoids thin listings.</p>
        </section>

        <section class="internal-links" aria-label="Related competition browsing">
          <p class="internal-links__title">More ways to browse</p>
          <div class="internal-links__list">
            <a class="internal-links__link" href="/competitions/">All competitions</a>
            <a class="internal-links__link" href="/competitions-ending-soon/">Competitions ending soon</a>
            <a class="internal-links__link" href="/how-we-verify-competitions/">How we verify listings</a>
            <a class="internal-links__link" href="/how-to-enter-competitions-safely/">How to enter safely</a>
          </div>
        </section>
      </main>

      ${renderSiteFooter()}
    </div>
  </body>
</html>
`;
}

function renderCollectionBreadcrumb(currentLabel) {
  return `<nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page">${escapeHtml(currentLabel)}</span>
        </nav>`;
}

function getCompetitionVisualUrl(competition) {
  if (competition && competition.image) {
    return competition.image;
  }

  const brandImage = getBrandAssociatedImage(competition);
  if (brandImage) {
    return brandImage;
  }

  return "";
}

function getStatusClassName(label) {
  const normalized = String(label || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `competition-card__status competition-card__status--${normalized || "default"}`;
}

function renderBrandMark(competition, className = "brand-mark") {
  const brand = competition.brand || "Freehub";
  const logoUrl = shared.getCompetitionLogoUrl(competition);
  const initials = shared.getBrandInitials(brand);

  if (logoUrl) {
    return `<span class="${className} ${className}--image"><img src="${escapeAttribute(
      logoUrl
    )}" alt="${escapeAttribute(`${brand} logo`)}" loading="lazy" /></span>`;
  }

  return `<span class="${className}" aria-hidden="true">${escapeHtml(initials)}</span>`;
}

function renderCompetitionVisualPlaceholder(competition, className = "competition-card__placeholder") {
  const logoUrl = shared.getCompetitionLogoUrl(competition);
  const logoMarkup = logoUrl
    ? `<img class="${className}-logo" src="${escapeAttribute(logoUrl)}" alt="${escapeAttribute(`${competition.brand || "Brand"} logo`)}" loading="eager" decoding="async" onload="this.parentElement.classList.add('${className}--has-logo')" onerror="this.remove()" />`
    : "";
  const brandLabel = competition.brand || shared.getBrandInitials(competition.brand);

  return `<div class="${className}" aria-hidden="true">
                  ${logoMarkup}
                  <span class="${className}-brand-name">${escapeHtml(brandLabel)}</span>
                  <span class="${className}-category">${escapeHtml(competition.category || "Prize")}</span>
                </div>`;
}

function renderCardStatusBadges(competition) {
  return shared
    .getCardStatusLabels(competition)
    .map((label) => `<span class="${getStatusClassName(label)}">${escapeHtml(label)}</span>`)
    .join("\n                  ");
}

function renderCompetitionCard(competition, featured = false) {
  const internalPath = shared.getCompetitionPath(competition);
  const urgencyBadge = `<span class="badge badge--closing">${escapeHtml(
    shared.getUrgencyBadgeLabel(competition.closingDate)
  )}</span>`;
  const tagBadges = shared
    .getCardTagLabels(competition)
    .map((label) => `<span class="badge badge--soft">${escapeHtml(label)}</span>`)
    .join("\n                    ");
  const footerMarkup = tagBadges
    ? `<div class="competition-card__footer">
                  <div class="competition-card__tags">
                    ${tagBadges}
                  </div>
                </div>`
    : "";
  const summaryMarkup = competition.summary
    ? `<p class="competition-card__summary">${escapeHtml(competition.summary)}</p>`
    : "";
  const cardClass = `competition-card${featured ? " competition-card--featured" : ""}`;
  const cardImageUrl = getCompetitionVisualUrl(competition);
  const urgencyLabel = shared.getUrgencyLabel(competition.closingDate);
  const entryMethodLabel = shared.getEntryMethodLabel(competition.entryType);
  const prizeCue = shared.getPrizeCue(competition);
  const headline = shared.getCardHeadline(competition);
  const brand = competition.brand || "Official promotion";
  const featuredEyebrow = featured ? '<p class="competition-card__eyebrow">Featured this week</p>' : "";
  const ctaClass = featured ? "competition-card__cta competition-card__cta--featured" : "competition-card__cta";
  const imageMarkup = cardImageUrl
    ? `<img src="${escapeAttribute(cardImageUrl)}" alt="${escapeAttribute(
        competition.title
      )}" loading="lazy" onerror="this.remove()" />`
    : "";

  return `<article class="${cardClass}" data-competition-slug="${escapeAttribute(
    shared.getCompetitionSlug(competition)
  )}" data-competition-title="${escapeAttribute(competition.title)}" data-competition-category="${escapeAttribute(
    competition.category
  )}">
              <div class="competition-card__media">
                ${renderCompetitionVisualPlaceholder(competition)}
                ${imageMarkup}
                <div class="competition-card__badges">
                  <div class="competition-card__badge-stack">
                    <span class="badge badge--category">${escapeHtml(competition.category)}</span>
                    <span class="badge badge--verified">Verified</span>
                  </div>
                  ${urgencyBadge}
                </div>
              </div>
              <div class="competition-card__body">
                ${featuredEyebrow}
                <div class="competition-card__brand-row">
                  ${renderBrandMark(competition)}
                  <p class="competition-card__brand">${escapeHtml(brand)}</p>
                  <span class="competition-card__source">Official source</span>
                </div>
                <div class="competition-card__status-row">
                  ${renderCardStatusBadges(competition)}
                </div>
                <h2 class="competition-card__title">${escapeHtml(headline)}</h2>
                <div class="competition-card__signals">
                  <span class="competition-card__signal competition-card__signal--value">${escapeHtml(prizeCue)}</span>
                  <span class="competition-card__signal competition-card__signal--urgency">${escapeHtml(urgencyLabel)}</span>
                  <span class="competition-card__signal competition-card__signal--cost">${escapeHtml(shared.getEntryCostLabel(competition))}</span>
                </div>
                ${summaryMarkup}
                <div class="competition-card__meta">
                  <span>Entry: ${escapeHtml(entryMethodLabel)}</span>
                  <span>Closes: ${escapeHtml(shared.formatDate(competition.closingDate))}</span>
                </div>
                ${footerMarkup}
                <span class="${ctaClass}">View Details</span>
              </div>
              <a class="competition-card__overlay-link" href="${escapeAttribute(internalPath)}" aria-label="${escapeAttribute(competition.title)} - view details">
                <span class="visually-hidden">View details for ${escapeHtml(competition.title)}</span>
              </a>
            </article>`;
}

function renderAdZone(id, placement, compact = false) {
  const className = compact ? "ad-slot ad-slot--compact ad-slot--reserved" : "ad-slot ad-slot--reserved";

  return `<section class="${className}" id="${escapeAttribute(id)}" data-placement="${escapeAttribute(
    placement
  )}" aria-label="Sponsored placement"></section>`;
}

function renderHeroPreviewPanel(competitions, options = {}) {
  const previewCompetitions = competitions.slice(0, 3);

  if (previewCompetitions.length === 0) {
    return "";
  }

  const title = options.title || "Prize Watch";
  const intro = options.intro || "A quick look at active competitions worth opening first.";
  const className = options.className ? `hero-preview-panel ${options.className}` : "hero-preview-panel";

  return `<aside class="${className}" aria-label="${escapeAttribute(title)}">
            <div class="hero-preview-panel__header">
              <p class="hero-preview-panel__kicker">Live now</p>
              <h2 class="hero-preview-panel__title">${escapeHtml(title)}</h2>
              <p class="hero-preview-panel__intro">${escapeHtml(intro)}</p>
            </div>
            <div class="hero-preview-list">
              ${previewCompetitions.map((competition, index) => renderHeroPreviewItem(competition, index === 0)).join("\n              ")}
            </div>
          </aside>`;
}

function renderHeroPreviewItem(competition, featured = false) {
  const title = shared.getCardHeadline(competition);
  const href = shared.getCompetitionPath(competition);
  const imageUrl = getCompetitionVisualUrl(competition);
  const imageMarkup = imageUrl
    ? `<img src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(competition.title)}" loading="lazy" onerror="this.remove()" />`
    : "";
  const className = featured ? "hero-preview-item hero-preview-item--featured" : "hero-preview-item";

  return `<a class="${className}" href="${escapeAttribute(href)}" aria-label="${escapeAttribute(
    competition.title
  )} - view details">
                <div class="hero-preview-item__media">
                  ${renderCompetitionVisualPlaceholder(competition, "hero-preview-item__placeholder")}
                  ${imageMarkup}
                </div>
                <div class="hero-preview-item__body">
                  <div class="hero-preview-item__brand">
                    ${renderBrandMark(competition, "hero-preview-item__mark")}
                    <span>${escapeHtml(competition.brand || "Official promotion")}</span>
                  </div>
                  <h3 class="hero-preview-item__title">${escapeHtml(title)}</h3>
                  <div class="hero-preview-item__meta">
                    <span>${escapeHtml(shared.getPrizeCue(competition))}</span>
                    <span>${escapeHtml(shared.getUrgencyLabel(competition.closingDate))}</span>
                  </div>
                </div>
              </a>`;
}

function renderHeroSpotlight(competition) {
  if (!competition) {
    return "";
  }

  const title = competition.title;
  const urgency = shared.getUrgencyLabel(competition.closingDate);
  const prizeCue = shared.getPrizeCue(competition);
  const entryPath = shared.getCompetitionPath(competition);
  const cardImageUrl = getCompetitionImageUrl(competition);

  return `<a class="hero-spotlight" href="${escapeAttribute(entryPath)}" aria-label="${escapeAttribute(
    title
  )} - view details">
            <div class="hero-spotlight__media">
              <img src="${escapeAttribute(cardImageUrl)}" alt="${escapeAttribute(title)}" loading="lazy" />
            </div>
            <div class="hero-spotlight__body">
              <p class="hero-spotlight__eyebrow">Featured prize</p>
              <h2 class="hero-spotlight__title">${escapeHtml(title)}</h2>
              <div class="hero-spotlight__meta">
                <span>${escapeHtml(prizeCue)}</span>
                <span>${escapeHtml(urgency)}</span>
              </div>
              <span class="hero-spotlight__cta">View Details</span>
            </div>
          </a>`;
}

function getHeroSpotlightCompetition(competitions) {
  const priorityCategories = ["Vouchers", "Cash", "Cars", "Holidays"];

  return competitions
    .filter((competition) => !competition.closingDate || shared.getDaysUntilClosing(competition.closingDate) >= 0)
    .slice()
    .sort((left, right) => {
      const leftCategoryScore = priorityCategories.includes(left.category)
        ? priorityCategories.length - priorityCategories.indexOf(left.category)
        : 0;
      const rightCategoryScore = priorityCategories.includes(right.category)
        ? priorityCategories.length - priorityCategories.indexOf(right.category)
        : 0;
      const leftScore = (left.isHighValue ? 10 : 0) + leftCategoryScore;
      const rightScore = (right.isHighValue ? 10 : 0) + rightCategoryScore;

      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }

      return new Date(left.closingDate) - new Date(right.closingDate);
    })[0];
}

function renderNavLink(link, currentPath) {
  const isActive = currentPath === normalizeStaticPath(link.href);
  const className = isActive ? "category-nav__link is-active" : "category-nav__link";
  return `<a class="${className}" href="${escapeAttribute(link.href)}">${escapeHtml(link.label)}</a>`;
}

function renderPopularLink(link, currentPath) {
  const isActive = currentPath === normalizeStaticPath(link.href);
  const className = isActive ? "popular-searches__link is-active" : "popular-searches__link";
  return `<a class="${className}" href="${escapeAttribute(link.href)}">${escapeHtml(link.label)}</a>`;
}

function renderInternalLinksSection(routeContext, competitions) {
  const section =
    routeContext.type === "category"
      ? getCategoryInternalLinks(routeContext.slug, competitions)
      : routeContext.type === "hub"
        ? getHubInternalLinks(routeContext.slug)
      : routeContext.type === "brand"
        ? getBrandInternalLinks(routeContext.slug)
      : routeContext.type === "tag"
        ? {
            title: "Explore Categories",
            links: [
              { label: "Cash competitions", href: "/category/cash/" },
              { label: "Car competitions", href: "/category/cars/" },
            ],
          }
        : null;

  if (!section) {
    return "";
  }

  return `<section class="internal-links" aria-label="${escapeAttribute(section.title)}">
          <p class="internal-links__title">${escapeHtml(section.title)}</p>
          <div class="internal-links__list">
            ${section.links
              .map(
                (link) =>
                  `<a class="internal-links__link" href="${escapeAttribute(link.href)}">${escapeHtml(link.label)}</a>`
              )
              .join("\n            ")}
          </div>
        </section>`;
}

function renderHubSupportLinks(routeContext, competitions) {
  if (routeContext.type !== "hub") {
    return "";
  }

  if (competitions.length >= 3) {
    return "";
  }

  const section = getHubInternalLinks(routeContext.slug);

  return `<section class="state-card" aria-label="More competition paths">
          <p class="state-card__title">More ways to browse live competitions</p>
          <p class="state-card__text">There are currently fewer matches on this hub, so use these related pages to find active competitions.</p>
          <div class="internal-links__list">
            ${section.links
              .slice(0, 4)
              .map(
                (link) =>
                  `<a class="internal-links__link" href="${escapeAttribute(link.href)}">${escapeHtml(link.label)}</a>`
              )
              .join("\n            ")}
          </div>
        </section>`;
}

function getHubInternalLinks(slug) {
  const linksBySlug = {
    competitions: [
      { label: "Browse competition brands", href: "/brands/" },
      { label: "New competitions", href: "/new-competitions-south-africa/" },
      { label: "Win a car competitions", href: "/win-a-car/" },
      { label: "Free competitions", href: "/free-competitions/" },
      { label: "Competitions ending soon", href: "/competitions-ending-soon/" },
      { label: "Purchase required competitions", href: "/purchase-required-competitions/" },
      { label: "How we verify listings", href: "/how-we-verify-competitions/" },
      { label: "How to enter safely", href: "/how-to-enter-competitions-safely/" },
    ],
    "win-a-car": [
      { label: "All competitions", href: "/competitions/" },
      { label: "Free competitions", href: "/free-competitions/" },
      { label: "Paid entry competitions", href: "/paid-entry-competitions/" },
      { label: "Competitions ending soon", href: "/competitions-ending-soon/" },
      { label: "Cash competitions", href: "/category/cash/" },
      { label: "Voucher competitions", href: "/category/vouchers/" },
      { label: "Browse competition brands", href: "/brands/" },
      { label: "Cars category", href: "/category/cars/" },
      { label: "Purchase required competitions", href: "/purchase-required-competitions/" },
      { label: "How to enter safely", href: "/how-to-enter-competitions-safely/" },
      { label: "Legit competitions guide", href: "/legit-competitions-south-africa/" },
    ],
    "free-competitions": [
      { label: "All competitions", href: "/competitions/" },
      { label: "Competitions ending soon", href: "/competitions-ending-soon/" },
      { label: "Win a car competitions", href: "/win-a-car/" },
      { label: "Purchase required competitions", href: "/purchase-required-competitions/" },
      { label: "Cash competitions", href: "/category/cash/" },
      { label: "Voucher competitions", href: "/category/vouchers/" },
      { label: "Tech competitions", href: "/category/tech/" },
      { label: "Holiday competitions", href: "/category/holidays/" },
      { label: "How to enter safely", href: "/how-to-enter-competitions-safely/" },
    ],
    "competitions-ending-soon": [
      { label: "All competitions", href: "/competitions/" },
      { label: "New competitions", href: "/new-competitions-south-africa/" },
      { label: "Free competitions", href: "/free-competitions/" },
      { label: "Purchase required competitions", href: "/purchase-required-competitions/" },
      { label: "Win a car competitions", href: "/win-a-car/" },
      { label: "Car competitions", href: "/category/cars/" },
      { label: "Cash competitions", href: "/category/cash/" },
      { label: "Voucher competitions", href: "/category/vouchers/" },
      { label: "Holiday competitions", href: "/category/holidays/" },
      { label: "Tech competitions", href: "/category/tech/" },
    ],
    "new-competitions-south-africa": [
      { label: "All competitions", href: "/competitions/" },
      { label: "Competitions ending soon", href: "/competitions-ending-soon/" },
      { label: "Free competitions", href: "/free-competitions/" },
      { label: "Win a car competitions", href: "/win-a-car/" },
      { label: "Cash competitions", href: "/category/cash/" },
      { label: "Voucher competitions", href: "/category/vouchers/" },
      { label: "Tech competitions", href: "/category/tech/" },
    ],
    "purchase-required-competitions": [
      { label: "Browse competition brands", href: "/brands/" },
      { label: "Purchase required guide", href: "/purchase-required-competitions-explained/" },
      { label: "Till slip competitions", href: "/till-slip-competitions-south-africa/" },
      { label: "Free competitions", href: "/free-competitions/" },
      { label: "Win a car competitions", href: "/win-a-car/" },
      { label: "How to enter safely", href: "/how-to-enter-competitions-safely/" },
      { label: "Legit competitions guide", href: "/legit-competitions-south-africa/" },
    ],
    "paid-entry-competitions": [
      { label: "Browse competition brands", href: "/brands/" },
      { label: "Free competitions", href: "/free-competitions/" },
      { label: "Purchase required competitions", href: "/purchase-required-competitions/" },
      { label: "How to enter safely", href: "/how-to-enter-competitions-safely/" },
    ],
  };
  const titlesBySlug = {
    "win-a-car": "Car Competition Jump Links",
    "competitions-ending-soon": "Competition Deadline Jump Links",
  };

  return {
    title: titlesBySlug[slug] || "Related Competition Hubs",
    links: linksBySlug[slug] || HUB_LINKS,
  };
}

function getBrandInternalLinks(slug) {
  const brandPage = shared.APPROVED_BRAND_PAGES[slug];
  const brandLabel = brandPage ? brandPage.brand : "this brand";

  return {
    title: `More ${brandLabel} Discovery`,
    links: [
      { label: "All competition brands", href: "/brands/" },
      { label: "All competitions", href: "/competitions/" },
      { label: "Competitions ending soon", href: "/competitions-ending-soon/" },
      { label: "How we verify listings", href: "/how-we-verify-competitions/" },
      { label: "How to enter safely", href: "/how-to-enter-competitions-safely/" },
    ],
  };
}

function getCategoryInternalLinks(slug, competitions) {
  const firstCategoryCompetition = competitions[0]
    ? shared.getCompetitionPath(competitions[0])
    : `/category/${slug}/`;
  const byIdPath = (id) => {
    const target = competitions.find((competition) => shared.getCompetitionSlug(competition) === id);
    return target ? shared.getCompetitionPath(target) : firstCategoryCompetition;
  };
  const byIdPathOrNull = (id) => {
    const target = competitions.find((competition) => shared.getCompetitionSlug(competition) === id);
    return target ? shared.getCompetitionPath(target) : null;
  };

  if (slug === "cars") {
    const aquellePath = byIdPathOrNull("aquelle-mzansi-mango");
    return {
      title: "Car Competition Searches",
      links: [
        { label: "Win a car competitions South Africa", href: "/win-a-car/" },
        ...(aquellePath ? [{ label: "aQuelle Suzuki Swift competition", href: aquellePath }] : []),
        { label: "Purchase required competitions", href: "/purchase-required-competitions/" },
        { label: "Free competitions", href: "/free-competitions/" },
        { label: "Competitions ending soon", href: "/competitions-ending-soon/" },
      ],
    };
  }

  if (slug === "holidays") {
    return {
      title: "Holiday Competition Searches",
      links: [
        { label: "All current competitions", href: "/competitions/" },
        { label: "Competitions ending soon", href: "/competitions-ending-soon/" },
        { label: "Free competitions", href: "/free-competitions/" },
        { label: "Purchase required competitions", href: "/purchase-required-competitions/" },
        { label: "Car competitions", href: "/category/cars/" },
        { label: "Cash competitions", href: "/category/cash/" },
        { label: "Voucher competitions", href: "/category/vouchers/" },
        { label: "Tech competitions", href: "/category/tech/" },
      ],
    };
  }

  if (slug === "tech") {
    return {
      title: "Tech Competition Searches",
      links: [
        { label: "All competitions", href: "/competitions/" },
        { label: "Competitions ending soon", href: "/competitions-ending-soon/" },
        { label: "Free competitions", href: "/free-competitions/" },
        { label: "Purchase required competitions", href: "/purchase-required-competitions/" },
        { label: "Win a car competitions", href: "/win-a-car/" },
        { label: "Cash competitions", href: "/category/cash/" },
        { label: "Voucher competitions", href: "/category/vouchers/" },
        { label: "Holiday competitions", href: "/category/holidays/" },
      ],
    };
  }

  if (slug === "cash") {
    const mtnMomoPath = byIdPathOrNull("mtn-momo-cash-sprint");
    return {
      title: "Cash Competition Searches",
      links: [
        { label: "Cash competitions South Africa", href: "/category/cash/" },
        ...(mtnMomoPath ? [{ label: "MTN MoMo cash competition", href: mtnMomoPath }] : []),
        { label: "Win cash online South Africa", href: byIdPath("fnb-pay-to-win-grand-cash-prize") },
        { label: "All competitions", href: "/competitions/" },
        { label: "Competitions ending soon", href: "/competitions-ending-soon/" },
        { label: "Free competitions", href: "/free-competitions/" },
        { label: "Purchase required competitions", href: "/purchase-required-competitions/" },
        { label: "Win a car competitions", href: "/win-a-car/" },
        { label: "Voucher competitions", href: "/category/vouchers/" },
        { label: "Tech competitions", href: "/category/tech/" },
        { label: "Holiday competitions", href: "/category/holidays/" },
      ],
    };
  }

  if (slug === "vouchers") {
    const takealotVoucherPath = byIdPathOrNull("debtbusters-money-stress-tracker-takealot-vouchers");
    const takealotVoucherLinks = takealotVoucherPath
      ? [{ label: "Takealot voucher prizes", href: takealotVoucherPath }]
      : [];

    return {
      title: "Voucher Competition Searches",
      links: [
        { label: "Voucher giveaway competitions", href: "/category/vouchers/" },
        ...takealotVoucherLinks,
        { label: "All competitions", href: "/competitions/" },
        { label: "Competitions ending soon", href: "/competitions-ending-soon/" },
        { label: "Free competitions", href: "/free-competitions/" },
        { label: "Purchase required competitions", href: "/purchase-required-competitions/" },
        { label: "Win a car competitions", href: "/win-a-car/" },
        { label: "Cash competitions", href: "/category/cash/" },
        { label: "Tech competitions", href: "/category/tech/" },
        { label: "Holiday competitions", href: "/category/holidays/" },
      ],
    };
  }

  return {
    title: "Related Searches",
    links: [
      { label: "All competitions", href: "/competitions/" },
      { label: "Free competitions", href: "/free-competitions/" },
      { label: "Competitions ending soon", href: "/competitions-ending-soon/" },
    ],
  };
}

function renderSupportSection(supportCopy) {
  if (!supportCopy) {
    return "";
  }

  return `<section class="state-card" aria-label="Why this page matters">
          <p class="state-card__title">Why This Page Matters</p>
          <p class="state-card__text">${escapeHtml(supportCopy)}</p>
        </section>`;
}

function getCollectionEmptyState(routeContext) {
  if (routeContext.type === "category" && routeContext.slug === "holidays") {
    return {
      title: "No verified holiday competitions right now",
      text:
        "There are no verified holiday competitions listed right now. Check all current competitions or come back soon for new travel, getaway and accommodation prize listings.",
    };
  }

  return {
    title: "No competitions match",
    text: "Try a different search term or clear the current category filter.",
  };
}

function renderCollectionEmptyState(routeContext, competitions) {
  const state = getCollectionEmptyState(routeContext);
  const hiddenClass = competitions.length > 0 ? " state-card--hidden" : "";

  return `<div id="emptyState" class="state-card${hiddenClass}" aria-live="polite">
            <p class="state-card__title">${escapeHtml(state.title)}</p>
            <p class="state-card__text">${escapeHtml(state.text)}</p>
          </div>`;
}

function renderWhatsAppChannelCta(routeContext = null) {
  const showOnCollection =
    routeContext && (routeContext.type === "hub" || routeContext.type === "category");

  if (routeContext && !showOnCollection) {
    return "";
  }

  return `<section class="state-card whatsapp-channel-cta" aria-label="WhatsApp competition updates">
          <p class="state-card__title">Get competition alerts on WhatsApp</p>
          <p class="state-card__text">Follow the South Africa Competitions WhatsApp Channel for new listings, closing-soon reminders and prize updates.</p>
          <a class="btn btn--primary whatsapp-channel-cta__button" href="${escapeAttribute(
            WHATSAPP_CHANNEL_URL
          )}" target="_blank" rel="noopener noreferrer">Follow on WhatsApp</a>
        </section>`;
}

function renderThinPageTips(competitions) {
  if (!shared.shouldShowThinPageTips(competitions)) {
    return "";
  }

  return `<section class="state-card" aria-label="Winning tips">
          <p class="state-card__title">Tips to improve your chances of winning</p>
          <ul class="state-card__list">
            ${shared.THIN_PAGE_TIPS.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("\n            ")}
          </ul>
        </section>`;
}

function renderHomeDiscoverySection({ kicker, title, intro, href, linkLabel, competitions, featured = false }) {
  if (!competitions || competitions.length === 0) {
    return "";
  }

  const gridClass = featured
    ? "competition-grid competition-grid--featured"
    : "competition-grid competition-grid--scroll";

  return `<section class="home-section home-section--discovery" aria-label="${escapeAttribute(title)}">
          <div class="home-section__header">
            <div>
              <p class="section-kicker">${escapeHtml(kicker)}</p>
              <h2 class="home-section__title">${escapeHtml(title)}</h2>
            </div>
            ${href ? `<a class="home-section__link" href="${escapeAttribute(href)}">${escapeHtml(linkLabel || "View more")}</a>` : ""}
          </div>
          <p class="home-section__intro">${escapeHtml(intro)}</p>
          <div class="${gridClass}">
            ${competitions.map((competition) => renderCompetitionCard(competition, featured)).join("\n            ")}
          </div>
        </section>`;
}

function getFreeEntryPicks(competitions, n) {
  return competitions
    .filter((competition) => shared.getEntryCostLabel(competition) === "Free entry")
    .slice()
    .sort((left, right) => {
      const highValueDiff = Number(right.isHighValue === true) - Number(left.isHighValue === true);
      if (highValueDiff !== 0) {
        return highValueDiff;
      }

      return new Date(left.closingDate) - new Date(right.closingDate);
    })
    .slice(0, n);
}

function getTrendingCompetitions(competitions, n) {
  return competitions
    .filter((competition) => shared.isHighValueCompetition(competition) || shared.shouldShowHotBadge(competition))
    .slice()
    .sort((left, right) => {
      const leftScore = (left.isHighValue ? 10 : 0) + (shared.isClosingWithinDays(left.closingDate, 7) ? 5 : 0);
      const rightScore = (right.isHighValue ? 10 : 0) + (shared.isClosingWithinDays(right.closingDate, 7) ? 5 : 0);

      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }

      return new Date(left.closingDate) - new Date(right.closingDate);
    })
    .slice(0, n);
}

function getLatestAddedCompetitions(competitions, n) {
  return competitions
    .slice()
    .sort((left, right) => {
      const leftChecked = new Date(left.lastChecked || 0).getTime() || 0;
      const rightChecked = new Date(right.lastChecked || 0).getTime() || 0;

      if (rightChecked !== leftChecked) {
        return rightChecked - leftChecked;
      }

      return new Date(left.closingDate) - new Date(right.closingDate);
    })
    .slice(0, n);
}

function renderHomeTrustSection() {
  return `<section class="home-section home-section--trust" aria-label="Why trust Freehub">
          <div class="home-section__header">
            <div>
              <p class="section-kicker">Why trust Freehub?</p>
              <h2 class="home-section__title">Built for safer competition discovery</h2>
            </div>
            <a class="home-section__link" href="/how-we-verify-competitions/">How we check listings</a>
          </div>
          <div class="trust-grid">
            <article class="trust-card">
              <span class="trust-card__label">Official sources</span>
              <h3>Promoter links stay visible</h3>
              <p>Freehub sends users to official promoter pages or campaign partners instead of collecting entries on our own site.</p>
            </article>
            <article class="trust-card">
              <span class="trust-card__label">Freshness</span>
              <h3>Active listings first</h3>
              <p>Hub pages use active published data, with closing dates and updated timestamps where the page is generated.</p>
            </article>
            <article class="trust-card">
              <span class="trust-card__label">Transparency</span>
              <h3>Costs and requirements are labelled</h3>
              <p>Cards surface free entry, purchase, paid entry, app and receipt-style requirements before users click through.</p>
            </article>
          </div>
        </section>`;
}

function renderHomepage(competitions) {
  const homeRouteContext = { type: "home", slug: null, path: "/" };
  const structuredData = shared.buildStructuredData(competitions, homeRouteContext);
  const ogImage = getCollectionMetadataImageUrl(competitions);
  const featured = getFeaturedCompetitions(competitions, 4);
  const featuredCardsMarkup = featured.map((c) => renderCompetitionCard(c, true)).join("\n            ");
  const closingSoon = getEndingSoonCompetitions(competitions, 4);
  const freeEntryPicks = getFreeEntryPicks(competitions, 4);
  const trending = getTrendingCompetitions(competitions, 4);
  const latestAdded = getLatestAddedCompetitions(competitions, 4);
  const heroPreviewMarkup = renderHeroPreviewPanel(featured, {
    title: "Prize Watch",
    intro: "A fast look at high-value and near-deadline competitions.",
    className: "hero-preview-panel--home",
  });

  const noscriptLinks = competitions
    .slice(0, 6)
    .map((c) => {
      const slug = shared.getCompetitionSlug(c);
      return `          <li><a href="${escapeAttribute(`/competition/${slug}/`)}">${escapeHtml(c.title)}</a></li>`;
    })
    .join("\n");

  const categoryNavMarkup = [
    `<a class="category-nav__link is-active" href="/">All</a>`,
    `<a class="category-nav__link" href="/tag/free-entry/">Free Entry</a>`,
    `<a class="category-nav__link" href="/tag/ending-soon/">Ending Soon</a>`,
    `<a class="category-nav__link" href="/tag/high-value/">High Value</a>`,
    ...shared.CATEGORY_SLUGS.map(
      (slug) =>
        `<a class="category-nav__link" href="${escapeAttribute(`/category/${slug}/`)}">${escapeHtml(
          shared.CATEGORY_COPY[slug].category
        )}</a>`
    ),
  ].join("\n          ");
  const homeIntentLinksMarkup = `<section class="internal-links" aria-label="Explore competition hubs">
          <p class="internal-links__title">Explore Competition Hubs</p>
          <div class="internal-links__list">
            <a class="internal-links__link" href="/competitions/">All live competitions</a>
            <a class="internal-links__link" href="/new-competitions-south-africa/">New competitions this week</a>
            <a class="internal-links__link" href="/win-a-car/">Win a car competitions</a>
            <a class="internal-links__link" href="/free-competitions/">Free competitions</a>
            <a class="internal-links__link" href="/competitions-ending-soon/">Competitions ending soon</a>
            <a class="internal-links__link" href="/purchase-required-competitions/">Purchase required competitions</a>
            <a class="internal-links__link" href="/paid-entry-competitions/">Paid entry competitions</a>
          </div>
        </section>`;
  const featuredSectionMarkup = `<section class="home-section home-section--featured" aria-label="Featured competitions this week">
          <div class="home-section__header">
            <div>
              <p class="section-kicker">Featured This Week</p>
              <h2 class="home-section__title">Curated competitions to open first</h2>
            </div>
            <a class="home-section__link" href="/tag/high-value/">High-value picks</a>
          </div>
          <p class="home-section__intro">A shortlist prioritising strong prizes, free-entry signals, useful everyday rewards and clear source information.</p>
          <div class="competition-grid competition-grid--featured">
            ${featuredCardsMarkup}
          </div>
        </section>`;
  const closingSoonSectionMarkup = renderHomeDiscoverySection({
    kicker: "Closing Soon",
    title: "Last-chance competitions",
    intro: "Sorted by deadline so mobile users can quickly spot competitions worth checking before they close.",
    href: "/competitions-ending-soon/",
    linkLabel: "View all ending soon",
    competitions: closingSoon,
  });
  const freeEntrySectionMarkup = renderHomeDiscoverySection({
    kicker: "Free Entry Picks",
    title: "No-purchase competitions",
    intro: "Published listings where the current Freehub data does not show a required product purchase or paid ticket.",
    href: "/free-competitions/",
    linkLabel: "View free competitions",
    competitions: freeEntryPicks,
  });
  const trendingSectionMarkup = renderHomeDiscoverySection({
    kicker: "Trending Competitions",
    title: "High-value and urgent prize draws",
    intro: "Competitions with high-value prizes, strong category demand or near-deadline urgency signals.",
    href: "/tag/high-value/",
    linkLabel: "View high-value picks",
    competitions: trending,
  });
  const latestAddedSectionMarkup = renderHomeDiscoverySection({
    kicker: "Latest Added",
    title: "Recently checked competitions",
    intro: "Freshly checked listings from the current data set, useful for repeat visitors looking for something new.",
    href: "/new-competitions-south-africa/",
    linkLabel: "View new competitions",
    competitions: latestAdded,
  });

  const homepageSeoCopy = `FreeHub helps you discover competitions in South Africa without wading through scattered social posts, outdated promo pages, or low-trust listing sites. Whether you want to win cars, cash, holidays, vouchers, or the latest tech, the homepage is designed to surface the most exciting opportunities quickly. You can browse featured competitions, jump into free-entry giveaways, or prioritise promotions that are ending soon so you do not miss valuable prizes.

Many South African competitions are tied to official brand promotions, retail campaigns, app offers, and seasonal giveaways. FreeHub makes those easier to compare by showing the entry method, closing date, and prize cues in one clean view. That means less hesitation and fewer wasted clicks before you decide which competition is worth your time.

If you are looking for free entry competitions in South Africa, practical voucher giveaways, high-value cash promotions, or travel prizes worth entering this week, FreeHub is built to help you move faster. Browse today, check the official rules on each competition page, and come back regularly for fresh opportunities.`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Free Competitions South Africa | Current Car, Holiday &amp; Cash Giveaways</title>
    <meta name="description" content="Browse free competitions South Africa users search for, including current car competitions, holiday giveaways, cash prizes, tech offers, and vouchers." />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${escapeAttribute(shared.CANONICAL_ORIGIN)}/" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Free Competitions South Africa | Current Car, Holiday &amp; Cash Giveaways" />
    <meta property="og:description" content="Browse free competitions South Africa users search for, including current car competitions, holiday giveaways, cash prizes, tech offers, and vouchers." />
    <meta property="og:url" content="${escapeAttribute(shared.CANONICAL_ORIGIN)}/" />
    <meta property="og:image" content="${escapeAttribute(ogImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Free Competitions South Africa | Current Car, Holiday &amp; Cash Giveaways" />
    <meta name="twitter:description" content="Browse free competitions South Africa users search for, including current car competitions, holiday giveaways, cash prizes, tech offers, and vouchers." />
    <meta name="twitter:image" content="${escapeAttribute(ogImage)}" />
    <script id="structured-data-itemlist" type="application/ld+json">${escapeScript(JSON.stringify(structuredData))}</script>
    <link rel="stylesheet" href="/styles.css" />
    ${ADSENSE_SCRIPT}
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-23P37R20FY"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('set', { page_type: 'home' });
      gtag('config', 'G-23P37R20FY');
    </script>
  </head>
  <body>
    <noscript>
      <section class="noscript-shell" aria-label="Competition links">
        <h2>Competition links</h2>
        <p>Browse a quick set of competition pages if JavaScript is unavailable.</p>
        <ul class="noscript-links">
${noscriptLinks}
        </ul>
      </section>
    </noscript>

    <div class="site-shell">
      <header class="hero hero--home">
        <div class="hero__layout">
          <div class="hero__copy">
            <div class="hero__brand" aria-label="FreeHub brand">
              <span class="hero__brand-mark" aria-hidden="true">FH</span>
              <span class="hero__brand-name">Freehub</span>
            </div>
            <h1 id="pageTitle">Today&apos;s Live Competitions in South Africa</h1>
            <p class="hero__text" id="pageIntro">FreeHub lists vouchers, prizes, cash giveaways and competitions from trusted South African brands so you can find offers worth opening today.</p>
            ${renderUpdatedNotice()}
            <div class="hero__actions">
              <a class="btn btn--primary" href="#all-competitions">Browse Today&apos;s Competitions</a>
              <a class="btn btn--secondary" href="/tag/ending-soon/">Ending Soon</a>
            </div>
            <div class="trust-row" aria-label="Trust signals">
              <span class="trust-row__item">Verified listings</span>
              <span class="trust-row__item">Official brand links</span>
              <span class="trust-row__item">Freehub is not the promoter</span>
            </div>
          </div>
          ${heroPreviewMarkup}
        </div>
      </header>

      <main class="main-content">
        ${featuredSectionMarkup}
        ${closingSoonSectionMarkup}
        ${freeEntrySectionMarkup}
        ${trendingSectionMarkup}
        ${latestAddedSectionMarkup}
        ${renderHomeTrustSection()}

        ${renderAdZone("ad-top", "after-featured")}

        <nav class="category-nav" aria-label="Competition categories">
          ${categoryNavMarkup}
        </nav>

        <section class="popular-searches" aria-label="Popular searches">
          <p class="popular-searches__title">Quick Paths</p>
          <div class="popular-searches__links">
            <a class="popular-searches__link" href="/competitions/">All competitions</a>
            <a class="popular-searches__link" href="/new-competitions-south-africa/">New competitions</a>
            <a class="popular-searches__link" href="/win-a-car/">Win a car</a>
            <a class="popular-searches__link" href="/free-competitions/">Free competitions</a>
            <a class="popular-searches__link" href="/competitions-ending-soon/">Ending soon</a>
            <a class="popular-searches__link" href="/purchase-required-competitions/">Purchase required</a>
          </div>
        </section>

        ${homeIntentLinksMarkup}
        ${renderWhatsAppChannelCta()}

        <section class="controls" aria-label="Competition filters">
          <label class="search-field" for="searchInput">
            <span class="search-field__label">Search competitions</span>
            <input
              id="searchInput"
              type="search"
              name="search"
              placeholder="Search by title or category"
              autocomplete="off"
            />
          </label>

          <div class="filters">
            <p class="filters__label">Categories</p>
            <div id="categoryFilters" class="filter-list" role="group" aria-label="Categories"></div>
          </div>
        </section>

        <section class="results-header" aria-live="polite">
          <p id="resultsSummary" class="results-header__summary">Showing featured competitions</p>
        </section>

        ${renderStatusPlaceholders()}

        <section class="competition-section" id="all-competitions">
          <div id="competitionsGrid" class="competition-grid" aria-live="polite"></div>

          <div id="emptyState" class="state-card state-card--hidden" aria-live="polite"></div>
        </section>

        ${renderAdZone("ad-middle", "after-results", true)}

        <section class="home-section home-section--steps" aria-label="How FreeHub Works">
          <h2 class="home-section__title">How FreeHub Works</h2>
          <p class="home-section__intro">FreeHub is built to help you move from browsing to entering with less hesitation and more confidence.</p>
          <div class="steps-grid">
            <article class="step-card">
              <span class="step-card__number">1</span>
              <h3 class="step-card__title">Browse competitions</h3>
              <p class="step-card__text">Start with featured picks, free entry offers, or categories like cars, cash, holidays, tech, and vouchers.</p>
            </article>
            <article class="step-card">
              <span class="step-card__number">2</span>
              <h3 class="step-card__title">Open the competition page</h3>
              <p class="step-card__text">Each listing gives you the key details first so you can decide quickly which competitions are worth the click.</p>
            </article>
            <article class="step-card">
              <span class="step-card__number">3</span>
              <h3 class="step-card__title">Follow the official entry method</h3>
              <p class="step-card__text">We point you to the promoter's page so you can follow the real entry instructions, terms, and closing dates.</p>
            </article>
            <article class="step-card">
              <span class="step-card__number">4</span>
              <h3 class="step-card__title">Check back for new prizes</h3>
              <p class="step-card__text">Fresh competitions appear regularly, so returning visitors always have something new to explore.</p>
            </article>
          </div>
          <div class="trust-note">
            <p class="trust-note__title">Trust note</p>
            <p class="trust-note__text">We link to official brand promotions and we do not require sign-up on our site to browse the listings.</p>
          </div>
        </section>

        ${renderAdZone("ad-bottom", "bottom")}

        <section class="seo-copy-block" aria-label="About competitions in South Africa">
          <h2 class="seo-copy-block__title">Competitions in South Africa, all in one place</h2>
          <div class="seo-copy-block__content">
            <p>${escapeHtml(homepageSeoCopy.split("\n\n")[0])}</p>
            <p>${escapeHtml(homepageSeoCopy.split("\n\n")[1])}</p>
            <p>${escapeHtml(homepageSeoCopy.split("\n\n")[2])}</p>
          </div>
        </section>

        <section class="home-cta" aria-label="Find more competitions">
          <h2 class="home-cta__title">Browse more prizes before the best ones disappear</h2>
          <div class="home-cta__actions">
            <a class="btn btn--primary" href="#all-competitions">Browse Today&apos;s Competitions</a>
            <a class="btn btn--secondary" href="/tag/ending-soon/">Ending Soon</a>
            <a class="btn btn--secondary" href="${escapeAttribute(
              WHATSAPP_CHANNEL_URL
            )}" target="_blank" rel="noopener noreferrer">Follow on WhatsApp</a>
          </div>
        </section>
      </main>

      ${renderSiteFooter()}
    </div>

    <aside class="ad-sticky ad-sticky--reserved" id="ad-sticky" aria-hidden="true"></aside>

    <script src="/shared/page-data.js" defer></script>
    <script src="/app.js" defer></script>
  </body>
</html>
`;
}

function renderTrustPage(page) {
  const canonicalUrl = `${shared.CANONICAL_ORIGIN}/${page.slug}/`;
  const usefulLinks = getTrustPageUsefulLinks(page);
  const articleData = page.article
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: page.heading,
        description: page.description,
        image: shared.DEFAULT_OG_IMAGE,
        datePublished: page.datePublished || BUILD_DATE_ISO,
        dateModified: page.dateModified || BUILD_DATE_ISO,
        author: {
          "@type": "Organization",
          name: "Freehub",
          url: `${shared.CANONICAL_ORIGIN}/`,
        },
        publisher: {
          "@type": "Organization",
          name: "Freehub",
          url: `${shared.CANONICAL_ORIGIN}/`,
          logo: {
            "@type": "ImageObject",
            url: `${shared.CANONICAL_ORIGIN}/FH%20logo.png`,
          },
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": canonicalUrl,
        },
      }
    : null;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.heading,
    description: page.description,
    url: canonicalUrl,
    inLanguage: "en-ZA",
    isPartOf: {
      "@type": "WebSite",
      name: "Freehub",
      url: `${shared.CANONICAL_ORIGIN}/`,
    },
  };
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${shared.CANONICAL_ORIGIN}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: page.heading,
        item: canonicalUrl,
      },
    ],
  };

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeAttribute(page.description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeAttribute(page.title)}" />
    <meta property="og:description" content="${escapeAttribute(page.description)}" />
    <meta property="og:url" content="${escapeAttribute(canonicalUrl)}" />
    <meta property="og:image" content="${escapeAttribute(shared.DEFAULT_OG_IMAGE)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttribute(page.title)}" />
    <meta name="twitter:description" content="${escapeAttribute(page.description)}" />
    <meta name="twitter:image" content="${escapeAttribute(shared.DEFAULT_OG_IMAGE)}" />
    <script id="structured-data-webpage" type="application/ld+json">${escapeScript(JSON.stringify(structuredData))}</script>
    <script id="structured-data-breadcrumb" type="application/ld+json">${escapeScript(JSON.stringify(breadcrumbData))}</script>
    ${articleData ? `<script id="structured-data-article" type="application/ld+json">${escapeScript(JSON.stringify(articleData))}</script>` : ""}
    <link rel="stylesheet" href="/styles.css" />
    ${ADSENSE_SCRIPT}
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-23P37R20FY"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('set', { page_type: 'trust', trust_page: ${escapeScript(JSON.stringify(page.slug))} });
      gtag('config', 'G-23P37R20FY');
    </script>
  </head>
  <body>
    <div class="site-shell">
      ${renderModernHero({
        className: "hero--utility hero--trust",
        eyebrow: "Freehub trust",
        heading: page.heading,
        intro: page.intro,
        actions: [
          { label: "Browse Competitions", href: "/competitions/", className: "btn--primary" },
          { label: "Safety Guide", href: "/how-to-enter-competitions-safely/", className: "btn--secondary" },
        ],
        trustItems: ["Freehub is not the promoter", "Official source links", "Safety-first browsing"],
      })}

      <main class="main-content trust-page">
        <nav class="category-nav" aria-label="Competition categories">
          ${CATEGORY_LINKS.map((link) => renderNavLink(link, `/${page.slug}/`)).join("\n          ")}
        </nav>

        <section class="trust-page__content" aria-label="${escapeAttribute(page.heading)}">
          ${page.sections
            .map(
              (section) => `<article class="trust-page__section">
            <h2>${escapeHtml(section.heading)}</h2>
            ${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n            ")}
          </article>`
            )
            .join("\n          ")}
        </section>

        <section class="internal-links" aria-label="Useful Freehub pages">
          <p class="internal-links__title">Useful Freehub Pages</p>
          <div class="internal-links__list">
            ${usefulLinks
              .map(
                (link) =>
                  `<a class="internal-links__link" href="${escapeAttribute(link.href)}">${escapeHtml(link.label)}</a>`
              )
              .join("\n            ")}
          </div>
        </section>
      </main>

      ${renderSiteFooter()}
    </div>
  </body>
</html>
`;
}

function getTrustPageUsefulLinks(page) {
  if (Array.isArray(page.links) && page.links.length > 0) {
    return page.links;
  }

  return [
    { label: "Browse competitions", href: "/" },
    { label: "Competitions ending soon", href: "/competitions-ending-soon/" },
    { label: "Car competitions", href: "/category/cars/" },
    { label: "Free entry listings", href: "/tag/free-entry/" },
    { label: "Report a competition", href: "/report-a-competition/" },
  ];
}

function renderNotFoundPage() {
  const canonicalUrl = `${shared.CANONICAL_ORIGIN}/`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Page Not Found | Freehub</title>
    <meta name="description" content="This Freehub page could not be found. Browse live South African competitions, categories, safety guidance and contact options." />
    <meta name="robots" content="noindex, follow" />
    <link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Page Not Found | Freehub" />
    <meta property="og:description" content="This Freehub page could not be found. Browse live South African competitions, categories, safety guidance and contact options." />
    <meta property="og:url" content="${escapeAttribute(canonicalUrl)}" />
    <meta property="og:image" content="${escapeAttribute(shared.DEFAULT_OG_IMAGE)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Page Not Found | Freehub" />
    <meta name="twitter:description" content="This Freehub page could not be found. Browse live South African competitions, categories, safety guidance and contact options." />
    <meta name="twitter:image" content="${escapeAttribute(shared.DEFAULT_OG_IMAGE)}" />
    <link rel="stylesheet" href="/styles.css" />
    ${ADSENSE_SCRIPT}
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-23P37R20FY"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('set', { page_type: '404' });
      gtag('config', 'G-23P37R20FY');
    </script>
  </head>
  <body>
    <div class="site-shell">
      ${renderModernHero({
        className: "hero--utility hero--not-found",
        eyebrow: "Freehub",
        heading: "Page not found",
        intro: "The page you opened is not available. You can return to live competitions, browse a category, or report a broken link.",
        actions: [
          { label: "Browse Competitions", href: "/competitions/", className: "btn--primary" },
          { label: "Report Link", href: "/report-a-competition/", className: "btn--secondary" },
        ],
        trustItems: ["Current listings remain active", "Helpful routes below", "Broken links can be reported"],
      })}

      <main class="main-content">
        <section class="internal-links" aria-label="Helpful links">
          <p class="internal-links__title">Keep Browsing</p>
          <div class="internal-links__list">
            <a class="internal-links__link" href="/">All competitions</a>
            <a class="internal-links__link" href="/category/cars/">Car competitions</a>
            <a class="internal-links__link" href="/category/cash/">Cash competitions</a>
            <a class="internal-links__link" href="/category/vouchers/">Voucher competitions</a>
            <a class="internal-links__link" href="/tag/free-entry/">Free entry listings</a>
            <a class="internal-links__link" href="/tag/ending-soon/">Ending soon listings</a>
          </div>
        </section>

        <section class="state-card" aria-label="Report this page">
          <p class="state-card__title">Found a broken link?</p>
          <p class="state-card__text">If a Freehub link sent you here, please report it so the listing can be checked.</p>
          <a class="internal-links__link" href="/report-a-competition/">Report a competition or broken link</a>
        </section>
      </main>

      ${renderSiteFooter()}
    </div>

    <script src="/shared/page-data.js" defer></script>
    <script src="/app.js" defer></script>
  </body>
</html>
`;
}

function getFeaturedCompetitions(competitions, n) {
  const PRIORITY_CATEGORIES = ["Vouchers", "Cash", "Cars", "Holidays", "Tech"];

  const scored = competitions.map((c) => ({
    competition: c,
    score:
      (c.isHighValue ? 10 : 0) +
      (PRIORITY_CATEGORIES.includes(c.category) ? PRIORITY_CATEGORIES.length - PRIORITY_CATEGORIES.indexOf(c.category) : 0) +
      (Array.isArray(c.tags) && c.tags.includes("free-entry") ? 3 : 0) +
      (Array.isArray(c.tags) && c.tags.includes("high-value") ? 4 : 0) +
      (Array.isArray(c.tags) && c.tags.includes("ending-soon") ? 5 : 0) +
      (shared.isClosingWithinDays(c.closingDate, 7) ? 5 : 0),
  }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(a.competition.closingDate) - new Date(b.competition.closingDate);
  });

  // Prefer category diversity in the top N
  const result = [];
  const usedCategories = new Set();

  for (const { competition } of scored) {
    if (result.length >= n) break;
    if (!usedCategories.has(competition.category)) {
      result.push(competition);
      usedCategories.add(competition.category);
    }
  }

  for (const { competition } of scored) {
    if (result.length >= n) break;
    if (!result.includes(competition)) result.push(competition);
  }

  return result;
}

function getEndingSoonCompetitions(competitions, n) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return competitions
    .filter((c) => new Date(c.closingDate) >= today)
    .sort((a, b) => new Date(a.closingDate) - new Date(b.closingDate))
    .slice(0, n);
}

function buildHowToEnterSteps(competition) {
  const type = (competition.entryType || "").toLowerCase();
  const brand = competition.brand || "the brand";
  const date = shared.formatDate(competition.closingDate);
  const tags = Array.isArray(competition.tags) ? competition.tags : [];
  const purchaseRequired = competition.purchaseRequired === true || tags.includes("purchase-required");

  if (type.includes("app")) {
    return [
      `Download or open the ${brand} app on your smartphone.`,
      "Log in or create your account if you don't have one.",
      `Navigate to the competition or promotions section and find this offer.`,
      purchaseRequired
        ? "Make the qualifying purchase or complete the required action to unlock your entry."
        : "Tap the entry tile and follow the in-app prompts to submit your entry.",
      "Confirm your entry has been submitted successfully.",
      `Competition closes ${date}. Winners will be notified via the app or email.`,
    ];
  }

  if (type.includes("sms")) {
    return [
      purchaseRequired
        ? `Purchase the qualifying product(s) from a participating ${brand} store.`
        : "Obtain your entry reference as per the competition terms.",
      "Keep your till slip or entry reference number safe.",
      "Compose an SMS with the required keyword and/or reference number as instructed.",
      "Send your SMS to the competition shortcode displayed in-store or on promotional material.",
      "Standard SMS rates apply. You will receive a confirmation SMS if your entry is valid.",
      `Entries close ${date}.`,
    ];
  }

  if (type.includes("in-store")) {
    return [
      `Visit a participating ${brand} store near you.`,
      purchaseRequired
        ? "Make the qualifying purchase as specified in the competition terms."
        : "Pick up an entry form at the customer service desk or till point.",
      "Complete the entry form with your details and, if required, attach your till slip.",
      "Drop your entry into the competition box in-store or hand it to a cashier.",
      "Keep a copy of your till slip as proof of your entry.",
      `Competition closes ${date}.`,
    ];
  }

  // Default: Online
  return [
    `Visit the official ${brand} competition page using the link below.`,
    "Complete the online entry form with your personal details.",
    purchaseRequired
      ? "Ensure you have made the qualifying purchase and have your proof of purchase ready."
      : "No purchase is necessary to enter — simply fill in and submit the form.",
    "Submit your entry before the closing date.",
    "Check your email for an entry confirmation.",
    `Competition closes ${date}.`,
  ];
}

function renderCompetitionDetailHero({
  competition,
  heroTitle,
  heroSubline,
  formattedDate,
  closingSoon,
  expired,
  outPath,
  ctaAttributes,
  ctaLabel,
  heroImage,
}) {
  const hasSpecificVisual = isSpecificCompetitionVisual(competition);
  const imageMarkup = heroImage
    ? `<img src="${escapeAttribute(heroImage)}" alt="${escapeAttribute(buildCompetitionImageAltText(competition, expired))}" loading="eager" onerror="this.remove()" />`
    : "";
  const heroMediaClass = hasSpecificVisual
    ? "competition-hero-card__media competition-hero-card__media--specific"
    : "competition-hero-card__media";
  const placeholderMarkup = hasSpecificVisual
    ? ""
    : renderCompetitionVisualPlaceholder(competition, "competition-hero-card__placeholder");
  const closingLabel = `${expired ? "Closed" : "Closes"} ${formattedDate}${closingSoon && !expired ? " - Ending soon" : ""}`;
  const actions = expired
    ? [{ label: "Browse Current Competitions", href: "/competitions/", className: "btn--primary" }]
    : [
        {
          label: ctaLabel,
          href: outPath,
          className: "btn--primary",
          target: "_blank",
          rel: "noopener noreferrer",
          attributes: ctaAttributes,
        },
        { label: "Browse More", href: "/competitions/", className: "btn--secondary" },
      ];

  return renderModernHero({
    className: "hero--competition-modern",
    eyebrow: expired ? "Archived competition" : "Competition listing",
    heading: heroTitle,
    intro: heroSubline,
    headingId: "pageTitle",
    updatedMarkup: `<p class="hero__closing${closingSoon && !expired ? " hero__closing--urgent" : ""}">${escapeHtml(
      closingLabel
    )}</p>`,
    actions,
    trustItems: expired
      ? ["Closed competition", "Archived official source", "Current alternatives below"]
      : ["Verified listing", "Official promoter link", "Freehub does not collect entries"],
    previewMarkup: `<aside class="competition-hero-card" aria-label="Competition summary">
            <div class="${heroMediaClass}">
              ${placeholderMarkup}
              ${imageMarkup}
            </div>
            <div class="competition-hero-card__body">
              <div class="competition-hero-card__brand">
                ${renderBrandMark(competition, "competition-hero-card__mark")}
                <span>${escapeHtml(competition.brand || "Official promotion")}</span>
              </div>
              <div class="competition-hero-card__status-row">
                ${renderCardStatusBadges(competition)}
              </div>
              <div class="competition-hero-card__facts">
                <span>${escapeHtml(shared.getPrizeCue(competition))}</span>
                <span>${escapeHtml(shared.getEntryCostLabel(competition))}</span>
                <span>${escapeHtml(shared.getUrgencyLabel(competition.closingDate))}</span>
              </div>
            </div>
          </aside>`,
  });
}

function renderCompetitionDetailMedia(competition, imageUrl, altText = competition.title) {
  const hasSpecificVisual = isSpecificCompetitionVisual(competition);
  const imageMarkup = imageUrl
    ? `<img src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(altText)}" loading="lazy" onerror="this.remove()" />`
    : "";
  const mediaClass = hasSpecificVisual
    ? "competition-detail__media competition-detail__media--specific"
    : "competition-detail__media";
  const placeholderMarkup = hasSpecificVisual
    ? ""
    : renderCompetitionVisualPlaceholder(competition, "competition-detail__placeholder");

  return `<div class="${mediaClass}">
            ${placeholderMarkup}
            ${imageMarkup}
          </div>`;
}

function isSpecificCompetitionVisual(competition) {
  return Boolean(competition && (competition.image || getBrandAssociatedImage(competition)));
}

function renderCompetitionPage(competition, allCompetitions, generatedBrandSlugs = []) {
  const slug = shared.getCompetitionSlug(competition);
  const canonicalUrl = `${shared.CANONICAL_ORIGIN}/competition/${slug}/`;
  const formattedDate = shared.formatDate(competition.closingDate);
  const heroImage = getCompetitionVisualUrl(competition);
  const ogImage = getMetadataImageUrl(competition);
  const expired = shared.isExpiredCompetition(competition);
  const archiveEligible = shared.isExpiredArchiveEligibleCompetition(competition);
  const archivedLowValue = shared.isArchivedLowValueCompetition(competition);
  const fallbackDescription = expired
    ? `This ${competition.brand || "brand"} competition has closed. View the archived prize and closing-date details, then browse current South African competitions on Freehub.`
    : shared.buildCompetitionDescription(competition);
  const description = buildCompetitionSeoDescription(competition, expired, fallbackDescription);
  const pageTitle = buildCompetitionSeoTitle(competition, expired);
  const relatedCompetitions = getRelatedCompetitions(competition, allCompetitions);

  const categorySlug = shared.CATEGORY_SLUGS.find(
    (key) => shared.CATEGORY_COPY[key].category === competition.category
  );
  const categoryPath = categorySlug ? `/category/${categorySlug}/` : "/";
  const heroTitle = expired ? `${competition.title} -- Competition Closed` : competition.title;
  const robotsDirective = archivedLowValue || (expired && !archiveEligible)
    ? "noindex, follow"
    : "index, follow, max-image-preview:large";
  const officialSourceUrl = getOfficialSourceUrl(competition);
  const officialSource = getOfficialSourceDomain(competition);
  const lastChecked = formatOptionalDate(competition.lastChecked);

  const closingSoonBadge = shared.isClosingSoon(competition.closingDate)
    ? '<span class="badge badge--closing">&#x1F525; Closing Soon</span>'
    : "";
  const brandBadge = competition.brand
    ? `<span class="badge badge--category">${escapeHtml(competition.brand)}</span>`
    : "";
  const entryStepsMarkup = buildHowToEnterSteps(competition);
  const tagsMarkup = (competition.tags || []).length > 0
    ? `<div class="competition-detail__tags">
              ${competition.tags.map(tag => `<span class="badge badge--tag">${escapeHtml(tag)}</span>`).join(' ')}
            </div>`
    : "";
  const heroSubline = expired
    ? (competition.brand ? `Archived ${competition.brand} competition` : "Archived competition")
    : buildCompetitionHeroSubline(competition);
  const imageAltText = buildCompetitionImageAltText(competition, expired);
  const closingSoon = shared.isClosingSoon(competition.closingDate);
  const outPath = shared.getOutPath(competition) + "/";
  const ctaLabel = getDetailCtaLabel(competition);
  const ctaAttributes = renderDetailCtaDataAttributes(competition, outPath, officialSource);
  const detailFactsMarkup = renderCompetitionDetailFacts(
    competition,
    formattedDate,
    officialSource,
    officialSourceUrl,
    closingSoon,
    expired
  );
  const breadcrumbMarkup = renderCompetitionBreadcrumb(competition, categorySlug, categoryPath);
  const trustStripMarkup = renderCompetitionTrustStrip(competition, officialSource, lastChecked);
  const beforeYouEnterMarkup = expired ? "" : renderBeforeYouEnterBlock(competition);
  const brandPrizeContextMarkup = expired ? "" : renderBrandPrizeContextSection(competition);
  const entryCostEligibilityMarkup = expired ? "" : renderEntryCostEligibilityNotes(competition);
  const sourceBlockMarkup = renderCompetitionSourceBlock(competition, officialSource, officialSourceUrl, lastChecked, expired);
  const faqItems = buildCompetitionFaqItems(competition, officialSource, ctaLabel, expired);
  const faqMarkup = renderCompetitionFaq(faqItems);

  const relatedCardsMarkup = relatedCompetitions.map((c) => renderCompetitionCard(c)).join("\n            ");
  const relatedSection = relatedCardsMarkup
    ? `<section class="competition-section" aria-label="Related Competitions">
          <div class="internal-links">
            <p class="internal-links__title">${expired ? "Current competitions you may like" : "Related Competitions"}</p>
          </div>
          <div class="competition-grid">
            ${relatedCardsMarkup}
          </div>
        </section>`
    : "";

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${shared.CANONICAL_ORIGIN}/` },
      ...(categorySlug
        ? [{ "@type": "ListItem", position: 2, name: competition.category, item: `${shared.CANONICAL_ORIGIN}/category/${categorySlug}/` }]
        : []),
      { "@type": "ListItem", position: categorySlug ? 3 : 2, name: competition.title },
    ],
  };
  const webPageData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: expired ? `${competition.title} -- Competition Closed` : competition.title,
    description,
    url: canonicalUrl,
    inLanguage: "en-ZA",
    isPartOf: {
      "@type": "WebSite",
      name: "FreeHub",
      url: `${shared.CANONICAL_ORIGIN}/`,
    },
    about: {
      "@type": "Thing",
      name: `${competition.category} competition`,
    },
  };
  const faqStructuredData = faqItems.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }
    : null;
  const faqStructuredDataScript = faqStructuredData
    ? `<script id="structured-data-faq" type="application/ld+json">${escapeScript(JSON.stringify(faqStructuredData))}</script>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(pageTitle)}</title>
    <meta name="description" content="${escapeAttribute(description)}" />
    <meta name="robots" content="${robotsDirective}" />
    <link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeAttribute(expired ? `${competition.title} Closed` : competition.title)}" />
    <meta property="og:description" content="${escapeAttribute(description)}" />
    <meta property="og:url" content="${escapeAttribute(canonicalUrl)}" />
    <meta property="og:image" content="${escapeAttribute(ogImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttribute(expired ? `${competition.title} Closed` : competition.title)}" />
    <meta name="twitter:description" content="${escapeAttribute(description)}" />
    <meta name="twitter:image" content="${escapeAttribute(ogImage)}" />
    <script id="structured-data-webpage" type="application/ld+json">${escapeScript(JSON.stringify(webPageData))}</script>
    <script id="structured-data-breadcrumb" type="application/ld+json">${escapeScript(JSON.stringify(breadcrumbData))}</script>
    ${faqStructuredDataScript}
    <link rel="stylesheet" href="${RELATIVE_ASSET_PATH}styles.css" />
    ${ADSENSE_SCRIPT}
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-23P37R20FY"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('set', { page_type: 'competition', competition_slug: ${escapeScript(JSON.stringify(slug))}, competition_category: ${escapeScript(JSON.stringify(competition.category))} });
      gtag('config', 'G-23P37R20FY');
    </script>
  </head>
  <body>
    <div class="site-shell">
      ${renderCompetitionDetailHero({
        competition,
        heroTitle,
        heroSubline,
        formattedDate,
        closingSoon,
        expired,
        outPath,
        ctaAttributes,
        ctaLabel,
        heroImage,
      })}

      <main class="main-content">
        ${breadcrumbMarkup}

        <nav class="category-nav" aria-label="Competition categories">
          ${CATEGORY_LINKS.map((link) => renderNavLink(link, "/competition/")).join("\n          ")}
        </nav>

        <section class="popular-searches" aria-label="Popular searches">
          <p class="popular-searches__title">Popular Searches</p>
          <div class="popular-searches__links">
            ${TAG_LINKS.map((link) => renderPopularLink(link, "/competition/")).join("\n            ")}
          </div>
        </section>

        ${expired ? `<section class="state-card state-card--error" aria-label="Competition closed">
          <p class="state-card__title">This competition has closed.</p>
          <p class="state-card__text">This Freehub page is kept as an archive to help users confirm the prize, brand, closing date and official source. Browse current competitions below.</p>
        </section>` : ""}

        ${renderCompetitionInternalLinks(competition, categoryPath, generatedBrandSlugs)}

        ${renderAdZone("ad-top", "detail-top")}

        <article class="competition-detail" aria-label="${escapeAttribute(competition.title)}">
          ${renderCompetitionDetailMedia(competition, heroImage, imageAltText)}
          <div class="competition-detail__body">
            <div class="competition-detail__meta">
              <span class="badge badge--category">${escapeHtml(competition.category)}</span>
              ${expired ? '<span class="badge badge--tag">Archived competition</span>' : ""}
              ${brandBadge}
              ${closingSoonBadge}
            </div>
            ${trustStripMarkup}
            ${detailFactsMarkup}
            ${renderCompetitionQuickAnswer(competition, expired)}
            <div class="competition-detail__summary">
              <p>${escapeHtml(description)}</p>
            </div>
            ${brandPrizeContextMarkup}
            ${entryCostEligibilityMarkup}
            ${tagsMarkup}
            ${entryStepsMarkup}
            ${beforeYouEnterMarkup}
            <div class="trust-chips">
              <span class="trust-chip">Verified listing</span>
              <span class="trust-chip">We link to official brand promotions</span>
              <span class="trust-chip">No sign-up required on FreeHub</span>
            </div>
            ${expired ? renderExpiredCompetitionActions(competition, categorySlug, generatedBrandSlugs, officialSourceUrl) : `<a
              class="competition-detail__cta"
              href="${escapeAttribute(outPath)}"
              target="_blank"
              rel="noopener noreferrer"
              ${ctaAttributes}
            >
              ${escapeHtml(ctaLabel)}
            </a>
            <p class="competition-detail__cta-note">You will leave Freehub and go to the official promoter page. Freehub does not run this competition or collect your entry.</p>`}
            ${sourceBlockMarkup}
            ${faqMarkup}
            <a
              class="competition-detail__whatsapp"
              href="https://wa.me/?text=${encodeURIComponent(expired ? `View the archived ${competition.title} competition on Freehub - ${canonicalUrl}` : `Enter the ${competition.title} competition - ${canonicalUrl}`)}"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on WhatsApp"
            >
              Share on WhatsApp
            </a>
          </div>
        </article>

        <section class="state-card" aria-label="About this listing">
          <p class="state-card__title">About This Listing</p>
          <p class="state-card__text">
            We link directly to official brand competitions and promoter pages. No account or sign-up is required on our site. Always check the promoter's terms and closing date before entering.
          </p>
        </section>

        ${!expired ? `<section class="competition-cta-repeat" aria-label="Enter this competition">
          <p>Ready to enter? Head to the official competition page.</p>
          <a class="competition-detail__cta" href="${escapeAttribute(outPath)}" target="_blank" rel="noopener noreferrer" ${ctaAttributes}>${escapeHtml(ctaLabel)}</a>
          <p class="competition-detail__cta-note">You will leave Freehub and go to the official promoter page.</p>
        </section>` : ""}

        ${renderAdZone("ad-middle", "detail-inside", true)}

        ${relatedSection}

        ${renderAdZone("ad-bottom", "after-related")}

        ${competition.brand ? `<section class="internal-links" aria-label="More from ${escapeAttribute(competition.brand)}">
          <p class="internal-links__title">More from ${escapeHtml(competition.brand)}</p>
          <div class="internal-links__list">
            <a class="internal-links__link" href="${escapeAttribute(categoryPath)}">Browse ${escapeHtml(competition.category)} competitions</a>
          </div>
        </section>` : ""}

      </main>

      ${renderSiteFooter()}
    </div>

    <aside class="ad-sticky ad-sticky--reserved" id="ad-sticky" aria-hidden="true"></aside>

    <script src="${RELATIVE_ASSET_PATH}shared/page-data.js" defer></script>
    <script src="${RELATIVE_ASSET_PATH}app.js" defer></script>
  </body>
</html>
`;
}

function renderCompetitionBreadcrumb(competition, categorySlug, categoryPath) {
  const categoryLink = categorySlug
    ? `<a href="${escapeAttribute(categoryPath)}">${escapeHtml(competition.category)}</a>`
    : `<span>${escapeHtml(competition.category)}</span>`;

  return `<nav class="breadcrumb" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span aria-hidden="true">/</span>
          ${categoryLink}
          <span aria-hidden="true">/</span>
          <span aria-current="page">${escapeHtml(competition.title)}</span>
        </nav>`;
}

function renderCompetitionTrustStrip(competition, officialSource, lastChecked) {
  const items = [];

  if (competition.verificationStatus === "published") {
    items.push("Verified listing");
  }

  if (lastChecked) {
    items.push(`Last checked: ${lastChecked}`);
  }

  if (officialSource) {
    items.push(`Official source: ${officialSource}`);
  }

  if (items.length === 0) {
    return "";
  }

  return `<div class="detail-trust-strip" aria-label="Listing trust details">
              ${items.map((item) => `<span>${escapeHtml(item)}</span>`).join("\n              ")}
            </div>`;
}

function renderBeforeYouEnterBlock(competition) {
  const costLabel = shared.getEntryCostLabel(competition);
  const entryCostType = String(competition.entryCostType || "").toLowerCase();
  const entryChannel = String(competition.entryChannel || competition.entryType || "").toLowerCase();
  const items = [
    "Read the official promoter terms before entering.",
    "Make sure the page you enter on belongs to the official promoter.",
    "Confirm the closing date on the official terms or promoter page.",
    "Freehub lists this competition but does not run it or collect your entry.",
  ];

  if (competition.purchaseRequired === true || entryCostType === "purchase-required") {
    items.push("Keep your receipt or proof of purchase.");
    if (competition.requiredProduct) {
      items.push("Check the qualifying products and participating stores.");
    }
    if (competition.minimumSpend || competition.minimumSpendAmount) {
      items.push("Confirm the minimum spend before buying.");
    }
  }

  if (costLabel === "Paid entry") {
    items.push("Check the ticket price and official payment flow.");
    items.push("Only buy through the official promoter or ticketing page.");
  }

  if (/sms|ussd|whatsapp/.test(entryChannel)) {
    items.push("Use only the official number or code shown by the promoter.");
    items.push("Standard network or data rates may apply.");
  }

  if (competition.category === "Cars" || competition.driverLicenceRequired) {
    items.push("Check whether a valid driver's licence or nominated driver is required.");
  }

  return `<section class="detail-checklist" aria-label="Before you enter">
              <p class="detail-section-title">Before you enter</p>
              <ul>
                ${items.slice(0, 7).map((item) => `<li>${escapeHtml(item)}</li>`).join("\n                ")}
              </ul>
            </section>`;
}

function buildCompetitionSeoTitle(competition, expired) {
  if (expired && competition.archiveSeoTitle) {
    return competition.archiveSeoTitle;
  }

  if (!expired && competition.seoTitle) {
    return competition.seoTitle;
  }

  return expired
    ? `${competition.title} Closed | Current Alternatives on Freehub`
    : `${competition.title} | ${competition.brand} Competition in South Africa | Freehub`;
}

function buildCompetitionSeoDescription(competition, expired, fallbackDescription) {
  if (expired && competition.archiveSeoDescription) {
    return competition.archiveSeoDescription;
  }

  if (!expired && competition.seoDescription) {
    return competition.seoDescription;
  }

  if (expired) {
    return fallbackDescription;
  }

  const prize = competition.prizeName || competition.prize || shared.getPrizeCue(competition);
  const pieces = [
    `See the ${competition.title}`,
    prize ? `including ${prize} prize details` : "including prize details",
    competition.closingDate ? "closing date" : "",
    competition.eligibilitySummary || competition.eligibility ? "eligibility notes" : "",
    "and the official terms",
  ].filter(Boolean);

  return `${pieces.join(", ")}.`;
}

function renderCompetitionQuickAnswer(competition, expired = false) {
  const quickAnswer = expired ? competition.archiveQuickAnswer : competition.quickAnswer;

  if (!quickAnswer) {
    return "";
  }

  return `<section class="detail-context detail-context--quick-answer" aria-label="Quick answer">
              <p class="detail-section-title">Quick answer</p>
              <p>${escapeHtml(quickAnswer)}</p>
            </section>`;
}

function buildCompetitionHeroSubline(competition) {
  const parts = [
    competition.brand ? `${competition.brand} competition in South Africa` : "Competition in South Africa",
    competition.category,
  ].filter(Boolean);

  return parts.join(" - ");
}

function buildCompetitionImageAltText(competition, expired = false) {
  const parts = [
    competition.title,
    competition.prizeName || competition.prize,
    competition.category ? `${competition.category} competition` : "",
    expired ? "closed archive page" : "Freehub listing",
  ].filter(Boolean);

  return parts.join(" - ");
}

function renderEntryCostEligibilityNotes(competition) {
  const notes = [
    competition.entryCostSummary ? { label: "Entry cost note", value: competition.entryCostSummary } : null,
    competition.eligibilitySummary ? { label: "Eligibility note", value: competition.eligibilitySummary } : null,
  ].filter(Boolean);

  if (notes.length === 0) {
    return "";
  }

  return `<section class="detail-context detail-context--notes" aria-label="Entry cost and eligibility notes">
              <p class="detail-section-title">Entry cost and eligibility notes</p>
              ${notes.map((note) => `<p><strong>${escapeHtml(note.label)}:</strong> ${escapeHtml(note.value)}</p>`).join("\n              ")}
            </section>`;
}

function renderBrandPrizeContextSection(competition) {
  const brandContext = competition.brandContext
    || `${competition.brand || "The named brand"} is the named brand or promoter for this competition. This Freehub page summarises the available prize, entry, closing date and official source information so users can check the promotion before entering.`;
  const prizeContext = competition.prizeContext
    || `${competition.prizeName || competition.prize || "The prize"} is listed from the verified competition data available to Freehub, with the closing date and official source shown on this page.`;
  const seoItems = parseSeoContextItems(competition.seoContext);

  return `<section class="detail-context" aria-label="Brand and competition context">
              <p class="detail-section-title">About the brand and this competition</p>
              <p>${escapeHtml(brandContext)}</p>
              <p>${escapeHtml(prizeContext)}</p>
              ${seoItems.length > 0 ? `<div class="detail-checklist detail-checklist--compact">
                <p class="detail-section-title">Why this may interest users</p>
                <ul>
                  ${seoItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n                  ")}
                </ul>
              </div>` : ""}
            </section>`;
}

function parseSeoContextItems(seoContext) {
  const raw = String(seoContext || "").trim();

  if (!raw) {
    return [];
  }

  return raw
    .replace(/^Useful for users searching for\s+/i, "")
    .split(/,\s*|\s+and\s+/)
    .map((item) => item.replace(/\.$/, "").trim())
    .filter(Boolean)
    .slice(0, 5);
}

function renderCompetitionSourceBlock(competition, officialSource, officialSourceUrl, lastChecked, expired = false) {
  const sourceLabel = expired ? "View archived official terms/source" : "View official terms";
  const termsMarkup = competition.termsUrl
    ? `<p><strong>Terms and conditions:</strong> <a href="${escapeAttribute(competition.termsUrl)}" rel="nofollow noopener" target="_blank">${escapeHtml(sourceLabel)}</a></p>`
    : "<p><strong>Terms and conditions:</strong> Check the official promoter page for full terms.</p>";

  return `<section class="detail-source" aria-label="Official source and terms">
              <p class="detail-section-title">Source and terms</p>
              <p><strong>Official source:</strong> <a href="${escapeAttribute(officialSourceUrl)}" rel="nofollow noopener" target="_blank">${escapeHtml(officialSource)}</a></p>
              ${termsMarkup}
              ${lastChecked ? `<p><strong>Last checked:</strong> ${escapeHtml(lastChecked)}</p>` : ""}
              <p><strong>Report an issue:</strong> <a href="/report-a-competition/">Tell Freehub about a broken, expired or suspicious listing</a></p>
            </section>`;
}

function buildCompetitionFaqItems(competition, officialSource, ctaLabel, expired = false) {
  const items = [];
  const costLabel = shared.getEntryCostLabel(competition);

  if (expired) {
    return [
      {
        question: "Is this competition still open?",
        answer: "No. This competition has closed and is kept on Freehub as an archive page.",
      },
      {
        question: "Can I still enter this competition?",
        answer: "No. Freehub does not show an enter button for closed competitions. Browse current competitions instead.",
      },
      {
        question: "Where can I find current competitions like this?",
        answer: `Use the current competitions, category and related listings on this page to find active South African competitions${competition.category ? ` in ${competition.category}` : ""}.`,
      },
      {
        question: "Why does Freehub keep closed competition pages?",
        answer: "Freehub keeps useful closed pages so users can confirm the prize, brand, closing date and official source after a competition has ended.",
      },
    ];
  }

  if (competition.entryCostType || typeof competition.purchaseRequired === "boolean" || competition.entryFeeLabel) {
    items.push({
      question: "Is this competition free to enter?",
      answer: buildFreeEntryAnswer(competition, costLabel),
    });
  }

  if (typeof competition.purchaseRequired === "boolean" || competition.requiredProduct || competition.minimumSpend) {
    items.push({
      question: "Do I need to buy something to enter?",
      answer: buildPurchaseRequirementAnswer(competition),
    });
  }

  if (officialSource) {
    items.push({
      question: "Where do I enter?",
      answer: `${ctaLabel} through Freehub's tracked outbound page, then complete your entry on ${officialSource}.`,
    });
  }

  if (competition.category === "Cars" || competition.driverLicenceRequired) {
    items.push({
      question: "Do I need a driver's licence?",
      answer: buildDriverLicenceAnswer(competition),
    });
  }

  items.push({
    question: "Is this competition run by Freehub?",
    answer: "No. Freehub lists the competition and links to the official promoter. Freehub does not run the competition or collect your entry.",
  });

  return items.slice(0, 5);
}

function buildFreeEntryAnswer(competition, costLabel) {
  if (competition.purchaseRequired === true) {
    return "No. This listing requires a qualifying purchase before entry. There may be no separate entry fee, but it is not a free-entry competition.";
  }

  if (costLabel === "Paid entry") {
    return `No. This listing uses paid entry${competition.entryFeeLabel ? ` (${competition.entryFeeLabel})` : ""}.`;
  }

  if (costLabel === "SMS/data rates may apply") {
    return "There may be no purchase requirement shown, but SMS, USSD or data rates may apply. Check the promoter's terms before entering.";
  }

  if (costLabel === "App required") {
    return "Entry appears to require the official app. Check the app and promoter terms for any costs or account requirements.";
  }

  if (costLabel === "Free entry") {
    return "This listing is marked as free entry based on the available Freehub data. Always confirm the latest terms on the official promoter page.";
  }

  return "The entry cost is unclear from the available data. Check the official promoter page before entering.";
}

function buildPurchaseRequirementAnswer(competition) {
  if (competition.purchaseRequired === true) {
    const parts = ["Yes. This competition requires a qualifying purchase"];
    if (competition.requiredProduct) {
      parts.push(` involving ${competition.requiredProduct}`);
    }
    if (competition.minimumSpend) {
      parts.push(` with ${competition.minimumSpend}`);
    }
    return `${parts.join("")}. Keep your proof of purchase for verification.`;
  }

  return "The available Freehub data does not show a purchase requirement for this listing. Check the official promoter page before entering.";
}

function buildDriverLicenceAnswer(competition) {
  const requirement = formatDriverLicenceRequirement(competition.driverLicenceRequired);

  if (requirement) {
    return `The current listing shows: ${requirement}. Check the official terms for the promoter's exact licence or nominated-driver rules.`;
  }

  return "Freehub does not currently have a specific driver's licence requirement for this car competition. Check the official terms before entering.";
}

function renderCompetitionFaq(items) {
  if (items.length === 0) {
    return "";
  }

  return `<section class="detail-faq" aria-label="Competition questions">
              <p class="detail-section-title">Quick questions</p>
              ${items
                .map(
                  (item) => `<details>
                    <summary>${escapeHtml(item.question)}</summary>
                    <p>${escapeHtml(item.answer)}</p>
                  </details>`
                )
                .join("\n              ")}
            </section>`;
}

function renderLegacyCompetitionPage(competition) {
  const slug = shared.getCompetitionSlug(competition);
  const title = competition.title || "Competition details";
  const sourceUrl = getOfficialSourceUrl(competition);
  const sourceDomain = getOfficialSourceDomain(competition);
  const canonicalUrl = `${shared.CANONICAL_ORIGIN}/competition/${slug}/`;
  const archiveDate = formatOptionalDate(competition.archivedAt);
  const closingDate = formatOptionalDate(competition.closingDate);
  const sourceLink = sourceUrl
    ? {
        label: `Reference source: ${sourceDomain}`,
        href: sourceUrl,
        className: "btn--secondary",
        target: "_blank",
        rel: "nofollow noopener",
      }
    : null;
  const actions = [
    { label: "Browse current competitions", href: "/competitions/", className: "btn--primary" },
    ...(sourceLink ? [sourceLink] : []),
  ];
  const sourceReferenceMarkup = sourceUrl
    ? `<p class="state-card__text">
            Official source reference:
            <a href="${escapeAttribute(sourceUrl)}" rel="nofollow noopener" target="_blank">${escapeHtml(
              sourceDomain
            )}</a>
          </p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)} | Closed Competition | Freehub</title>
    <meta name="description" content="This competition listing is no longer active on Freehub. Use the official source link to confirm current promoter information." />
    <meta name="robots" content="noindex, follow" />
    <link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="stylesheet" href="${RELATIVE_ASSET_PATH}styles.css" />
    ${ADSENSE_SCRIPT}
  </head>
  <body>
    <div class="site-shell">
      ${renderModernHero({
        className: "hero--utility hero--closed-listing",
        eyebrow: "Inactive listing",
        heading: title,
        intro: "This listing is not active on Freehub. It is kept as a legacy reference, but it is not shown as a current competition or open entry.",
        actions,
        trustItems: ["Not active on Freehub", "No active entry shown", "Source details can change"],
      })}

      <main class="main-content">
        <section class="state-card">
          <p class="state-card__title">This listing is not active on Freehub</p>
          <p class="state-card__text">${closingDate ? `Original closing date: ${escapeHtml(closingDate)}. ` : ""}${
            archiveDate ? `Archived on ${escapeHtml(archiveDate)}. ` : ""
          }Do not treat this page as open for entry. Browse current competitions instead.</p>
          ${sourceReferenceMarkup}
          <p class="state-card__text">
            <a href="/competitions/">Browse current competitions</a>
          </p>
        </section>
      </main>
    </div>
  </body>
</html>
`;
}

function renderOutPage(competition) {
  const slug = shared.getCompetitionSlug(competition);
  const externalUrl = getOfficialSourceUrl(competition);
  const sourceDomain = getOfficialSourceDomain(competition);
  const canonicalUrl = `${shared.CANONICAL_ORIGIN}/out/${slug}/`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Redirecting to ${escapeHtml(competition.title)} | Free Hub SA</title>
    <meta name="robots" content="noindex, nofollow" />
    <link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="stylesheet" href="${RELATIVE_ASSET_PATH}styles.css" />
    ${ADSENSE_SCRIPT}
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-23P37R20FY"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('set', { page_type: 'outbound', competition_slug: ${escapeScript(JSON.stringify(slug))}, competition_category: ${escapeScript(JSON.stringify(competition.category))} });
      gtag('config', 'G-23P37R20FY');
    </script>
    <script>
      (function () {
        var SLUG = ${escapeScript(JSON.stringify(slug))};
        var TITLE = ${escapeScript(JSON.stringify(competition.title))};
        var CATEGORY = ${escapeScript(JSON.stringify(competition.category))};
        var TARGET = ${escapeScript(JSON.stringify(externalUrl))};
        var SOURCE_DOMAIN = ${escapeScript(JSON.stringify(sourceDomain))};
        gtag('event', 'outbound_click', {
          competition_slug: SLUG,
          competition_title: TITLE,
          competition_category: CATEGORY,
          source_domain: SOURCE_DOMAIN,
          destination_url: TARGET,
          page_type: 'out',
          transport_type: 'beacon',
        });
        setTimeout(function () {
          window.location.replace(TARGET);
        }, 2000);
      })();
    </script>
  </head>
  <body>
    <div class="site-shell">
      ${renderModernHero({
        className: "hero--utility hero--outbound",
        eyebrow: "Official source",
        heading: "You are leaving Freehub",
        intro: `Taking you to ${sourceDomain} for ${competition.title}. If you are not redirected automatically, use the link below.`,
        actions: [
          { label: "Continue", href: externalUrl, className: "btn--primary", target: "_blank", rel: "nofollow noopener" },
          { label: "Back to Competitions", href: "/competitions/", className: "btn--secondary" },
        ],
        trustItems: ["External promoter page", "Terms apply at source", "Freehub does not collect entries"],
      })}

      <main class="main-content">
        <section class="state-card outbound-notice" aria-label="Redirect notice">
          <p class="state-card__title">Continue to the official promoter</p>
          <p class="state-card__text">
            You will be taken to ${escapeHtml(sourceDomain)} in 2 seconds. Freehub does not run this competition or collect your entry.
          </p>
          <p class="state-card__text">Always check the promoter's terms before entering.</p>
          <a class="competition-detail__cta" href="${escapeAttribute(externalUrl)}" rel="nofollow noopener" target="_blank">
            Continue to official promoter page
          </a>
          <p class="competition-detail__cta-note">If the redirect does not work, use the button above as the manual fallback link.</p>
        </section>

        ${renderAdZone("ad-top", "outbound-top")}

        ${renderAdZone("ad-middle", "outbound-middle", true)}
      </main>

      ${renderSiteFooter()}
    </div>
  </body>
</html>
`;
}

function renderCompetitionInternalLinks(competition, categoryPath, generatedBrandSlugs = []) {
  const links = [{ label: `All ${competition.category} competitions`, href: categoryPath }];
  const entryCostType = String(competition.entryCostType || "").toLowerCase();
  const brandSlug = shared.getBrandSlugForCompetition(competition, generatedBrandSlugs);

  if (brandSlug) {
    links.push({ label: `More ${competition.brand} competitions`, href: `/brand/${brandSlug}/` });
  }

  if (competition.category === "Cars" || String(competition.prizeType || "").toLowerCase() === "car") {
    links.push({ label: "Win a car competitions", href: "/win-a-car/" });
  }

  if (competition.purchaseRequired === true || entryCostType === "purchase-required") {
    links.push({ label: "Purchase required competitions", href: "/purchase-required-competitions/" });
  } else if (entryCostType === "paid-entry" || Number(competition.entryFeeAmount) > 0) {
    links.push({ label: "Paid entry competitions", href: "/paid-entry-competitions/" });
  } else if (entryCostType === "free-entry") {
    links.push({ label: "Free competitions", href: "/free-competitions/" });
  }

  links.push({ label: "How to enter competitions safely", href: "/how-to-enter-competitions-safely/" });
  links.push({ label: "Competitions ending soon", href: "/competitions-ending-soon/" });

  return `<section class="internal-links" aria-label="Explore More">
          <p class="internal-links__title">Explore More</p>
          <div class="internal-links__list">
            ${links
              .map(
                (link) =>
                  `<a class="internal-links__link" href="${escapeAttribute(link.href)}">${escapeHtml(link.label)}</a>`
              )
              .join("\n            ")}
          </div>
        </section>`;
}

function renderExpiredCompetitionActions(competition, categorySlug, generatedBrandSlugs = [], officialSourceUrl = "") {
  const links = [
    { label: "Browse Current Competitions", href: "/competitions/", className: "competition-detail__cta" },
  ];
  const brandSlug = shared.getBrandSlugForCompetition(competition, generatedBrandSlugs);

  if (brandSlug) {
    links.push({ label: `Browse ${competition.brand} competitions`, href: `/brand/${brandSlug}/`, className: "btn btn--secondary" });
  }

  if (categorySlug) {
    links.push({ label: `Browse ${competition.category} competitions`, href: `/category/${categorySlug}/`, className: "btn btn--secondary" });
  }

  links.push(
    { label: "Competitions ending soon", href: "/competitions-ending-soon/", className: "btn btn--secondary" },
    { label: "Free competitions", href: "/free-competitions/", className: "btn btn--secondary" }
  );

  const actionMarkup = links
    .map((link) => `<a class="${escapeAttribute(link.className)}" href="${escapeAttribute(link.href)}">${escapeHtml(link.label)}</a>`)
    .join("\n              ");
  const sourceMarkup = officialSourceUrl
    ? `<p class="competition-detail__cta-note"><a href="${escapeAttribute(officialSourceUrl)}" rel="nofollow noopener" target="_blank">View archived official terms/source</a></p>`
    : "";

  return `<div class="competition-archive-actions" aria-label="Archived competition actions">
              ${actionMarkup}
              <p class="competition-detail__cta-note">This competition has closed, so Freehub no longer links to the official entry flow as the main action.</p>
              ${sourceMarkup}
            </div>`;
}

function getRelatedCompetitions(competition, allCompetitions) {
  const currentSlug = shared.getCompetitionSlug(competition);
  const competitionTagSet = new Set([
    ...(competition.tags || []),
    ...(competition.sportsTags || []),
    ...(competition.teamTags || []),
  ]);

  const scored = allCompetitions
    .filter((c) => shared.getCompetitionSlug(c) !== currentSlug)
    .map((c) => {
      let score = 0;
      if (c.brand && competition.brand && c.brand === competition.brand) score += 6;
      if (c.category === competition.category) score += 3;
      if (shared.isHighValueCompetition(c)) score += 1;
      [...(c.tags || []), ...(c.sportsTags || []), ...(c.teamTags || [])].forEach((tag) => {
        if (competitionTagSet.has(tag)) score += 1;
      });
      return { competition: c, score };
    })
    .sort((a, b) => b.score - a.score || new Date(a.competition.closingDate) - new Date(b.competition.closingDate));

  return scored.slice(0, 5).map((item) => item.competition);
}

function renderCompetitionDetailFacts(competition, formattedDate, officialSource, officialSourceUrl, closingSoon, expired) {
  const facts = [
    { label: "Prize", value: competition.prizeName || shared.getPrizeCue(competition) },
    { label: "Prize value", value: formatPrizeValue(competition) },
    { label: "Number of prizes", value: competition.numberOfPrizes },
    { label: "Brand", value: competition.brand || "Official promotion" },
    { label: "Category", value: competition.category },
    {
      label: "Closing date",
      value: `${formattedDate}${closingSoon && !expired ? " · ending soon" : ""}`,
      urgent: closingSoon && !expired,
    },
    { label: "Entry cost", value: shared.getEntryCostLabel(competition) },
    { label: "Entry fee", value: competition.entryFeeLabel },
    {
      label: "Purchase required",
      value:
        typeof competition.purchaseRequired === "boolean"
          ? competition.purchaseRequired
            ? "Yes"
            : "No"
          : "",
    },
    { label: "Minimum spend", value: competition.minimumSpend },
    { label: "Product required", value: competition.requiredProduct },
    { label: "Entry channel", value: competition.entryChannel },
    { label: "Eligibility", value: competition.eligibility },
    { label: "Driver's licence requirement", value: formatDriverLicenceRequirement(competition.driverLicenceRequired) },
    { label: "Region", value: competition.region },
    {
      label: "Official terms",
      value: competition.termsUrl ? (expired ? "View archived official terms/source" : "View terms") : "",
      html: competition.termsUrl
        ? `<a href="${escapeAttribute(competition.termsUrl)}" rel="nofollow noopener" target="_blank">${escapeHtml(expired ? "View archived official terms/source" : "View terms")}</a>`
        : "",
    },
    {
      label: "Official source",
      value: officialSource,
      html: officialSourceUrl
        ? `<a href="${escapeAttribute(officialSourceUrl)}" rel="nofollow noopener" target="_blank">${escapeHtml(officialSource)}</a>`
        : escapeHtml(officialSource),
    },
  ].filter((fact) => fact.value !== undefined && fact.value !== null && String(fact.value).trim() !== "");

  return `<div class="competition-detail__info">
              ${facts
                .map(
                  (fact) =>
                    `<p class="${escapeAttribute(getDetailFactClassName(fact))}"><strong>${escapeHtml(
                      fact.label
                    )}:</strong> ${fact.html || escapeHtml(fact.value)}</p>`
                )
                .join("\n              ")}
            </div>`;
}

function getDetailFactClassName(fact) {
  const normalizedLabel = String(fact.label || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const classes = ["competition-detail__fact"];

  if (normalizedLabel) {
    classes.push(`competition-detail__fact--${normalizedLabel}`);
  }

  if (fact.urgent) {
    classes.push("competition-detail__info--urgent");
  }

  return classes.join(" ");
}

function formatPrizeValue(competition) {
  const value = shared.formatRandAmount(competition.prizeValueAmount);

  if (!value) {
    return "";
  }

  return competition.prizeValueCurrency && competition.prizeValueCurrency !== "ZAR"
    ? `${value} ${competition.prizeValueCurrency}`
    : value;
}

function formatDriverLicenceRequirement(value) {
  switch (value) {
    case "yes":
      return "Yes";
    case "no":
      return "No";
    case "winner-or-nominated-driver":
      return "Winner or nominated driver";
    default:
      return value || "";
  }
}

const REQUIRED_FIELDS = ["id", "title", "brand", "category", "closingDate", "url"];

function validateCompetition(entry, index) {
  const missing = REQUIRED_FIELDS.filter(
    (field) => !entry[field] || String(entry[field]).trim() === ""
  );
  if (missing.length > 0) {
    console.warn(`[SKIP] Entry at index ${index} missing required fields: ${missing.join(", ")}`);
    return false;
  }
  return true;
}

function runDataSafetyChecks(competitions) {
  const errors = [];
  const warnings = [];
  const seenSlugs = new Map();

  competitions.forEach((competition) => {
    const slug = shared.getCompetitionSlug(competition);
    const label = `${competition.title} (${slug})`;
    const tags = Array.isArray(competition.tags) ? competition.tags : [];
    const prizeType = String(competition.prizeType || "").toLowerCase();
    const headline = shared.getCardHeadline(competition);
    const costLabel = shared.getEntryCostLabel(competition);
    const previewUrlFields = ["entryUrl", "url", "sourceUrl"].filter((field) => isPreviewOrStagingUrl(competition[field]));

    if (seenSlugs.has(slug)) {
      errors.push(`Duplicate competition slug "${slug}" for "${seenSlugs.get(slug)}" and "${competition.title}".`);
    } else {
      seenSlugs.set(slug, competition.title);
    }

    if (previewUrlFields.length > 0 && competition.verificationStatus === "published") {
      errors.push(`Preview/staging entry URL detected. Confirm live public entry URL before publishing. ${label}; fields: ${previewUrlFields.join(", ")}`);
    } else if (previewUrlFields.length > 0) {
      warnings.push(`Preview/staging entry URL detected. Confirm live public entry URL before publishing. ${label}; fields: ${previewUrlFields.join(", ")}`);
    }

    if (competition.publicationStatus === "published" && competition.verificationStatus !== "published") {
      errors.push(`publicationStatus is published but verificationStatus is not published: ${label}.`);
    }

    if (competition.verificationStatus === "published" && competition.doNotPublish === true) {
      errors.push(`Published record has doNotPublish=true: ${label}.`);
    }

    if (competition.verificationStatus === "published" && !competition.sourceUrl) {
      warnings.push(`Published record is missing sourceUrl: ${label}.`);
    }

    if (competition.verificationStatus === "published" && !competition.termsUrl) {
      warnings.push(`Published record is missing termsUrl: ${label}.`);
    }

    if (competition.verificationStatus !== "published") {
      return;
    }

    if (/\bCash\b/i.test(headline) && prizeType !== "cash") {
      errors.push(`Misleading card headline for ${label}: "${headline}" but prizeType is "${prizeType || "missing"}".`);
    }

    if (competition.purchaseRequired === true && costLabel === "Free entry") {
      errors.push(`Purchase-required listing shows Free entry cost label: ${label}.`);
    }

    if (
      competition.entryFeeAmount &&
      competition.prizeValueAmount &&
      Number(competition.entryFeeAmount) === Number(competition.prizeValueAmount) &&
      prizeType !== "cash"
    ) {
      errors.push(`Entry fee amount may be used as prize value for ${label}.`);
    }

    if (
      competition.minimumSpendAmount &&
      competition.prizeValueAmount &&
      Number(competition.minimumSpendAmount) === Number(competition.prizeValueAmount) &&
      prizeType !== "cash"
    ) {
      errors.push(`Minimum spend amount may be used as prize value for ${label}.`);
    }

    if (tags.includes("paid-entry") && !competition.entryFeeLabel && !competition.entryFeeAmount) {
      warnings.push(`Paid-entry tag has no entryFeeLabel or entryFeeAmount: ${label}.`);
    }

    if (tags.includes("purchase-required") && competition.purchaseRequired !== true) {
      warnings.push(`purchase-required tag is present but purchaseRequired is not true: ${label}.`);
    }

    if ((competition.isHighValue || tags.includes("high-value")) && !competition.prizeType) {
      warnings.push(`Published high-value listing is missing prizeType: ${label}.`);
    }

    if (competition.category === "Cars" && !competition.prizeName) {
      warnings.push(`Published car listing is missing prizeName: ${label}.`);
    }
  });

  warnings.forEach((warning) => console.warn(`[WARN] ${warning}`));

  if (errors.length > 0) {
    throw new Error(`[Data safety checks failed]\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }
}

function isPreviewOrStagingUrl(value) {
  const url = String(value || "").trim().toLowerCase();

  return Boolean(url) && (
    url.includes("display.wayin.com/preview") ||
    url.includes("stagemode=true") ||
    url.includes("/preview/")
  );
}

function isExpired(dateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const closing = new Date(dateString);
  closing.setHours(0, 0, 0, 0);
  return closing < today;
}

function buildHowToEnterSteps(competition) {
  if (Array.isArray(competition.entrySteps) && competition.entrySteps.length > 0) {
    return renderHowToEnterList(competition.entrySteps);
  }

  if (typeof competition.entrySteps === "string" && competition.entrySteps.trim()) {
    return renderHowToEnterList([competition.entrySteps.trim()]);
  }

  const type = (competition.entryType || "").toLowerCase();
  let steps;

  if (type.includes("sms")) {
    steps = [
      "Buy a qualifying product from the participating retailer.",
      "SMS the required keyword and your details to the competition number.",
      "Keep your receipt as proof of purchase.",
      "Winners are drawn at random and contacted directly.",
    ];
  } else if (type.includes("app")) {
    steps = [
      `Download or open the ${competition.brand || "brand"} app.`,
      "Navigate to the competition or promotions section.",
      "Follow the in-app entry instructions.",
      "Submit your entry before the closing date.",
    ];
  } else if (type.includes("in-store") || type.includes("purchase")) {
    steps = [
      `Purchase a qualifying product at a participating ${competition.brand || "brand"} store.`,
      "Collect your receipt or any on-pack promotional material.",
      "Follow the in-store or on-pack entry instructions.",
      "Submit your entry before the closing date.",
    ];
  } else if (type.includes("survey") || type.includes("form")) {
    steps = [
      "Visit the official competition page using the link below.",
      "Complete the entry form with your details.",
      "Submit the form before the closing date.",
      "Check your email — winners are notified directly.",
    ];
  } else if (type.includes("social")) {
    steps = [
      "Follow the brand on their official social media account.",
      "Like or share the competition post as instructed.",
      "Tag any required friends in the comments.",
      "Winners are selected and announced on the brand's social page.",
    ];
  } else {
    steps = [
      "Visit the official competition page using the link below.",
      "Read the entry requirements and terms carefully.",
      "Complete and submit your entry.",
      "Winners are notified by the promoter — check back for results.",
    ];
  }

  return renderHowToEnterList(steps);
}

function renderHowToEnterList(steps) {
  return `<div class="competition-detail__steps">
              <p class="competition-detail__steps-title"><strong>How to Enter</strong></p>
              <ol class="competition-detail__steps-list">
                ${steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("\n                ")}
              </ol>
            </div>`;
}

function generateSitemap(competitions, routeContexts, sitemapCompetitions = competitions) {
  const origin = shared.CANONICAL_ORIGIN;

  const staticEntries = routeContexts.map((routeContext) => {
    const loc = routeContext.path === "/" ? `${origin}/` : `${origin}${routeContext.path}`;
    return renderSitemapUrl({
      loc,
      lastmod: getRouteLastmod(routeContext, competitions),
    });
  });
  const trustPageEntries = TRUST_PAGE_DEFINITIONS.map((page) => {
    return renderSitemapUrl({
      loc: `${origin}/${page.slug}/`,
      lastmod: page.dateModified || BUILD_DATE_ISO,
    });
  });

  const competitionEntries = sitemapCompetitions
    .filter((competition) => shared.isActiveCompetition(competition))
    .map((competition) => {
      const slug = shared.getCompetitionSlug(competition);
      return renderSitemapUrl({
        loc: `${origin}/competition/${slug}/`,
        lastmod: getCompetitionLastmod(competition),
        images: getSitemapImagesForCompetition(competition),
      });
    });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${[...staticEntries, ...trustPageEntries, ...competitionEntries].join("\n")}
</urlset>
`;
}

function renderSitemapUrl({ loc, lastmod, images = [] }) {
  const imageMarkup = images
    .map((imageUrl) => `\n    <image:image>\n      <image:loc>${escapeXml(imageUrl)}</image:loc>\n    </image:image>`)
    .join("");
  const lastmodMarkup = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : "";

  return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmodMarkup}${imageMarkup}\n  </url>`;
}

function getRouteLastmod(routeContext, competitions) {
  if (routeContext.type === "brand-index") {
    return getCompetitionListLastmod(competitions) || BUILD_DATE_ISO;
  }

  const filteredCompetitions = shared.filterCompetitionsByRoute(competitions, routeContext);
  return getCompetitionListLastmod(filteredCompetitions) || BUILD_DATE_ISO;
}

function getCompetitionListLastmod(competitions) {
  const dates = competitions
    .map(getCompetitionLastmod)
    .filter(Boolean)
    .sort();

  return dates.length > 0 ? dates[dates.length - 1] : "";
}

function getCompetitionLastmod(competition) {
  return normalizeIsoDateString(competition.lastChecked) || BUILD_DATE_ISO;
}

function normalizeIsoDateString(value) {
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    return "";
  }

  const parsed = new Date(rawValue);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

function getSitemapImagesForCompetition(competition) {
  const imageUrl = competition.image || "";

  if (!/^https?:\/\//i.test(imageUrl)) {
    return [];
  }

  return [imageUrl];
}

function renderRobotsTxt() {
  return `User-agent: *
Allow: /

Sitemap: ${shared.CANONICAL_ORIGIN}/sitemap.xml
`;
}

function getSafeHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (_error) {
    return "official promoter site";
  }
}

function getOfficialSourceUrl(competition) {
  return competition.sourceUrl || competition.url;
}

function getOfficialSourceDomain(competition) {
  if (competition.sourceDomain) {
    return String(competition.sourceDomain).replace(/^www\./, "");
  }

  return getSafeHostname(getOfficialSourceUrl(competition));
}

function formatOptionalDate(dateString) {
  if (!dateString) {
    return "";
  }

  return shared.formatDate(dateString);
}

function getLocalIsoDate(date) {
  const localDate = new Date(date);
  localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
  return localDate.toISOString().slice(0, 10);
}

function getDetailCtaLabel(competition) {
  const entryCostType = String(competition.entryCostType || "").toLowerCase();
  const entryText = [competition.entryType, competition.entryChannel, ...(competition.tags || [])].join(" ").toLowerCase();

  if (entryCostType === "paid-entry" || shared.getEntryCostLabel(competition) === "Paid entry") {
    return "Buy ticket on official page";
  }

  if (entryText.includes("whatsapp")) {
    return "Enter via official WhatsApp";
  }

  if (entryText.includes("ussd")) {
    return "Enter using official USSD code";
  }

  if (entryCostType === "app-required" || /\bapp\b/.test(entryText)) {
    return "Enter in the official app";
  }

  if (isSimpleBrandName(competition.brand)) {
    return `Enter on ${competition.brand}${getPossessiveSuffix(competition.brand)} site`;
  }

  return "View official entry page";
}

function isSimpleBrandName(brand) {
  if (!brand) {
    return false;
  }

  const trimmed = String(brand).trim();
  return trimmed.length <= 24 && /^[A-Za-z0-9 .'-]+$/.test(trimmed) && !/[\/&()+]/.test(trimmed);
}

function getPossessiveSuffix(value) {
  return /s$/i.test(String(value).trim()) ? "'" : "'s";
}

function renderDetailCtaDataAttributes(competition, outPath, sourceDomain) {
  const attributes = {
    "data-competition-slug": shared.getCompetitionSlug(competition),
    "data-competition-title": competition.title,
    "data-brand": competition.brand || "",
    "data-category": competition.category || "",
    "data-entry-cost-type": competition.entryCostType || shared.getEntryCostLabel(competition),
    "data-entry-method": competition.entryChannel || competition.entryType || "",
    "data-source-domain": sourceDomain || "",
    "data-destination-path": outPath,
  };

  return Object.entries(attributes)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== "")
    .map(([name, value]) => `${name}="${escapeAttribute(value)}"`)
    .join(" ");
}

function removeStaleCompetitionDirectories(validCompetitionSlugs, validOutSlugs) {
  removeStaleSlugDirectories(path.join(ROOT_DIR, "competition"), validCompetitionSlugs, "competition");
  removeStaleSlugDirectories(path.join(ROOT_DIR, "out"), validOutSlugs, "out");
}

function removeStaleSlugDirectories(managedDirectory, validSlugs, label) {
  if (!fs.existsSync(managedDirectory)) {
    return;
  }

  fs.readdirSync(managedDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .forEach((entry) => {
      if (validSlugs.has(entry.name)) {
        return;
      }

      const stalePath = path.join(managedDirectory, entry.name);
      fs.rmSync(stalePath, { recursive: true, force: true });
      console.log(`[generate-pages] Removed stale ${label} directory: ${stalePath}`);
    });
}

function removeStaleTagDirectories(routeContexts) {
  const validTagSlugs = new Set(
    routeContexts.filter((routeContext) => routeContext.type === "tag").map((routeContext) => routeContext.slug)
  );
  const tagDirectory = path.join(ROOT_DIR, "tag");

  if (!fs.existsSync(tagDirectory)) {
    return;
  }

  fs.readdirSync(tagDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .forEach((entry) => {
      if (validTagSlugs.has(entry.name)) {
        return;
      }

      const stalePath = path.join(tagDirectory, entry.name);
      fs.rmSync(stalePath, { recursive: true, force: true });
      console.log(`[generate-pages] Removed stale tag directory: ${stalePath}`);
    });
}

function removeStaleBrandDirectories(generatedBrandPages) {
  const validBrandSlugs = new Set(generatedBrandPages.map((brandPage) => brandPage.slug));
  const brandDirectory = path.join(ROOT_DIR, "brand");

  if (!fs.existsSync(brandDirectory)) {
    return;
  }

  fs.readdirSync(brandDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .forEach((entry) => {
      if (validBrandSlugs.has(entry.name)) {
        return;
      }

      const stalePath = path.join(brandDirectory, entry.name);
      fs.rmSync(stalePath, { recursive: true, force: true });
      console.log(`[generate-pages] Removed stale brand directory: ${stalePath}`);
    });
}

function removeLegacyHomeDirectory() {
  const legacyHomeDirectory = path.join(ROOT_DIR, "home");

  if (!fs.existsSync(legacyHomeDirectory)) {
    return;
  }

  fs.rmSync(legacyHomeDirectory, { recursive: true, force: true });
  console.log(`[generate-pages] Removed stale directory: ${legacyHomeDirectory}`);
}

function runStaticSeoChecks() {
  const errors = [];
  const sitemapPath = path.join(ROOT_DIR, "sitemap.xml");
  const sitemap = fs.readFileSync(sitemapPath, "utf8");
  const locMatches = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1].trim());

  if (locMatches.some((url) => url.includes("/out/"))) {
    errors.push("Sitemap contains /out/ URLs, which must stay non-indexable.");
  }

  locMatches.forEach((url) => {
    const pathname = new URL(url).pathname;
    if (pathname !== "/" && !pathname.endsWith("/")) {
      errors.push(`Sitemap URL missing trailing slash (likely redirect): ${url}`);
    }

    const filePath =
      pathname === "/"
        ? path.join(ROOT_DIR, "index.html")
        : path.join(ROOT_DIR, pathname.replace(/^\//, ""), "index.html");

    if (!fs.existsSync(filePath)) {
      errors.push(`Sitemap URL points to missing file: ${url}`);
      return;
    }

    const html = fs.readFileSync(filePath, "utf8");
    const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)"/i);
    if (!canonicalMatch) {
      errors.push(`Missing canonical tag in: ${filePath}`);
      return;
    }

    if (canonicalMatch[1] !== url) {
      errors.push(`Canonical mismatch for ${url}. Found: ${canonicalMatch[1]}`);
    }
  });

  const htmlFiles = [
    path.join(ROOT_DIR, "index.html"),
    ...getNestedIndexFiles(path.join(ROOT_DIR, "category")),
    ...getNestedIndexFiles(path.join(ROOT_DIR, "tag")),
    ...getNestedIndexFiles(path.join(ROOT_DIR, "competition")),
    ...shared.HUB_SLUGS.map((slug) => path.join(ROOT_DIR, slug, "index.html")),
    path.join(ROOT_DIR, "brands", "index.html"),
    ...getNestedIndexFiles(path.join(ROOT_DIR, "brand")),
    ...TRUST_PAGE_DEFINITIONS.map((page) => path.join(ROOT_DIR, page.slug, "index.html")),
  ];

  htmlFiles.forEach((filePath) => {
    const html = fs.readFileSync(filePath, "utf8");
    const badStructuredDataUrl = html.match(/"url":"https:\/\/freehub\.co\.za\/competition\/[^"]*[^\/]"/);
    if (badStructuredDataUrl) {
      errors.push(`Structured data competition URL missing trailing slash in: ${filePath}`);
    }

    const internalHrefRegex = /href="(\/(?:competition|category|tag|brand|brands)\/[^"]*)"/g;
    const internalHrefMatches = [...html.matchAll(internalHrefRegex)];
    internalHrefMatches.forEach((match) => {
      const href = match[1];
      if (!href.endsWith("/")) {
        errors.push(`Internal href missing trailing slash in ${filePath}: ${href}`);
      }
    });
  });

  if (errors.length > 0) {
    throw new Error(`[SEO checks failed]\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }
}

function runLifecycleStaticChecks(allCompetitions, activeCompetitions, expiredArchiveCompetitions, expiredLowValueCompetitions) {
  const errors = [];
  const activeSlugs = new Set(activeCompetitions.map((competition) => shared.getCompetitionSlug(competition)));
  const expiredCompetitions = [...expiredArchiveCompetitions, ...expiredLowValueCompetitions];
  const expiredSlugs = new Set(expiredCompetitions.map((competition) => shared.getCompetitionSlug(competition)));
  const sitemap = fs.readFileSync(path.join(ROOT_DIR, "sitemap.xml"), "utf8");

  expiredCompetitions.forEach((competition) => {
    const slug = shared.getCompetitionSlug(competition);
    const detailPath = path.join(ROOT_DIR, "competition", slug, "index.html");
    const outPath = path.join(ROOT_DIR, "out", slug, "index.html");

    if (!fs.existsSync(detailPath)) {
      errors.push(`Expired archive page was not generated: ${slug}`);
      return;
    }

    const html = fs.readFileSync(detailPath, "utf8");
    if (!html.includes("This competition has closed.")) {
      errors.push(`Expired archive page missing closed banner: ${slug}`);
    }
    if (!html.includes("Current competitions you may like")) {
      errors.push(`Expired archive page missing active related section: ${slug}`);
    }
    if (/href="\/out\//.test(html) || />\s*Enter (Competition|Now|on|via|using)/i.test(html)) {
      errors.push(`Expired archive page still exposes active entry CTA: ${slug}`);
    }
    if (fs.existsSync(outPath)) {
      errors.push(`Expired competition has generated /out/ page: ${slug}`);
    }
  });

  expiredArchiveCompetitions.forEach((competition) => {
    const slug = shared.getCompetitionSlug(competition);
    if (sitemap.includes(`/competition/${slug}/`)) {
      errors.push(`Expired archive page is included in sitemap: ${slug}`);
    }
  });

  expiredLowValueCompetitions.forEach((competition) => {
    const slug = shared.getCompetitionSlug(competition);
    const detailPath = path.join(ROOT_DIR, "competition", slug, "index.html");
    const html = fs.existsSync(detailPath) ? fs.readFileSync(detailPath, "utf8") : "";
    if (sitemap.includes(`/competition/${slug}/`)) {
      errors.push(`Low-value expired page is included in sitemap: ${slug}`);
    }
    if (!html.includes('name="robots" content="noindex, follow"')) {
      errors.push(`Low-value expired page missing noindex, follow: ${slug}`);
    }
  });

  const collectionFiles = [
    path.join(ROOT_DIR, "index.html"),
    ...getNestedIndexFiles(path.join(ROOT_DIR, "category")),
    ...getNestedIndexFiles(path.join(ROOT_DIR, "tag")),
    ...shared.HUB_SLUGS.map((slug) => path.join(ROOT_DIR, slug, "index.html")),
    path.join(ROOT_DIR, "brands", "index.html"),
    ...getNestedIndexFiles(path.join(ROOT_DIR, "brand")),
  ].filter((filePath) => fs.existsSync(filePath));

  collectionFiles.forEach((filePath) => {
    const html = fs.readFileSync(filePath, "utf8");
    expiredSlugs.forEach((slug) => {
      if (html.includes(`/competition/${slug}/`)) {
        errors.push(`Expired competition leaks into active listing page ${filePath}: ${slug}`);
      }
    });
  });

  allCompetitions
    .filter((competition) => !activeSlugs.has(shared.getCompetitionSlug(competition)))
    .filter((competition) => competition.verificationStatus !== "published" || competition.doNotPublish === true || competition.publicationStatus === "held")
    .forEach((competition) => {
      const slug = shared.getCompetitionSlug(competition);
      const detailPath = path.join(ROOT_DIR, "competition", slug, "index.html");
      if (fs.existsSync(detailPath)) {
        errors.push(`Held or unverified competition generated a public detail page: ${slug}`);
      }
    });

  if (errors.length > 0) {
    throw new Error(`[Lifecycle checks failed]\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }
}

function runImageQualityChecks() {
  const errors = [];
  const htmlFiles = [
    path.join(ROOT_DIR, "index.html"),
    ...getNestedIndexFiles(path.join(ROOT_DIR, "category")),
    ...getNestedIndexFiles(path.join(ROOT_DIR, "tag")),
    ...getNestedIndexFiles(path.join(ROOT_DIR, "competition")),
    ...shared.HUB_SLUGS.map((slug) => path.join(ROOT_DIR, slug, "index.html")),
    path.join(ROOT_DIR, "brands", "index.html"),
    ...getNestedIndexFiles(path.join(ROOT_DIR, "brand")),
  ];

  const dataUriImageRegex = /<img[^>]+src="data:image\/svg\+xml/i;
  const dataUriBgRegex = /background-image:\s*url\('data:image\/svg\+xml/i;

  htmlFiles.forEach((filePath) => {
    const html = fs.readFileSync(filePath, "utf8");

    if (dataUriImageRegex.test(html)) {
      errors.push(`Rendered SVG data URI image found in: ${filePath}`);
    }

    if (dataUriBgRegex.test(html)) {
      errors.push(`Rendered SVG data URI background image found in: ${filePath}`);
    }
  });

  if (errors.length > 0) {
    throw new Error(`[Image QA checks failed]\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }
}

function getNestedIndexFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(directory, entry.name, "index.html"))
    .filter((filePath) => fs.existsSync(filePath));
}

function normalizeStaticPath(pathname) {
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function escapeScript(value) {
  return String(value).replace(/<\/script/gi, "<\\/script");
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

main();
