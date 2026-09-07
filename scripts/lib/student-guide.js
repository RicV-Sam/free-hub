const TYPES = Object.freeze({
  completely_free: "Completely free",
  free_trial: "Free trial",
  student_discount: "Student discount",
  account_benefit: "Membership / account benefit",
});
// Independently reviewed provider hosts; content cannot extend this allowlist.
const SOURCE_HOSTS = new Set([
  "www.microsoft.com", "one.google.com", "support.google.com", "www.autodesk.com",
  "help.autodesk.com", "github.com", "www.figma.com", "help.figma.com", "www.notion.com",
  "www.jetbrains.com", "sales.jetbrains.com", "help.miro.com", "www.tenet.ac.za",
  "www.samsung.com", "www.istore.co.za", "www.mygautrain.co.za", "www.intercape.co.za",
  "secure.ticketpros.co.za", "www.spotify.com", "info.varsityvibe.co.za", "varsityvibe.co.za",
  "www.absa.co.za", "www.standardbank.co.za", "www.tablemountain.net", "www.sanbi.org",
  "shop.aquarium.co.za", "www.myunidays.com", "www.canva.com",
]);

function isDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

function validateStudentGuide(guide, asOfDate) {
  const errors = [];
  const text = (value, field) => {
    if (typeof value !== "string" || !value.trim()) errors.push(`${field}: required text`);
  };
  const date = (value, field) => { if (!isDate(value)) errors.push(`${field}: invalid date`); };
  const source = (value, field) => {
    text(value?.label, `${field}.label`);
    try {
      const url = new URL(value?.url);
      if (url.protocol !== "https:" || url.username || url.password || !SOURCE_HOSTS.has(url.hostname)) throw new Error();
    } catch { errors.push(`${field}: unapproved official source URL`); }
  };
  if (!guide || typeof guide !== "object") throw new Error("Student guide: missing content");
  date(asOfDate, "asOfDate");
  for (const field of ["slug", "heading", "description", "intro"]) text(guide[field], field);
  for (const field of ["datePublished", "dateModified"]) date(guide[field], field);
  if (guide.dateModified < guide.datePublished) errors.push("dateModified predates publication");
  const ids = new Set(["student-best", "student-types", "student-corrections", "student-method"]);
  const anchor = (id) => {
    if (!/^[a-z][a-z0-9-]*$/.test(id || "") || ids.has(id)) errors.push(`Invalid or duplicate anchor: ${id}`);
    ids.add(id);
  };
  if (!Array.isArray(guide.categories) || !guide.categories.length) errors.push("Missing categories");
  const categories = new Set();
  for (const category of guide.categories || []) {
    anchor(category.id); categories.add(category.id);
    text(category.heading, "category.heading"); text(category.intro, "category.intro");
  }
  if (!Array.isArray(guide.offers) || !guide.offers.length) errors.push("Missing offers");
  for (const offer of guide.offers || []) {
    anchor(offer.id);
    for (const field of ["name", "deal", "eligibility", "limitations", "region"]) text(offer[field], `${offer.id}.${field}`);
    if (!categories.has(offer.category)) errors.push(`${offer.id}: unknown category`);
    if (!Object.hasOwn(TYPES, offer.type)) errors.push(`${offer.id}: unknown classification`);
    if (!Array.isArray(offer.claim) || !offer.claim.length) errors.push(`${offer.id}: missing claim steps`);
    (offer.claim || []).forEach((step) => text(step, `${offer.id}.claim`));
    if (!Array.isArray(offer.sources) || !offer.sources.length) errors.push(`${offer.id}: missing evidence`);
    (offer.sources || []).forEach((s) => source(s, offer.id));
    source(offer.destination, `${offer.id}.destination`);
    if (!offer.sources?.some((entry) => entry.url === offer.destination?.url)) errors.push(`${offer.id}: destination must match reviewed evidence`);
    date(offer.lastChecked, `${offer.id}.lastChecked`);
    if (offer.lastChecked > guide.dateModified) errors.push(`${offer.id}: check date exceeds page review date`);
    if (offer.type === "free_trial") text(offer.renewal, `${offer.id}.renewal`);
    if (offer.type === "account_benefit") text(offer.accountCosts, `${offer.id}.accountCosts`);
    if (offer.expiresOn !== undefined) {
      date(offer.expiresOn, `${offer.id}.expiresOn`);
      if (offer.expiresOn < asOfDate) errors.push(`${offer.id}: expired; editorial review required`);
      if (offer.expiresOn < offer.lastChecked) errors.push(`${offer.id}: expired before verification`);
    }
    if (offer.comparison !== undefined) {
      text(offer.comparison.text, `${offer.id}.comparison.text`);
      if (offer.comparison.expiresOn === undefined && offer.comparison.reviewBy === undefined) errors.push(`${offer.id}: comparison requires a deadline`);
      if (offer.comparison.expiresOn !== undefined) date(offer.comparison.expiresOn, `${offer.id}.comparison.expiresOn`);
      if (offer.comparison.reviewBy !== undefined) date(offer.comparison.reviewBy, `${offer.id}.comparison.reviewBy`);
      source(offer.comparison.source, `${offer.id}.comparison.source`);
      if (offer.comparison.expiresOn < asOfDate) errors.push(`${offer.id}: comparison expired; editorial review required`);
      if (offer.comparison.reviewBy < asOfDate) errors.push(`${offer.id}: comparison review overdue; editorial review required`);
    }
  }
  if (!Array.isArray(guide.bestPicks) || !guide.bestPicks.length) errors.push("Missing best picks");
  const picks = new Set();
  for (const id of guide.bestPicks || []) {
    if (picks.has(id) || !guide.offers?.some((o) => o.id === id && o.type === "completely_free")) errors.push(`Invalid free best pick: ${id}`);
    picks.add(id);
  }
  for (const correction of guide.corrections || []) {
    text(correction.heading, "correction.heading"); text(correction.text, "correction.text");
    source(correction.source, "correction.source");
  }
  if (errors.length) throw new Error(`Student guide validation failed:\n${errors.join("\n")}`);
  return guide;
}

