const fs = require("fs");
const path = require("path");
const shared = require("../shared/page-data.js");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT_DIR, "data", "competitions.json");
const ARCHIVE_DATA_PATH = path.join(ROOT_DIR, "data", "archive", "competitions-expired.json");
const FREE_RESOURCES_PATH = path.join(ROOT_DIR, "data", "free-resources.json");
const RELATIVE_ASSET_PATH = "/";
const ADSENSE_SCRIPT =
  '<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6084410613829318" crossorigin="anonymous"></script>';
const GOOGLE_TAG_MANAGER_ID = "GTM-W2M7PCR7";
const META_PIXEL_ID = "2506912739756217";
const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/0029Vb7mS1VE50UlOc2yOe2H";
const DATACOST_URL = "https://datacost.co.za/?utm_source=freehub&utm_medium=house_banner&utm_campaign=freehub_cross_promo";
const DATACOST_USSD_URL = "https://datacost.co.za/ussd-codes/?utm_source=freehub&utm_medium=house_banner&utm_campaign=ussd_codes";
const DATACOST_BANNER_IMAGE = "/assets/partners/datacost-data-airtime-banner.jpg";
const BUILD_DATE_ISO = process.env.FREEHUB_BUILD_DATE || getLocalIsoDate(new Date());
const CSS_ASSET_VERSION = "20260704-voucher-seo-v1";
const FREEHUB_REFER_WIN_CONFIG = {
  referWinCampaignEnabled: true,
  referWinLiveReady: true,
  referWinPrototypeEnabled: false,
  campaignStatusLabel: "Live: 18 June to 31 July 2026",
  campaignMonth: "2026-07",
  campaignStartDate: "2026-06-18",
  campaignEndDate: "2026-07-31",
  campaignPeriodLabel: "18 June 2026 to 31 July 2026, ending at 23:59 SAST on 31 July 2026",
  nextCampaignPeriodLabel: "1 August 2026 to 31 August 2026, ending at 23:59 SAST on 31 August 2026",
  monthlyPrizeLabel: "R250 airtime",
  prizeFulfilmentLabel: "Airtime top-up or airtime voucher to a supported South African mobile number",
  winnerMechanicLabel: "Most approved referrals in the campaign month, subject to manual review",
  tieBreakerLabel: "If eligible participants tie on approved referrals, the winner is the tied participant who first reached that approved count. If that cannot be determined reliably, Freehub may run a random draw among the tied eligible participants after manual review.",
  winnerNotificationLabel: "Freehub will contact the selected winner using the account email and/or supplied South African mobile number within seven business days after monthly review is complete. If the winner cannot be verified or contacted within five business days, Freehub may select the next eligible participant.",
  promoterName: "Stura Consulting, operating Freehub",
  promoterContactEmail: "hello@freehub.co.za",
  minimumApprovedReferrals: 1,
  publicLeaderboardEnabled: false,
  adminReviewRequired: true,
  marketingConsentRequired: false,
  mobileNumberRequiredForParticipation: true,
  noPurchaseRequired: true,
};
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
];
const DUPLICATE_TAG_CANONICAL_PATHS = {
  "free-entry": "/free-competitions/",
  "purchase-required": "/purchase-required-competitions/",
  "paid-entry": "/paid-entry-competitions/",
};
const MIN_INDEXABLE_COLLECTION_COMPETITIONS = 2;
const MIN_INDEXABLE_VERTICAL_COMPETITIONS = 3;
const VERTICAL_PAGE_SLUGS = [
  "whatsapp-competitions-south-africa",
  "sms-competitions-south-africa",
  "till-slip-competitions-south-africa",
  "online-competitions-south-africa",
  "win-airtime-competitions-south-africa",
  "win-data-competitions-south-africa",
  "win-grocery-vouchers-south-africa",
  "supermarket-competitions-south-africa",
];
const VERTICAL_PAGE_SLUG_SET = new Set(VERTICAL_PAGE_SLUGS);
const CONTENT_INDEX_PAGES = [
  {
    slug: "guides",
    title: "Freehub Guides",
    description: "Guides for finding, checking and entering South African competitions safely.",
    heading: "Competition guides for South Africa",
    intro: "Use these guides to compare entry costs, deadlines, free-entry routes and safety checks before you open an official promoter page.",
  },
  {
    slug: "blog",
    title: "Freehub Blog",
    description: "Freehub updates and practical competition roundups for South African compers.",
    heading: "Freehub blog and roundups",
    intro: "Read practical competition roundups and evergreen explainers backed by current Freehub inventory and official-source checks.",
  },
];
const MONTHLY_GUIDE_SLUG = "best-competitions-south-africa-this-month";
let brandImageLookup = new Map();
let generatedVerticalPagesForLinks = [];
const FREE_RESOURCES = JSON.parse(fs.readFileSync(FREE_RESOURCES_PATH, "utf8"));
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
          "Companies can use the submit-a-competition page for review requests. Listing corrections and suspicious listing reports should include the competition title, the Freehub page URL and the official source URL where available.",
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
      "Read Freehub's privacy policy, including optional accounts, saved competitions, alerts, analytics, outbound links and competition entry responsibility.",
    heading: "Privacy Policy",
    intro:
      "This privacy policy explains how Freehub handles basic site usage information and optional account features. Freehub is a listing site and does not collect competition entries for promoters.",
    sections: [
      {
        heading: "Information Freehub may process",
        paragraphs: [
          "Freehub may use analytics tools to understand page views, clicks, device types and broad usage patterns. This helps us improve pages and find broken journeys.",
          "If you contact Freehub or submit a competition for review, we receive the information you choose to send, such as your name, business contact email, message, competition details and any page URLs included.",
        ],
      },
      {
        heading: "Competition submissions from companies",
        paragraphs: [
          "Companies, brands, agencies and promoters may submit public competition details for Freehub review. Freehub may store the submitted business contact details, official URLs, terms URLs, prize details, entry requirements, notes, review status and timestamps needed to assess the listing.",
          "Submission information is used to review whether a competition can be listed, to prevent abuse and to keep an internal record of review decisions. Freehub does not use the submission form to collect consumer entries for promoter competitions.",
        ],
      },
      {
        heading: "Optional Freehub accounts",
        paragraphs: [
          "Freehub may offer optional account features, such as saving a competition, hiding ignored competitions or storing competition alert preferences. You do not need a Freehub account to browse listings, open competition detail pages or click through to official promoter pages.",
          "If you choose to sign in, Freehub may store your account identifier, email address, display name, sign-in provider, saved competition IDs, ignored competition IDs, alert preferences, consent records and basic timestamps needed to run those optional features.",
        ],
      },
      {
        heading: "Sign-in providers",
        paragraphs: [
          "Freehub may support Google, Facebook and email-link sign-in through Firebase Authentication. Email-link sign-in sends a one-time sign-in link to the email address you provide, instead of asking Freehub to store a password.",
          "The provider you choose may process your sign-in under its own terms and privacy policy. Freehub does not add phone or SMS authentication for account sign-in.",
        ],
      },
      {
        heading: "Saved, ignored and alert preferences",
        paragraphs: [
          "Saved competitions help you return to listings you chose to keep. Ignored competition IDs help Freehub hide listings you chose not to see again while signed in. Alert preferences help Freehub remember whether you asked for competition alerts or occasional updates.",
          "The Privacy Policy checkbox is required before using optional account features. The alerts and marketing checkbox is optional and should not be pre-ticked.",
        ],
      },
      {
        heading: "Refer & Win and quick referral links",
        paragraphs: [
          "If you choose to create a Refer & Win quick referral link, Freehub may store the WhatsApp number or email address you provide, a masked version for display, your referral code, any referring code, consent records, landing path, campaign month and timestamps.",
          "Freehub uses this information to create referral links, track referral source, administer the Refer & Win campaign, prevent abuse, contact potential winners and fulfil airtime prizes where applicable. Marketing consent remains optional.",
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
      {
        heading: "Unsubscribe and preferences",
        paragraphs: [
          "If Freehub sends alerts or marketing emails in future, those messages should include a way to unsubscribe or change preferences.",
          "Freehub may keep limited records needed for security, abuse prevention, consent history, legal compliance or to confirm that a preference change was handled.",
        ],
      },
      {
        heading: "Freehub is not the promoter",
        paragraphs: [
          "Freehub lists public competition information and links users to official promoter pages. The promoter remains responsible for entry forms, eligibility checks, winner selection, prize fulfilment and its own privacy notices.",
        ],
      },
    ],
  },
  {
    slug: "freehub-account-benefits",
    title: "Why Sign Up for Freehub? | Saved and Hidden Competitions",
    description:
      "See what a Freehub account adds, including saved competitions, hidden seen competitions, email alerts and optional Google or email-link sign-in.",
    heading: "Why Sign Up for Freehub?",
    intro:
      "Freehub stays open for browsing, but signing in gives regular competition hunters a cleaner, more personal way to track what matters.",
    sections: [
      {
        heading: "Hide competitions you have already checked",
        paragraphs: [
          "Signed-in users can hide competitions they have already seen or decided to skip. Freehub stores the competition ID in your account and hides matching cards while you browse.",
          "Hidden competitions are not deleted from Freehub and you can show ignored competitions again if you want to review or undo the choice.",
        ],
      },
      {
        heading: "Save the competitions worth coming back to",
        paragraphs: [
          "Saving a competition keeps useful listings attached to your Freehub account instead of relying on browser history or screenshots.",
          "This is helpful for competitions with purchase steps, closing dates, receipt uploads or official terms you want to check again before entering.",
        ],
      },
      {
        heading: "Keep alerts separate from browsing",
        paragraphs: [
          "Email alerts are optional. You can browse, search and open official promoter links without signing in.",
          "When you do sign in, Google and email-link sign-in are available so Freehub does not need to store a password.",
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
      "A practical South African competition safety checklist covering official terms, closing dates, entry costs, till slips, WhatsApp entries and fake winner messages.",
    heading: "How to Enter Competitions Safely",
    intro:
      "Most competition problems start before the entry is submitted: a missed closing time, a wrong product, a fake WhatsApp number or a winner message that asks for money. Use this page as a quick pre-entry check.",
    article: true,
    datePublished: "2026-05-10",
    dateModified: "2026-07-07",
    sections: [
      {
        heading: "Do the 60-second source check",
        paragraphs: [
          "Before you enter, open the promoter's own page, app, verified social post, terms PDF or named campaign partner page. You should be able to see who runs the competition, what the prize is, how entries work and when it closes.",
          "Freehub is useful for comparing listings, but it is not the entry form and it is not the promoter. If the official source says something different from a summary, treat the official source as the final word.",
        ],
      },
      {
        heading: "Check the cost before you act",
        paragraphs: [
          "Look for the closing date and, where available, the closing time. Some campaigns close at 23:59, some close during business hours, and some draw from purchases made only inside a specific campaign period.",
          "Then check the entry cost. Free entry is different from purchase required. Purchase required is different from paid entry. USSD, SMS, app sign-in, data, a loyalty card or a receipt upload can all change what the user needs to do.",
        ],
      },
      {
        heading: "Keep proof until the prize is settled",
        paragraphs: [
          "For purchase-required competitions, keep the original till slip, online invoice, product code, app receipt or loyalty-card record. A photo is useful, but some promoters still ask for the original proof.",
          "For WhatsApp, SMS, USSD and form entries, keep confirmation messages or screenshots if the official terms say proof may be needed. Do not throw away packaging or till slips the same day you enter.",
        ],
      },
      {
        heading: "Share less, verify more",
        paragraphs: [
          "An entry form may need a name, contact details, province or proof of purchase. It should not need your banking password, card PIN, one-time PIN, remote-access app code or a photo of unnecessary documents just to enter.",
          "Read consent wording before ticking boxes. If a link came from a comment thread, unknown WhatsApp forward or private message, match it back to the official promoter before typing in personal information.",
        ],
      },
      {
        heading: "Treat surprise winner messages carefully",
        paragraphs: [
          "A fake winner message can use a real brand name and logo. Warning signs include a prize you never entered for, pressure to reply now, requests for release fees, courier fees, banking details, card PINs or one-time PINs.",
          "If you are unsure, do not argue with the message. Check the competition terms for the winner-contact method, then contact the promoter through its official website, app or verified social profile.",
        ],
      },
    ],
    checklistTitle: "Before you enter",
    checklist: [
      "Open the official promoter page, app, verified post or terms PDF.",
      "Check the closing date, closing time, eligibility rules and entry method.",
      "Confirm whether entry is free, purchase required, USSD/SMS linked or paid entry.",
      "Keep till slips, product codes, invoices and entry confirmations where required.",
      "Use only official WhatsApp numbers, USSD codes, forms, apps and payment routes.",
    ],
    avoidTitle: "Stop if you see",
    avoid: [
      "A page or message asks for banking passwords, card PINs or one-time PINs.",
      "A winner message demands release, admin, courier or verification fees.",
      "The WhatsApp number, USSD code or form link cannot be matched to the official promoter.",
      "You are being rushed to pay, send documents or click a link before checking the source.",
    ],
    faq: [
      {
        question: "Is Freehub the promoter of the competitions it lists?",
        answer:
          "No. Freehub is a competition discovery site. Entries, winner selection, prize fulfilment and final terms belong to the official promoter.",
      },
      {
        question: "Should I check the official page if Freehub has already summarised the listing?",
        answer:
          "Yes. Freehub helps users compare competitions, but the promoter's current official page and terms are the source of truth before entering.",
      },
      {
        question: "What proof should I keep after entering?",
        answer:
          "Keep the till slip, invoice, product code, entry confirmation or screenshot named in the official terms until the promoter has finished winner checks.",
      },
      {
        question: "What should I do if a competition message feels suspicious?",
        answer:
          "Do not share sensitive details or pay fees. Check the official terms and contact the promoter through its official website, app or verified social profile.",
      },
    ],
    links: [
      { label: "How to spot a scam competition", href: "/how-to-spot-a-scam-competition/" },
      { label: "Purchase required guide", href: "/purchase-required-competitions-explained/" },
      { label: "Paid entry guide", href: "/paid-entry-competitions-explained/" },
      { label: "Free competitions", href: "/free-competitions/" },
      { label: "All current competitions", href: "/competitions/" },
    ],
  },
  {
    slug: "how-to-spot-a-scam-competition",
    title: "How to Spot a Scam Competition in South Africa | Freehub",
    description:
      "Learn how to check if a South African competition is legitimate, including official-source checks, fake winner messages, payment red flags and safe entry tips.",
    heading: "How to Spot a Scam Competition",
    intro:
      "A scam competition often looks familiar at first glance: a known brand name, a logo, a prize image and a link that feels urgent. The safer move is to slow down and match the claim to an official source.",
    article: true,
    datePublished: "2026-07-07",
    dateModified: "2026-07-07",
    sections: [
      {
        heading: "Ask: where did this competition come from?",
        paragraphs: [
          "A trustworthy competition should make the promoter easy to identify. Look for the campaign on the brand's official website, app, verified social page, product packaging, receipt, terms PDF or named agency/campaign partner page.",
          "If the only source is a screenshot, comment reply, forwarded WhatsApp message or newly created Facebook page, do not treat it as verified yet. Search for the promoter's official page and compare the link, dates and entry instructions.",
        ],
      },
      {
        heading: "Check WhatsApp and Facebook details",
        paragraphs: [
          "For WhatsApp competitions, the number or click-to-chat link should appear in the promoter's own terms, post, website, pack or receipt. A number pasted into comments is not enough on its own.",
          "For Facebook competitions, inspect the page: when it was created, whether it has normal brand posts, whether it links to the official website, and whether the terms exist outside a private message. Fake pages often push users into inbox conversations quickly.",
        ],
      },
      {
        heading: "Read winner messages like a detective",
        paragraphs: [
          "Check whether you actually entered, whether the message came through the contact method named in the terms, and whether the sender can prove they represent the promoter without asking for unsafe information.",
          "Scam prize claims often ask for a release fee, courier fee, 'SARS clearance', verification payment, banking password, card PIN, one-time PIN or remote-access app. A real prize process should not need those from you.",
        ],
      },
      {
        heading: "Separate entry fees from prize-claim fees",
        paragraphs: [
          "Some competitions are labelled paid entry because the official entry route itself appears to require a ticket or fee. That is different from a message that says you already won but must now pay to release the prize.",
          "Freehub does not process competition payments, sell entries or collect winner fees. If any payment is involved, it should be visible in the official terms before entry, not introduced later by a private message.",
        ],
      },
      {
        heading: "When something feels off",
        paragraphs: [
          "Pause before clicking again. Keep screenshots, copy the URL, and check the official promoter channel separately. Do not use the contact details supplied in the suspicious message as your only verification route.",
          "If you already shared information, stop the conversation, avoid sending money, contact your bank or mobile provider where relevant, and report the fake page or message through the platform and the real brand's support channel.",
        ],
      },
    ],
    checklistTitle: "Scam red flags checklist",
    checklist: [
      "The promoter is hidden, misspelled or only available through a private inbox.",
      "The link comes from a copied comment, unknown WhatsApp message or lookalike Facebook page.",
      "The page has no closing date, terms, entry rules or official website link.",
      "A winner message asks for passwords, card PINs, one-time PINs, remote access or release fees.",
      "The message pressures you to pay or send documents before you can verify the source.",
    ],
    avoidTitle: "Safer checks",
    avoid: [
      "Type the brand's website address yourself or use its verified social profile.",
      "Match the WhatsApp number, USSD code, form link or payment route to official terms.",
      "Check the closing date, draw date and winner-contact method.",
      "Report suspicious Freehub listings through the report page so they can be reviewed.",
    ],
    faq: [
      {
        question: "How do I know if a competition is legitimate?",
        answer:
          "Look for a clear promoter, official source, closing date, entry method, prize details and terms. If those basics are missing, verify the promotion before entering.",
      },
      {
        question: "Can a fake competition use a real brand logo?",
        answer:
          "Yes. Scammers can copy logos, images and names from real brands. Check the official website, app or verified social page rather than trusting the image alone.",
      },
      {
        question: "Should I pay a fee to claim a competition prize?",
        answer:
          "Be very careful. Requests for release, admin, courier or verification fees are common scam warning signs. Verify directly with the official promoter before paying anything.",
      },
      {
        question: "Is a verified badge on social media enough?",
        answer:
          "It helps, but still check the competition terms and official website link. Fake pages can copy real content, and real-looking posts can be shared out of context.",
      },
      {
        question: "What should I do if I receive a suspicious winner message?",
        answer:
          "Do not send sensitive information or payment. Check the competition terms and contact the promoter through its official website, app or verified social profile.",
      },
    ],
    links: [
      { label: "Legit competitions guide", href: "/legit-competitions-south-africa/" },
      { label: "How to enter safely", href: "/how-to-enter-competitions-safely/" },
      { label: "Purchase required guide", href: "/purchase-required-competitions-explained/" },
      { label: "Paid entry guide", href: "/paid-entry-competitions-explained/" },
      { label: "All current competitions", href: "/competitions/" },
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
    title: "Purchase Required Competitions Explained | South Africa | Freehub",
    description:
      "Understand purchase-required competitions in South Africa, including qualifying products, till slips, loyalty cards, receipt uploads and official terms checks.",
    heading: "Purchase Required Competitions Explained",
    intro:
      "A purchase-required competition can be legitimate and still cost you money. The key question is simple: would you buy the product anyway if there were no prize?",
    article: true,
    datePublished: "2026-05-10",
    dateModified: "2026-07-07",
    sections: [
      {
        heading: "What the label really means",
        paragraphs: [
          "Purchase required means the route to entry starts with a shopping action. It might be a specific product, a minimum basket spend, a recharge, a loyalty-card swipe, an app opt-in, a QR scan or a receipt upload.",
          "There may be no separate ticket fee, but the purchase is still a cost. Freehub labels these separately so they do not get mixed into no-purchase or free-entry pages.",
        ],
      },
      {
        heading: "Check the product before you buy",
        paragraphs: [
          "The small details matter: product name, pack size, flavour, barcode, sticker, participating store, online-only wording, minimum spend, purchase dates and excluded products.",
          "Do the check before you pay. Buying the wrong size, missing the campaign dates or forgetting to swipe a required loyalty card can make an entry invalid even if the prize advert looked clear.",
        ],
      },
      {
        heading: "Receipts are part of the entry",
        paragraphs: [
          "For many retail competitions, the till slip is not paperwork; it is proof that the entry qualifies. Keep the original until the promoter finishes winner checks, even if you upload a photo.",
          "If entry happens after purchase through WhatsApp, SMS, USSD, a website form, an app or a QR code, use only the number or link in the official terms. Check whether data, SMS or USSD charges apply.",
        ],
      },
      {
        heading: "How Freehub handles these listings",
        paragraphs: [
          "Freehub uses purchase-required labels, cost notes and requirement summaries to help users compare competitions before opening the official page.",
          "Those labels are a browsing aid. The official terms still decide whether your product, receipt, purchase date, store and entry method qualify.",
        ],
      },
    ],
    checklistTitle: "Before buying to enter",
    checklist: [
      "Confirm the exact product, pack size, barcode, sticker or minimum spend.",
      "Check whether a loyalty card, app opt-in, payment method or receipt upload is required.",
      "Keep the original till slip, invoice, app receipt, product code or packaging.",
      "Make sure the purchase date falls inside the campaign period.",
      "Use only the official WhatsApp number, USSD code, SMS line, app or upload form.",
    ],
    avoidTitle: "What to avoid",
    avoid: [
      "Buying a product only because of the prize before checking the terms.",
      "Assuming a similar product, size or flavour will qualify.",
      "Throwing away proof of purchase before winners are verified.",
      "Uploading receipts through unofficial links, copied forms or comment-thread instructions.",
    ],
    faq: [
      {
        question: "Is a purchase-required competition free to enter?",
        answer:
          "No. There may be no separate ticket fee, but you still need a qualifying purchase or shopping action before entry.",
      },
      {
        question: "Why should I keep my till slip?",
        answer:
          "Promoters often use receipts, invoices or app records to confirm that the winner made the qualifying purchase during the campaign period.",
      },
      {
        question: "Can I enter if I bought the wrong product?",
        answer:
          "Usually not. Check the official terms for exact qualifying products, pack sizes, stores and purchase dates before entering.",
      },
      {
        question: "Is a loyalty-card competition purchase required?",
        answer:
          "Often yes if you must buy something and swipe or link a loyalty card for the entry to count. Check whether opt-in is required before payment.",
      },
    ],
    links: [
      { label: "Purchase required competitions", href: "/purchase-required-competitions/" },
      { label: "Free competitions", href: "/free-competitions/" },
      { label: "How to enter safely", href: "/how-to-enter-competitions-safely/" },
      { label: "How to spot a scam competition", href: "/how-to-spot-a-scam-competition/" },
    ],
  },
  {
    slug: "paid-entry-competitions-explained",
    title: "Paid Entry Competitions Explained | South Africa | Freehub",
    description:
      "Understand how paid-entry competitions work in South Africa, what to check before paying, and how they differ from free-entry and purchase-required competitions.",
    heading: "Paid Entry Competitions Explained",
    intro:
      "Paid-entry competitions need extra caution because the cost is part of the entry itself. This guide is here to help users recognise the category, not to encourage payment.",
    article: true,
    datePublished: "2026-07-07",
    dateModified: "2026-07-07",
    sections: [
      {
        heading: "Know which type of cost you are seeing",
        paragraphs: [
          "Free entry means no required purchase or paid ticket, although normal data or account requirements may still apply. Purchase required means a qualifying shopping action comes first.",
          "Paid entry means the entry route itself appears to require a fee, ticket or similar paid participation. Freehub labels this clearly so users do not confuse it with a free draw.",
        ],
      },
      {
        heading: "Check before paying anything",
        paragraphs: [
          "Before paying, identify the promoter, entry price, payment destination, closing date, draw date, winner-selection method, refund wording and contact details.",
          "Use only official promoter pages or official ticketing/payment routes. Do not pay from a private message, copied banking details or a comment-thread instruction that cannot be matched to the terms.",
        ],
      },
      {
        heading: "Do not confuse paid entry with prize-claim fees",
        paragraphs: [
          "A paid-entry cost should be visible before you enter. A later message claiming you won and must now pay a release, courier, admin or verification fee is a different thing and should be treated as a red flag.",
          "If a prize claim asks for payment after the fact, stop and verify through the promoter's official support channel. Do not use only the phone number or link supplied in the message.",
        ],
      },
      {
        heading: "When to walk away",
        paragraphs: [
          "Walk away if the promoter is unclear, the terms are missing, the payment destination does not match the official source, or the page uses pressure instead of clear rules.",
          "If you prefer not to pay, use Freehub's free-entry hub. It is better to skip a doubtful paid entry than to chase a prize through a payment route you cannot verify.",
        ],
      },
    ],
    checklistTitle: "Before paying to enter",
    checklist: [
      "Identify the promoter, entry price, payment destination and official terms.",
      "Check the closing date, draw date, entry limits and eligibility rules.",
      "Use only the official promoter or official ticketing/payment route.",
      "Look for refund, cancellation or substitution wording before paying.",
      "Compare free-entry alternatives before deciding whether payment is worth it.",
    ],
    avoidTitle: "Do not pay if",
    avoid: [
      "The promoter, terms, payment destination or draw date is missing.",
      "The payment route appears only in a private message or copied comment.",
      "A winner message asks for release, courier, admin or verification fees.",
      "You feel rushed to pay before you can verify the competition.",
    ],
    faq: [
      {
        question: "Does Freehub recommend paid-entry competitions?",
        answer:
          "No. Freehub labels paid-entry competitions so users can identify the cost and check the official terms carefully before deciding what to do.",
      },
      {
        question: "What is the difference between paid entry and purchase required?",
        answer:
          "Purchase required means a qualifying shopping action is needed. Paid entry means the entry itself appears to require a fee, ticket or similar paid participation route.",
      },
      {
        question: "What should I check before paying for an entry?",
        answer:
          "Check the official promoter, terms, entry price, payment destination, closing date, draw date, eligibility rules and winner contact process.",
      },
      {
        question: "Are free-entry competitions safer than paid-entry competitions?",
        answer:
          "They usually carry less direct financial risk because you are not paying to enter, but you should still check the official source, privacy wording and winner-contact rules.",
      },
    ],
    links: [
      { label: "Paid entry competitions", href: "/paid-entry-competitions/" },
      { label: "Free competitions", href: "/free-competitions/" },
      { label: "Purchase required guide", href: "/purchase-required-competitions-explained/" },
      { label: "How to spot a scam competition", href: "/how-to-spot-a-scam-competition/" },
      { label: "How to enter safely", href: "/how-to-enter-competitions-safely/" },
    ],
  },
  {
    slug: "free-stuff-south-africa",
    title: "Free Stuff South Africa | Legit Freebies, Competitions, Samples",
    description:
      "Find legit free stuff South Africa searchers actually want, including free competitions, samples, credit reports, courses and safe official links.",
    heading: "Free Stuff South Africa",
    intro:
      "Use this free stuff South Africa guide when you want legitimate no-cost options beyond a single giveaway. It brings together free competitions, cautious sample routes, learning resources, reading options and credit-report checks with official-source and safety context.",
    article: true,
    datePublished: "2026-05-27",
    dateModified: "2026-06-25",
    resourceCategories: ["online-courses", "childrens-books", "credit-report", "samples", "consumer-support"],
    resourceTitle: "Best free options right now",
    resourceIntro:
      "Start with resources that have clear ownership, official websites and a realistic explanation of what is actually free.",
    sections: [
      {
        heading: "Quick answer: free stuff South Africa",
        paragraphs: [
          "The safest free stuff South Africa options usually come from official websites that explain exactly what is free and what still costs money. Start with free-entry competitions, public learning platforms, open reading resources, free credit-report tools and carefully checked sample offers.",
          "If you mainly want current prize draws, start on the homepage for broader competitions South Africa discovery. If you want product-led offers, use the free samples guide and voucher giveaway hub before sharing any personal details.",
        ],
      },
      {
        heading: "What counts as useful free stuff?",
        paragraphs: [
          "The best free resources solve a real consumer problem without hiding the cost. Good examples include free-entry competitions, public learning platforms, open children's book libraries, free credit-report tools and product-testing programmes that explain the exchange clearly.",
          "A page is only useful if it tells users what is free, what still costs money, who runs the offer, who it suits and what to check before sharing personal details.",
        ],
      },
      {
        heading: "Where Freehub should focus",
        paragraphs: [
          "Freehub should prioritise free things South Africans search for repeatedly: no-purchase competitions, digital skills courses, free children's stories, credit report checks, sample programmes and voucher competitions with clear entry costs.",
          "These topics can keep attracting search traffic after individual competitions close because the pages answer evergreen questions and point users to current official websites.",
        ],
      },
      {
        heading: "Quick safety test before you sign up",
        paragraphs: [
          "Before using any freebie, check the official organisation, current terms, eligibility, privacy wording and any cost that may still apply, such as data, delivery, purchase with order, app sign-up or account verification.",
          "Avoid pages that promise free grocery vouchers, instant cash releases or sample boxes while hiding the promoter, asking for card details, or redirecting through unrelated survey domains.",
        ],
      },
    ],
    checklistTitle: "Before you sign up",
    checklist: [
      "Open the official website directly before entering personal details.",
      "Check whether the offer is free forever, a free trial, free with purchase, or free only if you are selected.",
      "Look for South African eligibility, closing dates, stock limits and age restrictions.",
      "Keep normal costs in mind: mobile data, delivery, printing, travel or a qualifying purchase may still apply.",
    ],
    avoidTitle: "What to avoid",
    avoid: [
      "Card PINs, banking passwords or remote-access apps.",
      "Fake voucher pages that say every visitor has already won.",
      "Sample offers that force unrelated survey walls before showing the promoter.",
      "Credit repair promises that ask for upfront fees to remove accurate information.",
    ],
    faq: [
      {
        question: "Where can I find legit free stuff in South Africa?",
        answer:
          "Start with official brand, learning, literacy and credit-bureau websites, then use Freehub for free-entry competitions and safety checks before you click through.",
      },
      {
        question: "What counts as free stuff and not just a competition?",
        answer:
          "Free stuff can include no-purchase competitions, public courses, reading libraries, free credit-report access and some sample programmes. If a page requires a purchase, delivery fee, paid ticket or selected testing panel, it should say so clearly.",
      },
      {
        question: "Is free stuff really free?",
        answer:
          "Sometimes. Some resources are fully free, while others may require data, an account, a purchase, delivery, age verification or selection for a product-testing campaign.",
      },
      {
        question: "What is the safest freebie to claim?",
        answer:
          "Free digital resources from established organisations, such as course platforms, reading libraries and credit-bureau tools, are usually lower risk than anonymous voucher or sample pages.",
      },
    ],
    links: [
      { label: "Competitions South Africa", href: "/" },
      { label: "Free competitions", href: "/free-competitions/" },
      { label: "Free voucher giveaways", href: "/category/vouchers/" },
      { label: "Free online courses", href: "/free-online-courses-south-africa/" },
      { label: "Free children's books", href: "/free-childrens-books-south-africa/" },
      { label: "Free credit report South Africa", href: "/free-credit-report-south-africa/" },
      { label: "Where to get free samples", href: "/free-samples-south-africa/" },
      { label: "Fake winner messages", href: "/fake-competition-winner-messages/" },
    ],
  },
  {
    slug: "free-online-courses-south-africa",
    title: "Free Online Courses South Africa | Digital Skills & Certificates",
    description:
      "Compare free online course options for South Africans, including Google Digital Skills, Microsoft Learn, Vodacom Digital Skills Hub and certificate checks.",
    heading: "Free Online Courses in South Africa",
    intro:
      "A jobseeker-friendly guide to free learning platforms, what they offer, what may still cost money and how to check certificate claims before spending time on a course.",
    article: true,
    datePublished: "2026-05-27",
    dateModified: "2026-05-27",
    resourceCategories: ["online-courses"],
    resourceTitle: "Official free course websites",
    resourceIntro:
      "Use these as starting points for digital skills, technical learning and beginner business training.",
    sections: [
      {
        heading: "Best for jobseekers and beginners",
        paragraphs: [
          "Free online courses work best when the page tells users the skill level, time commitment, certificate status and whether the provider is the official source. That is the difference between a useful search result and a thin list of links.",
          "For Freehub, the strongest course angle is practical: digital marketing, Microsoft tools, cloud basics, AI basics, CV-friendly skills and beginner business learning.",
        ],
      },
      {
        heading: "Certificate and cost checks",
        paragraphs: [
          "Some platforms offer free learning but charge for certification exams, pro certificates or optional upgrades. Others may offer free completion certificates for selected courses only.",
          "Users should confirm whether a course is self-paced, whether a certificate is included, whether data is zero-rated and whether the programme is open to all South Africans.",
        ],
      },
      {
        heading: "How to choose a course",
        paragraphs: [
          "Pick one skill goal first: improve your CV, learn digital marketing, understand Microsoft tools, start coding basics or build small-business confidence. Then choose the shortest official course that helps you prove progress.",
          "Avoid pages that promise guaranteed jobs after a free course unless the provider gives transparent terms, intake criteria and current programme details.",
        ],
      },
    ],
    checklistTitle: "Before you start a free course",
    checklist: [
      "Check whether the course, certificate and exam are all free or only the learning content is free.",
      "Confirm the course is still open and available to South African learners.",
      "Check estimated hours so you do not abandon the course halfway.",
      "Use the official provider page, not a reposted WhatsApp flyer.",
    ],
    avoidTitle: "Course red flags",
    avoid: [
      "Guaranteed job promises with no employer or programme terms.",
      "Requests for upfront admin fees for a supposedly free course.",
      "Certificate claims that do not appear on the provider's own website.",
      "Pages that collect ID documents before explaining who runs the training.",
    ],
    faq: [
      {
        question: "Are free online courses in South Africa really free?",
        answer:
          "Many learning paths are free to study, but certificates, exams, data or optional upgrades may cost money. Always check the official course page.",
      },
      {
        question: "Which free online course is best for beginners?",
        answer:
          "Google Digital Skills and Microsoft Learn are good starting points for beginners because they offer structured learning from official providers.",
      },
      {
        question: "Can I get a job with a free online course?",
        answer:
          "A free course can improve your CV and skills, but it does not guarantee employment. Treat job promises carefully unless the provider gives official placement terms.",
      },
    ],
    links: [
      { label: "Free stuff guide", href: "/free-stuff-south-africa/" },
      { label: "Free competitions", href: "/free-competitions/" },
      { label: "App competitions", href: "/app-competitions-south-africa/" },
      { label: "How to enter safely", href: "/how-to-enter-competitions-safely/" },
    ],
  },
  {
    slug: "free-childrens-books-south-africa",
    title: "Free Children's Books South Africa | Stories & Reading Resources",
    description:
      "Find free children's books and reading resources in South Africa, including Book Dash, Nal'ibali, FunDza, multilingual stories and safe download checks.",
    heading: "Free Children's Books in South Africa",
    intro:
      "A parent- and teacher-friendly guide to free South African reading resources, with official links, language notes and safety checks for downloads.",
    article: true,
    datePublished: "2026-05-27",
    dateModified: "2026-05-27",
    resourceCategories: ["childrens-books"],
    resourceTitle: "Official free reading websites",
    resourceIntro:
      "These resources are strong starting points for children, classrooms, reading clubs and mobile reading.",
    sections: [
      {
        heading: "Best resources for families and teachers",
        paragraphs: [
          "Free children's book searches need practical answers: where to read now, which ages are served, whether stories are available in South African languages and whether downloads are safe.",
          "Book Dash, Nal'ibali and FunDza are useful because they are ongoing literacy platforms, not short-lived coupon pages.",
        ],
      },
      {
        heading: "Language and age fit",
        paragraphs: [
          "Younger children usually need picture books, read-aloud stories and home-language support. Older children and teens may prefer mobile stories, serial fiction and short reads.",
          "A useful guide should help caregivers pick the right source instead of sending everyone to the same generic ebook page.",
        ],
      },
      {
        heading: "Safe download checks",
        paragraphs: [
          "Use established literacy organisations with clear reading or download terms. Avoid download sites that bundle unrelated software, force browser notifications or ask for adult identity documents for basic reading material.",
          "Normal costs may still apply if a family prints books or uses mobile data, so Freehub should describe digital access honestly.",
        ],
      },
    ],
    checklistTitle: "Before downloading books",
    checklist: [
      "Check age range, language and whether the story can be read online before downloading.",
      "Use official literacy platforms or publisher pages.",
      "Avoid downloads that require card details, unknown browser extensions or software installers.",
      "If printing, check paper and ink costs before promising the book is completely free.",
    ],
    avoidTitle: "Reading-resource red flags",
    avoid: [
      "PDF sites with aggressive pop-ups or fake download buttons.",
      "Books uploaded without permission or unclear copyright terms.",
      "Child-facing pages that ask for unnecessary adult identity details.",
      "Apps that hide subscriptions behind a free-book claim.",
    ],
    faq: [
      {
        question: "Where can I download free children's books in South Africa?",
        answer:
          "Start with official literacy platforms such as Book Dash and Nal'ibali, which provide free reading resources and clear access terms.",
      },
      {
        question: "Are free children's books safe to download?",
        answer:
          "They are safer when downloaded from official literacy organisations or publishers. Avoid mirror sites, forced extensions and pages with fake download buttons.",
      },
      {
        question: "Can teachers use free children's books?",
        answer:
          "Often yes, but teachers should check each provider's terms for classroom use, printing and sharing.",
      },
    ],
    links: [
      { label: "Free stuff guide", href: "/free-stuff-south-africa/" },
      { label: "Free online courses", href: "/free-online-courses-south-africa/" },
      { label: "Free competitions", href: "/free-competitions/" },
      { label: "Legit competitions guide", href: "/legit-competitions-south-africa/" },
    ],
  },
  {
    slug: "free-credit-report-south-africa",
    title: "Free Credit Report South Africa | Free Credit Score Checks",
    description:
      "Check free credit report South Africa options, free credit score routes, official bureau sources, identity checks and credit repair red flags.",
    heading: "Free Credit Report South Africa",
    intro:
      "Use this guide to compare free credit report South Africa options before you enter identity details. It explains recognised credit-bureau and consumer-platform routes, what a free credit score can and cannot tell you, and the red flags to avoid before applying for credit.",
    article: true,
    datePublished: "2026-05-27",
    dateModified: "2026-06-25",
    resourceCategories: ["credit-report"],
    resourceTitle: "Official free credit report options",
    resourceIntro:
      "Use recognised credit-bureau or authorised consumer platforms, then read how your data and offers are handled.",
    sections: [
      {
        heading: "Quick answer: free credit report South Africa",
        paragraphs: [
          "South Africans can start with recognised credit-bureau or consumer credit-score services when checking a free credit report or free credit score. Expect identity verification, account creation and privacy terms before the report is shown.",
          "A free credit report helps you review accounts, payment history, defaults, judgments and possible errors. It does not guarantee loan approval, remove accurate negative information or replace advice from the official provider.",
        ],
      },
      {
        heading: "What you can check for free",
        paragraphs: [
          "A free credit report can help you review listed accounts, missed payments, defaults, judgments, account enquiries and possible errors before you apply for new credit.",
          "Experian, TransUnion and ClearScore are useful starting points, but each service has its own sign-up flow, score display, update timing, privacy wording and offer model.",
        ],
      },
      {
        heading: "What to check before signing up",
        paragraphs: [
          "Check who provides the report, whether the service is free forever or a trial, whether card details are required, how your data is used and whether personalised offers are part of the service.",
          "A free credit score is not the same as guaranteed loan approval. Treat personalised offers as advertising or eligibility guidance unless the provider clearly says otherwise.",
        ],
      },
      {
        heading: "When to dispute an error",
        paragraphs: [
          "If a report shows an account, judgment, payment status or personal detail you believe is wrong, use the provider's official dispute or correction process. Keep screenshots, reference numbers and dates for your own records.",
          "Do not pay an anonymous agent to remove accurate information. If the information is wrong, the safer route is the official bureau or provider process, not a WhatsApp-only service.",
        ],
      },
      {
        heading: "Credit repair scam warning",
        paragraphs: [
          "Be wary of credit repair promises, upfront-fee fixes, WhatsApp agents who ask for passwords, and anyone claiming they can delete accurate credit information for a payment.",
          "If you find incorrect information, use the official provider's dispute process or recognised credit-bureau channels instead of paying an anonymous agent.",
        ],
      },
    ],
    checklistTitle: "Before checking your credit report",
    checklist: [
      "Use the official provider website or app.",
      "Confirm whether the report is free, a free annual report, or a free ongoing service.",
      "Read how your data may be used for offers or marketing.",
      "Never share banking passwords, card PINs or remote-access app codes.",
    ],
    avoidTitle: "Credit-report red flags",
    avoid: [
      "Upfront fees to remove accurate information.",
      "WhatsApp-only agents who promise instant credit score fixes.",
      "Sites that ask for card details before explaining the free report.",
      "Loan approval promises tied to a free credit score check.",
    ],
    faq: [
      {
        question: "Can I get a free credit report in South Africa?",
        answer:
          "Yes. South Africans can use recognised credit-bureau or authorised consumer services, including free annual bureau report options and free score/report platforms.",
      },
      {
        question: "Where should I start if I want to check my credit score for free?",
        answer:
          "Start with recognised credit-bureau or consumer credit-score providers and make sure you are on the official website or app before entering identity details.",
      },
      {
        question: "Does checking my own credit report hurt my score?",
        answer:
          "Checking your own report is generally treated differently from a lender application check. Use official provider guidance if you are unsure.",
      },
      {
        question: "Is a free credit score the same as loan approval?",
        answer:
          "No. A score helps you understand your profile, but approval depends on the lender's full assessment and current affordability checks.",
      },
      {
        question: "Should I pay someone to fix my credit report?",
        answer:
          "Be careful. Do not pay upfront fees to remove accurate credit information. If something is wrong, use the official provider or bureau dispute process.",
      },
    ],
    links: [
      { label: "Free stuff guide", href: "/free-stuff-south-africa/" },
      { label: "Where to get free samples", href: "/free-samples-south-africa/" },
      { label: "Free online courses", href: "/free-online-courses-south-africa/" },
      { label: "Fake winner messages", href: "/fake-competition-winner-messages/" },
      { label: "How to enter safely", href: "/how-to-enter-competitions-safely/" },
      { label: "Free competitions", href: "/free-competitions/" },
    ],
  },
  {
    slug: "free-samples-south-africa",
    title: "Where to Get Free Samples in South Africa | Official Offers Guide",
    description:
      "Where to get free samples in South Africa: check official brand campaigns, retailer sample offers and product-testing panels before you share details, pay delivery fees or trust a freebie claim.",
    heading: "Where to Get Free Samples in South Africa",
    intro:
      "If you are searching where to get free samples in South Africa, start with official brand campaigns, retailer sample offers and recognised product-testing panels. This guide is built for searchers who want a practical first check before they share personal details, pay delivery costs or assume every sample page is a legitimate no-cost offer.",
    article: true,
    datePublished: "2026-05-27",
    dateModified: "2026-06-25",
    resourceCategories: ["samples"],
    resourceTitle: "Sample and product-testing routes",
    resourceIntro:
      "These are not guaranteed freebies. They are places or methods to check when campaigns are active and terms are clear.",
    sections: [
      {
        heading: "Quick answer: where to get free samples",
        paragraphs: [
          "The safest places to get free samples are official brand campaign pages, retailer sample promotions and product-testing panels that clearly explain who qualifies, whether stock is limited, and whether delivery, a purchase, age checks or feedback tasks apply.",
          "If a page asks for bank-card details, hides the promoter, or promises guaranteed luxury freebies for everyone, treat it as a warning sign instead of a real free-samples South Africa offer.",
          "Use this guide when you want a cautious starting point, then compare broader free stuff South Africa options, free competitions, free vouchers South Africa and free credit report South Africa routes for other no-cost options.",
        ],
      },
      {
        heading: "Types of sample offers",
        paragraphs: [
          "Common free sample routes include official brand request forms, samples included with an order, in-store or kiosk samples, product-testing panels and adult-only product trials with age restrictions.",
          "Some offers are not truly free because they require a paid order, delivery fee, purchase, loyalty account, content task or collection at a specific store.",
        ],
      },
      {
        heading: "Check the source first",
        paragraphs: [
          "A safer sample page should show the official brand, eligibility, collection or delivery method, whether stock is limited, whether age restrictions apply and what personal information is collected.",
          "Avoid sample pages that ask for card details for a free item, send you through unrelated survey walls or claim everyone has already won a high-value voucher.",
        ],
      },
      {
        heading: "How Freehub should talk about samples",
        paragraphs: [
          "Use cautious labels such as sample offer, product testing, with order, limited stock or adult-only where appropriate. Do not label an offer free-entry if it requires a purchase, delivery payment or age-gated product claim.",
          "When in doubt, keep the item as an editorial guide mention instead of publishing it as a competition-style listing.",
        ],
      },
    ],
    checklistTitle: "Before claiming a sample",
    checklist: [
      "Confirm the sample appears on the brand, retailer or testing platform's official website.",
      "Check whether it is free, free with order, selected testers only, or limited to a store event.",
      "Read what feedback, content or review is expected in exchange.",
      "Check delivery, age, stock and purchase conditions before sharing personal details.",
    ],
    avoidTitle: "Sample red flags",
    avoid: [
      "Survey walls that never reveal the brand or product.",
      "Card details for a supposedly free sample.",
      "High-value voucher claims disguised as sample campaigns.",
      "Pages that say every visitor qualifies without any campaign terms.",
    ],
    faq: [
      {
        question: "Where can I get free samples in South Africa?",
        answer:
          "Check official brand campaign pages, retailer sample offers and recognised product-testing platforms. Free samples are often limited, selected, in-store only or linked to a purchase, so read the terms before sharing details.",
      },
      {
        question: "Can I get free samples without buying anything first?",
        answer:
          "Sometimes, yes. Some campaigns are genuinely free, but others are free with order, in-store only, limited to selected testers or linked to a delivery cost. The promoter should explain that before you enter.",
      },
      {
        question: "Are free samples always free?",
        answer:
          "No. Some are free only with an order, delivery fee, loyalty account, store visit or product-testing task.",
      },
      {
        question: "How do I avoid fake sample offers?",
        answer:
          "Use official websites, avoid card requests for free items, and step away from survey pages that hide the promoter or promise everyone a high-value reward.",
      },
    ],
    links: [
      { label: "Free giveaways South Africa", href: "/" },
      { label: "Free stuff guide", href: "/free-stuff-south-africa/" },
      { label: "Free voucher giveaways", href: "/category/vouchers/" },
      { label: "Free credit report guide", href: "/free-credit-report-south-africa/" },
      { label: "Free competitions", href: "/free-competitions/" },
      { label: "Report a suspicious listing", href: "/report-a-competition/" },
    ],
  },
  {
    slug: "submit-a-competition",
    title: "Submit a Competition South Africa | Brand Review & Listing | Freehub",
    description:
      "Submit a South African competition, giveaway or prize draw to Freehub for editorial review, validation and a possible SEO-friendly listing with official source links.",
    heading: "Submit a Competition to Freehub",
    intro:
      "Brands, agencies and promoters can submit South African competitions, giveaways and prize draws to Freehub for editorial review. We check the official source, entry requirements, closing date and user safety basics before deciding whether a listing can be published.",
    actions: [
      { label: "Submit Details", href: "#competitionSubmissionTitle", className: "btn--primary" },
      { label: "Email Freehub", href: "mailto:hello@freehub.co.za?subject=Competition%20submission%20for%20Freehub", className: "btn--secondary" },
      { label: "Review Criteria", href: "/how-we-verify-competitions/", className: "btn--secondary" },
    ],
    trustItems: ["Editorial review", "Official source required", "Dedicated detail pages"],
    service: {
      name: "South African competition review and listing",
      serviceType: "Competition listing review",
      audience: "Brands, agencies, retailers and promoters in South Africa",
    },
    sections: [
      {
        heading: "What Freehub currently offers",
        paragraphs: [
          "Freehub can review public South African competitions, giveaways, prize draws and brand promotions for possible listing on a Freehub competition detail page.",
          "A published listing can include the competition title, promoter or brand, prize, closing date, entry cost label, purchase or app requirement, entry channel, eligibility notes, official terms link and a direct route to the promoter source.",
          "Where there is enough active inventory, competitions may also appear on relevant category, brand, tag and SEO hub pages such as free competitions, purchase-required competitions, WhatsApp competitions, till-slip competitions, voucher competitions or win-a-car pages.",
        ],
      },
      {
        heading: "What to send for review",
        paragraphs: [
          "Use the submission form on this page with the campaign name, promoter or brand, official competition URL, terms and conditions URL, closing date, prize details, entry method, purchase requirements, eligibility limits and any approved campaign image or logo link.",
          "If an agency is submitting on behalf of a brand, include the brand relationship and the public source where users can confirm the competition is official.",
          "Please do not send raw customer data, competition entries, identity documents, till slips or private winner information to Freehub.",
        ],
      },
      {
        heading: "Why submit directly",
        paragraphs: [
          "Direct submissions help Freehub validate the official source faster, reduce missing requirement details and avoid publishing copied or incomplete competition information.",
          "A complete submission is more likely to become a useful page for South African users searching for current competitions, brand giveaways, voucher prizes, car competitions, purchase-required promotions or free-entry prize draws.",
        ],
      },
      {
        heading: "How review works",
        paragraphs: [
          "Freehub reviews submissions against the same safety and usefulness checks used for discovered listings. We look for a credible official source, clear entry rules, transparent costs, a closing date and enough detail for users to make an informed click.",
          "Submission does not guarantee publication. Freehub may decline, delay, edit, noindex or remove a listing if the source is unclear, the rules are incomplete, the campaign has ended or the promotion creates avoidable user-risk.",
        ],
      },
      {
        heading: "Useful detail pages for SEO",
        paragraphs: [
          "When a competition is approved, Freehub can create a dedicated detail page designed to help users understand the prize, promoter, closing date, entry method, requirements and official source before leaving Freehub.",
          "Detail pages are written for discovery and trust, not for collecting entries. Users are sent to the official promoter page to enter, and the promoter remains responsible for entry forms, winner selection, privacy notices and prize fulfilment.",
        ],
      },
    ],
    checklistTitle: "What Freehub can validate",
    checklist: [
      "Official promoter page, campaign page, verified social post or terms PDF.",
      "Promoter, brand, agency or campaign partner relationship.",
      "Closing date, draw timing and winner-contact process.",
      "Prize name, prize value where public, number of prizes and important exclusions.",
      "Approved campaign image, product image or logo URL if the promoter wants a richer listing.",
      "Entry method, including online form, app, WhatsApp, SMS, USSD, till slip, purchase, loyalty card or paid ticket.",
      "Eligibility rules such as age, South African residency, region, licence requirements or account requirements.",
      "Entry cost label, including free entry, purchase required, paid entry, data costs or standard network rates.",
    ],
    avoidTitle: "Submissions Freehub may reject",
    avoid: [
      "Competitions without a public official source or clear promoter.",
      "Campaigns that hide costs, terms, eligibility or closing dates.",
      "Pages asking for banking passwords, card PINs, one-time PINs or unofficial winner fees.",
      "Expired campaigns unless the page is useful as an archive and has strong source information.",
      "Submissions that ask Freehub to collect entries, choose winners or validate private user documents.",
    ],
    faq: [
      {
        question: "Can a company submit a competition to Freehub?",
        answer:
          "Yes. Companies, brands, agencies and promoters can use the Freehub submission form to send public competition details for editorial review and possible listing.",
      },
      {
        question: "Does submitting a competition guarantee a listing?",
        answer:
          "No. Freehub reviews each submission for source quality, clarity, safety and usefulness before deciding whether it can be published.",
      },
      {
        question: "Can Freehub create a detailed SEO page for an approved competition?",
        answer:
          "Yes. Approved competitions can receive a dedicated Freehub detail page with source-backed prize, closing-date, entry-method and requirement information.",
      },
      {
        question: "What helps a submitted competition get reviewed faster?",
        answer:
          "A public official competition URL, clear terms and conditions, prize details, closing date, entry method, eligibility rules and any approved image or logo URL help Freehub review the submission faster.",
      },
      {
        question: "Can agencies submit competitions for brands?",
        answer:
          "Yes. Agencies can submit competitions for brands, but the submission should include a public source or terms page that confirms the promoter, brand relationship and entry process.",
      },
      {
        question: "Will Freehub collect entries for my competition?",
        answer:
          "No. Freehub is a discovery and listing site. Entries, privacy consent, winner selection and prize fulfilment remain with the official promoter.",
      },
    ],
    links: [
      { label: "Email Freehub", href: "mailto:hello@freehub.co.za?subject=Competition%20submission%20for%20Freehub" },
      { label: "How Freehub checks listings", href: "/how-we-verify-competitions/" },
      { label: "Report a competition issue", href: "/report-a-competition/" },
      { label: "Browse current competitions", href: "/competitions/" },
      { label: "Browse competition brands", href: "/brands/" },
      { label: "Entry cost labels", href: "/competition-entry-cost-labels/" },
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

const VERTICAL_PAGE_DEFINITIONS = [
  {
    slug: "whatsapp-competitions-south-africa",
    title: "WhatsApp Competitions South Africa | Freehub",
    heading: "WhatsApp Competitions in South Africa",
    description:
      "Browse live South African WhatsApp competitions with official source links, closing dates, entry costs, purchase requirements and safety checks.",
    intro:
      "Find current South African competitions that use WhatsApp as an entry route or verification channel. These listings are generated from active published Freehub data only, so each card links to a Freehub detail page with the official promoter source, closing date, entry cost label and important requirements before you leave the site. WhatsApp competitions often ask for a code, till slip, photo, QR scan, receipt number or prompt response, so always confirm the official number and final terms on the promoter website.",
    support:
      "WhatsApp entry can be convenient, but it also creates room for fake winner messages and copied numbers. Use the official promoter source, check the entry cost label and never send banking passwords, card PINs or unofficial release fees.",
    explainerHeading: "How WhatsApp competitions usually work",
    explainerParagraphs: [
      "South African WhatsApp competitions often appear in retail, FMCG, beverage, beauty and telecom campaigns. A promoter may ask you to buy a qualifying product, scan a QR code, send a keyword, upload a till slip or follow automated prompts from an official WhatsApp number.",
      "The safest way to enter is to open the Freehub detail page, check the official source, then use the WhatsApp number or link confirmed by the promoter. Be careful with screenshots, forwarded messages and comments that publish a different number from the official terms.",
    ],
    checklist: [
      "Official promoter page or terms showing the WhatsApp number.",
      "Closing date, draw date and winner-contact method.",
      "Purchase, till slip, code, QR or product requirements.",
      "Any mobile data, consent or marketing opt-in steps.",
      "Whether Freehub is only summarising the competition.",
      "Promoter terms, which override Freehub summaries.",
    ],
    faq: [
      {
        question: "Are WhatsApp competitions free to enter?",
        answer:
          "Some are free entry, but many require a product purchase, till slip, app step, QR scan or qualifying code. Check the Freehub entry cost label and the official promoter terms before entering.",
      },
      {
        question: "How do I know the WhatsApp number is official?",
        answer:
          "Use the number listed on the promoter's official page, terms PDF or campaign page. Do not trust copied numbers from comments, screenshots or forwarded winner messages.",
      },
      {
        question: "Can a promoter ask for my receipt on WhatsApp?",
        answer:
          "Yes, some purchase-required campaigns ask for a receipt, code or photo through WhatsApp. Confirm the exact proof required and keep the original till slip until winners are confirmed.",
      },
      {
        question: "Does Freehub run WhatsApp competition lines?",
        answer:
          "No. Freehub lists competitions and links to official promoter sources. The promoter runs the WhatsApp flow, accepts entries and chooses winners.",
      },
    ],
    relatedLinks: [
      { label: "Till slip competitions", href: "/till-slip-competitions-south-africa/" },
      { label: "Purchase required competitions", href: "/purchase-required-competitions/" },
      { label: "Competitions ending soon", href: "/competitions-ending-soon/" },
      { label: "Fake winner messages", href: "/fake-competition-winner-messages/" },
    ],
    getMatchReasons: getWhatsAppVerticalMatchReasons,
  },
  {
    slug: "sms-competitions-south-africa",
    title: "SMS Competitions South Africa | Freehub",
    heading: "SMS Competitions in South Africa",
    description:
      "Browse live South African SMS competitions when Freehub has enough verified listings with official source links, SMS costs and closing dates.",
    intro:
      "SMS competitions can involve a shortcode, keyword, product code or receipt-linked entry, but this page is only published when Freehub has enough active verified SMS-entry competitions to make the page useful. SMS verification during account signup is not treated as an SMS competition entry method.",
    support:
      "SMS entry pages need extra caution because costs, shortcodes and opt-in wording matter. Freehub holds this page unless live inventory is strong enough.",
    explainerHeading: "How SMS competitions usually work",
    explainerParagraphs: [
      "A genuine SMS competition should clearly show the shortcode, keyword, charge or standard-rate wording, closing date and promoter terms. Some campaigns also require a product purchase or till slip before the SMS entry is valid.",
      "This vertical stays unpublished until enough active public listings confirm SMS as the actual entry mechanic rather than ordinary account verification.",
    ],
    checklist: [
      "Official source showing SMS as the entry method.",
      "Shortcode, keyword and any SMS charge.",
      "Purchase or proof-of-purchase requirements.",
      "Closing date and eligibility.",
      "Privacy and marketing consent wording.",
      "Promoter terms, which override Freehub summaries.",
    ],
    faq: [
      {
        question: "Why is this page held when there are too few SMS competitions?",
        answer:
          "Freehub avoids thin pages. SMS verification or account security messages do not count as SMS competition entry, so the page is only published when enough live entries qualify.",
      },
      {
        question: "Are SMS competitions always paid?",
        answer:
          "No. Some use standard network rates while others may charge more. The official promoter terms should state the SMS cost before you enter.",
      },
      {
        question: "What should I keep after entering by SMS?",
        answer:
          "Keep the original message, receipt, product code or proof of purchase where the promoter requires it.",
      },
      {
        question: "Does Freehub send SMS competition entries?",
        answer:
          "No. Freehub summarises listings and points users to official promoter sources.",
      },
    ],
    relatedLinks: [
      { label: "Purchase required competitions", href: "/purchase-required-competitions/" },
      { label: "Till slip competitions", href: "/till-slip-competitions-south-africa/" },
      { label: "How to enter safely", href: "/how-to-enter-competitions-safely/" },
    ],
    getMatchReasons: getSmsVerticalMatchReasons,
  },
  {
    slug: "till-slip-competitions-south-africa",
    title: "Till Slip Competitions South Africa | Freehub",
    heading: "Till Slip Competitions in South Africa",
    description:
      "Browse live South African till slip competitions with receipt requirements, official source links, closing dates and entry cost labels.",
    intro:
      "Find current South African competitions where a till slip, receipt, invoice, proof of purchase or uploaded purchase proof appears to be part of the entry process. Freehub only uses active published listings for this page, so held, expired and unverified competitions do not appear. Open a listing to compare the promoter, prize, closing date, entry route, qualifying product details and official terms before deciding whether to enter.",
    support:
      "Till slip competitions are usually purchase-required. Keep the original proof of purchase, check that the purchase date falls inside the campaign period and follow the promoter's official upload, WhatsApp, QR, app or in-store entry instructions.",
    explainerHeading: "How till slip competitions usually work",
    explainerParagraphs: [
      "A till slip competition usually asks you to buy a qualifying product or spend a minimum amount at a participating retailer. The receipt may contain a code, barcode, transaction number, date, store name or product line that the promoter uses to validate your entry.",
      "Do not throw the receipt away after submitting. Promoters may ask winners to produce the original till slip before awarding the prize, and entries can be rejected if the purchase falls outside the campaign dates or misses a qualifying product.",
    ],
    checklist: [
      "Official source and terms confirming the receipt requirement.",
      "Qualifying product, store, minimum spend or campaign dates.",
      "Closing date and final submission time.",
      "Upload, WhatsApp, QR, app, SMS or in-store entry route.",
      "Eligibility, privacy and marketing consent wording.",
      "Promoter terms, which override Freehub summaries.",
    ],
    faq: [
      {
        question: "Are till slip competitions free to enter?",
        answer:
          "Usually no. They normally require a qualifying purchase, even when there is no separate entry fee. Check the Freehub cost label and the official terms.",
      },
      {
        question: "Should I keep my receipt after entering?",
        answer:
          "Yes. Keep the original till slip or invoice until winners are announced and prizes are fulfilled, because promoters often need proof before validating a claim.",
      },
      {
        question: "Can I use an old receipt?",
        answer:
          "Only if the official terms allow it. Most campaigns require the receipt date to fall inside the competition period.",
      },
      {
        question: "Does Freehub validate till slips?",
        answer:
          "No. Freehub does not accept entries or validate receipts. The official promoter handles entry validation and prize fulfilment.",
      },
    ],
    relatedLinks: [
      { label: "Purchase required competitions", href: "/purchase-required-competitions/" },
      { label: "WhatsApp competitions", href: "/whatsapp-competitions-south-africa/" },
      { label: "Supermarket competitions", href: "/supermarket-competitions-south-africa/" },
      { label: "Entry cost labels", href: "/competition-entry-cost-labels/" },
    ],
    getMatchReasons: getTillSlipVerticalMatchReasons,
  },
  {
    slug: "online-competitions-south-africa",
    title: "Online Competitions South Africa | Freehub",
    heading: "Online Competitions in South Africa",
    description:
      "Browse live South African online competitions with official website forms, closing dates, entry costs, prizes and source links.",
    intro:
      "Find current South African competitions that can be entered through an online form, website, quiz, campaign page or official digital entry route. This page is built from active published Freehub listings, with each card linking to a Freehub detail page before the promoter site. Compare the brand, prize, closing date, entry cost and eligibility notes, then check the official rules before submitting any personal information.",
    support:
      "Online competitions can be quick to enter, but official URLs, privacy consent and eligibility rules still matter. Avoid cloned forms and always use the promoter source linked from the listing.",
    explainerHeading: "How online competitions usually work",
    explainerParagraphs: [
      "Online competitions can use forms, quizzes, quote requests, account logins, app-linked pages or promoter campaign sites. Some are free entry, while others depend on a purchase, loyalty profile, account action or qualifying transaction.",
      "Before entering, check whether the form belongs to the promoter or a named campaign partner. Read consent wording carefully, especially when the entry form asks for marketing permission, contact details, identity information or proof of purchase.",
    ],
    checklist: [
      "Official website or campaign partner domain.",
      "Closing date and eligibility rules.",
      "Free, purchase-required, account-required or paid-entry label.",
      "Personal information and marketing consent wording.",
      "Prize details, draw timing and winner-contact process.",
      "Promoter terms, which override Freehub summaries.",
    ],
    faq: [
      {
        question: "Are online competitions free to enter?",
        answer:
          "Some are free entry, but online forms can still require an account, quote, purchase, receipt upload or app step. Check the listing label and official terms.",
      },
      {
        question: "How do I avoid fake online entry forms?",
        answer:
          "Use the official promoter source, check the domain, avoid cloned forms from comments or messages and do not share banking passwords or one-time PINs.",
      },
      {
        question: "Can Freehub submit an online entry for me?",
        answer:
          "No. Freehub does not collect entries. Open the detail page, check the official source and enter through the promoter's own process.",
      },
      {
        question: "Why do some online competitions need an account?",
        answer:
          "Some promoters link entries to a loyalty, banking, retail, app or publisher account. The official terms should explain whether account signup is required.",
      },
    ],
    relatedLinks: [
      { label: "Free competitions", href: "/free-competitions/" },
      { label: "New competitions", href: "/new-competitions-south-africa/" },
      { label: "Tech competitions", href: "/category/tech/" },
      { label: "How to enter safely", href: "/how-to-enter-competitions-safely/" },
    ],
    getMatchReasons: getOnlineVerticalMatchReasons,
  },
  {
    slug: "win-airtime-competitions-south-africa",
    title: "Win Airtime Competitions South Africa | Freehub",
    heading: "Win Airtime Competitions in South Africa",
    description:
      "Browse live South African airtime competitions, recharge-linked prizes and mobile voucher giveaways with official source links.",
    intro:
      "Find current South African competitions where airtime, prepaid recharge value, mobile vouchers or airtime-linked rewards appear in the prize or entry mechanic. Listings are generated from active published Freehub data only, so each card shows the promoter, prize cue, closing date and cost label before you open the official source. Airtime promotions often involve recharges, app accounts, product purchases or retailer payment flows, so read the official terms carefully.",
    support:
      "Airtime competitions can be free, purchase-required, recharge-linked or account-linked. Check whether you must buy airtime, recharge a SIM, use an app or keep proof before entering.",
    explainerHeading: "How airtime competitions usually work",
    explainerParagraphs: [
      "Airtime prize campaigns often come from mobile networks, payment platforms, retailers and FMCG brands. They may offer airtime as the main prize, part of a reward bundle, instant vouchers or weekly draws linked to qualifying purchases.",
      "Check whether the promotion is a real competition rather than a normal deal or discount. Freehub only lists competition-style entries, and the official promoter source remains the final authority on costs, eligibility and prize fulfilment.",
    ],
    checklist: [
      "Official source showing airtime or recharge prize details.",
      "Whether a recharge, product purchase or account is required.",
      "Closing date and reward fulfilment timing.",
      "Network, voucher PIN or mobile-number rules.",
      "Privacy and marketing consent wording.",
      "Promoter terms, which override Freehub summaries.",
    ],
    faq: [
      {
        question: "Do airtime competitions require a recharge?",
        answer:
          "Some do and some do not. Check the entry cost label, required product notes and official terms before spending money.",
      },
      {
        question: "Are airtime voucher giveaways the same as ordinary deals?",
        answer:
          "No. Freehub should only list competition-style prize draws or reward campaigns, not ordinary airtime specials or discounts.",
      },
      {
        question: "Can I enter with any mobile network?",
        answer:
          "Not always. Some campaigns are limited to a specific network, wallet, retailer, app or recharge route.",
      },
      {
        question: "Does Freehub issue airtime prizes?",
        answer:
          "No. The promoter or campaign partner handles airtime prize fulfilment.",
      },
    ],
    relatedLinks: [
      { label: "Voucher competitions", href: "/category/vouchers/" },
      { label: "Purchase required competitions", href: "/purchase-required-competitions/" },
      { label: "Online competitions", href: "/online-competitions-south-africa/" },
      { label: "Competitions ending soon", href: "/competitions-ending-soon/" },
    ],
    getMatchReasons: getAirtimeVerticalMatchReasons,
  },
  {
    slug: "win-data-competitions-south-africa",
    title: "Win Data Competitions South Africa | Freehub",
    heading: "Win Data Competitions in South Africa",
    description:
      "Browse live South African competitions for mobile data, data bundles, connectivity prizes and smartphone data rewards where inventory qualifies.",
    intro:
      "Find current South African competitions where mobile data, data bundles, connectivity prizes, SIM-linked rewards or smartphone data bundles are clearly part of the prize. This page is only indexable when Freehub has enough active verified listings to avoid a thin search page. Each listing links to a Freehub detail page first, with official source links and cost labels visible before users leave for the promoter site.",
    support:
      "Data competitions should not be confused with ordinary telecom deals. This page only uses records where the active listing supports a competition or prize draw involving data or connectivity rewards.",
    explainerHeading: "How data competitions usually work",
    explainerParagraphs: [
      "Data prize campaigns can come from mobile networks, retailers, app partners, fibre providers or brands bundling smartphone and data rewards. They may require a recharge, app account, product purchase, qualifying transaction or online form.",
      "Because telecom wording can be broad, Freehub applies a stricter match rule here: telecom brand presence alone is not enough. The prize or entry summary must support a data, bundle, SIM, router, fibre or connectivity competition angle.",
    ],
    checklist: [
      "Official source showing data or connectivity prize wording.",
      "Whether a recharge, purchase, SIM or app account is required.",
      "Bundle size, validity period and eligible networks.",
      "Closing date and reward timing.",
      "Privacy and marketing consent wording.",
      "Promoter terms, which override Freehub summaries.",
    ],
    faq: [
      {
        question: "Why are some telecom competitions not listed here?",
        answer:
          "A telecom brand alone does not make a data competition. The listing must clearly support data, bundle, SIM, router, fibre or connectivity prize intent.",
      },
      {
        question: "Are data competitions free to enter?",
        answer:
          "Some may be free entry, but others require a recharge, purchase, app account or qualifying transaction. Check the cost label and official terms.",
      },
      {
        question: "Can data prizes expire?",
        answer:
          "Yes. Data bundle validity depends on the promoter and network terms, so check expiry and usage rules before entering.",
      },
      {
        question: "Does Freehub provide the data bundle?",
        answer:
          "No. Freehub lists the competition and links to the official promoter source.",
      },
    ],
    relatedLinks: [
      { label: "Airtime competitions", href: "/win-airtime-competitions-south-africa/" },
      { label: "Tech competitions", href: "/category/tech/" },
      { label: "Voucher competitions", href: "/category/vouchers/" },
      { label: "Online competitions", href: "/online-competitions-south-africa/" },
    ],
    getMatchReasons: getDataVerticalMatchReasons,
  },
  {
    slug: "win-grocery-vouchers-south-africa",
    title: "Win Grocery Vouchers South Africa | Freehub",
    heading: "Win Grocery Vouchers in South Africa",
    description:
      "Browse live South African grocery voucher competitions with supermarket, basket, trolley and food voucher prizes where inventory qualifies.",
    intro:
      "Find current South African competitions where grocery vouchers, shopping vouchers, food vouchers, supermarket rewards, basket prizes or trolley-style prizes are clearly part of the offer. This page is only published when active verified listings create a useful search page. Freehub keeps the matching stricter than a general voucher category so users looking for grocery value do not land on unrelated voucher promotions.",
    support:
      "Grocery voucher pages need clear supermarket or food-shopping intent. Generic voucher competitions stay on the broader voucher category unless the listing supports grocery wording.",
    explainerHeading: "How grocery voucher competitions usually work",
    explainerParagraphs: [
      "Grocery voucher competitions often run through supermarkets, loyalty programmes, food brands, payment partners and shopping campaigns. Some are free entry, but many require a purchase, rewards-card swipe, app account, till slip or qualifying product.",
      "Check where the voucher can be redeemed, whether exclusions apply, how long it remains valid and whether winners receive a digital voucher, card, account credit or store-specific reward.",
    ],
    checklist: [
      "Official source showing grocery, supermarket or food voucher prize wording.",
      "Voucher value, redemption store and expiry rules.",
      "Purchase, till slip, loyalty-card or app requirements.",
      "Closing date and winner-contact process.",
      "Privacy and marketing consent wording.",
      "Promoter terms, which override Freehub summaries.",
    ],
    faq: [
      {
        question: "Are grocery voucher competitions different from voucher competitions?",
        answer:
          "Yes. This page focuses on supermarket, grocery, food voucher, basket or trolley prize intent. General voucher prizes remain in the broader voucher category.",
      },
      {
        question: "Do I need a till slip to win grocery vouchers?",
        answer:
          "Sometimes. Many grocery promotions require a qualifying purchase, receipt or loyalty-card swipe, but the official terms decide the entry requirement.",
      },
      {
        question: "Can grocery vouchers expire?",
        answer:
          "Yes. Check voucher validity, exclusions and redemption rules on the official promoter terms.",
      },
      {
        question: "Does Freehub issue grocery vouchers?",
        answer:
          "No. Freehub summarises listings and links to official promoter pages.",
      },
    ],
    relatedLinks: [
      { label: "Voucher competitions", href: "/category/vouchers/" },
      { label: "Supermarket competitions", href: "/supermarket-competitions-south-africa/" },
      { label: "Till slip competitions", href: "/till-slip-competitions-south-africa/" },
      { label: "Purchase required competitions", href: "/purchase-required-competitions/" },
    ],
    getMatchReasons: getGroceryVoucherVerticalMatchReasons,
  },
  {
    slug: "supermarket-competitions-south-africa",
    title: "Supermarket Competitions South Africa | Freehub",
    heading: "Supermarket Competitions in South Africa",
    description:
      "Browse live South African supermarket competitions from retailers, loyalty programmes and grocery campaigns with source links and cost labels.",
    intro:
      "Find current South African competitions linked to supermarkets, grocery retailers, loyalty programmes and store-based grocery campaigns. This page uses active published Freehub listings only, so users can compare the retailer, prize, closing date, entry route and purchase requirement before opening the official source. Supermarket competitions often involve rewards cards, till slips, qualifying products, app accounts, in-store purchases or digital shopping channels.",
    support:
      "Supermarket competitions can be valuable but often depend on store, product, receipt and loyalty rules. Check the participating retailer and official terms before buying anything to enter.",
    explainerHeading: "How supermarket competitions usually work",
    explainerParagraphs: [
      "Supermarket competitions in South Africa often come from grocery retailers, supplier partnerships, payment partners and loyalty programmes. A campaign may ask shoppers to buy a product, swipe a rewards card, upload a receipt, enter through an app or shop at a participating branch.",
      "Check whether the competition is national or limited to certain stores, provinces, channels or account holders. If a purchase is required, keep your receipt and confirm that the item or basket qualifies before entering.",
    ],
    checklist: [
      "Official retailer, supplier or campaign source.",
      "Participating stores, products, channels or loyalty programme rules.",
      "Purchase, till slip, app or rewards-card requirements.",
      "Closing date, draw date and winner-contact process.",
      "Privacy and marketing consent wording.",
      "Promoter terms, which override Freehub summaries.",
    ],
    faq: [
      {
        question: "Are supermarket competitions usually purchase-required?",
        answer:
          "Many are, but not all. Check the Freehub cost label and the official terms for product, minimum spend, loyalty-card or app requirements.",
      },
      {
        question: "Which supermarkets can appear on this page?",
        answer:
          "This page can include verified active listings linked to retailers such as SPAR, Checkers, Shoprite, Pick n Pay, Boxer, Woolworths, OK Foods, Food Lover's Market and similar grocery campaigns.",
      },
      {
        question: "Should I keep my till slip?",
        answer:
          "Yes, if a purchase or in-store action is involved. Promoters may need the original till slip to validate entries or prizes.",
      },
      {
        question: "Does Freehub run supermarket competitions?",
        answer:
          "No. Freehub lists public competitions and links users to official promoter pages.",
      },
    ],
    relatedLinks: [
      { label: "Grocery voucher competitions", href: "/win-grocery-vouchers-south-africa/" },
      { label: "Till slip competitions", href: "/till-slip-competitions-south-africa/" },
      { label: "Purchase required competitions", href: "/purchase-required-competitions/" },
      { label: "Voucher competitions", href: "/category/vouchers/" },
    ],
    getMatchReasons: getSupermarketVerticalMatchReasons,
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
  const noindexActiveCompetitions = shared.getNoindexActiveCompetitions(validCompetitions);
  const expiredArchiveCompetitions = uniqueCompetitionsBySlug(
    shared.getExpiredArchiveCompetitions([...validCompetitions, ...validArchiveCompetitions])
  );
  const expiredLowValueCompetitions = shared.getArchivedLowValueCompetitions(validCompetitions);
  const detailCompetitions = shared.sortCompetitions([
    ...activeCompetitions,
    ...noindexActiveCompetitions,
    ...expiredArchiveCompetitions,
    ...expiredLowValueCompetitions,
  ]);
  brandImageLookup = buildBrandImageLookup(activeCompetitions);
  const validCompetitionSlugs = new Set(detailCompetitions.map((competition) => shared.getCompetitionSlug(competition)));
  const outCompetitions = [...activeCompetitions, ...noindexActiveCompetitions];
  const validOutSlugs = new Set(outCompetitions.map((competition) => shared.getCompetitionSlug(competition)));
  removeStaleCompetitionDirectories(validCompetitionSlugs, validOutSlugs);
  const generatedBrandPages = shared.getGeneratedBrandPageDefinitions(activeCompetitions);
  const generatedBrandSlugs = generatedBrandPages.map((brandPage) => brandPage.slug);
  const verticalCoverage = getVerticalCoverage(activeCompetitions);
  generatedVerticalPagesForLinks = verticalCoverage
    .filter((entry) => entry.safeToPublish)
    .map((entry) => ({
      ...entry.definition,
      competitionCount: entry.matches.length,
      path: `/${entry.definition.slug}/`,
    }));
  writeVerticalCoverageReport(verticalCoverage);
  const routeContexts = getGeneratedRouteContexts(activeCompetitions, generatedBrandPages);
  removeStaleTagDirectories(routeContexts);
  removeStaleBrandDirectories(generatedBrandPages);
  removeStaleVerticalDirectories(generatedVerticalPagesForLinks);
  removeLegacyHomeDirectory();
  removeLegacyNestedSiteDirectory();

  fs.writeFileSync(path.join(ROOT_DIR, "index.html"), renderHomepage(activeCompetitions));
  fs.writeFileSync(path.join(ROOT_DIR, "404.html"), renderNotFoundPage());

  routeContexts.filter((routeContext) => routeContext.type !== "home").forEach((routeContext) => {
    const filteredCompetitions = getRouteCompetitions(activeCompetitions, routeContext);
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

  outCompetitions.forEach((competition) => {
    const html = renderOutPage(competition);
    const slug = shared.getCompetitionSlug(competition);
    const outputDirectory = path.join(ROOT_DIR, "out", slug);

    fs.mkdirSync(outputDirectory, { recursive: true });
    fs.writeFileSync(path.join(outputDirectory, "index.html"), html);
  });

  getPublicTrustPageDefinitions().forEach((page) => {
    const outputDirectory = path.join(ROOT_DIR, page.slug);

    fs.mkdirSync(outputDirectory, { recursive: true });
    fs.writeFileSync(path.join(outputDirectory, "index.html"), renderTrustPage(page));
  });

  writeContentPages(activeCompetitions);
  writeClubPages(activeCompetitions);
  writeReferAndWinPages();
  writeAdminPages();

  fs.writeFileSync(
    path.join(ROOT_DIR, "sitemap.xml"),
    generateSitemap(activeCompetitions, routeContexts, [...activeCompetitions, ...expiredArchiveCompetitions])
  );
  fs.writeFileSync(path.join(ROOT_DIR, "robots.txt"), renderRobotsTxt());
  runLifecycleStaticChecks(
    validCompetitions,
    activeCompetitions,
    noindexActiveCompetitions,
    expiredArchiveCompetitions,
    expiredLowValueCompetitions,
    routeContexts
  );
  runStaticSeoChecks(routeContexts);
  runCrawlerVisibleTextChecks(routeContexts);
  runGlobalCtaChecks(routeContexts);
  runImageQualityChecks(routeContexts);
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

function getPublicTrustPageDefinitions() {
  return TRUST_PAGE_DEFINITIONS.filter((page) => !VERTICAL_PAGE_SLUG_SET.has(page.slug));
}

function getVerticalCoverage(activeCompetitions) {
  return VERTICAL_PAGE_DEFINITIONS.map((definition) => {
    const matches = shared.sortCompetitions(
      activeCompetitions.filter((competition) => getVerticalMatchReasons(definition, competition).length > 0)
    );
    const minimumLiveCount = definition.minimumLiveCount || MIN_INDEXABLE_VERTICAL_COMPETITIONS;
    const safeToPublish = matches.length >= minimumLiveCount;

    return {
      definition,
      matches,
      minimumLiveCount,
      safeToPublish,
      heldReason: safeToPublish
        ? ""
        : `Only ${matches.length} active public match${matches.length === 1 ? "" : "es"}; requires ${minimumLiveCount}.`,
    };
  });
}

function getVerticalMatchReasons(definition, competition) {
  if (!definition || typeof definition.getMatchReasons !== "function") {
    return [];
  }

  return definition.getMatchReasons(competition).filter(Boolean);
}

function getRouteCompetitions(competitions, routeContext) {
  if (routeContext.type === "vertical") {
    return getVerticalPageCompetitions(competitions, routeContext.verticalPage);
  }

  return shared.filterCompetitionsByRoute(competitions, routeContext);
}

function getVerticalPageCompetitions(competitions, verticalPage) {
  return shared.sortCompetitions(
    shared
      .getPublishedActiveCompetitions(competitions)
      .filter((competition) => getVerticalMatchReasons(verticalPage, competition).length > 0)
  );
}

function getRoutePageCopy(routeContext) {
  if (routeContext.type === "vertical") {
    const verticalPage = routeContext.verticalPage;
    return {
      title: verticalPage.title,
      description: verticalPage.description,
      heading: verticalPage.heading,
      intro: verticalPage.intro,
      canonical: `${shared.CANONICAL_ORIGIN}/${verticalPage.slug}/`,
    };
  }

  return shared.getPageCopy(routeContext);
}

function getRouteSupportCopy(routeContext) {
  if (routeContext.type === "vertical") {
    return routeContext.verticalPage.support;
  }

  return shared.getPageSupportCopy(routeContext);
}

function buildRouteStructuredData(competitions, routeContext) {
  if (routeContext.type !== "vertical") {
    return shared.buildStructuredData(competitions, routeContext);
  }

  const pageCopy = getRoutePageCopy(routeContext);
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: pageCopy.heading,
    itemListElement: competitions.map((competition, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: shared.getCompetitionAbsoluteUrl(competition),
      name: competition.title,
      description: shared.buildCompetitionDescription(competition),
      image: competition.image || undefined,
    })),
  };
}

function writeVerticalCoverageReport(coverage) {
  const reportPath = path.join(ROOT_DIR, "reports", "vertical-page-coverage-report.md");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });

  const lines = [
    "# Vertical Page Coverage Report",
    "",
    `Generated: ${BUILD_DATE_ISO}`,
    "",
    "Only active, published, public-safe competitions are counted. Held, unverified, expired and doNotPublish records do not contribute to publication decisions.",
    "",
  ];

  coverage.forEach((entry) => {
    const { definition, matches, minimumLiveCount, safeToPublish, heldReason } = entry;
    lines.push(`## ${definition.heading}`);
    lines.push("");
    lines.push(`- URL: /${definition.slug}/`);
    lines.push(`- Matching active public competitions: ${matches.length}`);
    lines.push(`- Publication threshold: ${minimumLiveCount}`);
    lines.push(`- Safe to publish: ${safeToPublish ? "yes" : "no"}`);
    lines.push(`- Status: ${safeToPublish ? "indexable vertical page" : `held; ${heldReason}`}`);
    lines.push("");

    if (matches.length === 0) {
      lines.push("No active public matches were found.");
      lines.push("");
    } else {
      lines.push("| Competition | Closing date | Entry cost type | Source | Terms | Match reasons | Data notes |");
      lines.push("|---|---:|---|---|---|---|---|");
      matches.forEach((competition) => {
        const slug = shared.getCompetitionSlug(competition);
        const source = competition.sourceUrl ? "yes" : "missing";
        const terms = competition.termsUrl ? "yes" : "missing";
        const reasons = getVerticalMatchReasons(definition, competition).join("; ");
        const dataNotes = getVerticalDataNotes(definition, competition).join("; ") || "none";
        lines.push(
          `| ${escapeMarkdownTableCell(competition.title)} (${slug}) | ${escapeMarkdownTableCell(
            competition.closingDate || ""
          )} | ${escapeMarkdownTableCell(competition.entryCostType || "")} | ${source} | ${terms} | ${escapeMarkdownTableCell(
            reasons
          )} | ${escapeMarkdownTableCell(dataNotes)} |`
        );
      });
      lines.push("");
    }

    const recommendations = getVerticalRecommendations(definition, matches, safeToPublish);
    lines.push("Recommended normalisation:");
    recommendations.forEach((recommendation) => lines.push(`- ${recommendation}`));
    lines.push("");
  });

  fs.writeFileSync(reportPath, `${lines.join("\n")}\n`);
}

function getVerticalDataNotes(definition, competition) {
  const notes = [];
  const tags = getCompetitionTagSet(competition);
  const slug = definition.slug;

  if (!competition.sourceUrl) {
    notes.push("missing sourceUrl");
  }

  if (!competition.termsUrl) {
    notes.push("missing termsUrl");
  }

  if (slug === "sms-competitions-south-africa" && tags.has("sms-verification") && !tags.has("sms-entry")) {
    notes.push("SMS verification is not SMS entry");
  }

  if (slug === "till-slip-competitions-south-africa" && !hasAnyTag(tags, ["till-slip", "till-slip-required", "receipt"])) {
    notes.push("consider explicit till-slip or receipt tag if terms confirm");
  }

  if (slug === "win-airtime-competitions-south-africa" && !hasAnyTag(tags, ["airtime", "recharge-required"])) {
    notes.push("consider airtime or recharge tag if prize terms confirm");
  }

  if (slug === "win-data-competitions-south-africa" && !hasAnyTag(tags, ["data", "mobile-data", "connectivity"])) {
    notes.push("consider data/connectivity tag only if prize terms confirm");
  }

  if (slug === "win-grocery-vouchers-south-africa" && !hasAnyTag(tags, ["grocery", "groceries", "supermarket"])) {
    notes.push("consider grocery/supermarket tag only if prize terms confirm");
  }

  return notes;
}

function getVerticalRecommendations(definition, matches, safeToPublish) {
  const recommendations = [];

  if (!safeToPublish) {
    recommendations.push("Do not generate or sitemap this page until active verified inventory improves.");
  }

  if (definition.slug === "sms-competitions-south-africa") {
    recommendations.push("Separate sms-entry from sms-verification so account verification does not inflate SMS-entry inventory.");
  }

  if (definition.slug === "till-slip-competitions-south-africa") {
    recommendations.push("Use explicit till-slip, receipt or proof-of-purchase tags instead of relying on broad purchase-required matching.");
  }

  if (definition.slug === "win-data-competitions-south-africa") {
    recommendations.push("Only tag data when the prize or terms mention data bundles, SIM, fibre, router or connectivity rewards.");
  }

  if (definition.slug === "win-grocery-vouchers-south-africa") {
    recommendations.push("Keep grocery voucher intent separate from generic voucher competitions.");
  }

  if (matches.some((competition) => !competition.termsUrl)) {
    recommendations.push("Add termsUrl where official terms are available.");
  }

  if (recommendations.length === 0) {
    recommendations.push("Inventory is strong enough; keep lastChecked and source/terms links fresh.");
  }

  return recommendations;
}

function escapeMarkdownTableCell(value) {
  return String(value || "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ")
    .trim();
}

function getCompetitionTagSet(competition) {
  return new Set((competition.tags || []).map((tag) => String(tag).trim().toLowerCase()).filter(Boolean));
}

function getCompetitionVerticalText(competition) {
  return [
    competition.title,
    competition.brand,
    competition.category,
    competition.summary,
    competition.prize,
    competition.prizeName,
    competition.prizeDescription,
    competition.requiredProduct,
    competition.entryType,
    competition.entryChannel,
    competition.entryCostSummary,
    competition.howToEnter,
    competition.eligibilitySummary,
    Array.isArray(competition.entrySteps) ? competition.entrySteps.join(" ") : competition.entrySteps,
    Array.isArray(competition.tags) ? competition.tags.join(" ") : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getPrizeVerticalText(competition) {
  return [
    competition.title,
    competition.prize,
    competition.prizeName,
    competition.prizeDescription,
    Array.isArray(competition.tags) ? competition.tags.join(" ") : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function hasAnyTag(tags, values) {
  return values.some((value) => tags.has(value));
}

function getWhatsAppVerticalMatchReasons(competition) {
  const tags = getCompetitionTagSet(competition);
  const text = getCompetitionVerticalText(competition);
  const reasons = [];

  if (hasAnyTag(tags, ["whatsapp-entry", "whatsapp", "whatsapp-entry-method"])) {
    reasons.push("WhatsApp entry tag");
  }

  if (/\bwhats\s*app\b|\bwhatsapp\b/.test(text)) {
    reasons.push("WhatsApp mentioned in entry text");
  }

  return reasons;
}

function getSmsVerticalMatchReasons(competition) {
  const tags = getCompetitionTagSet(competition);
  const text = getCompetitionVerticalText(competition);
  const reasons = [];

  if (tags.has("sms-verification") && !tags.has("sms-entry")) {
    return [];
  }

  if (tags.has("sms-entry")) {
    reasons.push("SMS entry tag");
  }

  if (hasAnyTag(tags, ["sms", "standard-rates", "shortcode"]) && !tags.has("sms-verification")) {
    reasons.push("SMS or shortcode tag");
  }

  if (/\bsms\b|shortcode|short code/.test(text) && !/sms verification|verification sms|one-time pin|otp/i.test(text)) {
    reasons.push("SMS or shortcode mentioned in entry text");
  }

  return reasons;
}

function getTillSlipVerticalMatchReasons(competition) {
  const tags = getCompetitionTagSet(competition);
  const text = getCompetitionVerticalText(competition);
  const reasons = [];

  if (hasAnyTag(tags, ["till-slip", "till-slip-required", "receipt", "proof-of-purchase"])) {
    reasons.push("Till slip or receipt tag");
  }

  if (/\btill slip\b|receipt|invoice|proof of purchase|upload (your )?(slip|receipt)|keep (your )?(slip|receipt)/.test(text)) {
    reasons.push("Till slip or receipt mentioned in entry text");
  }

  return reasons;
}

function getOnlineVerticalMatchReasons(competition) {
  const tags = getCompetitionTagSet(competition);
  const text = getCompetitionVerticalText(competition);
  const reasons = [];

  if (tags.has("online-entry")) {
    reasons.push("Online entry tag");
  }

  if (/\bonline form\b|\bonline entry\b|\bwebsite entry\b|\bweb form\b|\bentry form\b|\bquiz\b|enter online/.test(text)) {
    reasons.push("Online entry mentioned in entry text");
  }

  return reasons;
}

function getAirtimeVerticalMatchReasons(competition) {
  const tags = getCompetitionTagSet(competition);
  const text = getPrizeVerticalText(competition);
  const reasons = [];

  if (tags.has("airtime")) {
    reasons.push("Airtime tag");
  }

  if (/\bairtime\b|\bprepaid\b|mobile voucher|voucher pin/.test(text)) {
    reasons.push("Airtime prize text");
  }

  return reasons;
}

function getDataVerticalMatchReasons(competition) {
  const tags = getCompetitionTagSet(competition);
  const text = getPrizeVerticalText(competition);
  const reasons = [];

  if (hasAnyTag(tags, ["data", "mobile-data", "connectivity", "fibre", "router"])) {
    reasons.push("Data or connectivity tag");
  }

  if (/\bmobile data\b|\bdata bundle\b|\bdata bundles\b|\b[0-9]+gb\b|\bgb data\b|\bconnectivity\b|\bsim\b|\bfibre\b|\brouter\b|smartphone with data/.test(text)) {
    reasons.push("Data or connectivity prize text");
  }

  return reasons;
}

function getGroceryVoucherVerticalMatchReasons(competition) {
  const tags = getCompetitionTagSet(competition);
  const text = getPrizeVerticalText(competition);
  const brand = String(competition.brand || "").toLowerCase();
  const hasVoucherIntent = /voucher|vouchers|shopping card|gift card|store card/.test(text);
  const foodRetailBrandPattern = /spar|checkers|shoprite|pick n pay|pnp|boxer|ok foods|food lover|food lovers|food lover's market|sixty60/;
  const hasGroceryIntent =
    hasAnyTag(tags, ["grocery", "groceries", "supermarket"]) ||
    foodRetailBrandPattern.test(brand) ||
    /grocery|groceries|supermarket|food voucher|shopping voucher|basket|trolley/.test(text);
  const reasons = [];

  if (hasVoucherIntent && hasGroceryIntent) {
    reasons.push("Grocery or supermarket voucher intent");
  }

  return reasons;
}

function getSupermarketVerticalMatchReasons(competition) {
  const tags = getCompetitionTagSet(competition);
  const text = getCompetitionVerticalText(competition);
  const brand = String(competition.brand || "").toLowerCase();
  const supermarketPattern =
    /spar|checkers|shoprite|pick n pay|pnp|boxer|woolworths|ok foods|food lover|food lovers|food lover's market|sixty60/;
  const reasons = [];

  if (supermarketPattern.test(brand)) {
    reasons.push("Supermarket brand or retail partner");
  }

  if (hasAnyTag(tags, ["supermarket", "grocery", "groceries"])) {
    reasons.push("Supermarket or grocery tag");
  }

  if (/supermarket|grocery|groceries|basket|trolley|xtra savings|smart shopper|spar rewards|boxer rewards|sixty60/.test(text)) {
    reasons.push("Supermarket or grocery entry text");
  }

  return reasons;
}

function getGeneratedRouteContexts(competitions, generatedBrandPages = []) {
  const categoryRouteContexts = shared.CATEGORY_SLUGS.map((slug) => ({
    type: "category",
    slug,
    path: `/category/${slug}/`,
  }));
  const activeTagRouteContexts = shared.TAG_SLUGS
    .filter((slug) => shared.getTagFilteredCompetitions(competitions, slug).length > 0)
    .map((slug) => {
      const path = `/tag/${slug}/`;
      const competitionCount = shared.getTagFilteredCompetitions(competitions, slug).length;
      const canonicalPath = DUPLICATE_TAG_CANONICAL_PATHS[slug] || path;

      return {
        type: "tag",
        slug,
        path,
        noindex: canonicalPath !== path || competitionCount < MIN_INDEXABLE_COLLECTION_COMPETITIONS,
        canonicalOverride: `${shared.CANONICAL_ORIGIN}${canonicalPath}`,
      };
    });
  const hubRouteContexts = shared.HUB_SLUGS.map((slug) => ({
    type: "hub",
    slug,
    path: `/${slug}/`,
    noindex: shared.getHubFilteredCompetitions(competitions, slug).length < MIN_INDEXABLE_COLLECTION_COMPETITIONS,
  }));
  const brandRouteContexts = generatedBrandPages.map((brandPage) => ({
    type: "brand",
    slug: brandPage.slug,
    path: brandPage.path,
  }));
  const verticalRouteContexts = generatedVerticalPagesForLinks.map((verticalPage) => ({
    type: "vertical",
    slug: verticalPage.slug,
    path: verticalPage.path,
    verticalPage,
  }));
  const brandIndexRouteContext = {
    type: "brand-index",
    slug: "brands",
    path: "/brands/",
    noindex: generatedBrandPages.length === 0,
  };

  return [
    { type: "home", slug: "", path: "/" },
    ...categoryRouteContexts,
    ...activeTagRouteContexts,
    ...hubRouteContexts,
    ...verticalRouteContexts,
    brandIndexRouteContext,
    ...brandRouteContexts,
  ];
}

function renderSiteFooter(options = {}) {
  const { includeAuthPanel = true } = options;
  const verticalLinksMarkup = generatedVerticalPagesForLinks
    .slice(0, 6)
    .map(
      (page) =>
        `<a href="${escapeAttribute(page.path)}">${escapeHtml(page.heading.replace(" in South Africa", ""))}</a>`
    )
    .join("\n              ");

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
              <a href="/how-to-spot-a-scam-competition/">Spot scam competitions</a>
              <a href="/legit-competitions-south-africa/">Legit competition guide</a>
              <a href="/competition-closing-date-checklist/">Closing date checklist</a>
              <a href="/competition-entry-cost-labels/">Entry cost labels</a>
              <a href="/app-competitions-south-africa/">App competitions</a>
              <a href="/fake-competition-winner-messages/">Fake winner messages</a>
              <a href="/purchase-required-competitions-explained/">Purchase required guide</a>
              <a href="/paid-entry-competitions-explained/">Paid entry guide</a>
              <a href="/free-stuff-south-africa/">Free stuff guide</a>
              <a href="/free-online-courses-south-africa/">Free online courses</a>
              <a href="/free-childrens-books-south-africa/">Free children's books</a>
              <a href="/free-credit-report-south-africa/">Free credit report</a>
              <a href="/submit-a-competition/">Submit a competition</a>
              <a href="/report-a-competition/">Report a competition</a>
              <a href="/freehub-account-benefits/">Account benefits</a>
              <a href="/club/">Freehub Club</a>
              <a href="/refer-and-win/">Refer &amp; Win</a>
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
              ${verticalLinksMarkup}
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
              <a href="${escapeAttribute(DATACOST_URL)}" target="_blank" rel="noopener noreferrer sponsored">DataCost.co.za</a>
            </nav>
            ${includeAuthPanel ? renderGlobalAuthPanel({ id: "footer", compact: true }) : ""}
          </div>
        </div>
      </footer>`;
}

function renderTopNavigation(options = {}) {
  const { active = "" } = options;
  const links = [
    { key: "home", label: "Home", href: "/" },
    { key: "competitions", label: "Competitions", href: "/competitions/" },
    { key: "ending", label: "Ending soon", href: "/competitions-ending-soon/" },
    { key: "whatsapp", label: "WhatsApp", href: WHATSAPP_CHANNEL_URL, target: "_blank", rel: "noopener noreferrer" },
    { key: "club", label: "Club", href: "/club/" },
  ];

  return `<a class="skip-link" href="#main-content">Skip to content</a>
      <header class="site-topbar" aria-label="Freehub navigation">
        <a class="site-topbar__brand" href="/" aria-label="Freehub home">
          <span class="site-topbar__mark" aria-hidden="true">FH</span>
          <span class="site-topbar__name">Freehub</span>
        </a>
        <nav class="site-topbar__nav" aria-label="Primary navigation">
          ${links
            .map((link) => {
              const className = [
                "site-topbar__link",
                link.key === "whatsapp" ? "site-topbar__link--whatsapp" : "",
                link.key === active ? "is-active" : "",
              ]
                .filter(Boolean)
                .join(" ");
              const current = link.key === active ? ` aria-current="page"` : "";
              const target = link.target ? ` target="${escapeAttribute(link.target)}"` : "";
              const rel = link.rel ? ` rel="${escapeAttribute(link.rel)}"` : "";
              return `<a class="${className}" href="${escapeAttribute(link.href)}"${current}${target}${rel}>${escapeHtml(link.label)}</a>`;
            })
            .join("\n          ")}
        </nav>
        <a class="site-topbar__account" href="/club/dashboard/" aria-label="Open Freehub Club account">
          <span class="site-topbar__account-icon" aria-hidden="true">FH</span>
          <span>Account</span>
        </a>
      </header>`;
}

function renderStatusPlaceholders() {
  return `<section id="loadingState" class="state-card state-card--hidden" aria-live="polite"></section>

        <section
          id="errorState"
          class="state-card state-card--hidden state-card--error"
          aria-live="assertive"
        ></section>`;
}

function writeClubPages(activeCompetitions = []) {
  [
    { slug: "club", html: renderClubLandingPage() },
    { slug: path.join("club", "dashboard"), html: renderClubDashboardPage(activeCompetitions) },
    { slug: path.join("club", "account"), html: renderClubAccountPage() },
  ].forEach((page) => {
    const outputDirectory = path.join(ROOT_DIR, page.slug);
    fs.mkdirSync(outputDirectory, { recursive: true });
    fs.writeFileSync(path.join(outputDirectory, "index.html"), page.html);
  });
}

function writeAdminPages() {
  [
    { slug: path.join("admin", "referrals"), html: renderReferralAdminPage() },
  ].forEach((page) => {
    const outputDirectory = path.join(ROOT_DIR, page.slug);
    fs.mkdirSync(outputDirectory, { recursive: true });
    fs.writeFileSync(path.join(outputDirectory, "index.html"), page.html);
  });
}

function writeReferAndWinPages() {
  [
    { slug: "refer-and-win", html: renderReferAndWinPage() },
    { slug: path.join("refer-and-win", "terms"), html: renderReferAndWinTermsPage() },
  ].forEach((page) => {
    const outputDirectory = path.join(ROOT_DIR, page.slug);
    fs.mkdirSync(outputDirectory, { recursive: true });
    fs.writeFileSync(path.join(outputDirectory, "index.html"), page.html);
  });
}

function getStylesheetHref(assetPath = "/") {
  return `${assetPath}styles.css?v=${CSS_ASSET_VERSION}`;
}

function renderGoogleTagManagerHead(contextExpression = "{}") {
  return `<!-- Google Tag Manager -->
    <script>
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(${contextExpression});
      function gtag(){dataLayer.push(arguments);}
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${GOOGLE_TAG_MANAGER_ID}');
    </script>
    <!-- End Google Tag Manager -->`;
}

function renderGoogleTagManagerNoScript() {
  return `<!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GOOGLE_TAG_MANAGER_ID}"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->`;
}

function renderMetaPixelHead() {
  return `<!-- Facebook Pixel Code -->
    <script>
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${META_PIXEL_ID}');
      fbq('track', 'PageView');
    </script>
    <!-- End Facebook Pixel Code -->`;
}

function renderMetaPixelNoScript() {
  return `<!-- Facebook Pixel Code (noscript) -->
    <noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1" alt="" /></noscript>
    <!-- End Facebook Pixel Code (noscript) -->`;
}

const CATEGORY_FALLBACK_STYLES = {
  Cash: { start: "#0f766e", end: "#14b8a6", accent: "#99f6e4" },
  Cars: { start: "#1d4ed8", end: "#60a5fa", accent: "#dbeafe" },
  Holidays: { start: "#c2410c", end: "#fb923c", accent: "#ffedd5" },
  Tech: { start: "#4338ca", end: "#818cf8", accent: "#e0e7ff" },
  Vouchers: { start: "#be123c", end: "#fb7185", accent: "#ffe4e6" },
  Sports: { start: "#047857", end: "#34d399", accent: "#d1fae5" },
  Lifestyle: { start: "#7c2d12", end: "#fb923c", accent: "#ffedd5" },
};
const CATEGORY_FALLBACK_IMAGES = {
  Cars: "https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1600&q=80",
  Cash: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=1600&q=80",
  Holidays: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
  Tech: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=80",
  Vouchers: "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=1600&q=80",
  Sports: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1600&q=80",
  Lifestyle: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1600&q=80",
};

function getCompetitionImageUrl(competition) {
  if (competition && competition.image) {
    return competition.image;
  }

  return getBrandAssociatedImage(competition) || buildBrandFallbackImage(competition || {});
}

function getMetadataImageUrl(competition) {
  if (competition && competition.image) {
    return competition.image;
  }

  const brandImage = getBrandAssociatedImage(competition);
  return brandImage || buildBrandFallbackImage(competition || {});
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

  const normalizedActions = actions.some((action) => action.href === WHATSAPP_CHANNEL_URL)
    ? actions
    : [
        ...actions,
        {
          label: "Follow on WhatsApp",
          href: WHATSAPP_CHANNEL_URL,
          className: "btn--whatsapp",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      ];

  return `<div class="hero__actions">
              ${normalizedActions
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
  const trustItems = flagship ? getFlagshipTrustItems(routeContext) : getCollectionTrustItems(routeContext, competitions);
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

  if (routeContext.type === "vertical") {
    actions.push({ label: "Entry Cost Guide", href: "/competition-entry-cost-labels/", className: "btn--secondary" });
  }

  return actions.slice(0, 3);
}

function getCollectionTrustItems(routeContext, competitions = []) {
  if (routeContext.type === "vertical") {
    return [`${competitions.length} live competitions`, "Official source links", "Freehub is not the promoter"];
  }

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

  if (routeContext.type === "vertical") {
    return {
      title: "Live Listings Watch",
      intro: "Current matches from active published Freehub data.",
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

function renderVerticalEditorial(routeContext) {
  if (routeContext.type !== "vertical") {
    return "";
  }

  const verticalPage = routeContext.verticalPage;
  const paragraphs = Array.isArray(verticalPage.explainerParagraphs) ? verticalPage.explainerParagraphs : [];

  return `<section class="seo-copy-block seo-copy-block--intro" aria-label="${escapeAttribute(verticalPage.explainerHeading)}">
          <h2 class="seo-copy-block__title">${escapeHtml(verticalPage.explainerHeading)}</h2>
          <div class="seo-copy-block__content hub-editorial">
            <section class="hub-editorial__section">
              ${paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n              ")}
              <p>Freehub summarises competitions and links to official promoter pages. Always confirm the final rules on the promoter's website.</p>
            </section>
          </div>
        </section>`;
}

function renderVerticalChecklist(routeContext) {
  if (routeContext.type !== "vertical") {
    return "";
  }

  const checklist = Array.isArray(routeContext.verticalPage.checklist) ? routeContext.verticalPage.checklist : [];

  if (checklist.length === 0) {
    return "";
  }

  return `<section class="seo-copy-block seo-copy-block--hub" aria-label="What to check before entering">
          <h2 class="seo-copy-block__title">What to check before entering</h2>
          <div class="seo-copy-block__content hub-editorial">
            <section class="hub-editorial__section">
              <ul class="hub-editorial__list">
                ${checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n                ")}
              </ul>
            </section>
          </div>
        </section>`;
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
              <p>If the cost route is unclear, the listing should not appear on this page. Browse the homepage for broader <a href="/">free giveaways South Africa</a> intent when you want to compare free-entry, purchase-required and account-linked promotions together.</p>
            </section>
            <section class="hub-editorial__section">
              <h3>Free entry vs purchase required</h3>
              <p>A purchase-required competition can still be legitimate, but it belongs on a different page because users must buy something, keep proof of purchase, swipe a loyalty card or meet a spend threshold. Free-entry listings should not require those actions.</p>
              <p>Compare purchase mechanics separately on <a href="/purchase-required-competitions/">purchase required competitions</a>, scan urgent deadlines on <a href="/competitions-ending-soon/">competitions ending soon</a>, or return to <a href="/">all giveaways and competitions</a> when you are not filtering by entry cost.</p>
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

function renderVoucherIntentSection(routeContext, competitions) {
  if (routeContext.type !== "category" || routeContext.slug !== "vouchers") {
    return "";
  }

  const lower = (value) => String(value || "").toLowerCase();
  const haystack = (competition) =>
    [
      competition.title,
      competition.brand,
      competition.summary,
      competition.prizeName,
      competition.prizeContext,
      competition.seoContext,
      Array.isArray(competition.tags) ? competition.tags.join(" ") : "",
    ]
      .map(lower)
      .join(" ");
  const countMatching = (patterns) =>
    competitions.filter((competition) => patterns.some((pattern) => pattern.test(haystack(competition)))).length;
  const getTags = (competition) => Array.isArray(competition.tags) ? competition.tags.map(lower) : [];
  const freeEntryCount = competitions.filter((competition) => {
    const entryCostType = lower(competition.entryCostType);
    const tags = getTags(competition);
    return entryCostType === "free-entry" || tags.includes("free-entry");
  }).length;
  const purchaseRequiredCount = competitions.filter((competition) => {
    const entryCostType = lower(competition.entryCostType);
    const tags = getTags(competition);
    return competition.purchaseRequired === true || entryCostType === "purchase-required" || tags.includes("purchase-required");
  }).length;
  const endingSoonCount = competitions.filter((competition) => {
    const daysUntilClosing = shared.getDaysUntilClosing(competition.closingDate);
    return Number.isFinite(daysUntilClosing) && daysUntilClosing >= 0 && daysUntilClosing <= shared.ENDING_SOON_TAG_DAYS;
  }).length;
  const shortcutLinks = [
    { label: "Grocery voucher competitions", href: "/win-grocery-vouchers-south-africa/", count: countMatching([/grocery|groceries|supermarket|shoprite|checkers|spar|basket|trolley/]) },
    { label: "Airtime voucher competitions", href: "/win-airtime-competitions-south-africa/", count: countMatching([/airtime|recharge|prepaid/]) },
    { label: "Data voucher competitions", href: "/win-data-competitions-south-africa/", count: countMatching([/\bdata\b|bundle|mobile data/]) },
    { label: "Free-entry voucher listings", href: "/free-competitions/", count: freeEntryCount },
    { label: "Purchase-required voucher listings", href: "/purchase-required-competitions/", count: purchaseRequiredCount },
    { label: "Ending-soon voucher prizes", href: "/competitions-ending-soon/", count: endingSoonCount },
  ];
  const typeCards = [
    {
      title: "Shopping and grocery vouchers",
      text: "Check the redemption store, voucher value, expiry rules and whether a rewards card, till slip or minimum spend is required.",
    },
    {
      title: "Fuel, airtime and data vouchers",
      text: "Confirm the network, redemption channel, mobile-number rules and whether standard SMS, USSD or data costs apply.",
    },
    {
      title: "Online and retail gift cards",
      text: "Look for official terms covering exclusions, delivery method, expiry date and whether the voucher can be transferred or converted to cash.",
    },
  ];

  return `<section class="seo-copy-block seo-copy-block--category" aria-label="Voucher competition shortcuts">
          <h2 class="seo-copy-block__title">Find the right voucher giveaway faster</h2>
          <div class="seo-copy-block__content hub-editorial">
            <section class="hub-editorial__section">
              <h3>Voucher shortcuts</h3>
              <p>Voucher searches are not all the same. Use these routes to separate grocery vouchers, shopping vouchers, fuel rewards, airtime or data prizes, free-entry draws and purchase-required campaigns before opening a listing.</p>
              <div class="popular-searches__links">
                ${shortcutLinks
                  .map(
                    (link) => `<a class="popular-searches__link" href="${escapeAttribute(link.href)}">${escapeHtml(link.label)}${link.count ? ` (${link.count})` : ""}</a>`
                  )
                  .join("\n                ")}
              </div>
            </section>
            <section class="hub-editorial__section">
              <h3>Voucher prize types to compare</h3>
              <div class="info-strip info-strip--inline">
                ${typeCards
                  .map(
                    (card) => `<div>
                  <p class="info-strip__label">${escapeHtml(card.title)}</p>
                  <p class="info-strip__text">${escapeHtml(card.text)}</p>
                </div>`
                  )
                  .join("\n                ")}
              </div>
            </section>
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
      title: "How to compare free voucher giveaways",
      sections: [
        {
          heading: "What voucher giveaways are",
          paragraphs: [
            `Voucher competitions are prize draws or giveaways where the reward is a voucher, gift card, credit, store spend, airtime, data, fuel value or similar redeemable reward. This page currently groups ${escapeHtml(liveCopy)} for users searching voucher competitions South Africa, free voucher giveaway and free vouchers South Africa intent.`,
            "Common voucher prize types include grocery vouchers, supermarket vouchers, online shopping vouchers, retail gift cards, beauty vouchers, restaurant or food vouchers, fuel vouchers and airtime or data vouchers where the active listing supports that prize type.",
            `If you want broader giveaway discovery first, compare the <a href="/">Freehub homepage</a>. If you want a tighter voucher-only route, stay on this hub, use the voucher shortcuts above and open verified listing cards below.`,
          ],
        },
        {
          heading: "Free entry and purchase-required entries",
          paragraphs: [
            "Voucher giveaways can be free entry, purchase required, paid entry, account required, app required, rewards card required, till slip required, WhatsApp entry, online entry or in-store entry. Check the label on each card before opening the promoter page.",
            `If you only want no-cost routes, compare <a href="/free-competitions/">free competitions</a>. If a listing needs a qualifying product, receipt, rewards-card swipe, app action or minimum spend, compare it with <a href="/purchase-required-competitions/">purchase required competitions</a>.`,
          ],
        },
        {
          heading: "Voucher value and redemption rules",
          paragraphs: [
            "Read the official terms for the voucher value, expiry date, redemption rules, participating stores, exclusions, delivery method, draw date, winner-contact process and whether the voucher can be split, transferred or converted to cash.",
            "For grocery, fuel, airtime and data vouchers, check whether the reward is a physical card, digital voucher, account credit, app reward, recharge PIN or network-specific bundle before entering.",
          ],
        },
        {
          heading: "Retail and online voucher wording",
          paragraphs: [
            "Where an active verified partner campaign offers a named retail or online-shopping voucher, Freehub describes the prize and keeps the promoter separate. Held, unverified or unclear voucher records should not be used to target generic voucher searches.",
            `For urgent options, also compare <a href="/competitions-ending-soon/">competitions ending soon</a>, <a href="/competitions/">all current competitions</a>, <a href="/win-a-car/">win-a-car competitions</a>, <a href="/category/cash/">cash competitions</a>, <a href="/category/tech/">tech competitions</a> and <a href="/category/holidays/">holiday competitions</a>.`,
          ],
        },
        {
          heading: "Voucher giveaway safety",
          paragraphs: [
            "Do not pay unofficial winner, courier, delivery, admin or release fees to claim a voucher prize. Verify prize messages through the promoter's official website, social page, app or support channel before sharing personal information.",
            "Be careful with copied social posts, survey-wall pages and messages that claim every visitor has already won a voucher. A real Freehub listing should point back to an official promoter source or clear terms.",
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
  if (routeContext.type === "vertical") {
    return Array.isArray(routeContext.verticalPage.faq) ? routeContext.verticalPage.faq : [];
  }

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
        question: "Where can I find free voucher giveaways today?",
        answer:
          "Start with this voucher hub when you specifically want voucher prizes, gift cards or store-credit giveaways. If your search intent is broader, compare the Freehub homepage for current giveaways across vouchers, cash, cars and free-entry routes.",
      },
      {
        question: "What types of vouchers can I win?",
        answer:
          "Voucher prizes can include shopping, grocery, retail, beauty, food, fuel, airtime, data, online shopping and partner campaign Takealot voucher prizes where the active source supports the listing.",
      },
      {
        question: "How do I find grocery or supermarket voucher competitions?",
        answer:
          "Use the grocery voucher route when you specifically want supermarket, shopping basket, food voucher or store-card prizes. Broader retail and online voucher prizes remain on the main voucher competitions page.",
      },
      {
        question: "Are airtime and data vouchers included?",
        answer:
          "Yes, when the active listing supports it. Airtime and data voucher competitions may involve mobile networks, app rewards, recharge mechanics, USSD, SMS or retailer campaigns, so always check the official terms and any standard network costs.",
      },
      {
        question: "Are Takealot voucher competitions listed on Freehub?",
        answer:
          "Freehub may list active verified partner campaigns offering Takealot voucher prizes. We do not describe partner promotions as Takealot-run campaigns unless an official source clearly supports that wording.",
      },
      {
        question: "Which voucher competitions should I enter first?",
        answer:
          "Start with voucher competitions that are closing soon, then compare high-value prizes and free-entry routes. Check the voucher amount, expiry date, redemption store, entry cost and promoter before leaving Freehub.",
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
  if (routeContext.type === "vertical") {
    return `${routeContext.verticalPage.heading} FAQ`;
  }

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
  const pageCopy = getRoutePageCopy(routeContext);
  const canonicalUrl = routeContext.canonicalOverride || pageCopy.canonical;
  const robotsDirective = routeContext.noindex === true
    ? "noindex, follow"
    : "index, follow, max-image-preview:large";
  const supportCopy = getRouteSupportCopy(routeContext);
  const structuredData = buildRouteStructuredData(competitions, routeContext);
  const ogImage = getCollectionMetadataImageUrl(competitions);
  const isCollectionPage = ["category", "tag", "hub", "brand", "vertical"].includes(routeContext.type);
  const collectionPageStructuredData =
    isCollectionPage
      ? {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: pageCopy.heading,
          description: pageCopy.description,
          url: canonicalUrl,
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
            { "@type": "ListItem", position: 2, name: pageCopy.heading, item: canonicalUrl },
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
    <meta name="robots" content="${robotsDirective}" />
    <link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeAttribute(pageCopy.title)}" />
    <meta property="og:description" content="${escapeAttribute(pageCopy.description)}" />
    <meta property="og:url" content="${escapeAttribute(canonicalUrl)}" />
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
    <link rel="stylesheet" href="${escapeAttribute(getStylesheetHref(RELATIVE_ASSET_PATH))}" />
    ${ADSENSE_SCRIPT}
    ${renderGoogleTagManagerHead(`{ page_type: '${routeContext.type}'${routeContext.type === "hub" ? `, hub_slug: '${routeContext.slug}'` : ""}${routeContext.type === "brand" ? `, brand_slug: '${routeContext.slug}'` : ""} }`)}
    ${renderMetaPixelHead()}
  </head>
  <body>
    ${renderGoogleTagManagerNoScript()}
    ${renderMetaPixelNoScript()}
    <div class="site-shell">
      ${renderTopNavigation({ active: "competitions" })}
      ${renderCollectionHero(routeContext, pageCopy, competitions)}

      <main id="main-content" class="main-content">
        ${isCollectionPage ? renderCollectionBreadcrumb(pageCopy.heading) : ""}

        ${renderSupportSection(supportCopy)}
        ${renderHubIntroEditorial(routeContext)}
        ${renderVerticalEditorial(routeContext)}

        <nav class="category-nav" aria-label="Competition categories">
          ${CATEGORY_LINKS.map((link) => renderNavLink(link, routeContext.path)).join("\n          ")}
        </nav>

        <section class="popular-searches" aria-label="Popular searches">
          <p class="popular-searches__title">Popular Searches</p>
          <div class="popular-searches__links">
            ${TAG_LINKS.map((link) => renderPopularLink(link, routeContext.path)).join("\n            ")}
          </div>
        </section>

        ${renderVoucherIntentSection(routeContext, competitions)}
        ${renderInternalLinksSection(routeContext, competitions)}
        ${routeContext.type === "hub" && ["competitions", "free-competitions", "win-a-car"].includes(routeContext.slug) ? renderVerticalDiscoveryLinks() : ""}
        ${renderHubSupportLinks(routeContext, competitions)}
        ${renderDeadlineBuckets(routeContext, competitions)}
        ${renderWhatsAppChannelCta(routeContext)}
        ${renderDatacostPromo({
          placement: `${routeContext.type}-${routeContext.slug || "index"}`,
          compact: routeContext.type === "tag",
          ussd: ["sms-competitions-south-africa", "win-airtime-competitions-south-africa", "win-data-competitions-south-africa"].includes(routeContext.slug),
        })}

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
        ${renderVerticalChecklist(routeContext)}
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
    <script type="module" src="${RELATIVE_ASSET_PATH}shared/auth-ui.js"></script>
  </body>
</html>
`;
}

function renderBrandIndexPage(brandPages) {
  const pageCopy = shared.BRAND_INDEX_COPY;
  const hasBrandPages = brandPages.length > 0;
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
  const brandIndexBodyMarkup = hasBrandPages
    ? `<section class="internal-links" id="brandPages" aria-label="Generated brand pages">
          <p class="internal-links__title">Brands with active competition pages</p>
          <div class="internal-links__list">
            ${brandLinksMarkup}
          </div>
        </section>`
    : `<section class="state-card" id="brandPages" aria-label="Brand page status">
          <p class="state-card__title">No brand pages qualify right now</p>
          <p class="state-card__text">Freehub only indexes brand pages when a brand has enough active published competitions to make the page useful. Use the current competition hubs below until enough strong brand clusters qualify.</p>
        </section>`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(pageCopy.title)}</title>
    <meta name="description" content="${escapeAttribute(pageCopy.description)}" />
    <meta name="robots" content="${hasBrandPages ? "index, follow, max-image-preview:large" : "noindex, follow"}" />
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
    <link rel="stylesheet" href="${escapeAttribute(getStylesheetHref(RELATIVE_ASSET_PATH))}" />
    ${ADSENSE_SCRIPT}
    ${renderGoogleTagManagerHead("{ page_type: 'brand-index' }")}
    ${renderMetaPixelHead()}
  </head>
  <body>
    ${renderGoogleTagManagerNoScript()}
    ${renderMetaPixelNoScript()}
    <div class="site-shell">
      ${renderTopNavigation({ active: "competitions" })}
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

      <main id="main-content" class="main-content">
        ${renderCollectionBreadcrumb(pageCopy.heading)}
        ${renderSupportSection(pageCopy.support)}

        ${brandIndexBodyMarkup}

        <section class="state-card" aria-label="About brand pages">
          <p class="state-card__title">Why these brands appear</p>
          <p class="state-card__text">Freehub only creates brand pages when there are at least ${shared.BRAND_PAGE_MIN_COMPETITIONS} active published competitions for that brand. This keeps brand pages useful and avoids thin listings.</p>
        </section>

        ${renderDatacostPromo({ placement: "brand-index", compact: true })}

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
    <script type="module" src="/shared/auth-ui.js"></script>
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

  return buildBrandFallbackImage(competition || {});
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

function renderCardStatusBadges(competition, options = {}) {
  const { expired = false } = options;
  const labels = expired ? ["Closed", "Verified"] : shared.getCardStatusLabels(competition);

  return labels
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
  )}" data-competition-brand="${escapeAttribute(competition.brand || "")}" data-competition-closing-date="${escapeAttribute(
    competition.closingDate || ""
  )}" data-competition-path="${escapeAttribute(internalPath)}">
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
                <div class="competition-card__actions">
                  <button
                    class="competition-card__ignore"
                    type="button"
                    data-auth-action="ignore"
                    data-competition-id="${escapeAttribute(shared.getCompetitionSlug(competition))}"
                    data-competition-title="${escapeAttribute(competition.title)}"
                    data-competition-category="${escapeAttribute(competition.category)}"
                    data-competition-brand="${escapeAttribute(competition.brand || "")}"
                    data-competition-closing-date="${escapeAttribute(competition.closingDate || "")}"
                    data-competition-path="${escapeAttribute(internalPath)}"
                    aria-pressed="false"
                  >Hide</button>
                </div>
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

function renderDatacostPromo(options = {}) {
  const {
    placement = "sitewide",
    compact = false,
    ussd = false,
    heading = ussd ? "No data? Keep useful USSD codes close" : "Compare data and airtime deals before you spend",
    text = ussd
      ? "DataCost keeps South African network USSD codes in one place for balance checks, airtime, data and quick mobile actions."
      : "DataCost.co.za helps you compare mobile data and airtime deals across South African networks, with quick links for everyday mobile savings.",
    cta = ussd ? "Open USSD Codes" : "Visit DataCost.co.za",
  } = options;
  const href = ussd ? DATACOST_USSD_URL : DATACOST_URL;
  const className = compact ? "datacost-promo datacost-promo--compact" : "datacost-promo";
  const promoId = `datacost-promo-${String(placement).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

  return `<section class="${className}" id="${escapeAttribute(promoId)}" aria-label="DataCost partner recommendation" data-placement="${escapeAttribute(
    placement
  )}">
          <a class="datacost-promo__media" href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer sponsored" aria-label="${escapeAttribute(cta)}">
            <img src="${escapeAttribute(DATACOST_BANNER_IMAGE)}" alt="DataCost.co.za data and airtime deals preview" loading="lazy" />
          </a>
          <div class="datacost-promo__body">
            <p class="datacost-promo__label">Freehub partner</p>
            <h2 class="datacost-promo__title">${escapeHtml(heading)}</h2>
            <p class="datacost-promo__text">${escapeHtml(text)}</p>
            <a class="datacost-promo__cta" href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer sponsored">${escapeHtml(cta)}</a>
          </div>
        </section>`;
}

function isTelecomOrMobileCompetition(competition) {
  const tags = Array.isArray(competition && competition.tags) ? competition.tags.join(" ") : "";
  const searchableText = [
    competition && competition.title,
    competition && competition.summary,
    competition && competition.prizeName,
    competition && competition.entryType,
    competition && competition.entryChannel,
    competition && competition.entryFeeLabel,
    tags,
  ]
    .join(" ")
    .toLowerCase();

  return /\b(data|airtime|ussd|sms|whatsapp|mtn|vodacom|telkom|cell c|mobile|sim|recharge)\b/.test(searchableText);
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
      : routeContext.type === "vertical"
        ? getVerticalInternalLinks(routeContext.verticalPage)
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
            ${filterPublishedInternalLinks(section.links, routeContext.slug)
              .map(
                (link) =>
                  `<a class="internal-links__link" href="${escapeAttribute(link.href)}">${escapeHtml(link.label)}</a>`
              )
              .join("\n            ")}
          </div>
        </section>`;
}

function getVerticalInternalLinks(verticalPage) {
  const relatedLinks = Array.isArray(verticalPage.relatedLinks) ? verticalPage.relatedLinks : [];
  const baselineLinks = [
    { label: "All competitions", href: "/competitions/" },
    { label: "Free competitions", href: "/free-competitions/" },
    { label: "Competitions ending soon", href: "/competitions-ending-soon/" },
    { label: "How to enter safely", href: "/how-to-enter-competitions-safely/" },
  ];

  return {
    title: "Related Competition Searches",
    links: filterPublishedInternalLinks([...relatedLinks, ...baselineLinks], verticalPage.slug),
  };
}

function filterPublishedInternalLinks(links, currentSlug = "") {
  const publishedVerticalSlugs = new Set(generatedVerticalPagesForLinks.map((page) => page.slug));

  return links.filter((link) => {
    const match = String(link.href || "").match(/^\/([a-z0-9-]+)\/$/);

    if (!match) {
      return true;
    }

    const slug = match[1];
    if (slug === currentSlug) {
      return false;
    }

    if (VERTICAL_PAGE_SLUG_SET.has(slug)) {
      return publishedVerticalSlugs.has(slug);
    }

    return true;
  });
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
            ${filterPublishedInternalLinks(section.links, routeContext.slug)
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
      { label: "How to spot scam competitions", href: "/how-to-spot-a-scam-competition/" },
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
      { label: "How to spot scam competitions", href: "/how-to-spot-a-scam-competition/" },
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
      { label: "How to spot scam competitions", href: "/how-to-spot-a-scam-competition/" },
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
      { label: "How to spot scam competitions", href: "/how-to-spot-a-scam-competition/" },
    ],
    "paid-entry-competitions": [
      { label: "Browse competition brands", href: "/brands/" },
      { label: "Paid entry guide", href: "/paid-entry-competitions-explained/" },
      { label: "Free competitions", href: "/free-competitions/" },
      { label: "Purchase required competitions", href: "/purchase-required-competitions/" },
      { label: "How to enter safely", href: "/how-to-enter-competitions-safely/" },
      { label: "How to spot scam competitions", href: "/how-to-spot-a-scam-competition/" },
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
    const knorrPath = byIdPathOrNull("knorr-win-r5000-weekly-2026");
    const clerePath = byIdPathOrNull("clere-share-of-r1-million-cash-2026");
    return {
      title: "Cash Competition Searches",
      links: [
        { label: "Cash competitions South Africa", href: "/category/cash/" },
        ...(knorrPath ? [{ label: "Knorr competition 2026", href: knorrPath }] : []),
        ...(clerePath ? [{ label: "Clere competition 2026", href: clerePath }] : []),
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
      title: "Voucher Giveaway Searches",
      links: [
        { label: "Voucher competitions South Africa", href: "/category/vouchers/" },
        { label: "Free voucher giveaways", href: "/category/vouchers/" },
        { label: "Grocery voucher competitions", href: "/win-grocery-vouchers-south-africa/" },
        { label: "Airtime voucher competitions", href: "/win-airtime-competitions-south-africa/" },
        { label: "Data voucher competitions", href: "/win-data-competitions-south-africa/" },
        { label: "Free giveaways South Africa today", href: "/" },
        { label: "Where to get free samples", href: "/free-samples-south-africa/" },
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

  if (routeContext.type === "category") {
    const categoryLabel = routeContext.slug.replace(/-/g, " ");
    return {
      title: `No verified ${categoryLabel} competitions right now`,
      text: `There are no verified ${categoryLabel} competitions listed right now. Check all current competitions or come back soon for new listings.`,
    };
  }

  if (routeContext.type === "hub") {
    const hubLabel = routeContext.slug.replace(/-/g, " ");
    return {
      title: `No verified ${hubLabel} right now`,
      text: `There are no verified listings on this hub right now. Use the related pages to browse current published competitions.`,
    };
  }

  return {
    title: "No verified competitions right now",
    text: "There are no verified competitions listed here right now. Check all current competitions or come back soon for new listings.",
  };
}

function renderCollectionEmptyState(routeContext, competitions) {
  if (competitions.length > 0) {
    return `<div id="emptyState" class="state-card state-card--hidden" aria-live="polite"></div>`;
  }

  const state = getCollectionEmptyState(routeContext);

  return `<div id="emptyState" class="state-card" aria-live="polite">
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

function renderGlobalAuthPanel(options = {}) {
  const {
    id = "global",
    compact = false,
    title = "Get Freehub email alerts",
    text = "Sign in with Google or an email link to save alert preferences. Browsing and entry links stay open.",
  } = options;
  const className = compact
    ? "competition-auth competition-auth--global competition-auth--compact"
    : "competition-auth competition-auth--global";

  return `<section
          class="${className}"
          data-freehub-auth
          data-auth-context="${escapeAttribute(id)}"
          data-auth-default-action="alerts"
          data-auth-signed-out-text="${escapeAttribute(text)}"
          aria-label="Optional Freehub email alerts"
          hidden
        >
          <div class="competition-auth__copy">
            <p class="competition-auth__title">${escapeHtml(title)}</p>
            <p class="competition-auth__text" data-auth-user>${escapeHtml(text)}</p>
          </div>
          <div class="competition-auth__actions">
            <button class="competition-auth__button" type="button" data-auth-action="alerts">Get email alerts</button>
            <button class="competition-auth__link" type="button" data-auth-action="signin">Sign in</button>
            <button class="competition-auth__link" type="button" data-auth-action="signout" hidden>Sign out</button>
          </div>
          <p class="competition-auth__status" data-auth-status aria-live="polite"></p>
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

function hasHomepageReadyData(competition) {
  return Boolean(
    competition &&
      (competition.sourceUrl || competition.url) &&
      (competition.termsUrl || competition.sourceUrl || competition.url) &&
      competition.closingDate &&
      competition.entryFeeLabel &&
      competition.category
  );
}

function compareHomepageCandidateScore(left, right) {
  const leftScore =
    (hasHomepageReadyData(left) ? 20 : 0) +
    (shared.isHighValueCompetition(left) ? 10 : 0) +
    (left.image ? 3 : 0) +
    (left.termsUrl ? 2 : 0);
  const rightScore =
    (hasHomepageReadyData(right) ? 20 : 0) +
    (shared.isHighValueCompetition(right) ? 10 : 0) +
    (right.image ? 3 : 0) +
    (right.termsUrl ? 2 : 0);

  if (rightScore !== leftScore) {
    return rightScore - leftScore;
  }

  return new Date(left.closingDate) - new Date(right.closingDate);
}

function getHomepageTopPicks(competitions) {
  const selectedSlugs = new Set();
  const pick = (candidates) => {
    const winner = candidates
      .filter(hasHomepageReadyData)
      .filter((competition) => !selectedSlugs.has(shared.getCompetitionSlug(competition)))
      .slice()
      .sort(compareHomepageCandidateScore)[0];

    if (winner) {
      selectedSlugs.add(shared.getCompetitionSlug(winner));
    }

    return winner;
  };

  return [
    {
      label: "Best free-entry pick",
      competition: pick(competitions.filter((competition) => shared.getEntryCostLabel(competition) === "Free entry")),
    },
    {
      label: "Best high-value pick",
      competition: pick(competitions.filter((competition) => shared.isHighValueCompetition(competition))),
    },
    {
      label: "Closing soon pick",
      competition: pick(competitions.filter((competition) => shared.isClosingWithinDays(competition.closingDate, 14))),
    },
  ].filter((entry) => entry.competition);
}

function excludeCompetitionsBySlug(competitions, excludedSlugs, limit) {
  return competitions
    .filter((competition) => !excludedSlugs.has(shared.getCompetitionSlug(competition)))
    .slice(0, limit);
}

function renderTopPicksSection(topPicks) {
  if (topPicks.length === 0) {
    return "";
  }

  return `<section class="home-section home-section--top-picks" aria-label="Today's top competition picks">
          <div class="home-section__header">
            <div>
              <p class="section-kicker">Today's Top Picks</p>
              <h2 class="home-section__title">Open these first</h2>
            </div>
            <a class="home-section__link" href="/competitions/">View all live competitions</a>
          </div>
          <div class="top-picks-grid">
            ${topPicks.map((entry) => renderTopPickCard(entry)).join("\n            ")}
          </div>
        </section>`;
}

function renderTopPickCard(entry) {
  const competition = entry.competition;
  const href = shared.getCompetitionPath(competition);
  const imageUrl = getCompetitionVisualUrl(competition);
  const imageMarkup = imageUrl
    ? `<img src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(competition.title)}" loading="lazy" onerror="this.remove()" />`
    : "";

  return `<article class="top-pick-card">
              <a class="top-pick-card__media" href="${escapeAttribute(href)}" aria-label="${escapeAttribute(competition.title)} - view details">
                ${renderCompetitionVisualPlaceholder(competition, "top-pick-card__placeholder")}
                ${imageMarkup}
              </a>
              <div class="top-pick-card__body">
                <p class="top-pick-card__label">${escapeHtml(entry.label)}</p>
                <h3 class="top-pick-card__title"><a href="${escapeAttribute(href)}">${escapeHtml(shared.getCardHeadline(competition))}</a></h3>
                <div class="top-pick-card__meta">
                  <span>${escapeHtml(competition.brand || "Official promoter")}</span>
                  <span>${escapeHtml(shared.getEntryCostLabel(competition))}</span>
                  <span>${escapeHtml(shared.getUrgencyLabel(competition.closingDate))}</span>
                </div>
                <a class="top-pick-card__cta" href="${escapeAttribute(href)}">View details</a>
              </div>
            </article>`;
}

function renderIntentTilesSection() {
  const intentLinks = [
    { label: "Win a car", href: "/win-a-car/", text: "Vehicle prizes and car-focused campaigns" },
    { label: "Free entry", href: "/free-competitions/", text: "No-purchase listings from verified sources" },
    { label: "Ending soon", href: "/competitions-ending-soon/", text: "Deadlines to check before they close" },
    { label: "WhatsApp", href: "/whatsapp-competitions-south-africa/", text: "Mobile-entry campaigns and till-slip routes" },
    { label: "Till slip", href: "/till-slip-competitions-south-africa/", text: "Receipt and purchase-proof promotions" },
    { label: "Cash prizes", href: "/category/cash/", text: "Money prizes with clear cost labels" },
  ];

  return `<section class="home-section home-section--intent" aria-label="Browse competitions by intent">
          <div class="home-section__header">
            <div>
              <p class="section-kicker">Browse by Intent</p>
              <h2 class="home-section__title">Choose the route that fits today</h2>
            </div>
          </div>
          <div class="intent-tile-grid">
            ${intentLinks
              .map(
                (link) => `<a class="intent-tile" href="${escapeAttribute(link.href)}">
                  <span class="intent-tile__label">${escapeHtml(link.label)}</span>
                  <span class="intent-tile__text">${escapeHtml(link.text)}</span>
                </a>`
              )
              .join("\n            ")}
          </div>
        </section>`;
}

function renderLatestRowsSection(competitions) {
  if (competitions.length === 0) {
    return "";
  }

  return `<section class="home-section home-section--latest-rows" aria-label="Latest checked competitions">
          <div class="home-section__header">
            <div>
              <p class="section-kicker">Latest Added</p>
              <h2 class="home-section__title">Recently checked competitions</h2>
            </div>
            <a class="home-section__link" href="/new-competitions-south-africa/">View new competitions</a>
          </div>
          <div class="latest-rows">
            ${competitions.map(renderLatestCompetitionRow).join("\n            ")}
          </div>
        </section>`;
}

function renderLatestCompetitionRow(competition) {
  return `<a class="latest-row" href="${escapeAttribute(shared.getCompetitionPath(competition))}">
              <span class="latest-row__title">${escapeHtml(competition.title)}</span>
              <span class="latest-row__meta">${escapeHtml(shared.getEntryCostLabel(competition))}</span>
              <span class="latest-row__meta">${escapeHtml(shared.getUrgencyLabel(competition.closingDate))}</span>
            </a>`;
}

function renderHomepageClubSection() {
  return `<section class="home-cta home-cta--club" aria-label="Freehub Club and alerts">
          <div>
            <p class="section-kicker">Freehub Club</p>
            <h2 class="home-cta__title">Save competitions and get reminders</h2>
            <p class="home-section__intro">Create a free account to save listings, track what you entered or skipped, and keep useful competition alerts in one place.</p>
          </div>
          <div class="home-cta__actions">
            <a class="btn btn--primary" href="/club/">Open Club</a>
            <a class="btn btn--secondary" href="/competitions-ending-soon/">See deadlines</a>
          </div>
          ${renderGlobalAuthPanel({
            id: "home-club",
            title: "Get email alerts",
            text: "Optional Freehub account: sign in with Google or an email link to save alert preferences.",
          })}
        </section>`;
}

function renderHomepageGuidesSection() {
  const guides = [
    { label: "Best competitions this month", href: "/best-competitions-south-africa-this-month/" },
    { label: "Win a car competitions", href: "/win-a-car/" },
    { label: "Free entry competitions", href: "/free-competitions/" },
    { label: "Enter safely", href: "/how-to-enter-competitions-safely/" },
    { label: "Purchase required explained", href: "/purchase-required-competitions-explained/" },
  ];

  return `<section class="home-section home-section--guides" aria-label="Competition guides">
          <div class="home-section__header">
            <div>
              <p class="section-kicker">Guides</p>
              <h2 class="home-section__title">Read before you enter</h2>
            </div>
            <a class="home-section__link" href="/guides/">View guides</a>
          </div>
          <div class="guide-card-grid">
            ${guides
              .map((guide) => `<a class="guide-card" href="${escapeAttribute(guide.href)}">${escapeHtml(guide.label)}</a>`)
              .join("\n            ")}
          </div>
        </section>`;
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

function renderVerticalDiscoveryLinks() {
  if (generatedVerticalPagesForLinks.length === 0) {
    return "";
  }

  return `<section class="internal-links" aria-label="Ways to enter competitions">
          <p class="internal-links__title">Ways to Enter Competitions</p>
          <div class="internal-links__list">
            ${generatedVerticalPagesForLinks
              .map(
                (page) =>
                  `<a class="internal-links__link" href="${escapeAttribute(page.path)}">${escapeHtml(
                    page.heading
                  )} (${page.competitionCount})</a>`
              )
              .join("\n            ")}
          </div>
        </section>`;
}

function renderHomepage(competitions) {
  const homeRouteContext = { type: "home", slug: null, path: "/" };
  const structuredData = shared.buildStructuredData(competitions, homeRouteContext);
  const ogImage = getCollectionMetadataImageUrl(competitions);
  const topPicks = getHomepageTopPicks(competitions);
  const topPickSlugs = new Set(topPicks.map((entry) => shared.getCompetitionSlug(entry.competition)));
  const latestAdded = excludeCompetitionsBySlug(getLatestAddedCompetitions(competitions, 12), topPickSlugs, 6);
  const previewCompetitions = topPicks.map((entry) => entry.competition);
  const heroPreviewMarkup = renderHeroPreviewPanel(previewCompetitions, {
    title: "Prize Watch",
    intro: "Three active picks with clear prize, cost and deadline cues.",
    className: "hero-preview-panel--home",
  });

  const noscriptLinks = competitions
    .slice(0, 6)
    .map((c) => {
      const slug = shared.getCompetitionSlug(c);
      return `          <li><a href="${escapeAttribute(`/competition/${slug}/`)}">${escapeHtml(c.title)}</a></li>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>South African Competitions Worth Entering Today | Freehub</title>
    <meta name="description" content="Find South African competitions worth checking today, with curated picks, clear closing dates, entry-cost labels and official promoter links." />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${escapeAttribute(shared.CANONICAL_ORIGIN)}/" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="South African Competitions Worth Entering Today | Freehub" />
    <meta property="og:description" content="Find active South African competitions with curated picks, clear costs, closing dates and official promoter links." />
    <meta property="og:url" content="${escapeAttribute(shared.CANONICAL_ORIGIN)}/" />
    <meta property="og:image" content="${escapeAttribute(ogImage)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="South African Competitions Worth Entering Today | Freehub" />
    <meta name="twitter:description" content="Find active South African competitions with curated picks, clear costs, closing dates and official promoter links." />
    <meta name="twitter:image" content="${escapeAttribute(ogImage)}" />
    <script id="structured-data-itemlist" type="application/ld+json">${escapeScript(JSON.stringify(structuredData))}</script>
    <link rel="stylesheet" href="${escapeAttribute(getStylesheetHref("/"))}" />
    ${ADSENSE_SCRIPT}
    ${renderGoogleTagManagerHead("{ page_type: 'home' }")}
    ${renderMetaPixelHead()}
  </head>
  <body>
    ${renderGoogleTagManagerNoScript()}
    ${renderMetaPixelNoScript()}
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
      ${renderTopNavigation({ active: "home" })}
      <header class="hero hero--home">
        <div class="hero__layout">
          <div class="hero__copy">
            <div class="hero__brand" aria-label="FreeHub brand">
              <span class="hero__brand-mark" aria-hidden="true">FH</span>
              <span class="hero__brand-name">Freehub</span>
            </div>
            <h1 id="pageTitle">Find South African competitions worth entering today</h1>
            <p class="hero__text" id="pageIntro">Verified competition listings from official promoter sources. Compare prizes, closing dates and entry costs before you click through.</p>
            ${renderUpdatedNotice()}
            <div class="hero__actions">
              <a class="btn btn--primary" href="/competitions/">View today&apos;s picks</a>
              <a class="btn btn--secondary" href="/win-a-car/">Win a car</a>
              <a class="btn btn--secondary" href="/free-competitions/">Free entry competitions</a>
              <a class="btn btn--whatsapp" href="${escapeAttribute(WHATSAPP_CHANNEL_URL)}" target="_blank" rel="noopener noreferrer">Follow on WhatsApp</a>
            </div>
            <div class="trust-row" aria-label="Trust signals">
              <span class="trust-row__item">Verified listings</span>
              <span class="trust-row__item">Official source links</span>
              <span class="trust-row__item">Cost labels</span>
              <span class="trust-row__item">Freehub is not the promoter</span>
            </div>
          </div>
          ${heroPreviewMarkup}
        </div>
      </header>

      <main id="main-content" class="main-content">
        ${renderTopPicksSection(topPicks)}
        ${renderDatacostPromo({
          placement: "home-after-featured",
          compact: true,
          heading: "Compare data deals before you enter",
          text: "DataCost.co.za helps you check South African data and airtime deals quickly, so prize browsing and everyday mobile costs stay in one place.",
        })}
        ${renderIntentTilesSection()}
        ${renderLatestRowsSection(latestAdded)}
        ${renderHomeTrustSection()}
        ${renderDatacostPromo({ placement: "home-before-filters" })}
        ${renderHomepageClubSection()}
        ${renderHomepageGuidesSection()}
      </main>

      ${renderSiteFooter()}
    </div>

    <aside class="ad-sticky ad-sticky--reserved" id="ad-sticky" aria-hidden="true"></aside>

    <script src="/shared/page-data.js" defer></script>
    <script src="/app.js" defer></script>
    <script type="module" src="/shared/auth-ui.js"></script>
  </body>
</html>
`;
}

function renderTrustPage(page) {
  const canonicalUrl = `${shared.CANONICAL_ORIGIN}/${page.slug}/`;
  const usefulLinks = getTrustPageUsefulLinks(page);
  const pageResources = getTrustPageResources(page);
  const faqItems = Array.isArray(page.faq) ? page.faq : [];
  const resourceStructuredData = buildFreeResourceItemList(page, pageResources);
  const faqStructuredData = buildTrustPageFaqStructuredData(faqItems);
  const serviceStructuredData = buildTrustPageServiceStructuredData(page, canonicalUrl);
  const articleData = page.article
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: page.heading,
        description: page.description,
        image: shared.DEFAULT_OG_IMAGE,
        datePublished: page.datePublished || getTrustPageLastmod(page),
        dateModified: getTrustPageLastmod(page),
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
  const resourceStructuredDataScript = resourceStructuredData
    ? `<script id="structured-data-itemlist" type="application/ld+json">${escapeScript(
        JSON.stringify(resourceStructuredData)
      )}</script>`
    : "";
  const faqStructuredDataScript = faqStructuredData
    ? `<script id="structured-data-faq" type="application/ld+json">${escapeScript(JSON.stringify(faqStructuredData))}</script>`
    : "";
  const serviceStructuredDataScript = serviceStructuredData
    ? `<script id="structured-data-service" type="application/ld+json">${escapeScript(JSON.stringify(serviceStructuredData))}</script>`
    : "";

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
    ${resourceStructuredDataScript}
    ${faqStructuredDataScript}
    ${serviceStructuredDataScript}
    <link rel="stylesheet" href="${escapeAttribute(getStylesheetHref("/"))}" />
    ${ADSENSE_SCRIPT}
    ${renderGoogleTagManagerHead(`{ page_type: 'trust', trust_page: ${escapeScript(JSON.stringify(page.slug))} }`)}
    ${renderMetaPixelHead()}
  </head>
  <body>
    ${renderGoogleTagManagerNoScript()}
    ${renderMetaPixelNoScript()}
    <div class="site-shell">
      ${renderTopNavigation()}
      ${renderModernHero({
        className: "hero--utility hero--trust",
        eyebrow: "Freehub trust",
        heading: page.heading,
        intro: page.intro,
        actions: page.actions || [
          { label: "Browse Competitions", href: "/competitions/", className: "btn--primary" },
          { label: "Safety Guide", href: "/how-to-enter-competitions-safely/", className: "btn--secondary" },
        ],
        trustItems: page.trustItems || ["Freehub is not the promoter", "Official source links", "Safety-first browsing"],
      })}

      <main id="main-content" class="main-content trust-page">
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

        ${page.slug === "submit-a-competition" ? renderCompetitionSubmissionForm() : ""}
        ${page.slug === "contact" ? renderGlobalAuthPanel({
          id: "contact",
          title: "Want competition alerts instead?",
          text: "For alerts, sign in with Google or an email link. For company submissions, use the dedicated submission page.",
        }) : ""}
        ${page.slug === "freehub-account-benefits" ? renderGlobalAuthPanel({
          id: "account-benefits",
          title: "Try signed-in competition tracking",
          text: "Sign in with Google or an email link to save competitions, hide ones you have seen and keep alert preferences with your account.",
        }) : ""}

        ${renderFreeResourceSection(page, pageResources)}
        ${renderTrustChecklist(page)}
        ${renderTrustFaqSection(faqItems)}
        ${renderDatacostPromo({
          placement: `trust-${page.slug}`,
          compact: true,
          ussd: ["free-data-south-africa", "free-stuff-south-africa", "app-competitions-south-africa"].includes(page.slug),
        })}

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
    ${page.slug === "submit-a-competition" ? '<script type="module" src="/shared/submission-ui.js"></script>' : ""}
    <script type="module" src="/shared/auth-ui.js"></script>
  </body>
</html>
`;
}

function writeContentPages(activeCompetitions) {
  CONTENT_INDEX_PAGES.forEach((page) => {
    const outputDirectory = path.join(ROOT_DIR, page.slug);
    fs.mkdirSync(outputDirectory, { recursive: true });
    fs.writeFileSync(path.join(outputDirectory, "index.html"), renderContentIndexPage(page));
  });

  const monthlyGuideDirectory = path.join(ROOT_DIR, MONTHLY_GUIDE_SLUG);
  fs.mkdirSync(monthlyGuideDirectory, { recursive: true });
  fs.writeFileSync(path.join(monthlyGuideDirectory, "index.html"), renderMonthlyGuidePage(activeCompetitions));
}

function getGuideCards() {
  return [
    {
      title: "Best competitions to enter in South Africa this month",
      href: `/${MONTHLY_GUIDE_SLUG}/`,
      text: "A current, inventory-backed roundup of active listings worth opening first.",
    },
    {
      title: "Win a car competitions in South Africa 2026",
      href: "/win-a-car/",
      text: "Vehicle prizes and car-focused promotions with official-source links.",
    },
    {
      title: "Free entry competitions South Africa",
      href: "/free-competitions/",
      text: "No-purchase competitions where Freehub data does not show a required product purchase or paid ticket.",
    },
    {
      title: "How to enter competitions safely",
      href: "/how-to-enter-competitions-safely/",
      text: "Safety checks for prize messages, official links, closing dates and personal information.",
    },
    {
      title: "Purchase required competitions explained",
      href: "/purchase-required-competitions-explained/",
      text: "What to check before buying a product, keeping a receipt or using a loyalty-card route.",
    },
  ];
}

function renderContentIndexPage(page) {
  const canonicalUrl = `${shared.CANONICAL_ORIGIN}/${page.slug}/`;
  const guideCards = getGuideCards();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: page.heading,
    description: page.description,
    url: canonicalUrl,
  };

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(page.title)} | Freehub</title>
    <meta name="description" content="${escapeAttribute(page.description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <script id="structured-data-content-index" type="application/ld+json">${escapeScript(JSON.stringify(jsonLd))}</script>
    <link rel="stylesheet" href="${escapeAttribute(getStylesheetHref("/"))}" />
    ${renderGoogleTagManagerHead(`{ page_type: '${escapeScript(page.slug)}' }`)}
    ${renderMetaPixelHead()}
  </head>
  <body>
    ${renderGoogleTagManagerNoScript()}
    ${renderMetaPixelNoScript()}
    <div class="site-shell">
      ${renderTopNavigation({ active: page.slug === "guides" ? "competitions" : "home" })}
      ${renderModernHero({
        className: "hero--standard hero--no-preview",
        eyebrow: "Freehub guides",
        heading: page.heading,
        intro: page.intro,
        actions: [
          { label: "All Competitions", href: "/competitions/", className: "btn--primary" },
          { label: "Ending Soon", href: "/competitions-ending-soon/", className: "btn--secondary" },
        ],
        trustItems: ["Official source links", "Cost labels", "Freehub is not the promoter"],
      })}

      <main id="main-content" class="main-content">
        <section class="home-section home-section--guides" aria-label="Freehub guide collection">
          <div class="guide-card-grid guide-card-grid--expanded">
            ${guideCards.map(renderGuideCollectionCard).join("\n            ")}
          </div>
        </section>

        ${renderGlobalAuthPanel({
          id: `${page.slug}-alerts`,
          title: "Get competition alerts",
          text: "Sign in with Google or an email link to save Freehub alert preferences.",
        })}
      </main>

      ${renderSiteFooter()}
    </div>
    <script src="/shared/page-data.js" defer></script>
    <script type="module" src="/shared/auth-ui.js"></script>
  </body>
</html>
`;
}

function renderGuideCollectionCard(guide) {
  return `<a class="guide-card guide-card--expanded" href="${escapeAttribute(guide.href)}">
              <span class="guide-card__title">${escapeHtml(guide.title)}</span>
              <span class="guide-card__text">${escapeHtml(guide.text)}</span>
            </a>`;
}

function renderMonthlyGuidePage(activeCompetitions) {
  const canonicalUrl = `${shared.CANONICAL_ORIGIN}/${MONTHLY_GUIDE_SLUG}/`;
  const featuredCompetitions = getMonthlyGuideCompetitions(activeCompetitions);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Best Competitions to Enter in South Africa This Month",
    description: "A current Freehub roundup of active South African competitions with costs, entry methods and closing dates.",
    datePublished: BUILD_DATE_ISO,
    dateModified: BUILD_DATE_ISO,
    author: { "@type": "Organization", name: "Freehub" },
    publisher: { "@type": "Organization", name: "Freehub" },
    mainEntityOfPage: canonicalUrl,
  };

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Best Competitions to Enter in South Africa This Month | Freehub</title>
    <meta name="description" content="Compare current South African competitions worth checking this month, with prize, cost, entry method and closing-date details from Freehub." />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <script id="structured-data-article" type="application/ld+json">${escapeScript(JSON.stringify(jsonLd))}</script>
    <link rel="stylesheet" href="${escapeAttribute(getStylesheetHref("/"))}" />
    ${renderGoogleTagManagerHead("{ page_type: 'monthly_guide' }")}
    ${renderMetaPixelHead()}
  </head>
  <body>
    ${renderGoogleTagManagerNoScript()}
    ${renderMetaPixelNoScript()}
    <div class="site-shell">
      ${renderTopNavigation({ active: "competitions" })}
      ${renderModernHero({
        className: "hero--standard hero--with-preview",
        eyebrow: "Monthly guide",
        heading: "Best competitions to enter in South Africa this month",
        intro: "A current roundup of active Freehub listings with visible costs, closing dates and official-source paths.",
        updatedMarkup: renderUpdatedNotice(),
        actions: [
          { label: "All Competitions", href: "/competitions/", className: "btn--primary" },
          { label: "Free Entry", href: "/free-competitions/", className: "btn--secondary" },
          { label: "Ending Soon", href: "/competitions-ending-soon/", className: "btn--secondary" },
        ],
        trustItems: ["Active listings only", "Official source links", "Cost labels"],
        previewMarkup: renderHeroPreviewPanel(featuredCompetitions.slice(0, 3), {
          title: "This Month",
          intro: "A quick look at current picks from the roundup.",
          className: "hero-preview-panel--collection",
        }),
      })}

      <main id="main-content" class="main-content">
        <section class="seo-copy-block seo-copy-block--intro" aria-label="Monthly competition guide">
          <h2 class="seo-copy-block__title">Current picks from Freehub inventory</h2>
          <div class="seo-copy-block__content">
            <p>This guide is generated from active public Freehub listings. It favours competitions with clear source links, cost labels, entry methods and closing dates.</p>
            <p>Freehub does not run these competitions or collect entries. Open the detail page first, then confirm the latest rules on the official promoter source before entering.</p>
          </div>
        </section>

        ${renderMonthlyGuideTable(featuredCompetitions)}

        <section class="seo-copy-block" aria-label="Safety checklist">
          <h2 class="seo-copy-block__title">Safety checklist</h2>
          <div class="seo-copy-block__content">
            <p>Check the official promoter page, closing date, entry cost, purchase requirement and winner-contact process before submitting personal details.</p>
            <p>Be cautious with prize messages that ask for upfront fees, unofficial payment links or documents that are not explained in the promoter terms.</p>
          </div>
        </section>

        ${renderHomepageGuidesSection()}
        ${renderGlobalAuthPanel({
          id: "monthly-guide-alerts",
          title: "Get competition alerts",
          text: "Sign in with Google or an email link to save Freehub alert preferences.",
        })}
      </main>

      ${renderSiteFooter()}
    </div>
    <script src="/shared/page-data.js" defer></script>
    <script type="module" src="/shared/auth-ui.js"></script>
  </body>
</html>
`;
}

function getMonthlyGuideCompetitions(activeCompetitions) {
  return activeCompetitions
    .filter(hasHomepageReadyData)
    .slice()
    .sort(compareHomepageCandidateScore)
    .slice(0, 12);
}

function renderMonthlyGuideTable(competitions) {
  if (competitions.length === 0) {
    return `<section class="state-card" aria-label="No current monthly picks">
          <p class="state-card__title">No monthly picks are ready yet</p>
          <p class="state-card__text">Browse all current competitions while Freehub refreshes this guide.</p>
        </section>`;
  }

  return `<section class="guide-table-section" aria-label="Best competitions this month">
          <div class="table-scroll">
            <table class="guide-table">
              <thead>
                <tr>
                  <th>Competition</th>
                  <th>Brand</th>
                  <th>Prize</th>
                  <th>Cost</th>
                  <th>Closes</th>
                  <th>Entry method</th>
                </tr>
              </thead>
              <tbody>
                ${competitions
                  .map(
                    (competition) => `<tr>
                  <td><a href="${escapeAttribute(shared.getCompetitionPath(competition))}">${escapeHtml(competition.title)}</a></td>
                  <td>${escapeHtml(competition.brand || "Official promoter")}</td>
                  <td>${escapeHtml(competition.prizeName || shared.getPrizeCue(competition))}</td>
                  <td>${escapeHtml(shared.getEntryCostLabel(competition))}</td>
                  <td>${escapeHtml(shared.formatDate(competition.closingDate))}</td>
                  <td>${escapeHtml(competition.entryChannel || competition.entryType || "Official source")}</td>
                </tr>`
                  )
                  .join("\n                ")}
              </tbody>
            </table>
          </div>
        </section>`;
}

function renderClubLandingPage() {
  const canonicalUrl = `${shared.CANONICAL_ORIGIN}/club/`;
  const title = "Freehub Club | Save and Track South African Competitions";
  const description =
    "Join Freehub Club to save South African competitions, track what you entered or skipped, and keep your own referral link ready for future Club rewards.";
  const faqItems = [
    {
      question: "Is Freehub Club free?",
      answer: "Yes. Freehub Club is a free account feature for saving and tracking competition listings on Freehub.",
    },
    {
      question: "Does Freehub enter competitions for me?",
      answer:
        "No. Freehub helps you organise listings, but entries still happen on the official promoter website or entry channel.",
    },
    {
      question: "Is Refer and Win live?",
      answer:
        "Yes. The first Freehub Refer and Win campaign is live from 18 June 2026 to 31 July 2026, ending at 23:59 SAST on 31 July 2026, with R250 airtime as the prize and manual review required before referrals count.",
    },
  ];
  const faqStructuredData = buildTrustPageFaqStructuredData(faqItems);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Freehub Club",
    description,
    url: canonicalUrl,
    inLanguage: "en-ZA",
    isPartOf: {
      "@type": "WebSite",
      name: "Freehub",
      url: `${shared.CANONICAL_ORIGIN}/`,
    },
  };

  return renderClubShell({
    title,
    description,
    canonicalUrl,
    robots: "index, follow, max-image-preview:large",
    pageType: "club_landing",
    structuredDataScripts: `
    <script id="structured-data-webpage" type="application/ld+json">${escapeScript(JSON.stringify(structuredData))}</script>
    ${faqStructuredData ? `<script id="structured-data-faq" type="application/ld+json">${escapeScript(JSON.stringify(faqStructuredData))}</script>` : ""}`,
    body: `
      ${renderModernHero({
        className: "hero--club hero--with-preview",
        eyebrow: "Freehub Club",
        heading: "Save and track South African competitions",
        intro:
          "Create a free Freehub Club account to keep useful competitions together, mark what you entered, and copy your personal referral link for the first Refer & Win campaign.",
        actions: [
          { label: "Continue with Google", href: "/club/dashboard/", className: "btn--primary" },
          { label: "Browse Competitions", href: "/competitions/", className: "btn--secondary" },
        ],
        trustItems: ["Free account", "Official source links", "Refer & Win live"],
        previewMarkup: renderClubPreviewPanel(),
      })}
      <main id="main-content" class="main-content club-page">
        <section class="club-section club-section--split" aria-label="Freehub Club benefits">
          <article>
            <p class="section-kicker">What Club does</p>
            <h2>Keep your competition hunting organised</h2>
            <p>Freehub Club gives regular visitors a simple place to save listings, keep track of what they still want to enter, and come back before closing dates pass.</p>
          </article>
          <div class="club-feature-grid">
            <article class="club-feature"><h3>Save competitions</h3><p>Keep promising listings in one account instead of relying on screenshots, browser history or memory.</p></article>
            <article class="club-feature"><h3>Track your status</h3><p>Mark saved competitions as interested, entered or skipped so your dashboard stays useful.</p></article>
            <article class="club-feature"><h3>Share your link</h3><p>Your referral link can be used for the current Refer &amp; Win campaign. Referrals only count after Freehub admin review.</p></article>
            <article class="club-feature"><h3>Stay private</h3><p>Freehub does not collect competition entries. Promoter forms, winner selection and prize fulfilment remain with the official promoter.</p></article>
          </div>
        </section>

        <section class="club-section club-section--notice" aria-label="Refer and Win status">
          <div>
            <p class="section-kicker">First campaign</p>
            <h2>Refer &amp; Win is live with a R250 airtime prize</h2>
            <p>Club members can opt in, add a South African mobile number for prize fulfilment, accept the rules and share their referral link. The first campaign runs from 18 June 2026 to 31 July 2026, ending at 23:59 SAST on 31 July 2026.</p>
          </div>
          <div class="club-section__actions">
            <a class="btn btn--primary" href="/refer-and-win/">Learn about Refer &amp; Win</a>
            <a class="btn btn--secondary" href="/refer-and-win/terms/">Campaign rules</a>
            <a class="btn btn--secondary" href="/club/dashboard/">Open Club dashboard</a>
          </div>
        </section>

        <section class="trust-faq" aria-label="Freehub Club FAQ">
          <div class="home-section__header">
            <div>
              <p class="section-kicker">FAQ</p>
              <h2 class="home-section__title">Freehub Club questions</h2>
            </div>
          </div>
          ${faqItems
            .map(
              (item) => `<details class="trust-faq__item">
            <summary>${escapeHtml(item.question)}</summary>
            <p>${escapeHtml(item.answer)}</p>
          </details>`
            )
            .join("\n          ")}
        </section>
      </main>`,
  });
}

function renderClubDashboardPage(activeCompetitions = []) {
  const dashboardCompetitions = getClubDashboardCompetitions(activeCompetitions);

  return renderClubShell({
    title: "Freehub Club Dashboard | Saved Competitions",
    description: "View saved Freehub competitions, update statuses and copy your Club referral link.",
    canonicalUrl: `${shared.CANONICAL_ORIGIN}/club/dashboard/`,
    robots: "noindex, follow",
    pageType: "club_dashboard",
    body: `
      <script>window.FREEHUB_CLUB_COMPETITIONS = ${escapeScript(JSON.stringify(dashboardCompetitions))};</script>
      <main id="main-content" class="main-content club-page club-dashboard" data-club-page="dashboard">
        <section class="club-app-shell" aria-label="Freehub Club dashboard">
          <div class="club-app-header">
            <div>
              <p class="section-kicker">Freehub Club</p>
              <h1>Dashboard</h1>
              <p data-club-welcome>Sign in with Google to keep your saved competitions synced to your Freehub Club account.</p>
            </div>
            <div class="club-app-actions">
              <button class="btn btn--primary" type="button" data-club-action="signin">Continue with Google</button>
              <button class="btn btn--secondary" type="button" data-club-action="signout" hidden>Sign out</button>
            </div>
          </div>
          <section class="club-referral-card" data-club-referral hidden>
            <div>
              <p class="section-kicker">Referral link</p>
              <h2>Your Freehub Club link</h2>
              <p>Refer &amp; Win is live with a R250 airtime prize. The first campaign runs from 18 June 2026 to 31 July 2026, ending at 23:59 SAST on 31 July 2026. You must opt in from your account and referrals only count after manual review.</p>
            </div>
            <div class="club-copy-row">
              <input type="text" readonly data-club-referral-link aria-label="Your Freehub Club referral link" />
              <button class="btn btn--secondary" type="button" data-club-action="copy-referral">Copy</button>
              <button class="btn btn--secondary" type="button" data-club-action="share-referral">Share</button>
              <a class="btn btn--secondary" href="/refer-and-win/">Refer &amp; Win</a>
              <a class="btn btn--secondary" href="/refer-and-win/terms/">Rules</a>
            </div>
            <p class="club-status">Approved referrals are confirmed by admin review after sign-ups are checked.</p>
            <p class="club-status" data-club-referral-status aria-live="polite"></p>
          </section>
          <section class="club-saved-panel club-tools" aria-label="Freehub member tools" data-club-tools>
            <div class="club-panel-header club-tools__header">
              <div>
                <h2>Member tools</h2>
                <p>Quick utilities for tracking entries, checking prize messages and keeping competition admin tidy.</p>
              </div>
            </div>
            <div class="club-tools-grid">
              <article class="club-tool-card" data-tool="lotto">
                <div class="club-tool-card__header">
                  <p class="club-saved-item__meta">Number generator</p>
                  <h3>Lotto quick picks</h3>
                </div>
                <label>
                  <span>Game</span>
                  <select data-lotto-game>
                    <option value="lotto">Lotto: 6 from 52</option>
                    <option value="powerball">PowerBall: 5 from 50 + 1 from 20</option>
                    <option value="daily">Daily Lotto: 5 from 36</option>
                  </select>
                </label>
                <div class="club-tool-result" data-lotto-result aria-live="polite">Choose a game and generate numbers.</div>
                <div class="club-tool-actions">
                  <button class="btn btn--primary" type="button" data-tool-action="generate-lotto">Generate</button>
                  <button class="btn btn--secondary" type="button" data-tool-action="save-lotto">Save set</button>
                </div>
                <div class="club-tool-list" data-lotto-saved></div>
              </article>
              <article class="club-tool-card" data-tool="entry-calculator">
                <div class="club-tool-card__header">
                  <p class="club-saved-item__meta">Spend check</p>
                  <h3>Entry cost calculator</h3>
                </div>
                <div class="club-tool-form-grid">
                  <label><span>Spend</span><input type="number" min="0" step="0.01" inputmode="decimal" data-cost-spend placeholder="0.00" /></label>
                  <label><span>Entries</span><input type="number" min="1" step="1" inputmode="numeric" data-cost-entries placeholder="1" /></label>
                  <label><span>Prize value</span><input type="number" min="0" step="0.01" inputmode="decimal" data-cost-prize placeholder="0.00" /></label>
                  <label><span>Chance note</span><input type="text" data-cost-odds placeholder="Unknown or 1 in 1000" /></label>
                </div>
                <button class="btn btn--primary" type="button" data-tool-action="calculate-cost">Calculate</button>
                <div class="club-tool-result" data-cost-result aria-live="polite">Enter the spend and entries to compare the cost per entry.</div>
              </article>
              <article class="club-tool-card" data-tool="scam-checker">
                <div class="club-tool-card__header">
                  <p class="club-saved-item__meta">Safety</p>
                  <h3>Prize message checker</h3>
                </div>
                <div class="club-risk-list">
                  <label><input type="checkbox" data-risk-item value="payment" /> They ask for a fee, courier payment or airtime first</label>
                  <label><input type="checkbox" data-risk-item value="banking" /> They ask for banking PINs, OTPs or card details</label>
                  <label><input type="checkbox" data-risk-item value="pressure" /> They pressure you to respond immediately</label>
                  <label><input type="checkbox" data-risk-item value="unofficial" /> The message comes from an unofficial number, Gmail or shortened link</label>
                  <label><input type="checkbox" data-risk-item value="unknown" /> You do not remember entering this competition</label>
                </div>
                <button class="btn btn--primary" type="button" data-tool-action="check-scam">Check risk</button>
                <div class="club-tool-result" data-risk-result aria-live="polite">Tick what applies to the message you received.</div>
              </article>
            </div>
            <article class="club-tool-card club-tool-card--wide" data-tool="proof-vault">
              <div class="club-tool-card__header">
                <p class="club-saved-item__meta">Entry admin</p>
                <h3>Proof and reminder vault</h3>
                <p>Store reference numbers, receipt notes and reminder dates for tracked competitions on this device.</p>
              </div>
              <div class="club-tool-list club-proof-list" data-proof-vault-list></div>
              <p class="club-status" data-proof-status aria-live="polite"></p>
            </article>
          </section>
          <details class="club-saved-panel club-collapsible" aria-label="Saved competitions" open>
            <summary class="club-panel-header">
              <div>
                <h2>Tracked competitions</h2>
                <p data-club-saved-summary>Saved competitions from this browser or your Freehub Club account will appear here.</p>
              </div>
              <span class="club-panel-header__toggle"><span data-open-label>Open</span><span data-close-label>Close</span></span>
            </summary>
            <div class="club-panel-actions">
              <button class="btn btn--secondary" type="button" data-club-action="clear-local">Clear local saves</button>
            </div>
            <div class="club-saved-list" data-club-saved-list></div>
          </details>
          <details class="club-saved-panel club-collapsible" aria-label="All active competitions">
            <summary class="club-panel-header">
              <div>
                <h2>All active competitions</h2>
                <p data-club-all-summary>Listed by nearest closing date so members can work through entries before they expire.</p>
              </div>
              <span class="club-panel-header__toggle"><span data-open-label>Open</span><span data-close-label>Close</span></span>
            </summary>
            <div class="club-panel-actions">
              <a class="btn btn--secondary" href="/competitions/">Public listings</a>
            </div>
            <div class="club-all-list" data-club-all-list></div>
          </details>
          <section class="club-section club-section--notice">
            <div><h2>Account settings</h2><p>Check your email, member details, saved count and Club consent records.</p></div>
            <a class="btn btn--primary" href="/club/account/">Your account details</a>
          </section>
        </section>
      </main>`,
  });
}

function getClubDashboardCompetitions(activeCompetitions = []) {
  return activeCompetitions
    .slice()
    .sort((left, right) => new Date(left.closingDate) - new Date(right.closingDate))
    .map((competition) => {
      const slug = shared.getCompetitionSlug(competition);

      return {
        competitionId: slug,
        slug,
        title: competition.title,
        brand: competition.brand || "",
        category: competition.category || "",
        closingDate: competition.closingDate || "",
        path: shared.getCompetitionPath(competition),
        entryCost: shared.getEntryCostLabel(competition),
        entryMethod: shared.getEntryMethodLabel(competition.entryType),
      };
    });
}

function renderClubAccountPage() {
  return renderClubShell({
    title: "Freehub Club Account | Profile and Referral Link",
    description: "View your Freehub Club account details, referral code and saved competition count.",
    canonicalUrl: `${shared.CANONICAL_ORIGIN}/club/account/`,
    robots: "noindex, follow",
    pageType: "club_account",
    body: `
      <main id="main-content" class="main-content club-page club-account" data-club-page="account">
        <section class="club-app-shell" aria-label="Freehub Club account">
          <div class="club-app-header">
            <div>
              <p class="section-kicker">Freehub Club</p>
              <h1>Account</h1>
              <p data-club-welcome>Sign in with Google to view your Freehub Club account.</p>
            </div>
            <div class="club-app-actions">
              <a class="club-back-link" href="/club/dashboard/">Back to dashboard</a>
              <button class="btn btn--primary" type="button" data-club-action="signin">Continue with Google</button>
              <button class="btn btn--secondary" type="button" data-club-action="signout" hidden>Sign out</button>
            </div>
          </div>
          <section class="club-account-grid" data-club-account>
            <article class="club-account-card">
              <p class="section-kicker">Profile</p>
              <dl class="club-definition-list">
                <div><dt>Name</dt><dd data-club-field="displayName">Not signed in</dd></div>
                <div><dt>Email</dt><dd data-club-field="email">Not signed in</dd></div>
                <div><dt>Member since</dt><dd data-club-field="createdAt">Not available</dd></div>
                <div><dt>Saved competitions</dt><dd data-club-field="savedCount">0</dd></div>
              </dl>
            </article>
            <article class="club-account-card">
              <p class="section-kicker">Referral</p>
              <dl class="club-definition-list">
                <div><dt>Code</dt><dd data-club-field="referralCode">Not available</dd></div>
                <div><dt>Link</dt><dd><input type="text" readonly data-club-referral-link aria-label="Your Freehub Club referral link" /></dd></div>
                <div><dt>Refer &amp; Win terms</dt><dd data-club-field="referWinTermsAccepted">Not accepted</dd></div>
                <div><dt>Refer &amp; Win mobile</dt><dd data-club-field="mobileNumberMasked">Not provided</dd></div>
                <div><dt>Marketing consent</dt><dd data-club-field="marketingConsent">Not opted in</dd></div>
              </dl>
              <button class="btn btn--secondary" type="button" data-club-action="copy-referral">Copy referral link</button>
              <p class="club-status" data-club-referral-status aria-live="polite"></p>
            </article>
          </section>
          <section class="club-section club-refer-participation" aria-label="Refer and Win participation">
            <div class="club-section--split">
              <div>
                <p class="section-kicker">Refer &amp; Win first campaign</p>
                <h2>Join the R250 airtime referral campaign</h2>
                <p>Freehub Club remains free. A South African mobile number is only required if you want to participate in Refer &amp; Win because airtime fulfilment needs a valid number.</p>
                <dl class="club-definition-list club-readiness-list">
                  <div><dt>Participation</dt><dd data-club-field="referWinParticipant">Not joined</dd></div>
                  <div><dt>Prize</dt><dd>${escapeHtml(FREEHUB_REFER_WIN_CONFIG.monthlyPrizeLabel)}</dd></div>
                  <div><dt>Campaign period</dt><dd>${escapeHtml(FREEHUB_REFER_WIN_CONFIG.campaignPeriodLabel)}</dd></div>
                  <div><dt>Review</dt><dd>Admin approval required</dd></div>
                </dl>
              </div>
              <form class="club-participation-form" data-club-refer-form>
                <div class="club-form-grid">
                  <label>
                    <span>South African mobile number</span>
                    <input type="tel" inputmode="tel" autocomplete="tel" placeholder="082 123 4567" data-club-mobile-number />
                  </label>
                  <label>
                    <span>Network</span>
                    <select data-club-mobile-network>
                      <option value="">Select network</option>
                      <option value="Vodacom">Vodacom</option>
                      <option value="MTN">MTN</option>
                      <option value="Telkom">Telkom</option>
                      <option value="Cell C">Cell C</option>
                      <option value="Rain">Rain</option>
                      <option value="Other / not sure">Other / not sure</option>
                    </select>
                  </label>
                </div>
                <label class="club-checkbox-row">
                  <input type="checkbox" data-club-refer-terms />
                  <span>I accept the Freehub Refer &amp; Win rules and understand that referrals only count after review.</span>
                </label>
                <label class="club-checkbox-row">
                  <input type="checkbox" data-club-prize-mobile-consent />
                  <span>I understand Freehub may use my South African mobile number to administer Refer &amp; Win, prevent abuse, contact me if needed, and fulfil airtime prizes where applicable.</span>
                </label>
                <label class="club-checkbox-row">
                  <input type="checkbox" data-club-marketing-consent />
                  <span>I agree to receive Freehub competition updates and marketing messages. I understand I can unsubscribe later.</span>
                </label>
                <div class="club-form-actions">
                  <button class="btn btn--primary" type="button" data-club-action="save-refer-win">Save Refer &amp; Win details</button>
                  <p class="club-form-status" data-club-mobile-status aria-live="polite"></p>
                </div>
              </form>
            </div>
          </section>
        </section>
      </main>`,
  });
}

function renderReferralAdminPage() {
  const title = "Freehub Referral Admin Review";
  const description = "Private Freehub admin review area for pending referral attribution records.";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeAttribute(description)}" />
    <meta name="robots" content="noindex, nofollow" />
    <link rel="canonical" href="${escapeAttribute(`${shared.CANONICAL_ORIGIN}/admin/referrals/`)}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="stylesheet" href="${escapeAttribute(getStylesheetHref("/"))}" />
    ${renderReferWinConfigScript()}
  </head>
  <body>
    <div class="site-shell">
      ${renderTopNavigation({ active: "" })}
      <main id="main-content" class="main-content admin-page" data-admin-page="referrals">
        <section class="admin-shell" aria-label="Referral admin review">
          <div class="club-app-header">
            <div>
              <p class="section-kicker">Private admin</p>
              <h1>Referral review</h1>
              <p>Manual review for Freehub Club referral attribution. Refer &amp; Win is live from 18 June 2026 to 31 July 2026, but admin approval is still required before any referral counts.</p>
            </div>
            <div class="club-app-actions">
              <a class="club-back-link" href="/club/dashboard/">Back to dashboard</a>
              <button class="btn btn--primary" type="button" data-referral-admin-action="signin">Continue with Google</button>
              <button class="btn btn--secondary" type="button" data-referral-admin-action="signout" hidden>Sign out</button>
            </div>
          </div>

          <section class="admin-gate" data-referral-admin-gate>
            <h2 data-referral-admin-gate-title>Admin sign-in required</h2>
            <p data-referral-admin-gate-message>Sign in with the Google account that has an active admins/{uid} document.</p>
            <p class="admin-note">Create admin access manually in Firebase Console. There is no public self-serve admin signup.</p>
          </section>

          <section class="admin-content" data-referral-admin-content hidden>
            <section class="admin-campaign-status" aria-label="Refer and Win campaign status">
              <div>
                <p class="section-kicker">Campaign status</p>
                <h2>Refer &amp; Win campaign: first campaign live</h2>
                <p>${escapeHtml(FREEHUB_REFER_WIN_CONFIG.monthlyPrizeLabel)} prize. Current period: ${escapeHtml(FREEHUB_REFER_WIN_CONFIG.campaignPeriodLabel)}. Next period: ${escapeHtml(FREEHUB_REFER_WIN_CONFIG.nextCampaignPeriodLabel)}. Winner confirmation still requires manual referral review, participant readiness checks and final admin sign-off.</p>
              </div>
              <div class="club-section__actions">
                <a class="btn btn--secondary" href="/refer-and-win/">Public page</a>
                <a class="btn btn--secondary" href="/refer-and-win/terms/">Campaign rules</a>
              </div>
            </section>

            <div class="admin-toolbar">
              <div>
                <p class="section-kicker">Signed in admin</p>
                <p class="admin-toolbar__identity" data-referral-admin-email>Admin</p>
              </div>
              <label>
                <span>Campaign month</span>
                <input type="month" data-referral-admin-filter data-referral-admin-month />
              </label>
              <label>
                <span>Status</span>
                <select data-referral-admin-filter data-referral-admin-status>
                  <option value="pending_verification">Pending verification</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="all">All statuses</option>
                </select>
              </label>
              <button class="btn btn--secondary" type="button" data-referral-admin-action="refresh">Refresh</button>
            </div>

            <p class="club-status" data-referral-admin-status-text aria-live="polite">Loading referral review queue...</p>

            <section class="admin-count-grid" aria-label="Monthly referral counts">
              <article><span>Total</span><strong data-referral-count-total>0</strong></article>
              <article><span>Pending</span><strong data-referral-count-pending>0</strong></article>
              <article><span>Approved</span><strong data-referral-count-approved>0</strong></article>
              <article><span>Rejected</span><strong data-referral-count-rejected>0</strong></article>
            </section>

            <section class="admin-count-grid" aria-label="Refer and Win participant readiness">
              <article><span>Opted in</span><strong data-referral-participant-count>0</strong></article>
              <article><span>Missing mobile</span><strong data-referral-missing-mobile-count>0</strong></article>
              <article><span>Missing terms</span><strong data-referral-missing-terms-count>0</strong></article>
              <article><span>Review model</span><strong>Manual</strong></article>
            </section>

            <section class="admin-count-grid" aria-label="Public referral lead counts">
              <article><span>Quick links</span><strong data-public-lead-count>0</strong></article>
              <article><span>Referred leads</span><strong data-public-lead-referred-count>0</strong></article>
              <article><span>Mobile contacts</span><strong data-public-lead-mobile-count>0</strong></article>
              <article><span>Marketing opt-ins</span><strong data-public-lead-marketing-count>0</strong></article>
            </section>

            <section class="admin-grid">
              <article class="admin-panel">
                <div class="admin-panel__header">
                  <p class="section-kicker">Provisional summary</p>
                  <h2>Monthly top referrers</h2>
                </div>
                <div class="admin-referral-ranks" data-referral-top-referrers></div>
              </article>

              <article class="admin-panel">
                <div class="admin-panel__header">
                  <p class="section-kicker">Review queue</p>
                  <h2>Referral attribution records</h2>
                </div>
                <div class="admin-referral-list" data-referral-admin-list></div>
              </article>
            </section>

            <section class="admin-panel">
              <div class="admin-panel__header">
                <p class="section-kicker">Low-friction growth</p>
                <h2>Public quick referral leads</h2>
                <p>These records are created when a visitor enters a WhatsApp number or email to get a share link without full Club registration. They support traffic attribution, but prize eligibility still needs review.</p>
              </div>
              <div class="admin-referral-list" data-public-referral-lead-list></div>
            </section>
          </section>
        </section>
      </main>
      ${renderSiteFooter({ includeAuthPanel: false })}
    </div>
    <script type="module" src="/shared/referral-admin-ui.js"></script>
  </body>
</html>
`;
}

function renderReferAndWinPage() {
  const canonicalUrl = `${shared.CANONICAL_ORIGIN}/refer-and-win/`;
  const title = "Refer Friends and Win R250 Airtime | Freehub Refer & Win";
  const description =
    "Join the first Freehub Refer & Win campaign from 18 June to 31 July 2026. Freehub Club members can share a referral link and stand a chance to win R250 airtime after approved referrals are reviewed.";
  const faqItems = [
    {
      question: "Is Refer & Win live now?",
      answer:
        "Yes. The first Freehub Refer & Win campaign runs from 18 June 2026 to 31 July 2026, ending at 23:59 SAST on 31 July 2026. It is free to enter, no purchase is required, and referrals only count after manual review.",
    },
    {
      question: "How do I join Freehub Club?",
      answer: "Join through the Freehub Club page using Google sign-in. Club membership is free, and the quick referral link on this page is available if you want to share before creating a full account.",
    },
    {
      question: "How do I get a referral link?",
      answer:
        "Use the quick referral form on this page with a WhatsApp number or email, or sign into Freehub Club and use the referral link in your Club dashboard.",
    },
    {
      question: "What is the first campaign prize?",
      answer:
        "The first campaign prize is R250 airtime, fulfilled as an airtime top-up or airtime voucher to a supported South African mobile number.",
    },
    {
      question: "When does the next campaign run?",
      answer:
        "The next campaign is planned to run from 1 August 2026 to 31 August 2026, ending at 23:59 SAST on 31 August 2026.",
    },
    {
      question: "What counts as an approved referral?",
      answer:
        "Only referrals that pass manual review may count. A click or sign-in alone does not make a referral approved.",
    },
    {
      question: "Can I refer myself?",
      answer: "No. Self-referrals do not count and may be rejected during manual review.",
    },
    {
      question: "Will there be a public leaderboard?",
      answer:
        "No. Freehub does not show a public leaderboard for this campaign. Admin review happens privately.",
    },
    {
      question: "Does Freehub show my personal details publicly?",
      answer:
        "No. Public referral surfaces must not show emails, phone numbers, Firebase UIDs or private account details.",
    },
    {
      question: "Do I have to accept marketing messages?",
      answer:
        "No. Marketing consent is optional and separate from Freehub Club and the Refer & Win campaign.",
    },
    {
      question: "Where can I read the rules?",
      answer: "Read the campaign rules at /refer-and-win/terms/ before sharing your referral link.",
    },
  ];
  const faqStructuredData = buildTrustPageFaqStructuredData(faqItems);
  const webPageStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Freehub Refer & Win",
    description,
    url: canonicalUrl,
    inLanguage: "en-ZA",
    isPartOf: {
      "@type": "WebSite",
      name: "Freehub",
      url: `${shared.CANONICAL_ORIGIN}/`,
    },
  };

  return renderReferAndWinShell({
    title,
    description,
    canonicalUrl,
    pageType: "refer_win_landing",
    structuredDataScripts: `
    <script id="structured-data-webpage" type="application/ld+json">${escapeScript(JSON.stringify(webPageStructuredData))}</script>
    <script id="structured-data-faq" type="application/ld+json">${escapeScript(JSON.stringify(faqStructuredData))}</script>`,
    body: `
      ${renderModernHero({
        className: "hero--refer-win hero--with-preview",
        eyebrow: "Freehub Refer & Win",
        heading: "Refer friends. Stand a chance to win R250 airtime.",
        intro:
          "Freehub Refer & Win is live for its first campaign from 18 June 2026 to 31 July 2026. Freehub Club members in South Africa can opt in, share their personal referral link, and compete for a R250 airtime prize based on approved referrals.",
        updatedMarkup: renderReferWinStatusPill(),
        actions: [
          { label: "Join Freehub Club", href: "/club/", className: "btn--primary" },
          { label: "View your Club dashboard", href: "/club/dashboard/", className: "btn--secondary" },
          { label: "Read the campaign rules", href: "/refer-and-win/terms/", className: "btn--secondary" },
        ],
        trustItems: ["Free to enter", "Approved referrals only", "Marketing consent is optional"],
        previewMarkup: renderReferAndWinPreviewPanel(),
      })}
      <main id="main-content" class="main-content refer-page">
        ${renderPublicReferralSignup()}

        <section class="club-section club-section--notice refer-status-notice">
          <div>
            <p class="section-kicker">Campaign status</p>
            <h2>Live now</h2>
            <p>The first campaign runs from ${escapeHtml(FREEHUB_REFER_WIN_CONFIG.campaignPeriodLabel)}. The next campaign runs from ${escapeHtml(FREEHUB_REFER_WIN_CONFIG.nextCampaignPeriodLabel)}. Prize counting depends on approved referrals after manual review; there is no public leaderboard and no automatic winner selection.</p>
          </div>
          <a class="btn btn--primary" href="/refer-and-win/terms/">Read campaign rules</a>
        </section>

        <section class="club-section" aria-label="How Refer and Win will work">
          <p class="section-kicker">How it works</p>
          <h2>Five steps</h2>
          <ol class="refer-steps">
            <li><strong>Create your referral link</strong><span>Enter a WhatsApp number or email on this page, or sign into Freehub Club for the full account version.</span></li>
            <li><strong>Share on WhatsApp</strong><span>Use the WhatsApp share button or copy your link for friends and family.</span></li>
            <li><strong>Friends visit Freehub</strong><span>Referral attribution may be captured when someone arrives from your valid referral link.</span></li>
            <li><strong>Friends join or follow</strong><span>Friends can create their own quick link, join Freehub Club or follow the WhatsApp channel.</span></li>
            <li><strong>Approved referrals count</strong><span>Only referrals approved through manual review count towards the July campaign.</span></li>
          </ol>
          <p class="refer-note">Only approved referrals count. Approval is subject to manual review. No purchase is required.</p>
        </section>

        <section class="club-section club-section--split" aria-label="Prize preview and approved referrals">
          <article>
            <p class="section-kicker">Prize</p>
            <h2>${escapeHtml(FREEHUB_REFER_WIN_CONFIG.monthlyPrizeLabel)}</h2>
            <p>The first campaign prize is fulfilled as an airtime top-up or airtime voucher to a supported South African mobile number.</p>
            <p>A WhatsApp number or email lets Freehub contact you about your quick referral link. A supported South African mobile number may still be needed before airtime can be fulfilled if you are selected after review.</p>
          </article>
          <article>
            <p class="section-kicker">Approved referrals</p>
            <h2>What may count</h2>
            <ul class="refer-check-list">
              <li>The referred person is new to Freehub Club.</li>
              <li>The referred person arrives through a valid referral link or referral code.</li>
              <li>The referred person joins the Club, follows the WhatsApp channel, or creates a quick referral lead that can be reviewed.</li>
              <li>The referral is not a self-referral.</li>
              <li>The referral is not duplicate, fake, automated or suspicious.</li>
              <li>The referral is approved through manual review.</li>
            </ul>
          </article>
        </section>

        <section class="club-section club-section--split" aria-label="Referral exclusions and fairness">
          <article>
            <p class="section-kicker">What does not count</p>
            <h2>Rejected referral examples</h2>
            <ul class="refer-check-list">
              <li>Self-referrals.</li>
              <li>Duplicate accounts.</li>
              <li>Fake or automated registrations.</li>
              <li>Incomplete or suspicious profiles.</li>
              <li>Referrals created by misleading users.</li>
              <li>Referrals that breach the rules or cannot be verified.</li>
            </ul>
          </article>
          <article>
            <p class="section-kicker">Fairness and review</p>
            <h2>Manual review comes first</h2>
            <p>Referrals are reviewed before they count. Suspicious activity may be rejected, and the highest count is not final until review is complete.</p>
            <p>Freehub may delay, reject or review referrals if there are technical, fraud, abuse or compliance concerns. Public winner announcements will only happen after confirmation.</p>
          </article>
        </section>

        <section class="club-section club-section--split" aria-label="Example leaderboard and privacy">
          <article class="refer-example-board">
            <p class="section-kicker">No public leaderboard</p>
            <h2>Review stays private</h2>
            <p>Freehub does not publish emails, mobile numbers, Firebase UIDs or private referral records. Admin review and provisional counts stay inside the private referral admin area.</p>
            <p>Winner confirmation happens only after Freehub checks referral quality, participant readiness and rule compliance.</p>
          </article>
          <article>
            <p class="section-kicker">Privacy</p>
            <h2>Personal details stay private</h2>
            <p>Freehub uses account and referral information to manage Freehub Club, referral tracking, campaign administration, fraud prevention, and prize fulfilment where applicable.</p>
            <p>Marketing messages are optional and require separate consent. Personal information is not shown publicly, and users can unsubscribe from marketing messages later if they opted in.</p>
          </article>
        </section>

        <section class="trust-faq" aria-label="Freehub Refer and Win FAQ">
          <div class="home-section__header">
            <div>
              <p class="section-kicker">FAQ</p>
              <h2 class="home-section__title">Refer &amp; Win questions</h2>
            </div>
          </div>
          ${faqItems
            .map(
              (item) => `<details class="trust-faq__item">
            <summary>${escapeHtml(item.question)}</summary>
            <p>${escapeHtml(item.answer)}</p>
          </details>`
            )
            .join("\n          ")}
        </section>
      </main>`,
  });
}

function renderReferAndWinTermsPage() {
  const canonicalUrl = `${shared.CANONICAL_ORIGIN}/refer-and-win/terms/`;
  const title = "Freehub Refer & Win First Campaign Rules | Freehub";
  const description =
    "Read the Freehub Refer & Win first campaign rules for the R250 airtime referral campaign running from 18 June to 31 July 2026, including eligibility, manual review, prize fulfilment, privacy and tie-breaker details.";
  const sections = [
    {
      heading: "1. Promoter",
      paragraphs: [
        `${FREEHUB_REFER_WIN_CONFIG.promoterName} is the promoter of this Freehub Refer & Win campaign.`,
        `Campaign support contact: ${FREEHUB_REFER_WIN_CONFIG.promoterContactEmail}.`,
      ],
    },
    { heading: "2. Campaign name", paragraphs: ["Freehub Refer & Win."] },
    { heading: "3. Territory", paragraphs: ["South Africa."] },
    {
      heading: "4. Eligibility",
      list: [
        "Open to South African residents.",
        "Participants must be 18 years or older.",
        "Participants can create a quick referral link with a WhatsApp number or email, or use a valid Freehub Club account.",
        "Participants must accept these rules and provide a valid contact route for campaign administration and airtime fulfilment.",
        "Freehub may require a selected quick-link participant to confirm details or create/verify a Freehub Club account before prize fulfilment.",
        "Participants must comply with the rules.",
        "Freehub may exclude accounts involved in fraud, abuse, duplicate registrations or misleading referral activity.",
      ],
    },
    {
      heading: "5. Campaign period",
      paragraphs: [
        `The first campaign period is ${FREEHUB_REFER_WIN_CONFIG.campaignPeriodLabel}.`,
        `The next campaign is planned for ${FREEHUB_REFER_WIN_CONFIG.nextCampaignPeriodLabel}.`,
        "Only referrals attributed to the active campaign period can be considered for that campaign's prize.",
      ],
    },
    {
      heading: "6. Prize",
      paragraphs: [
        `The prize is ${FREEHUB_REFER_WIN_CONFIG.monthlyPrizeLabel}.`,
        `${FREEHUB_REFER_WIN_CONFIG.prizeFulfilmentLabel}.`,
        "The prize is not transferable and is not exchangeable for cash unless Freehub confirms otherwise in writing.",
      ],
    },
    { heading: "7. No purchase required", paragraphs: ["No purchase is required to participate in Refer & Win. Paid SMS, shortcode entry and paid access are not part of this campaign."] },
    {
      heading: "8. How to participate",
      paragraphs: ["To participate in the first Refer & Win campaign:"],
      list: [
        "Create a quick referral link on the public Refer & Win page with a WhatsApp number or email, or join Freehub Club and use your Club referral link.",
        "Accept the Freehub Refer & Win rules and prize-contact consent.",
        "Get your referral link.",
        "Share your referral link.",
        "Referred users visit Freehub, follow the WhatsApp channel, create their own quick link or join Freehub Club through that link.",
        "Referrals are reviewed.",
        "Approved referrals count towards the active campaign period.",
      ],
    },
    {
      heading: "9. Referral link mechanic",
      paragraphs: [
        "Each quick-link participant or Freehub Club member receives a unique referral code. Referral links may look like /refer-and-win/?ref=FHXXXXX or /club/?ref=FHXXXXX.",
        "Referral attribution may be stored for a limited period. Only valid referral codes can be considered, and a click alone does not create an approved referral.",
      ],
    },
    {
      heading: "10. Approved referral definition",
      paragraphs: [
        "An approved referral is a referral reviewed and approved by Freehub or an authorised admin for the active campaign period.",
        "A referral is not approved just because someone clicked a link. A referral is not approved just because someone signed in.",
        "A referral is eligible only if the referrer accepted the rules, supplied a valid contact route, and passed manual review.",
      ],
    },
    {
      heading: "11. What does not count",
      list: [
        "Self-referrals.",
        "Duplicate accounts.",
        "Fake accounts.",
        "Automated or bot registrations.",
        "Misleading sharing.",
        "Incomplete or unverifiable sign-ups.",
        "Referrals that breach the rules.",
        "Referrals generated by abuse of the system.",
      ],
    },
    {
      heading: "12. Manual review",
      paragraphs: [
        "All referrals are subject to manual review. Status may be pending, approved or rejected.",
        "Freehub can reject suspicious referrals. Monthly totals are not final until review is complete.",
        "Admin approval is required before any referral counts towards the prize.",
      ],
    },
    {
      heading: "13. Winner selection",
      paragraphs: [
        "The eligible participant with the highest number of approved referrals in the active campaign period may be selected as the winner, subject to participant eligibility checks, manual referral review and final admin confirmation.",
        "No winner is selected automatically by the website.",
      ],
    },
    {
      heading: "14. Tie-breaker",
      paragraphs: [
        FREEHUB_REFER_WIN_CONFIG.tieBreakerLabel,
      ],
    },
    {
      heading: "15. Winner notification",
      list: [
        FREEHUB_REFER_WIN_CONFIG.winnerNotificationLabel,
        "A selected winner may need to confirm the mobile number and any reasonable information needed for prize fulfilment.",
        "Freehub will not ask winners for banking passwords, card PINs, one-time PINs or remote access.",
      ],
    },
    {
      heading: "16. Prize fulfilment",
      paragraphs: [
        `${FREEHUB_REFER_WIN_CONFIG.prizeFulfilmentLabel}.`,
        "Freehub may use a third-party airtime provider, voucher provider, mobile network product or manual airtime purchase route to fulfil the prize.",
        "Prize fulfilment depends on the mobile number and network being supported by the selected fulfilment method.",
      ],
    },
    {
      heading: "17. Mobile number use",
      paragraphs: [
        "A South African mobile number is preferred for Refer & Win because the prize is airtime and Freehub needs a valid number for prize fulfilment. Quick-link participants may provide an email address first, but a selected winner may still need to provide a supported South African mobile number before fulfilment.",
        "Freehub may use the supplied contact details to administer Refer & Win, prevent abuse, contact the participant if needed, verify prize readiness and fulfil airtime prizes where applicable.",
        "Mobile numbers and email addresses are not shown publicly.",
      ],
    },
    {
      heading: "18. Publicity",
      paragraphs: [
        "Freehub may publish anonymised winner information, such as a first name, province, masked referral code or non-identifying campaign summary.",
        "Personal details, emails, full mobile numbers and Firebase UIDs will not be published publicly.",
      ],
    },
    {
      heading: "19. Data protection and privacy",
      paragraphs: [
        "Freehub processes account, referral, quick-link, consent, email and mobile-number information for account management, referral tracking, campaign administration, fraud prevention, support, record keeping and prize fulfilment.",
        "Freehub does not publish emails, mobile numbers, Firebase UIDs or private referral records. Refer & Win does not improve a user's chance of winning third-party competitions listed on Freehub.",
      ],
    },
    {
      heading: "20. Marketing consent",
      paragraphs: [
        "Marketing consent is optional and is not required to participate.",
        "A participant can opt into Refer & Win without agreeing to receive Freehub marketing messages.",
      ],
    },
    {
      heading: "21. Changes, suspension or cancellation",
      paragraphs: [
        "Freehub may amend, pause or cancel the campaign if technical issues, fraud, abuse, operational constraints or legal/compliance concerns arise.",
        "Changes should be communicated clearly.",
      ],
    },
    {
      heading: "22. Contact/support",
      paragraphs: [`For Freehub support, contact ${FREEHUB_REFER_WIN_CONFIG.promoterContactEmail}.`],
    },
    {
      heading: "23. Record keeping",
      paragraphs: [
        "Freehub may keep referral, review, consent, eligibility and prize-fulfilment records needed to administer the campaign, prevent abuse, handle support queries and evidence manual review decisions.",
        "Referral review records remain private and are not a public leaderboard.",
      ],
    },
  ];

  return renderReferAndWinShell({
    title,
    description,
    canonicalUrl,
    pageType: "refer_win_terms",
    robots: "index, follow, max-image-preview:large",
    body: `
      ${renderModernHero({
        className: "hero--refer-win hero--collection hero--no-preview",
        eyebrow: "Campaign rules",
        heading: "Freehub Refer & Win First Campaign Rules",
        intro:
          "These rules apply to the first Freehub Refer & Win campaign, running from 18 June 2026 to 31 July 2026. The prize is R250 airtime and referrals only count after manual admin review.",
        updatedMarkup: renderReferWinStatusPill(),
        actions: [
          { label: "Back to Refer & Win", href: "/refer-and-win/", className: "btn--primary" },
          { label: "Join Freehub Club", href: "/club/", className: "btn--secondary" },
        ],
        trustItems: ["Free to enter", "R250 airtime", "Manual review required"],
      })}
      <main id="main-content" class="main-content refer-page refer-terms-page">
        <section class="club-section club-section--notice refer-status-notice">
          <div>
            <p class="section-kicker">Status notice</p>
            <h2>Live now</h2>
            <p>The first campaign period is ${escapeHtml(FREEHUB_REFER_WIN_CONFIG.campaignPeriodLabel)}. The next campaign is planned for ${escapeHtml(FREEHUB_REFER_WIN_CONFIG.nextCampaignPeriodLabel)}. Referrals stay pending until reviewed by an authorised Freehub admin. No public leaderboard, automatic winner selection, SMS billing or shortcode entry is enabled.</p>
          </div>
          <a class="btn btn--primary" href="/club/dashboard/">View Club dashboard</a>
        </section>

        <section class="club-section refer-terms">
          ${sections.map(renderReferTermsSection).join("\n          ")}
        </section>
      </main>`,
  });
}

function renderReferAndWinShell({
  title,
  description,
  canonicalUrl,
  pageType,
  body,
  structuredDataScripts = "",
  robots = "index, follow, max-image-preview:large",
}) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeAttribute(description)}" />
    <meta name="robots" content="${escapeAttribute(robots)}" />
    <link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeAttribute(title)}" />
    <meta property="og:description" content="${escapeAttribute(description)}" />
    <meta property="og:url" content="${escapeAttribute(canonicalUrl)}" />
    <meta property="og:image" content="${escapeAttribute(shared.DEFAULT_OG_IMAGE)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttribute(title)}" />
    <meta name="twitter:description" content="${escapeAttribute(description)}" />
    <meta name="twitter:image" content="${escapeAttribute(shared.DEFAULT_OG_IMAGE)}" />
    ${structuredDataScripts}
    ${renderReferWinConfigScript()}
    <link rel="stylesheet" href="${escapeAttribute(getStylesheetHref("/"))}" />
    ${ADSENSE_SCRIPT}
    ${renderGoogleTagManagerHead(`{ page_type: ${escapeScript(JSON.stringify(pageType))} }`)}
    ${renderMetaPixelHead()}
  </head>
  <body>
    ${renderGoogleTagManagerNoScript()}
    ${renderMetaPixelNoScript()}
    <div class="site-shell">
      ${renderTopNavigation({ active: "club" })}
      ${body}
      ${renderSiteFooter()}
    </div>
    <script type="module" src="/shared/auth-ui.js"></script>
    <script type="module" src="/shared/refer-win-ui.js"></script>
  </body>
</html>
`;
}

function renderReferWinConfigScript() {
  const clubConfig = {
    referWinCampaignEnabled: FREEHUB_REFER_WIN_CONFIG.referWinCampaignEnabled,
    campaignMonth: FREEHUB_REFER_WIN_CONFIG.campaignMonth,
    campaignStatusLabel: FREEHUB_REFER_WIN_CONFIG.campaignStatusLabel,
    monthlyPrizeLabel: FREEHUB_REFER_WIN_CONFIG.monthlyPrizeLabel,
    mobileNumberRequiredForParticipation: FREEHUB_REFER_WIN_CONFIG.mobileNumberRequiredForParticipation,
    publicLeaderboardEnabled: FREEHUB_REFER_WIN_CONFIG.publicLeaderboardEnabled,
    adminReviewRequired: FREEHUB_REFER_WIN_CONFIG.adminReviewRequired,
    marketingConsentRequired: FREEHUB_REFER_WIN_CONFIG.marketingConsentRequired,
  };

  return `<script>window.FREEHUB_REFER_WIN_CONFIG = ${escapeScript(
    JSON.stringify(FREEHUB_REFER_WIN_CONFIG)
  )}; window.FREEHUB_CLUB_CONFIG = ${escapeScript(JSON.stringify(clubConfig))};</script>`;
}

function renderReferWinStatusPill(label = FREEHUB_REFER_WIN_CONFIG.campaignStatusLabel) {
  return `<p class="refer-status-pill">${escapeHtml(label)}</p>`;
}

function renderReferAndWinPreviewPanel() {
  return `<aside class="hero-preview-panel hero-preview-panel--refer" aria-label="Refer and Win status preview">
            <p class="hero-preview-panel__kicker">First campaign</p>
            <h2 class="hero-preview-panel__title">${escapeHtml(FREEHUB_REFER_WIN_CONFIG.monthlyPrizeLabel)}</h2>
            <p class="hero-preview-panel__intro">Free-to-enter monthly challenge for approved Freehub Club referrals.</p>
            <ul class="hero-preview-panel__list">
              <li><span>Mechanic</span><strong>Most approved referrals</strong></li>
              <li><span>Review</span><strong>Manual approval required</strong></li>
              <li><span>Privacy</span><strong>No public leaderboard</strong></li>
            </ul>
            <p class="hero-preview-panel__note">No purchase required. Marketing consent is optional.</p>
          </aside>`;
}

function renderPublicReferralSignup() {
  return `<section class="club-section public-referral-card" aria-label="Create a Freehub referral link">
          <div class="public-referral-card__header">
            <div>
              <p class="section-kicker">Quick referral link</p>
              <h2>Get your link without creating a full account</h2>
              <p>Enter a WhatsApp number or email so Freehub can contact you if your referral entries are selected. Your friends can use your link to join the Club or follow the WhatsApp channel.</p>
            </div>
            <a class="btn btn--whatsapp" href="${escapeAttribute(WHATSAPP_CHANNEL_URL)}" target="_blank" rel="noopener noreferrer">Follow on WhatsApp</a>
          </div>
          <form class="public-referral-form" data-public-referral-form>
            <label>
              <span>WhatsApp number or email</span>
              <input type="text" inputmode="email" autocomplete="email tel" maxlength="160" placeholder="082 123 4567 or name@email.com" data-public-referral-contact required />
            </label>
            <label class="club-checkbox-row">
              <input type="checkbox" data-public-referral-terms required />
              <span>I accept the Freehub Refer &amp; Win rules and understand referrals only count after review.</span>
            </label>
            <label class="club-checkbox-row">
              <input type="checkbox" data-public-referral-prize-consent required />
              <span>I understand Freehub may use this contact for campaign administration, abuse prevention, winner contact and airtime fulfilment where applicable.</span>
            </label>
            <label class="club-checkbox-row">
              <input type="checkbox" data-public-referral-marketing />
              <span>I agree to receive Freehub competition updates. This is optional.</span>
            </label>
            <div class="club-form-actions">
              <button class="btn btn--primary" type="submit">Create my referral link</button>
              <p class="club-form-status" data-public-referral-status aria-live="polite"></p>
            </div>
          </form>
          <article class="public-referral-result" data-public-referral-result hidden>
            <div>
              <p class="section-kicker">Your referral code</p>
              <h3 data-public-referral-code>FHXXXXX</h3>
              <p>Saved for <span data-public-referral-contact-masked>your contact</span>. Share this link with friends so Freehub can track the referral source.</p>
            </div>
            <div class="club-copy-row">
              <input type="text" readonly data-public-referral-link aria-label="Your Freehub referral link" />
              <button class="btn btn--secondary" type="button" data-public-referral-action="copy">Copy</button>
              <button class="btn btn--whatsapp" type="button" data-public-referral-action="whatsapp">Share on WhatsApp</button>
              <a class="btn btn--secondary" href="${escapeAttribute(WHATSAPP_CHANNEL_URL)}" target="_blank" rel="noopener noreferrer" data-public-referral-channel-link data-public-referral-action="channel">Join channel</a>
            </div>
            <p class="refer-note">For stronger prize eligibility, you can still create a full Freehub Club account later using the same referral journey.</p>
          </article>
        </section>`;
}

function renderReferTermsSection(section) {
  const paragraphs = (section.paragraphs || [])
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("\n              ");
  const list = Array.isArray(section.list)
    ? `<ul>${section.list.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n                ")}</ul>`
    : "";

  return `<article class="refer-terms__section">
            <h2>${escapeHtml(section.heading)}</h2>
            ${paragraphs}
            ${list}
          </article>`;
}

function renderClubShell({ title, description, canonicalUrl, robots, pageType, body, structuredDataScripts = "" }) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeAttribute(description)}" />
    <meta name="robots" content="${escapeAttribute(robots)}" />
    <link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeAttribute(title)}" />
    <meta property="og:description" content="${escapeAttribute(description)}" />
    <meta property="og:url" content="${escapeAttribute(canonicalUrl)}" />
    <meta property="og:image" content="${escapeAttribute(shared.DEFAULT_OG_IMAGE)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttribute(title)}" />
    <meta name="twitter:description" content="${escapeAttribute(description)}" />
    <meta name="twitter:image" content="${escapeAttribute(shared.DEFAULT_OG_IMAGE)}" />
    ${structuredDataScripts}
    ${renderReferWinConfigScript()}
    <link rel="stylesheet" href="${escapeAttribute(getStylesheetHref("/"))}" />
    ${ADSENSE_SCRIPT}
    ${renderGoogleTagManagerHead(`{ page_type: ${escapeScript(JSON.stringify(pageType))} }`)}
    ${renderMetaPixelHead()}
  </head>
  <body>
    ${renderGoogleTagManagerNoScript()}
    ${renderMetaPixelNoScript()}
    <div class="site-shell">
      ${renderTopNavigation({ active: "club" })}
      ${body}
      ${renderSiteFooter({ includeAuthPanel: false })}
    </div>
    <script type="module" src="/shared/club-ui.js"></script>
    <script type="module" src="/shared/club-tools.js"></script>
    <script type="module" src="/shared/auth-ui.js"></script>
  </body>
</html>
`;
}

function renderClubPreviewPanel() {
  return `<aside class="hero-preview-panel hero-preview-panel--club" aria-label="Freehub Club preview">
            <p class="hero-preview-panel__eyebrow">Member toolkit</p>
            <h2 class="hero-preview-panel__title">Your competition shortlist</h2>
            <ul class="hero-preview-panel__list">
              <li><span>Interested</span><strong>Save before you enter</strong></li>
              <li><span>Entered</span><strong>Track what you have done</strong></li>
              <li><span>Skipped</span><strong>Clear out weak listings</strong></li>
            </ul>
            <p class="hero-preview-panel__note">Referral records stay pending until a campaign is live.</p>
          </aside>`;
}

function renderCompetitionSubmissionForm() {
  return `<section class="submission-panel" aria-labelledby="competitionSubmissionTitle">
          <div class="submission-panel__header">
            <p class="section-kicker">Submit for review</p>
            <h2 id="competitionSubmissionTitle">Competition submission details</h2>
            <p>Submissions are saved to Freehub's private review queue and marked pending review. Freehub does not accept consumer competition entries here.</p>
          </div>
          <form class="submission-form" data-competition-submission-form>
            <div class="submission-form__grid">
              <label>
                <span>Company or brand</span>
                <input name="companyName" type="text" autocomplete="organization" maxlength="120" required />
              </label>
              <label>
                <span>Contact name</span>
                <input name="contactName" type="text" autocomplete="name" maxlength="120" required />
              </label>
              <label>
                <span>Contact email</span>
                <input name="contactEmail" type="email" autocomplete="email" maxlength="160" required />
              </label>
              <label>
                <span>Competition title</span>
                <input name="competitionTitle" type="text" maxlength="160" required />
              </label>
              <label>
                <span>Official competition URL</span>
                <input name="officialUrl" type="url" inputmode="url" maxlength="500" required />
              </label>
              <label>
                <span>Terms URL</span>
                <input name="termsUrl" type="url" inputmode="url" maxlength="500" />
              </label>
              <label>
                <span>Campaign image or logo URL</span>
                <input name="campaignImageUrl" type="url" inputmode="url" maxlength="500" />
              </label>
              <label>
                <span>Closing date</span>
                <input name="closingDate" type="date" required />
              </label>
              <label>
                <span>Entry method</span>
                <select name="entryMethod" required>
                  <option value="">Select one</option>
                  <option value="online-form">Online form</option>
                  <option value="app">App</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="sms">SMS</option>
                  <option value="ussd">USSD</option>
                  <option value="till-slip">Till slip or receipt</option>
                  <option value="in-store">In store</option>
                  <option value="social">Social media</option>
                  <option value="paid-ticket">Paid ticket</option>
                  <option value="other">Other or mixed</option>
                </select>
              </label>
            </div>
            <label>
              <span>Prize details</span>
              <textarea name="prizeDetails" rows="4" maxlength="1200" required></textarea>
            </label>
            <label>
              <span>Purchase, eligibility or account requirements</span>
              <textarea name="requirements" rows="4" maxlength="1200"></textarea>
            </label>
            <label>
              <span>Extra notes for Freehub review</span>
              <textarea name="notes" rows="4" maxlength="1200"></textarea>
            </label>
            <label class="submission-form__consent">
              <input name="submissionConsent" type="checkbox" required />
              <span>I am submitting public campaign information for Freehub review and I will not include customer entries, identity documents, banking details or private winner information.</span>
            </label>
            <div class="submission-form__actions">
              <button class="btn btn--primary" type="submit">Submit for Review</button>
              <p class="submission-form__status" data-submission-status aria-live="polite"></p>
            </div>
          </form>
        </section>`;
}

function getTrustPageResources(page) {
  const categories = Array.isArray(page.resourceCategories) ? page.resourceCategories : [];

  if (categories.length === 0) {
    return [];
  }

  return FREE_RESOURCES.filter((resource) => categories.includes(resource.category));
}

function getTrustPageLastmod(page) {
  const dates = [
    page.dateModified,
    ...getTrustPageResources(page).flatMap((resource) => [
      resource.dateModified,
      resource.lastReviewed,
    ]),
  ]
    .map(normalizeIsoDateString)
    .filter(Boolean)
    .sort();

  return dates.length > 0 ? dates[dates.length - 1] : page.datePublished || BUILD_DATE_ISO;
}

function renderFreeResourceSection(page, resources) {
  if (!Array.isArray(resources) || resources.length === 0) {
    return "";
  }

  return `<section class="free-resource-section" aria-label="${escapeAttribute(page.resourceTitle || "Official free resources")}">
          <div class="free-resource-section__header">
            <p class="section-kicker">Official Websites</p>
            <h2>${escapeHtml(page.resourceTitle || "Best free options right now")}</h2>
            <p>${escapeHtml(page.resourceIntro || "Use official source links and check what is actually free before signing up.")}</p>
          </div>
          <div class="free-resource-grid">
            ${resources.map(renderFreeResourceCard).join("\n            ")}
          </div>
        </section>`;
}

function renderFreeResourceCard(resource) {
  const rel = resource.internal ? "" : ' rel="nofollow noopener" target="_blank"';
  const linkLabel = resource.internal ? "Read guide" : "Official website";

  return `<article class="free-resource-card">
              <div class="free-resource-card__top">
                <span class="free-resource-card__category">${escapeHtml(resource.categoryLabel)}</span>
                <span class="free-resource-card__reviewed">Reviewed ${escapeHtml(shared.formatDate(resource.lastReviewed))}</span>
              </div>
              <h3>${escapeHtml(resource.name)}</h3>
              <dl class="free-resource-card__facts">
                <div>
                  <dt>Best for</dt>
                  <dd>${escapeHtml(resource.bestFor)}</dd>
                </div>
                <div>
                  <dt>What is free</dt>
                  <dd>${escapeHtml(resource.freeDetails)}</dd>
                </div>
                <div>
                  <dt>Requirements</dt>
                  <dd>${escapeHtml(resource.requirements)}</dd>
                </div>
                <div>
                  <dt>Check first</dt>
                  <dd>${escapeHtml(resource.watchOut)}</dd>
                </div>
              </dl>
              <a class="free-resource-card__link" href="${escapeAttribute(resource.officialUrl)}"${rel}>${escapeHtml(linkLabel)}</a>
            </article>`;
}

function renderTrustChecklist(page) {
  const checklist = Array.isArray(page.checklist) ? page.checklist : [];
  const avoid = Array.isArray(page.avoid) ? page.avoid : [];

  if (checklist.length === 0 && avoid.length === 0) {
    return "";
  }

  return `<section class="free-resource-advice" aria-label="Free resource checks">
          ${renderTrustChecklistPanel(page.checklistTitle || "Before you sign up", checklist, "free-resource-advice__panel--positive")}
          ${renderTrustChecklistPanel(page.avoidTitle || "What to avoid", avoid, "free-resource-advice__panel--warning")}
        </section>`;
}

function renderTrustChecklistPanel(title, items, className) {
  if (!Array.isArray(items) || items.length === 0) {
    return "";
  }

  return `<article class="free-resource-advice__panel ${escapeAttribute(className)}">
            <h2>${escapeHtml(title)}</h2>
            <ul>
              ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n              ")}
            </ul>
          </article>`;
}

function renderTrustFaqSection(faqItems) {
  if (!Array.isArray(faqItems) || faqItems.length === 0) {
    return "";
  }

  return `<section class="detail-faq detail-faq--hub" aria-label="Free resource questions">
          <p class="detail-section-title">Common Questions</p>
          ${faqItems
            .map(
              (item) => `<details>
            <summary>${escapeHtml(item.question)}</summary>
            <p>${escapeHtml(item.answer)}</p>
          </details>`
            )
            .join("\n          ")}
        </section>`;
}

function buildFreeResourceItemList(page, resources) {
  if (!Array.isArray(resources) || resources.length === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: page.resourceTitle || page.heading,
    itemListElement: resources.map((resource, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "WebSite",
        name: resource.name,
        url: resource.officialUrl,
        description: resource.freeDetails,
      },
    })),
  };
}

function buildTrustPageFaqStructuredData(faqItems) {
  if (!Array.isArray(faqItems) || faqItems.length === 0) {
    return null;
  }

  return {
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
  };
}

function buildTrustPageServiceStructuredData(page, canonicalUrl) {
  if (!page || !page.service) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.service.name || page.heading,
    serviceType: page.service.serviceType || "Editorial review",
    description: page.description,
    url: canonicalUrl,
    areaServed: {
      "@type": "Country",
      name: "South Africa",
    },
    audience: page.service.audience
      ? {
          "@type": "BusinessAudience",
          audienceType: page.service.audience,
        }
      : undefined,
    provider: {
      "@type": "Organization",
      name: "Freehub",
      url: `${shared.CANONICAL_ORIGIN}/`,
      email: "hello@freehub.co.za",
    },
  };
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
    <link rel="stylesheet" href="${escapeAttribute(getStylesheetHref("/"))}" />
    ${ADSENSE_SCRIPT}
    ${renderGoogleTagManagerHead("{ page_type: '404' }")}
    ${renderMetaPixelHead()}
  </head>
  <body>
    ${renderGoogleTagManagerNoScript()}
    ${renderMetaPixelNoScript()}
    <div class="site-shell">
      ${renderTopNavigation()}
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

      <main id="main-content" class="main-content">
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
    <script type="module" src="/shared/auth-ui.js"></script>
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
  const heroUrgencyFact = expired
    ? "Closed competition"
    : shared.getUrgencyLabel(competition.closingDate);
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
                ${renderCardStatusBadges(competition, { expired })}
              </div>
              <div class="competition-hero-card__facts">
                <span>${escapeHtml(shared.getPrizeCue(competition))}</span>
                <span>${escapeHtml(shared.getEntryCostLabel(competition))}</span>
                <span>${escapeHtml(heroUrgencyFact)}</span>
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
  const noindexActive = !expired && shared.getCompetitionVisibility(competition) === "noindex";
  const adsAllowed = !expired && shared.competitionAllowsAds(competition);
  const adScriptMarkup = adsAllowed ? ADSENSE_SCRIPT : "";
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
  const robotsDirective = expired || noindexActive
    ? "noindex, follow"
    : "index, follow, max-image-preview:large";
  const officialSourceUrl = getOfficialSourceUrl(competition);
  const officialSource = getOfficialSourceDomain(competition);
  const lastChecked = formatOptionalDate(competition.lastChecked);

  const closingSoonBadge = !expired && shared.isClosingSoon(competition.closingDate)
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
  const authPanelMarkup = expired ? "" : renderCompetitionAuthPanel(competition, slug, canonicalUrl);

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
    <link rel="stylesheet" href="${escapeAttribute(getStylesheetHref(RELATIVE_ASSET_PATH))}" />
    ${adScriptMarkup}
    ${renderGoogleTagManagerHead(`{ page_type: 'competition', competition_slug: ${escapeScript(JSON.stringify(slug))}, competition_category: ${escapeScript(JSON.stringify(competition.category))} }`)}
    ${renderMetaPixelHead()}
  </head>
  <body>
    ${renderGoogleTagManagerNoScript()}
    ${renderMetaPixelNoScript()}
    <div class="site-shell">
      ${renderTopNavigation({ active: "competitions" })}
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

      <main id="main-content" class="main-content">
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
        ${renderDatacostPromo({
          placement: `competition-${slug}`,
          compact: true,
          ussd: isTelecomOrMobileCompetition(competition),
        })}

        ${adsAllowed ? renderAdZone("ad-top", "detail-top") : ""}

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
            ${authPanelMarkup}
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

        ${adsAllowed ? renderAdZone("ad-middle", "detail-inside", true) : ""}

        ${relatedSection}

        ${adsAllowed ? renderAdZone("ad-bottom", "after-related") : ""}

        ${competition.brand ? `<section class="internal-links" aria-label="More from ${escapeAttribute(competition.brand)}">
          <p class="internal-links__title">More from ${escapeHtml(competition.brand)}</p>
          <div class="internal-links__list">
            <a class="internal-links__link" href="${escapeAttribute(categoryPath)}">Browse ${escapeHtml(competition.category)} competitions</a>
          </div>
        </section>` : ""}

      </main>

      ${renderSiteFooter()}
    </div>

    ${adsAllowed ? '<aside class="ad-sticky ad-sticky--reserved" id="ad-sticky" aria-hidden="true"></aside>' : ""}

    <script src="${RELATIVE_ASSET_PATH}shared/page-data.js" defer></script>
    <script src="${RELATIVE_ASSET_PATH}app.js" defer></script>
    <script type="module" src="${RELATIVE_ASSET_PATH}shared/auth-ui.js"></script>
  </body>
</html>
`;
}

function renderCompetitionAuthPanel(competition, slug, canonicalUrl) {
  return `<section
              class="competition-auth"
              data-freehub-auth
              data-competition-id="${escapeAttribute(slug)}"
              data-competition-slug="${escapeAttribute(slug)}"
              data-competition-title="${escapeAttribute(competition.title)}"
              data-competition-brand="${escapeAttribute(competition.brand || "")}"
              data-competition-category="${escapeAttribute(competition.category)}"
              data-competition-closing-date="${escapeAttribute(competition.closingDate || "")}"
              data-competition-path="${escapeAttribute(canonicalUrl)}"
              aria-label="Optional Freehub account actions"
              hidden
            >
              <div class="competition-auth__copy">
                <p class="competition-auth__title">Optional: save this competition</p>
                <p class="competition-auth__text" data-auth-user>Sign in to save this listing or get alerts. Browsing and entry links stay open.</p>
              </div>
              <div class="competition-auth__actions">
                <button class="competition-auth__button" type="button" data-auth-action="save">Sign in to save</button>
                <button class="competition-auth__button competition-auth__button--secondary" type="button" data-auth-action="alerts">Get competition alerts</button>
                <button class="competition-auth__button competition-auth__button--ghost" type="button" data-auth-action="ignore">Sign in to hide</button>
                <button class="competition-auth__link" type="button" data-auth-action="signin">Sign in to save</button>
                <button class="competition-auth__link" type="button" data-auth-action="signout" hidden>Sign out</button>
              </div>
              <p class="competition-auth__status" data-auth-status aria-live="polite"></p>
            </section>`;
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

function hasPurchaseRequiredSignal(competition) {
  const tags = Array.isArray(competition && competition.tags) ? competition.tags : [];
  const entryCostType = String((competition && competition.entryCostType) || "").toLowerCase();

  return (
    competition &&
    (competition.purchaseRequired === true ||
      entryCostType === "purchase-required" ||
      tags.includes("purchase-required") ||
      tags.includes("till-slip") ||
      tags.includes("till-slip-required") ||
      tags.includes("qualifying-products"))
  );
}

function hasPaidEntrySignal(competition) {
  const tags = Array.isArray(competition && competition.tags) ? competition.tags : [];
  const entryCostType = String((competition && competition.entryCostType) || "").toLowerCase();

  return (
    competition &&
    (entryCostType === "paid-entry" ||
      Number(competition.entryFeeAmount) > 0 ||
      tags.includes("paid-entry") ||
      tags.includes("raffle"))
  );
}

function renderBeforeYouEnterBlock(competition) {
  const costLabel = shared.getEntryCostLabel(competition);
  const entryCostType = String(competition.entryCostType || "").toLowerCase();
  const entryChannel = String(competition.entryChannel || competition.entryType || "").toLowerCase();
  const helpLinks = [
    { label: "How to enter safely", href: "/how-to-enter-competitions-safely/" },
    { label: "Spot scam competitions", href: "/how-to-spot-a-scam-competition/" },
  ];
  const items = [
    "Read the official promoter terms before entering.",
    "Make sure the page you enter on belongs to the official promoter.",
    "Confirm the closing date on the official terms or promoter page.",
    "Freehub lists this competition but does not run it or collect your entry.",
  ];

  if (hasPurchaseRequiredSignal(competition)) {
    items.push("Keep your receipt or proof of purchase.");
    helpLinks.push({ label: "Purchase required guide", href: "/purchase-required-competitions-explained/" });
    if (competition.requiredProduct) {
      items.push("Check the qualifying products and participating stores.");
    }
    if (competition.minimumSpend || competition.minimumSpendAmount) {
      items.push("Confirm the minimum spend before buying.");
    }
  }

  if (hasPaidEntrySignal(competition) || costLabel === "Paid entry") {
    items.push("Check the ticket price and official payment flow.");
    items.push("Only buy through the official promoter or ticketing page.");
    helpLinks.push({ label: "Paid entry guide", href: "/paid-entry-competitions-explained/" });
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
              <p>Check the promoter's official terms, closing date and entry requirements before entering. Freehub summarises competitions to help users compare them, but the promoter's official page is the source of truth.</p>
              <ul>
                ${items.slice(0, 7).map((item) => `<li>${escapeHtml(item)}</li>`).join("\n                ")}
              </ul>
              <div class="internal-links__list">
                ${helpLinks
                  .map(
                    (link) =>
                      `<a class="internal-links__link" href="${escapeAttribute(link.href)}">${escapeHtml(link.label)}</a>`
                  )
                  .join("\n                ")}
              </div>
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
    <link rel="stylesheet" href="${escapeAttribute(getStylesheetHref(RELATIVE_ASSET_PATH))}" />
    ${ADSENSE_SCRIPT}
    ${renderGoogleTagManagerHead(`{ page_type: 'inactive_competition', competition_slug: ${escapeScript(JSON.stringify(slug))}, competition_category: ${escapeScript(JSON.stringify(competition.category))} }`)}
    ${renderMetaPixelHead()}
  </head>
  <body>
    ${renderGoogleTagManagerNoScript()}
    ${renderMetaPixelNoScript()}
    <div class="site-shell">
      ${renderTopNavigation({ active: "competitions" })}
      ${renderModernHero({
        className: "hero--utility hero--closed-listing",
        eyebrow: "Inactive listing",
        heading: title,
        intro: "This listing is not active on Freehub. It is kept as a legacy reference, but it is not shown as a current competition or open entry.",
        actions,
        trustItems: ["Not active on Freehub", "No active entry shown", "Source details can change"],
      })}

      <main id="main-content" class="main-content">
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
    <link rel="stylesheet" href="${escapeAttribute(getStylesheetHref(RELATIVE_ASSET_PATH))}" />
    ${ADSENSE_SCRIPT}
    ${renderGoogleTagManagerHead(`{ page_type: 'outbound', competition_slug: ${escapeScript(JSON.stringify(slug))}, competition_category: ${escapeScript(JSON.stringify(competition.category))} }`)}
    ${renderMetaPixelHead()}
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
    ${renderGoogleTagManagerNoScript()}
    ${renderMetaPixelNoScript()}
    <div class="site-shell">
      ${renderTopNavigation({ active: "competitions" })}
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

      <main id="main-content" class="main-content">
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

      ${renderSiteFooter({ includeAuthPanel: false })}
    </div>
  </body>
</html>
`;
}

function renderCompetitionInternalLinks(competition, categoryPath, generatedBrandSlugs = []) {
  const links = [{ label: `All ${competition.category} competitions`, href: categoryPath }];
  const entryCostType = String(competition.entryCostType || "").toLowerCase();
  const brandSlug = shared.getBrandSlugForCompetition(competition, generatedBrandSlugs);
  const slug = shared.getCompetitionSlug(competition);

  if (brandSlug) {
    links.push({ label: `More ${competition.brand} competitions`, href: `/brand/${brandSlug}/` });
  }

  if (competition.category === "Cars" || String(competition.prizeType || "").toLowerCase() === "car") {
    links.push({ label: "Win a car competitions", href: "/win-a-car/" });
  }

  if (slug === "clere-share-of-r1-million-cash-2026") {
    links.push({ label: "Clere For Men competition", href: "/competition/clere-for-men-play-it-smooth-2026/" });
    links.push({ label: "Knorr competition 2026", href: "/competition/knorr-win-r5000-weekly-2026/" });
  }
  if (slug === "clere-for-men-play-it-smooth-2026") {
    links.push({ label: "Clere competition 2026", href: "/competition/clere-share-of-r1-million-cash-2026/" });
  }
  if (slug === "knorr-win-r5000-weekly-2026") {
    links.push({ label: "Clere competition 2026", href: "/competition/clere-share-of-r1-million-cash-2026/" });
  }

  if (hasPurchaseRequiredSignal(competition)) {
    links.push({ label: "Purchase required competitions", href: "/purchase-required-competitions/" });
  } else if (hasPaidEntrySignal(competition)) {
    links.push({ label: "Paid entry competitions", href: "/paid-entry-competitions/" });
  } else if (entryCostType === "free-entry") {
    links.push({ label: "Free competitions", href: "/free-competitions/" });
  }

  links.push({ label: "How to enter competitions safely", href: "/how-to-enter-competitions-safely/" });
  links.push({ label: "How to spot scam competitions", href: "/how-to-spot-a-scam-competition/" });
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

    if (competition.visibility && !["public", "noindex", "club_only"].includes(String(competition.visibility).trim().toLowerCase())) {
      errors.push(`Invalid visibility value for ${label}: ${competition.visibility}.`);
    }

    if (competition.riskLevel && !["low", "medium", "high"].includes(String(competition.riskLevel).trim().toLowerCase())) {
      errors.push(`Invalid riskLevel value for ${label}: ${competition.riskLevel}.`);
    }

    if (competition.adsAllowed !== undefined && typeof competition.adsAllowed !== "boolean") {
      errors.push(`adsAllowed must be boolean when present: ${label}.`);
    }

    if (competition.requiresAgeGate !== undefined && typeof competition.requiresAgeGate !== "boolean") {
      errors.push(`requiresAgeGate must be boolean when present: ${label}.`);
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

  const staticEntries = routeContexts
    .filter((routeContext) => routeContext.noindex !== true)
    .map((routeContext) => {
      const loc = routeContext.path === "/" ? `${origin}/` : `${origin}${routeContext.path}`;
      return renderSitemapUrl({
        loc,
        lastmod: getRouteLastmod(routeContext, competitions),
      });
    });
  const trustPageEntries = getPublicTrustPageDefinitions().map((page) => {
    return renderSitemapUrl({
      loc: `${origin}/${page.slug}/`,
      lastmod: getTrustPageLastmod(page),
    });
  });
  const contentPageEntries = getContentSitemapEntries().map((entry) =>
    renderSitemapUrl({
      loc: `${origin}/${entry.slug}/`,
      lastmod: BUILD_DATE_ISO,
    })
  );
  const clubEntries = [
    renderSitemapUrl({
      loc: `${origin}/club/`,
      lastmod: BUILD_DATE_ISO,
    }),
  ];
  const referAndWinEntries = [
    renderSitemapUrl({
      loc: `${origin}/refer-and-win/`,
      lastmod: BUILD_DATE_ISO,
    }),
    renderSitemapUrl({
      loc: `${origin}/refer-and-win/terms/`,
      lastmod: BUILD_DATE_ISO,
    }),
  ];

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
${[...staticEntries, ...trustPageEntries, ...contentPageEntries, ...clubEntries, ...referAndWinEntries, ...competitionEntries].join("\n")}
</urlset>
`;
}

function getContentSitemapEntries() {
  return [...CONTENT_INDEX_PAGES, { slug: MONTHLY_GUIDE_SLUG }];
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

  const filteredCompetitions = getRouteCompetitions(competitions, routeContext);
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

function removeStaleVerticalDirectories(generatedVerticalPages) {
  const validVerticalSlugs = new Set(generatedVerticalPages.map((page) => page.slug));

  VERTICAL_PAGE_SLUGS.forEach((slug) => {
    if (validVerticalSlugs.has(slug)) {
      return;
    }

    const stalePath = path.join(ROOT_DIR, slug);
    if (!fs.existsSync(stalePath)) {
      return;
    }

    fs.rmSync(stalePath, { recursive: true, force: true });
    console.log(`[generate-pages] Removed stale vertical directory: ${stalePath}`);
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

function removeLegacyNestedSiteDirectory() {
  const legacyNestedSiteDirectory = path.join(ROOT_DIR, "free-hub");

  if (!fs.existsSync(legacyNestedSiteDirectory)) {
    return;
  }

  const nestedSiteLooksGenerated =
    fs.existsSync(path.join(legacyNestedSiteDirectory, "index.html")) &&
    fs.existsSync(path.join(legacyNestedSiteDirectory, "sitemap.xml")) &&
    fs.existsSync(path.join(legacyNestedSiteDirectory, "competition"));

  if (!nestedSiteLooksGenerated) {
    console.warn(
      `[generate-pages] Skipped removing unexpected nested directory: ${legacyNestedSiteDirectory}`
    );
    return;
  }

  fs.rmSync(legacyNestedSiteDirectory, { recursive: true, force: true });
  console.log(`[generate-pages] Removed stale directory: ${legacyNestedSiteDirectory}`);
}

function runStaticSeoChecks(routeContexts = []) {
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
    ...routeContexts
      .filter((routeContext) => routeContext.type !== "home")
      .map((routeContext) => path.join(ROOT_DIR, routeContext.path.replace(/^\//, "").replace(/\/$/, ""), "index.html")),
    ...getNestedIndexFiles(path.join(ROOT_DIR, "competition")),
    ...getPublicTrustPageDefinitions().map((page) => path.join(ROOT_DIR, page.slug, "index.html")),
    ...getContentIndexFiles(),
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

  runFreeResourceChecks();
}

function runFreeResourceChecks() {
  const errors = [];
  const seenNames = new Set();
  const requiredFields = [
    "name",
    "category",
    "categoryLabel",
    "officialUrl",
    "bestFor",
    "freeDetails",
    "requirements",
    "watchOut",
    "datePublished",
    "lastReviewed",
    "dateModified",
  ];
  const resourceCategoriesUsed = new Set(
    getPublicTrustPageDefinitions().flatMap((page) => (Array.isArray(page.resourceCategories) ? page.resourceCategories : []))
  );

  FREE_RESOURCES.forEach((resource) => {
    const label = resource.name || "(unnamed free resource)";

    if (seenNames.has(label)) {
      errors.push(`Duplicate free resource name: ${label}`);
    }
    seenNames.add(label);

    requiredFields.forEach((field) => {
      if (!resource[field]) {
        errors.push(`Free resource missing ${field}: ${label}`);
      }
    });

    ["datePublished", "lastReviewed", "dateModified"].forEach((field) => {
      if (resource[field] && !normalizeIsoDateString(resource[field])) {
        errors.push(`Free resource has invalid ${field}: ${label}`);
      }
    });

    try {
      const url = new URL(resource.officialUrl);
      if (!["http:", "https:"].includes(url.protocol)) {
        errors.push(`Free resource URL must be http or https: ${label}`);
      }
    } catch (error) {
      errors.push(`Free resource has invalid officialUrl: ${label}`);
    }
  });

  resourceCategoriesUsed.forEach((category) => {
    if (!FREE_RESOURCES.some((resource) => resource.category === category)) {
      errors.push(`Trust page references free-resource category with no resources: ${category}`);
    }
  });

  getPublicTrustPageDefinitions().filter((page) => Array.isArray(page.resourceCategories) && page.resourceCategories.length > 0).forEach(
    (page) => {
      if (!page.datePublished || !page.dateModified) {
        errors.push(`Free-resource page must define explicit datePublished and dateModified: ${page.slug}`);
      }

      if (page.dateModified === BUILD_DATE_ISO && page.dateModified !== page.datePublished) {
        errors.push(`Free-resource page dateModified appears to be using build date by default: ${page.slug}`);
      }
    }
  );

  if (errors.length > 0) {
    throw new Error(`[Free resource checks failed]\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }
}

function runCrawlerVisibleTextChecks(routeContexts = []) {
  const errors = [];
  const crawlerVisibleStrings = [
    "No competitions match",
    "Loading competitions",
    "Unable to load competitions",
    "ad placeholder",
  ];
  const htmlFiles = [
    path.join(ROOT_DIR, "index.html"),
    path.join(ROOT_DIR, "404.html"),
    ...routeContexts
      .filter((routeContext) => routeContext.type !== "home")
      .map((routeContext) => path.join(ROOT_DIR, routeContext.path.replace(/^\//, "").replace(/\/$/, ""), "index.html")),
    ...getNestedIndexFiles(path.join(ROOT_DIR, "competition")),
    ...getPublicTrustPageDefinitions().map((page) => path.join(ROOT_DIR, page.slug, "index.html")),
    ...getContentIndexFiles(),
  ].filter((filePath) => fs.existsSync(filePath));

  htmlFiles.forEach((filePath) => {
    const html = fs.readFileSync(filePath, "utf8");
    crawlerVisibleStrings.forEach((text) => {
      if (html.includes(text)) {
        errors.push(`Crawler-visible placeholder or false empty-state text found in ${filePath}: ${text}`);
      }
    });
  });

  if (errors.length > 0) {
    throw new Error(`[Crawler-visible text checks failed]\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }
}

function runLifecycleStaticChecks(
  allCompetitions,
  activeCompetitions,
  noindexActiveCompetitions,
  expiredArchiveCompetitions,
  expiredLowValueCompetitions,
  routeContexts = []
) {
  const errors = [];
  const activeSlugs = new Set(activeCompetitions.map((competition) => shared.getCompetitionSlug(competition)));
  const noindexActiveSlugs = new Set(noindexActiveCompetitions.map((competition) => shared.getCompetitionSlug(competition)));
  const expiredCompetitions = [...expiredArchiveCompetitions, ...expiredLowValueCompetitions];
  const expiredSlugs = new Set(expiredCompetitions.map((competition) => shared.getCompetitionSlug(competition)));
  const sitemap = fs.readFileSync(path.join(ROOT_DIR, "sitemap.xml"), "utf8");

  activeCompetitions.forEach((competition) => {
    const slug = shared.getCompetitionSlug(competition);
    const detailPath = path.join(ROOT_DIR, "competition", slug, "index.html");

    if (!sitemap.includes(`/competition/${slug}/`)) {
      errors.push(`Active published competition is missing from sitemap: ${slug}`);
    }

    if (!fs.existsSync(detailPath)) {
      errors.push(`Active published competition detail page missing: ${slug}`);
      return;
    }

    const html = fs.readFileSync(detailPath, "utf8");
    if (!html.includes('name="robots" content="index, follow, max-image-preview:large"')) {
      errors.push(`Active published competition missing index robots directive: ${slug}`);
    }
  });

  noindexActiveCompetitions.forEach((competition) => {
    const slug = shared.getCompetitionSlug(competition);
    const detailPath = path.join(ROOT_DIR, "competition", slug, "index.html");

    if (sitemap.includes(`/competition/${slug}/`)) {
      errors.push(`Noindex competition page is included in sitemap: ${slug}`);
    }

    if (!fs.existsSync(detailPath)) {
      errors.push(`Noindex active competition detail page missing: ${slug}`);
      return;
    }

    const html = fs.readFileSync(detailPath, "utf8");
    if (!html.includes('name="robots" content="noindex, follow"')) {
      errors.push(`Noindex active competition missing noindex robots directive: ${slug}`);
    }
    if (html.includes("pagead2.googlesyndication.com") || html.includes("ad-slot")) {
      errors.push(`Noindex active competition includes ad markup: ${slug}`);
    }
  });

  expiredCompetitions.forEach((competition) => {
    const slug = shared.getCompetitionSlug(competition);
    const detailPath = path.join(ROOT_DIR, "competition", slug, "index.html");
    const outPath = path.join(ROOT_DIR, "out", slug, "index.html");

    if (!fs.existsSync(detailPath)) {
      errors.push(`Expired archive page was not generated: ${slug}`);
      return;
    }

    const html = fs.readFileSync(detailPath, "utf8");
    const archiveLeadSection = html.split("Current competitions you may like")[0] || html;
    if (!html.includes("This competition has closed.")) {
      errors.push(`Expired archive page missing closed banner: ${slug}`);
    }
    if (!html.includes('name="robots" content="noindex, follow"')) {
      errors.push(`Expired competition page missing noindex, follow: ${slug}`);
    }
    if (!html.includes("Current competitions you may like")) {
      errors.push(`Expired archive page missing active related section: ${slug}`);
    }
    if (/(Closing soon|Trending|Last chance|Ends today|Ends in \d+ day)/i.test(archiveLeadSection)) {
      errors.push(`Expired archive page still exposes active status messaging: ${slug}`);
    }
    if (
      /href="\/out\//.test(archiveLeadSection) ||
      /<a[^>]*>\s*Enter (Competition|Now|on|via|using)/i.test(archiveLeadSection)
    ) {
      errors.push(`Expired archive page still exposes active entry CTA: ${slug}`);
    }
    if (fs.existsSync(outPath)) {
      errors.push(`Expired competition has generated /out/ page: ${slug}`);
    }
    if (sitemap.includes(`/competition/${slug}/`)) {
      errors.push(`Expired competition page is included in sitemap: ${slug}`);
    }
  });

  expiredLowValueCompetitions.forEach((competition) => {
    const slug = shared.getCompetitionSlug(competition);
    if (sitemap.includes(`/competition/${slug}/`)) {
      errors.push(`Low-value expired page is included in sitemap: ${slug}`);
    }
  });

  const collectionFiles = [
    path.join(ROOT_DIR, "index.html"),
    ...routeContexts
      .filter((routeContext) => routeContext.type !== "home")
      .map((routeContext) => path.join(ROOT_DIR, routeContext.path.replace(/^\//, "").replace(/\/$/, ""), "index.html")),
  ].filter((filePath) => fs.existsSync(filePath));

  const homepagePath = path.join(ROOT_DIR, "index.html");
  if (fs.existsSync(homepagePath)) {
    const homepageHtml = fs.readFileSync(homepagePath, "utf8");
    const topPickCardCount = (homepageHtml.match(/class="top-pick-card"/g) || []).length;
    const topPickSlugs = [...homepageHtml.matchAll(/<article class="top-pick-card"[\s\S]*?href="\/competition\/([^/]+)\//g)].map(
      (match) => match[1]
    );
    const duplicateTopPickSlugs = topPickSlugs.filter((slug, index) => topPickSlugs.indexOf(slug) !== index);

    if (topPickCardCount > 3) {
      errors.push(`Homepage has more than 3 top-pick cards: ${topPickCardCount}`);
    }

    if (duplicateTopPickSlugs.length > 0) {
      errors.push(`Homepage top picks contain duplicate competitions: ${Array.from(new Set(duplicateTopPickSlugs)).join(", ")}`);
    }
  }

  collectionFiles.forEach((filePath) => {
    const html = fs.readFileSync(filePath, "utf8");
    expiredSlugs.forEach((slug) => {
      if (html.includes(`/competition/${slug}/`)) {
        errors.push(`Expired competition leaks into active listing page ${filePath}: ${slug}`);
      }
    });
    noindexActiveSlugs.forEach((slug) => {
      if (html.includes(`/competition/${slug}/`)) {
        errors.push(`Noindex competition leaks into public listing page ${filePath}: ${slug}`);
      }
    });
  });

  allCompetitions
    .filter((competition) => !activeSlugs.has(shared.getCompetitionSlug(competition)))
    .filter((competition) => !noindexActiveSlugs.has(shared.getCompetitionSlug(competition)))
    .filter(
      (competition) =>
        competition.verificationStatus !== "published" ||
        competition.doNotPublish === true ||
        competition.publicationStatus === "held" ||
        shared.isClubOnlyCompetition(competition)
    )
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

function runGlobalCtaChecks(routeContexts = []) {
  const errors = [];
  const htmlFiles = [
    path.join(ROOT_DIR, "index.html"),
    path.join(ROOT_DIR, "404.html"),
    ...routeContexts
      .filter((routeContext) => routeContext.type !== "home")
      .map((routeContext) => path.join(ROOT_DIR, routeContext.path.replace(/^\//, "").replace(/\/$/, ""), "index.html")),
    ...getPublicTrustPageDefinitions().map((page) => path.join(ROOT_DIR, page.slug, "index.html")),
    ...getContentIndexFiles(),
    ...getNestedIndexFiles(path.join(ROOT_DIR, "competition")),
  ].filter((filePath, index, files) => fs.existsSync(filePath) && files.indexOf(filePath) === index);

  htmlFiles.forEach((filePath) => {
    const html = fs.readFileSync(filePath, "utf8");

    if (!html.includes(WHATSAPP_CHANNEL_URL)) {
      errors.push(`Public content page missing WhatsApp Channel link: ${filePath}`);
    }

    if (!html.includes("data-freehub-auth")) {
      errors.push(`Public content page missing Google/email alert signup panel: ${filePath}`);
    }

    if (!html.includes("/shared/auth-ui.js")) {
      errors.push(`Public content page missing auth UI script: ${filePath}`);
    }
  });

  if (errors.length > 0) {
    throw new Error(`[Global CTA checks failed]\n${errors.map((error) => `- ${error}`).join("\n")}`);
  }
}

function runImageQualityChecks(routeContexts = []) {
  const errors = [];
  const htmlFiles = [
    path.join(ROOT_DIR, "index.html"),
    ...routeContexts
      .filter((routeContext) => routeContext.type !== "home")
      .map((routeContext) => path.join(ROOT_DIR, routeContext.path.replace(/^\//, "").replace(/\/$/, ""), "index.html")),
    ...getNestedIndexFiles(path.join(ROOT_DIR, "competition")),
    ...getContentIndexFiles(),
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

function getContentIndexFiles() {
  return getContentSitemapEntries().map((entry) => path.join(ROOT_DIR, entry.slug, "index.html"));
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
