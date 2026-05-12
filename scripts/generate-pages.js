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
  const archivedCompetitions = fs.existsSync(ARCHIVE_DATA_PATH)
    ? JSON.parse(fs.readFileSync(ARCHIVE_DATA_PATH, "utf8"))
    : [];
  const validCompetitions = shared.sortCompetitions(
    rawCompetitions.filter((entry, index) => validateCompetition(entry, index))
  );
  runDataSafetyChecks(validCompetitions);
  const publishedCompetitions = shared.getPublishedCompetitions(validCompetitions);
  const legacyCompetitions = [
    ...validCompetitions.filter((competition) => competition.verificationStatus !== "published"),
    ...archivedCompetitions,
  ];
  const allCompetitions = mergeCompetitionsBySlug([...publishedCompetitions, ...legacyCompetitions]);
  brandImageLookup = buildBrandImageLookup(allCompetitions);
  const validSlugs = new Set(allCompetitions.map((competition) => shared.getCompetitionSlug(competition)));
  removeStaleCompetitionDirectories(validSlugs);
  const competitions = publishedCompetitions.filter((competition) => !isExpired(competition.closingDate));
  const generatedBrandPages = shared.getGeneratedBrandPageDefinitions(competitions);
  const generatedBrandSlugs = generatedBrandPages.map((brandPage) => brandPage.slug);
  const routeContexts = getGeneratedRouteContexts(competitions, generatedBrandPages);
  removeStaleTagDirectories(routeContexts);
  removeStaleBrandDirectories(generatedBrandPages);
  removeLegacyHomeDirectory();

  fs.writeFileSync(path.join(ROOT_DIR, "index.html"), renderHomepage(competitions));
  fs.writeFileSync(path.join(ROOT_DIR, "404.html"), renderNotFoundPage());

  routeContexts.filter((routeContext) => routeContext.type !== "home").forEach((routeContext) => {
    const filteredCompetitions = shared.filterCompetitionsByRoute(competitions, routeContext);
    const html =
      routeContext.type === "brand-index"
        ? renderBrandIndexPage(generatedBrandPages)
        : renderPage(routeContext, filteredCompetitions);
    const outputDirectory = path.join(ROOT_DIR, routeContext.path.replace(/^\//, "").replace(/\/$/, ""));

    fs.mkdirSync(outputDirectory, { recursive: true });
    fs.writeFileSync(path.join(outputDirectory, "index.html"), html);
  });

  allCompetitions.forEach((competition) => {
    const html =
      competition.verificationStatus === "published"
        ? renderCompetitionPage(competition, competitions, generatedBrandSlugs)
        : renderLegacyCompetitionPage(competition);
    const slug = shared.getCompetitionSlug(competition);
    const outputDirectory = path.join(ROOT_DIR, "competition", slug);

    fs.mkdirSync(outputDirectory, { recursive: true });
    fs.writeFileSync(path.join(outputDirectory, "index.html"), html);
  });

  allCompetitions.forEach((competition) => {
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

  fs.writeFileSync(path.join(ROOT_DIR, "sitemap.xml"), generateSitemap(competitions, routeContexts));
  fs.writeFileSync(path.join(ROOT_DIR, "robots.txt"), renderRobotsTxt());
  runStaticSeoChecks();
  runImageQualityChecks();
}

function mergeCompetitionsBySlug(competitions) {
  const bySlug = new Map();

  competitions.forEach((competition) => {
    const slug = shared.getCompetitionSlug(competition);
    const existing = bySlug.get(slug);

    if (!existing) {
      bySlug.set(slug, competition);
      return;
    }

    if (existing.verificationStatus !== "published" && competition.verificationStatus === "published") {
      bySlug.set(slug, competition);
    }
  });

  return Array.from(bySlug.values());
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

  const brandImage = getBrandAssociatedImage(competition);
  return brandImage || buildBrandFallbackImage(competition || {});
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

function renderHubUpdatedNotice(routeContext) {
  if (!isEndingSoonHub(routeContext)) {
    return "";
  }

  return `<p class="hero__updated">Updated ${escapeHtml(shared.formatDate(BUILD_DATE_ISO))}</p>`;
}

function renderEndingSoonEditorial(routeContext) {
  if (!isEndingSoonHub(routeContext)) {
    return "";
  }

  return `<section class="seo-copy-block seo-copy-block--hub" aria-label="Guide to competitions ending soon">
          <h2 class="seo-copy-block__title">How to use competitions ending this week</h2>
          <div class="seo-copy-block__content hub-editorial">
            <section class="hub-editorial__section">
              <h3>Why ending-soon competitions are worth checking</h3>
              <p>Competitions close quickly, and some South African promoters only keep entry forms open until a specific date or time. This page helps you prioritise current competitions with the nearest deadlines before browsing the wider <a href="/competitions/">competitions</a> hub.</p>
              <p>If you want a narrower starting point, compare <a href="/free-competitions/">free competitions</a>, <a href="/purchase-required-competitions/">purchase required competitions</a>, or category pages for <a href="/category/cars/">cars</a>, <a href="/category/cash/">cash</a>, <a href="/category/vouchers/">vouchers</a>, <a href="/category/holidays/">holidays</a> and <a href="/category/tech/">tech</a>.</p>
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
              <h3>Cost labels explained</h3>
              <ul class="hub-editorial__list">
                <li><strong>Free entry:</strong> no required product purchase or paid ticket is shown in the listing.</li>
                <li><strong>Purchase required:</strong> you may need a qualifying product, minimum spend, receipt or proof of purchase.</li>
                <li><strong>Paid entry:</strong> the promotion appears to require a paid ticket, raffle entry or similar paid participation.</li>
                <li><strong>Account required:</strong> you may need a promoter, retailer, loyalty or platform account before entry.</li>
                <li><strong>App required:</strong> entry is completed through the promoter's official app or app-linked flow.</li>
                <li><strong>Till slip required:</strong> keep the receipt because it may be needed for entry validation or prize claims.</li>
              </ul>
              <p>For a fuller breakdown, read the <a href="/competition-entry-cost-labels/">competition entry cost labels guide</a>.</p>
            </section>
            <section class="hub-editorial__section">
              <h3>Freehub's role</h3>
              <p>Freehub does not run these competitions, choose winners, collect entries or process payments. We list useful competition information and send you to the official promoter source so you can read the current terms and enter there.</p>
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
          heading: "Look for source clarity",
          paragraphs: [
            `Cash prizes can be useful, but they need careful checking. This page currently groups ${escapeHtml(liveCopy)} with official source links, cost labels and closing dates.`,
            `For safer entry habits, read the <a href="/fake-competition-winner-messages/">fake winner message guide</a> before responding to any prize claim.`,
          ],
        },
        {
          heading: "Before sharing details",
          paragraphs: [
            "Never share banking passwords, card PINs, one-time PINs or remote-access permissions to claim a cash prize. Verify winner contact through the promoter's official channels.",
          ],
        },
      ],
    },
    holidays: {
      ariaLabel: "Guide to holiday competitions in South Africa",
      title: "How to check holiday giveaway details",
      sections: [
        {
          heading: "Travel prizes need extra checks",
          paragraphs: [
            `Holiday giveaways can include local stays, flights, experiences or travel vouchers. This page currently groups ${escapeHtml(liveCopy)} so you can compare deadlines and source links quickly.`,
            "Check whether flights, transfers, meals, spending money, visas, passports, taxes, blackout dates or companion rules are included before entering.",
          ],
        },
      ],
    },
    tech: {
      ariaLabel: "Guide to tech competitions in South Africa",
      title: "How to choose tech giveaways",
      sections: [
        {
          heading: "Check the entry route",
          paragraphs: [
            `Tech competitions can involve app entries, account actions, recharge mechanics, online forms or purchase-linked entries. This page currently groups ${escapeHtml(liveCopy)} with cost labels and official links.`,
            `If an app is required, use the <a href="/app-competitions-south-africa/">app competitions guide</a> to check that you are using the official promoter app.`,
          ],
        },
      ],
    },
    vouchers: {
      ariaLabel: "Guide to voucher competitions in South Africa",
      title: "How to compare voucher competitions",
      sections: [
        {
          heading: "Practical prizes still need clear terms",
          paragraphs: [
            `Voucher competitions can be quick to enter and useful for everyday spending. This page currently groups ${escapeHtml(liveCopy)} across shopping, grocery, online-store and rewards-style offers.`,
            "Check the voucher expiry date, spend exclusions, participating stores, delivery method and whether the promoter needs an account or proof of purchase.",
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
        question: "Are cash competitions safe to enter?",
        answer:
          "A cash competition is safer when the promoter is identifiable, the terms are clear and the entry link is official. Never share banking passwords or card PINs to claim a prize.",
      },
      {
        question: "Do cash giveaways require payment?",
        answer:
          "Some are free entry, while others require a purchase, account action, transaction or paid ticket. Check the cost label and promoter terms first.",
      },
      {
        question: "How does Freehub list cash competitions?",
        answer:
          "Freehub lists published cash competitions with a closing date, entry method and official source link where enough information is available.",
      },
    ],
    holidays: [
      {
        question: "What should I check before entering a holiday competition?",
        answer:
          "Check travel dates, departure city, passport or visa needs, blackout periods, spending money, transfers, taxes and whether the prize is transferable.",
      },
      {
        question: "Are holiday giveaways free to enter?",
        answer:
          "Some holiday giveaways are free entry, while others require a booking, purchase, app action or account. Freehub labels the likely cost route where available.",
      },
      {
        question: "Who handles the holiday prize?",
        answer:
          "The promoter or its agency handles winner contact and prize fulfilment. Freehub only links to the official competition source.",
      },
    ],
    tech: [
      {
        question: "What counts as a tech giveaway?",
        answer:
          "Tech giveaways can include smartphones, laptops, gaming bundles, home theatre prizes, data, airtime, devices and electronics vouchers.",
      },
      {
        question: "Do tech competitions need an app or account?",
        answer:
          "Some tech competitions use an app, account, recharge, loyalty profile or purchase. Check the entry method and official terms before sharing details.",
      },
      {
        question: "How can I avoid fake tech prize messages?",
        answer:
          "Verify winner messages through the promoter's official website, app or support channel. Do not share one-time PINs, passwords or card PINs.",
      },
    ],
    vouchers: [
      {
        question: "What voucher prizes appear on Freehub?",
        answer:
          "Voucher competitions can include grocery, shopping, fashion, restaurant, travel, fuel, airtime and online-store vouchers.",
      },
      {
        question: "Are voucher competitions free to enter?",
        answer:
          "Many voucher competitions are free entry, but some require a purchase, loyalty card, app action or receipt. Check the listing label and official terms.",
      },
      {
        question: "What happens after a voucher competition closes?",
        answer:
          "Expired voucher competitions are removed from live hub pages, and users should browse current listings instead of trying to enter closed offers.",
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
    .flatMap((competition, index) => {
      const items = [renderCompetitionCard(competition)];

      if ((index + 1) % 6 === 0) {
        items.push(renderInlineAdCard());
      }

      return items;
    })
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
      <header class="hero">
        <div class="hero__copy">
          <p class="eyebrow">free-hub</p>
          <h1 id="pageTitle">${escapeHtml(pageCopy.heading)}</h1>
          <p class="hero__text" id="pageIntro">${escapeHtml(pageCopy.intro)}</p>
          ${renderHubUpdatedNotice(routeContext)}
        </div>
      </header>

      <main class="main-content">
        ${isCollectionPage ? renderCollectionBreadcrumb(pageCopy.heading) : ""}

        ${renderSupportSection(supportCopy)}

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

          <div id="emptyState" class="state-card state-card--hidden" aria-live="polite">
            <p class="state-card__title">No competitions match</p>
            <p class="state-card__text">Try a different search term or clear the current category filter.</p>
          </div>
        </section>

        ${renderCategoryEditorial(routeContext, competitions)}
        ${renderEndingSoonEditorial(routeContext)}
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
      <header class="hero">
        <div class="hero__copy">
          <p class="eyebrow">free-hub</p>
          <h1 id="pageTitle">${escapeHtml(pageCopy.heading)}</h1>
          <p class="hero__text" id="pageIntro">${escapeHtml(pageCopy.intro)}</p>
        </div>
      </header>

      <main class="main-content">
        ${renderCollectionBreadcrumb(pageCopy.heading)}
        ${renderSupportSection(pageCopy.support)}

        <section class="internal-links" aria-label="Generated brand pages">
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

function renderCompetitionCard(competition, featured = false) {
  const internalPath = shared.getCompetitionPath(competition);
  const urgencyBadge = `<span class="badge badge--closing">${escapeHtml(
    shared.getUrgencyBadgeLabel(competition.closingDate)
  )}</span>`;
  const hotBadge = shared.shouldShowHotBadge(competition) ? '<span class="badge badge--hot">HOT</span>' : "";
  const costBadge = `<span class="badge badge--soft">${escapeHtml(shared.getEntryCostLabel(competition))}</span>`;
  const tagBadges = shared
    .getCardTagLabels(competition)
    .map((label) => `<span class="badge badge--soft">${escapeHtml(label)}</span>`)
    .join("\n                    ");
  const summaryMarkup = competition.summary
    ? `<p class="competition-card__summary">${escapeHtml(competition.summary)}</p>`
    : "";
  const cardClass = `competition-card${featured ? " competition-card--featured" : ""}`;
  const cardImageUrl = getCompetitionImageUrl(competition);
  const urgencyLabel = shared.getUrgencyLabel(competition.closingDate);
  const entryMethodLabel = shared.getEntryMethodLabel(competition.entryType);
  const prizeCue = shared.getPrizeCue(competition);
  const headline = shared.getCardHeadline(competition);
  const brand = competition.brand || "Official promotion";
  const featuredEyebrow = featured ? '<p class="competition-card__eyebrow">Featured pick</p>' : "";
  const ctaClass = featured ? "competition-card__cta competition-card__cta--featured" : "competition-card__cta";

  return `<article class="${cardClass}" data-competition-slug="${escapeAttribute(
    shared.getCompetitionSlug(competition)
  )}" data-competition-title="${escapeAttribute(competition.title)}" data-competition-category="${escapeAttribute(
    competition.category
  )}">
              <div class="competition-card__media">
                <img src="${escapeAttribute(cardImageUrl)}" alt="${escapeAttribute(
    competition.title
  )}" loading="lazy" />
                <div class="competition-card__badges">
                  <div class="competition-card__badge-stack">
                    <span class="badge badge--category">${escapeHtml(competition.category)}</span>
                    ${hotBadge}
                  </div>
                  ${urgencyBadge}
                </div>
              </div>
              <div class="competition-card__body">
                ${featuredEyebrow}
                <h2 class="competition-card__title">${escapeHtml(headline)}</h2>
                <p class="competition-card__brand">${escapeHtml(brand)}</p>
                <div class="competition-card__signals">
                  <span class="competition-card__signal competition-card__signal--value">${escapeHtml(prizeCue)}</span>
                  <span class="competition-card__signal competition-card__signal--urgency">${escapeHtml(urgencyLabel)}</span>
                </div>
                ${summaryMarkup}
                <div class="competition-card__meta">
                  <span>${escapeHtml(entryMethodLabel)}</span>
                  <span>${escapeHtml(shared.formatDate(competition.closingDate))}</span>
                </div>
                <div class="competition-card__footer">
                  <div class="competition-card__tags">
                    <span class="competition-card__entry">${escapeHtml(entryMethodLabel)}</span>
                    ${tagBadges || costBadge}
                  </div>
                </div>
                <span class="${ctaClass}">View Details</span>
              </div>
              <a class="competition-card__overlay-link" href="${escapeAttribute(internalPath)}" aria-label="${escapeAttribute(competition.title)} - view details">
                <span class="visually-hidden">View details for ${escapeHtml(competition.title)}</span>
              </a>
            </article>`;
}

function renderInlineAdCard(placement = "inline") {
  return `<article class="sponsored-card sponsored-card--reserved" data-placement="${escapeAttribute(placement)}" aria-hidden="true"></article>`;
}

function renderAdZone(id, placement, compact = false) {
  const className = compact ? "ad-slot ad-slot--compact ad-slot--reserved" : "ad-slot ad-slot--reserved";

  return `<section class="${className}" id="${escapeAttribute(id)}" data-placement="${escapeAttribute(
    placement
  )}" aria-label="Sponsored placement"></section>`;
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
      { label: "Browse competition brands", href: "/brands/" },
      { label: "Cars category", href: "/category/cars/" },
      { label: "Purchase required competitions", href: "/purchase-required-competitions/" },
      { label: "Paid entry competitions", href: "/paid-entry-competitions/" },
      { label: "How to enter safely", href: "/how-to-enter-competitions-safely/" },
      { label: "Legit competitions guide", href: "/legit-competitions-south-africa/" },
    ],
    "free-competitions": [
      { label: "Browse competition brands", href: "/brands/" },
      { label: "All competitions", href: "/competitions/" },
      { label: "Competitions ending soon", href: "/competitions-ending-soon/" },
      { label: "How to enter safely", href: "/how-to-enter-competitions-safely/" },
      { label: "Purchase required competitions", href: "/purchase-required-competitions/" },
    ],
    "competitions-ending-soon": [
      { label: "All competitions", href: "/competitions/" },
      { label: "New competitions", href: "/new-competitions-south-africa/" },
      { label: "Free competitions", href: "/free-competitions/" },
      { label: "Purchase required competitions", href: "/purchase-required-competitions/" },
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

  return {
    title: "Related Competition Hubs",
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

  if (slug === "cars") {
    return {
      title: "Car Competition Searches",
      links: [
        { label: "Win a car competitions South Africa", href: "/win-a-car/" },
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
        { label: "Win a holiday South Africa", href: byIdPath("sanlam-plan-win-mauritius") },
        { label: "Holiday giveaway competitions", href: byIdPath("makro-rewards-zanzibar-getaway") },
        { label: "Free competitions", href: "/free-competitions/" },
        { label: "Competitions ending soon", href: "/competitions-ending-soon/" },
      ],
    };
  }

  if (slug === "tech") {
    return {
      title: "Tech Giveaway Searches",
      links: [
        { label: "Gadget giveaway competitions", href: byIdPath("game-store-gadget-giveaway") },
        { label: "Smartphone competition entries", href: byIdPath("vodacom-recharge-win-galaxy-s25") },
        { label: "Free competitions", href: "/free-competitions/" },
        { label: "Competitions ending soon", href: "/competitions-ending-soon/" },
      ],
    };
  }

  if (slug === "cash") {
    return {
      title: "Cash Competition Searches",
      links: [
        { label: "Cash competitions South Africa", href: "/category/cash/" },
        { label: "Win cash online South Africa", href: byIdPath("fnb-pay-to-win-grand-cash-prize") },
        { label: "Free competitions", href: "/free-competitions/" },
        { label: "Competitions ending soon", href: "/competitions-ending-soon/" },
      ],
    };
  }

  if (slug === "vouchers") {
    return {
      title: "Voucher Competition Searches",
      links: [
        { label: "Voucher giveaway competitions", href: "/category/vouchers/" },
        { label: "Takealot competitions and vouchers", href: byIdPath("cell-c-takealot-voucher-giveaway") },
        { label: "Free competitions", href: "/free-competitions/" },
        { label: "Competitions ending soon", href: "/competitions-ending-soon/" },
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

function renderHomepage(competitions) {
  const homeRouteContext = { type: "home", slug: null, path: "/" };
  const structuredData = shared.buildStructuredData(competitions, homeRouteContext);
  const ogImage = getCollectionMetadataImageUrl(competitions);
  const featured = getFeaturedCompetitions(competitions, 4);
  const featuredCardsMarkup = featured.map((c) => renderCompetitionCard(c, true)).join("\n            ");
  const heroSpotlightMarkup = renderHeroSpotlight(getHeroSpotlightCompetition(competitions));

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
  const featuredSectionMarkup = `<section class="home-section home-section--featured" aria-label="Featured competitions">
          <div class="home-section__header">
            <div>
              <p class="section-kicker">Featured Today</p>
              <h2 class="home-section__title">Open these live competitions first</h2>
            </div>
            <a class="home-section__link" href="/tag/high-value/">High-value picks</a>
          </div>
          <p class="home-section__intro">A quick shortlist prioritising high-value, voucher, cash, free-entry, and ending-soon signals.</p>
          <div class="competition-grid competition-grid--featured">
            ${featuredCardsMarkup}
          </div>
        </section>`;

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
    <link rel="icon" type="image/png" href="/FH%20logo.png" />
    <link rel="apple-touch-icon" href="/FH%20logo.png" />
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
              <img class="hero__brand-logo" src="/FH%20logo.png" alt="FreeHub logo" width="200" height="40" loading="eager" decoding="async" />
            </div>
            <h1 id="pageTitle">Today&apos;s Live Competitions in South Africa</h1>
            <p class="hero__text" id="pageIntro">FreeHub lists vouchers, prizes, cash giveaways and competitions from trusted South African brands so you can find offers worth opening today.</p>
            <div class="hero__actions">
              <a class="btn btn--primary" href="#all-competitions">Browse Today&apos;s Competitions</a>
              <a class="btn btn--secondary" href="/tag/ending-soon/">Ending Soon</a>
            </div>
            <div class="trust-row" aria-label="Trust signals">
              <span class="trust-row__item">Verified listings</span>
              <span class="trust-row__item">Official brand links</span>
              <span class="trust-row__item">No FreeHub sign-up</span>
            </div>
          </div>
          ${heroSpotlightMarkup}
        </div>
      </header>

      <main class="main-content">
        ${featuredSectionMarkup}

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

          <div id="emptyState" class="state-card state-card--hidden" aria-live="polite">
            <p class="state-card__title">No competitions match</p>
            <p class="state-card__text">Try a different search term or clear the current category filter.</p>
          </div>
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
      <header class="hero">
        <div class="hero__copy">
          <p class="eyebrow">FREEHUB</p>
          <h1>${escapeHtml(page.heading)}</h1>
          <p class="hero__text">${escapeHtml(page.intro)}</p>
        </div>
      </header>

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
      <header class="hero">
        <div class="hero__copy">
          <p class="eyebrow">FREEHUB</p>
          <h1>Page not found</h1>
          <p class="hero__text">The page you opened is not available. You can return to live competitions, browse a category, or report a broken link.</p>
        </div>
      </header>

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

function renderCompetitionPage(competition, allCompetitions, generatedBrandSlugs = []) {
  const slug = shared.getCompetitionSlug(competition);
  const canonicalUrl = `${shared.CANONICAL_ORIGIN}/competition/${slug}/`;
  const description = shared.buildCompetitionDescription(competition);
  const formattedDate = shared.formatDate(competition.closingDate);
  const heroImage = getCompetitionImageUrl(competition);
  const ogImage = getMetadataImageUrl(competition);
  const relatedCompetitions = getRelatedCompetitions(competition, allCompetitions);

  const categorySlug = shared.CATEGORY_SLUGS.find(
    (key) => shared.CATEGORY_COPY[key].category === competition.category
  );
  const categoryPath = categorySlug ? `/category/${categorySlug}/` : "/";
  const expired = isExpired(competition.closingDate);
  const heroTitle = competition.title;
  const robotsDirective = expired
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
  const heroSubline = competition.brand ? `By ${competition.brand}` : competition.category;
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
  const beforeYouEnterMarkup = renderBeforeYouEnterBlock(competition);
  const sourceBlockMarkup = renderCompetitionSourceBlock(competition, officialSource, officialSourceUrl, lastChecked);
  const faqItems = buildCompetitionFaqItems(competition, officialSource, ctaLabel);
  const faqMarkup = renderCompetitionFaq(faqItems);

  const relatedCardsMarkup = relatedCompetitions.map((c) => renderCompetitionCard(c)).join("\n            ");
  const relatedSection = relatedCardsMarkup
    ? `<section class="competition-section" aria-label="Related Competitions">
          <div class="internal-links">
            <p class="internal-links__title">Related Competitions</p>
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
    name: competition.title,
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
    <title>${escapeHtml(competition.title)} – Enter Now | Free Competitions South Africa</title>
    <meta name="description" content="${escapeAttribute(description)}" />
    <meta name="robots" content="${robotsDirective}" />
    <link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeAttribute(competition.title)}" />
    <meta property="og:description" content="${escapeAttribute(description)}" />
    <meta property="og:url" content="${escapeAttribute(canonicalUrl)}" />
    <meta property="og:image" content="${escapeAttribute(ogImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttribute(competition.title)}" />
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
      <header class="hero hero--competition" style="background-image: url('${escapeAttribute(heroImage)}')">
        <div class="hero__overlay" aria-hidden="true"></div>
        <div class="hero__content">
          <p class="eyebrow">free-hub</p>
          <h1 id="pageTitle">${escapeHtml(heroTitle)}</h1>
          <p class="hero__text">${escapeHtml(heroSubline)}</p>
          <p class="hero__closing${closingSoon && !expired ? " hero__closing--urgent" : ""}">${expired ? "Closed" : "Closes"} ${escapeHtml(formattedDate)}${closingSoon && !expired ? " · Ending soon" : ""}</p>
          ${!expired ? `<a class="hero__cta" href="${escapeAttribute(outPath)}" target="_blank" rel="noopener noreferrer" ${ctaAttributes}>${escapeHtml(ctaLabel)}</a>` : ""}
        </div>
      </header>

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
          <p class="state-card__title">This competition has closed</p>
          <p class="state-card__text">The closing date was ${escapeHtml(formattedDate)}. Browse related competitions below.</p>
        </section>` : ""}

        ${renderCompetitionInternalLinks(competition, categoryPath, generatedBrandSlugs)}

        ${renderAdZone("ad-top", "detail-top")}

        <article class="competition-detail" aria-label="${escapeAttribute(competition.title)}">
          <div class="competition-detail__media">
            <img src="${escapeAttribute(heroImage)}" alt="${escapeAttribute(competition.title)}" onerror="this.onerror=null;this.src='${escapeAttribute(buildBrandFallbackImage(competition))}'" />
          </div>
          <div class="competition-detail__body">
            <div class="competition-detail__meta">
              <span class="badge badge--category">${escapeHtml(competition.category)}</span>
              ${brandBadge}
              ${closingSoonBadge}
            </div>
            ${trustStripMarkup}
            ${detailFactsMarkup}
            <div class="competition-detail__summary">
              <p>${escapeHtml(description)}</p>
            </div>
            ${tagsMarkup}
            ${entryStepsMarkup}
            ${beforeYouEnterMarkup}
            <div class="trust-chips">
              <span class="trust-chip">Verified listing</span>
              <span class="trust-chip">We link to official brand promotions</span>
              <span class="trust-chip">No sign-up required on FreeHub</span>
            </div>
            <a
              class="competition-detail__cta"
              href="${escapeAttribute(outPath)}"
              target="_blank"
              rel="noopener noreferrer"
              ${ctaAttributes}
            >
              ${escapeHtml(ctaLabel)}
            </a>
            <p class="competition-detail__cta-note">You will leave Freehub and go to the official promoter page. Freehub does not run this competition or collect your entry.</p>
            ${sourceBlockMarkup}
            ${faqMarkup}
            <a
              class="competition-detail__whatsapp"
              href="https://wa.me/?text=${encodeURIComponent(`Enter the ${competition.title} competition – ${canonicalUrl}`)}"
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

function renderCompetitionSourceBlock(competition, officialSource, officialSourceUrl, lastChecked) {
  const termsMarkup = competition.termsUrl
    ? `<p><strong>Terms and conditions:</strong> <a href="${escapeAttribute(competition.termsUrl)}" rel="nofollow noopener" target="_blank">View official terms</a></p>`
    : "<p><strong>Terms and conditions:</strong> Check the official promoter page for full terms.</p>";

  return `<section class="detail-source" aria-label="Official source and terms">
              <p class="detail-section-title">Source and terms</p>
              <p><strong>Official source:</strong> <a href="${escapeAttribute(officialSourceUrl)}" rel="nofollow noopener" target="_blank">${escapeHtml(officialSource)}</a></p>
              ${termsMarkup}
              ${lastChecked ? `<p><strong>Last checked:</strong> ${escapeHtml(lastChecked)}</p>` : ""}
              <p><strong>Report an issue:</strong> <a href="/report-a-competition/">Tell Freehub about a broken, expired or suspicious listing</a></p>
            </section>`;
}

function buildCompetitionFaqItems(competition, officialSource, ctaLabel) {
  const items = [];
  const costLabel = shared.getEntryCostLabel(competition);

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

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)} | Closed Competition | Freehub</title>
    <meta name="description" content="This competition listing is no longer active on Freehub. Use the official source link to confirm current promoter information." />
    <meta name="robots" content="noindex, follow" />
    <link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />
    <link rel="stylesheet" href="${RELATIVE_ASSET_PATH}styles.css" />
    ${ADSENSE_SCRIPT}
  </head>
  <body>
    <div class="site-shell">
      <header class="hero">
        <div class="hero__copy">
          <p class="eyebrow">free-hub</p>
          <h1>${escapeHtml(title)}</h1>
          <p class="hero__text">This listing is closed or no longer published on Freehub. Check the official promoter page for the latest campaign status.</p>
        </div>
      </header>

      <main class="main-content">
        <section class="state-card">
          <p class="state-card__title">Competition not active on Freehub</p>
          <p class="state-card__text">${closingDate ? `Original closing date: ${escapeHtml(closingDate)}. ` : ""}${
            archiveDate ? `Archived on ${escapeHtml(archiveDate)}. ` : ""
          }Details can change at source.</p>
          <p class="state-card__text">
            <a href="${escapeAttribute(sourceUrl)}" rel="nofollow noopener" target="_blank">Open ${escapeHtml(
              sourceDomain
            )}</a>
          </p>
          <p class="state-card__text">
            <a href="/">Browse current live competitions</a>
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
      <header class="hero">
        <div class="hero__copy">
          <p class="eyebrow">free-hub</p>
          <h1>You are leaving Freehub</h1>
          <p class="hero__text">Taking you to <strong>${escapeHtml(sourceDomain)}</strong> for <strong>${escapeHtml(competition.title)}</strong>. If you are not redirected automatically, use the link below.</p>
        </div>
      </header>

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

function getRelatedCompetitions(competition, allCompetitions) {
  const currentSlug = shared.getCompetitionSlug(competition);
  const competitionTagSet = new Set(competition.tags || []);

  const scored = allCompetitions
    .filter((c) => shared.getCompetitionSlug(c) !== currentSlug)
    .map((c) => {
      let score = 0;
      if (c.category === competition.category) score += 2;
      (c.tags || []).forEach((tag) => {
        if (competitionTagSet.has(tag)) score += 1;
      });
      return { competition: c, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

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
      value: competition.termsUrl ? "View terms" : "",
      html: competition.termsUrl
        ? `<a href="${escapeAttribute(competition.termsUrl)}" rel="nofollow noopener" target="_blank">View terms</a>`
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
                    `<p${fact.urgent ? ` class="competition-detail__info--urgent"` : ""}><strong>${escapeHtml(
                      fact.label
                    )}:</strong> ${fact.html || escapeHtml(fact.value)}</p>`
                )
                .join("\n              ")}
            </div>`;
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

    if (seenSlugs.has(slug)) {
      errors.push(`Duplicate competition slug "${slug}" for "${seenSlugs.get(slug)}" and "${competition.title}".`);
    } else {
      seenSlugs.set(slug, competition.title);
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

function generateSitemap(competitions, routeContexts) {
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

  const competitionEntries = competitions
    .filter((competition) => !isExpired(competition.closingDate))
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

function removeStaleCompetitionDirectories(validSlugs) {
  const managedDirectories = [path.join(ROOT_DIR, "competition"), path.join(ROOT_DIR, "out")];

  managedDirectories.forEach((managedDirectory) => {
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
        console.log(`[generate-pages] Removed stale directory: ${stalePath}`);
    });
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
