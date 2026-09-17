const page = {
  slug: 'whatsapp-channel',
  title: 'Free WhatsApp Competition Updates South Africa | FreeHub',
  heading: 'South African competition updates on WhatsApp',
  description: 'Follow FreeHub’s free WhatsApp channel for new South African competition updates, prize details, closing dates and links showing how to enter.',
  dateModified: '2026-09-17',
  sections: [],
};

function render({ url, escapeHtml: e, stylesheet, navigation, footer, trackingHead, trackingBody }) {
  const canonical = 'https://freehub.co.za/whatsapp-channel/';
  const join = (label = 'Follow FreeHub on WhatsApp') => `<a class="wa-join" href="${e(url)}" target="_blank" rel="noopener noreferrer">${label}<span aria-hidden="true"> ↗</span></a>`;
  const schema = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', name: page.heading, description: page.description, url: canonical, inLanguage: 'en-ZA', isPartOf: { '@type': 'WebSite', name: 'FreeHub', url: 'https://freehub.co.za/' } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://freehub.co.za/' }, { '@type': 'ListItem', position: 2, name: 'WhatsApp channel', item: canonical }] }
  ] };
  return `<!doctype html><html lang="en-ZA"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${e(page.title)}</title><meta name="description" content="${e(page.description)}">
  <meta name="robots" content="index, follow, max-image-preview:large"><link rel="canonical" href="${canonical}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <meta property="og:type" content="website"><meta property="og:title" content="${e(page.title)}"><meta property="og:description" content="${e(page.description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="https://freehub.co.za/FH%20logo.png">
  <meta name="twitter:card" content="summary"><meta name="twitter:title" content="${e(page.title)}"><meta name="twitter:description" content="${e(page.description)}"><meta name="twitter:image" content="https://freehub.co.za/FH%20logo.png">
  <script type="application/ld+json">${JSON.stringify(schema)}</script>
  <link rel="stylesheet" href="${e(stylesheet)}"><link rel="stylesheet" href="/assets/whatsapp-channel.css">${trackingHead}
  </head><body>${trackingBody}<div class="site-shell">${navigation}
  <main id="main-content" class="wa-page">
    <section class="wa-hero" aria-labelledby="wa-title">
      <div class="wa-copy"><p class="wa-eyebrow">FREEHUB ON WHATSAPP</p>
        <h1 id="wa-title">South African competition updates on WhatsApp</h1>
        <p class="wa-hook">New competitions.<br><em>Straight to your WhatsApp.</em></p>
        <p class="wa-intro">Discover new competitions without checking back all day. We post prize details, closing dates and links showing how to enter directly to our channel.</p>
        ${join()}<p class="wa-small">Free to follow. No FreeHub signup needed.<br>Normal data charges may apply.</p>
      </div>
      <aside class="wa-preview" aria-label="Illustration of the channel, not a live feed">
        <div class="wa-phone-head"><img src="/FH%20logo.png" width="48" height="48" alt="FreeHub"><div><strong>South Africa Competitions</strong><span>FreeHub’s WhatsApp channel</span></div></div>
        <p class="wa-preview-label">A LITTLE PREVIEW OF WHAT TO EXPECT</p>
        <div class="wa-message"><span class="wa-message-kicker">YOUR NEXT COMPETITION FIND</span><h2>See the prize.<br>Check the deadline.<br>Choose what to enter.</h2><p>Competition details, entry requirements and a link to read more on FreeHub.</p><span class="wa-message-link">Explore the competition →</span></div>
        <div class="wa-message wa-message--small"><strong>Found one a friend would love?</strong><p>Share the channel so they can discover new competitions too.</p></div>
        <p class="wa-preview-note">Illustrative preview · not a live competition or entry form</p>
      </aside>
    </section>
    <div class="wa-milestone"><strong>1,000 followers reached.</strong><span>Thanks for being part of our growing competition community.</span></div>
    <section class="wa-benefits" aria-labelledby="wa-benefits-title"><div><p class="wa-eyebrow">LESS SEARCHING. MORE DISCOVERING.</p><h2 id="wa-benefits-title">A useful update.<br>A chance worth a look.</h2><p>Keep South African competition discoveries in the app you already use.</p></div><dl>
      <div><dt>New finds, in one place</dt><dd>See competitions we share directly in the channel, then open the ones that interest you.</dd></div>
      <div><dt>The details that matter</dt><dd>Find out what’s up for grabs and when entries close before deciding to explore further.</dd></div>
      <div><dt>A clear next step</dt><dd>Follow the link to FreeHub for entry information and official promoter sources. Following the channel does not enter you into a competition.</dd></div>
    </dl></section>
    <section class="wa-how" aria-labelledby="wa-how-title"><div><p class="wa-eyebrow">READY WHEN YOU ARE</p><h2 id="wa-how-title">Three steps to stay in the loop</h2><ol><li><strong>Open our channel.</strong> Use the button below. Look for <b>South Africa Competitions</b>, our channel’s current name.</li><li><strong>Tap Follow.</strong> Find the channel again in WhatsApp’s Updates tab.</li><li><strong>Want notifications?</strong> Turn on the channel’s notification bell. Notifications are muted by default, so this step is optional.</li></ol>${join()}</div><figure class="wa-qr"><img src="/assets/whatsapp-channel-qr.svg" width="180" height="180" alt="QR code to open FreeHub’s WhatsApp channel"><figcaption>On a computer?<br>Scan with your phone to open the channel.</figcaption></figure></section>
    <section class="wa-faq" aria-labelledby="wa-faq-title"><p class="wa-eyebrow">GOOD TO KNOW</p><h2 id="wa-faq-title">Before you follow</h2>
      <details open><summary>Is the FreeHub WhatsApp channel free?</summary><p>Yes. There is no fee to follow and no FreeHub account is required. Your usual internet or mobile data charges may apply. Individual competitions can have purchase requirements or entry costs: always check their terms.</p></details>
      <details><summary>Is this a WhatsApp group?</summary><p>No. It is a channel for updates from FreeHub, rather than a group conversation. You can read the posts in WhatsApp’s Updates tab.</p></details>
      <details><summary>Does following automatically enter me into competitions?</summary><p>No. Each competition has its own entry steps, eligibility rules and closing date. Open the linked information and follow the promoter’s instructions to enter.</p></details>
      <details><summary>Will I receive a notification for every post?</summary><p>Channel notifications are muted by default. You can choose to turn them on, or simply browse the channel when it suits you.</p></details>
      <details><summary>Can other followers see my phone number?</summary><p>Following a channel does not reveal your number to other followers. WhatsApp says only admins who already have you saved as a contact can see it. <a href="https://www.whatsapp.com/channels" target="_blank" rel="noopener noreferrer">Read WhatsApp’s channel privacy information</a>.</p></details>
      <details><summary>Can I stop following?</summary><p>Yes. You can unfollow the channel in WhatsApp whenever you like.</p></details>
    </section>
    <section class="wa-finish"><p class="wa-eyebrow">YOUR NEXT FIND STARTS HERE</p><h2>Make room for a little possibility.</h2><p>Follow FreeHub for new South African competition updates, free on WhatsApp.</p>${join()}<p class="wa-small">You choose which competitions to explore. Each promoter’s terms apply.</p></section>
    <nav class="wa-related" aria-label="More from FreeHub"><a href="/new-competitions-south-africa/">Browse new competitions →</a><a href="/free-competitions/">Find no-purchase competitions →</a><a href="/whatsapp-competitions-south-africa/">How WhatsApp competition entries work →</a></nav>
  </main>${footer}</div><script type="module" src="/shared/auth-ui.js"></script></body></html>`;
}
module.exports = { page, render };