function getStudentNoticePath(id) {
  if (!/^[a-z][a-z0-9-]*$/.test(id)) throw new Error("Invalid student notice id");
  return `/out/student/${id}/`;
}

function createStudentOfferRenderer({ escapeHtml: h, escapeAttribute: a, formatDate }) {
  const link = (s) => `<a href="${a(s.url)}" rel="nofollow noopener">${h(s.label)}</a>`;
  return (o, { showClaimButton = true } = {}) => `<article class="student-offer" id="${a(o.id)}" aria-labelledby="${a(o.id)}-title">
    <div class="student-offer__heading"><p class="student-type student-type--${a(o.type)}">${h(TYPES[o.type])}</p><h3 id="${a(o.id)}-title">${h(o.name)}</h3><p class="student-offer__deal">${h(o.deal)}</p><p class="student-meta">${h(o.region)}</p></div>
    <div class="student-offer__details"><dl>
      <div><dt>Who qualifies</dt><dd>${h(o.eligibility)}</dd></div>
      <div><dt>How to claim</dt><dd><ol>${o.claim.map((s) => `<li>${h(s)}</li>`).join("")}</ol></dd></div>
      <div><dt>Check first</dt><dd>${h(o.limitations)}</dd></div>
      ${o.renewal ? `<div class="student-cost"><dt>Renewal & charges</dt><dd>${h(o.renewal)}</dd></div>` : ""}
      ${o.accountCosts ? `<div class="student-cost"><dt>Account costs</dt><dd>${h(o.accountCosts)}</dd></div>` : ""}
      ${o.expiresOn ? `<div><dt>Published offer ends</dt><dd><time datetime="${a(o.expiresOn)}">${h(formatDate(o.expiresOn))}</time></dd></div>` : ""}
    </dl>${o.comparison ? `<aside class="student-tip"><strong>FreeHub price check</strong><p>${h(o.comparison.text)}</p><p>Checked ${h(formatDate(o.lastChecked))}. ${o.comparison.expiresOn ? `Promotion valid through ${h(formatDate(o.comparison.expiresOn))}. ` : ""}${o.comparison.reviewBy ? `Comparison review due ${h(formatDate(o.comparison.reviewBy))}; prices may change sooner. ` : ""}${link(o.comparison.source)}</p></aside>` : ""}
    ${showClaimButton ? `<p><a class="btn btn--primary student-claim" href="${a(getStudentNoticePath(o.id))}">Review ${h(o.name)} before continuing</a></p>` : ""}
    <p class="student-sources"><strong>Official sources and terms:</strong> ${o.sources.map(link).join(" · ")}</p><p class="student-meta">Last checked <time datetime="${a(o.lastChecked)}">${h(formatDate(o.lastChecked))}</time></p></div>
  </article>`;
}

function createStudentGuideRenderer({ escapeHtml: h, escapeAttribute: a, formatDate }) {
  const link = (s) => `<a href="${a(s.url)}" rel="nofollow noopener">${h(s.label)}</a>`;
  const offerHtml = createStudentOfferRenderer({ escapeHtml: h, escapeAttribute: a, formatDate });
  return function renderStudentGuide(guide) {
    return `<div class="student-guide">
      <p class="student-review">By <a href="/about/" rel="author">FreeHub</a> · ${guide.offers.length} selected benefits · Sources checked <time datetime="${a(guide.dateModified)}">${h(formatDate(guide.dateModified))}</time>. Offers can change.</p>
      <figure class="student-art"><img src="/assets/student-guide/campus-study-1200.jpg" srcset="/assets/student-guide/campus-study-640.jpg 640w, /assets/student-guide/campus-study-1200.jpg 1200w" sizes="(max-width: 800px) calc(100vw - 32px), 760px" width="1200" height="675" alt="Illustration of university students studying together on campus" decoding="async" /><figcaption>Student life, illustrated. Artwork created with AI for FreeHub.</figcaption></figure>
      <section id="student-best" class="student-best" aria-labelledby="student-best-title"><p class="section-kicker">Start with R0</p><h2 id="student-best-title">Best student freebies to check first</h2><p>Choose what you will actually use. These picks have no subscription trial attached, but eligibility still matters.</p><ul>${guide.bestPicks.map((id) => { const o = guide.offers.find((item) => item.id === id); return `<li><a href="#${a(id)}">${h(o.name)}</a><span>${h(o.deal)}</span></li>`; }).join("")}</ul></section>
      <section id="student-types" class="student-key" aria-label="What the labels mean"><h2>Free, trial or discount?</h2><dl><div><dt>Completely free</dt><dd>No separate fee for the listed benefit while eligible. Normal data or equipment costs may remain.</dd></div><div><dt>Free trial</dt><dd>A limited period at no charge, followed by subscription charges.</dd></div><div><dt>Student discount</dt><dd>You pay a reduced price for the product or service.</dd></div><div><dt>Membership / account benefit</dt><dd>Access depends on an account or membership and its conditions.</dd></div></dl></section>
      <nav class="student-jump" aria-label="Student guide sections"><h2>Find what you need</h2><ul>${guide.categories.map((c) => `<li><a href="#${a(c.id)}">${h(c.heading)}</a></li>`).join("")}<li><a href="#student-corrections">Common claims, checked</a></li></ul></nav>
      ${guide.categories.map((c) => `<section class="student-category" id="${a(c.id)}" aria-labelledby="${a(c.id)}-title"><header><h2 id="${a(c.id)}-title">${h(c.heading)}</h2><p>${h(c.intro)}</p>${c.id === "everyday" ? `<p><a href="https://varsityvibe.co.za/" rel="nofollow noopener">Check the current Varsity Vibe directory</a> or <a href="#varsity-vibe">read the free-membership details</a>.</p>` : ""}</header>${guide.offers.filter((o) => o.category === c.id).map(offerHtml).join("")}</section>`).join("")}
      <section id="student-corrections" class="student-corrections"><h2>Common claims, checked</h2>${guide.corrections.map((c) => `<article><h3>${h(c.heading)}</h3><p>${h(c.text)} ${link(c.source)}</p></article>`).join("")}</section>
      <section id="student-method" class="student-method"><h2>How we checked this guide</h2><p>We checked provider pages, official documentation and authorised programme information. A listing means the published benefit was checked, not that FreeHub completed a student application or guarantees approval. Where a provider does not state an age or study-mode rule, we do not assume that every student qualifies.</p><p>We leave out offers with unresolved material conditions. Prices without a verified South African amount are not guessed. Our selection is not a complete list of every student offer, and we do not add up hypothetical annual savings.</p><p>Before claiming, check the official terms again. Send corrections through <a href="/contact/">FreeHub’s contact page</a>. Student ID and payment details belong only in the provider’s official application, never with FreeHub.</p></section>
    </div>`;
  };
}

module.exports = { TYPES, validateStudentGuide, createStudentGuideRenderer, createStudentOfferRenderer, getStudentNoticePath };
