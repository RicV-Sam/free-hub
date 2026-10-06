function getGeneratedEntryHash(entry) {
  return entry && entry.hash ? entry.hash : "missing";
}

function isExactReviewedDifference(manifest, filePath, expectedEntry, actualEntry) {
  const reviewed = manifest && manifest.files ? manifest.files[filePath] : null;

  if (!reviewed) {
    return false;
  }

  return (
    reviewed.expected === getGeneratedEntryHash(expectedEntry) &&
    reviewed.actual === getGeneratedEntryHash(actualEntry)
  );
}

function isAirtimeDashDiscoveryDifference(filePath, expectedHtml, actualHtml, buildDate) {
  if (filePath.endsWith(".html")) {
    const play = '          <a class="site-topbar__link" href="/play/airtime-dash/">Play</a>\n';
    const followers = ['          <a class="site-topbar__link" href="/club/">My competitions</a>',
      '          <a class="site-topbar__link is-active" href="/club/" aria-current="page">My competitions</a>'];
    return !expectedHtml.includes(play) && actualHtml.split(play).length === 2 &&
      followers.some(following => actualHtml.includes(play + following) && actualHtml.replace(play + following, following) === expectedHtml);
  }
  if (filePath === "sitemap.xml" && /^\d{4}-\d{2}-\d{2}$/.test(buildDate)) {
    const entry = `  <url>\n    <loc>https://freehub.co.za/play/airtime-dash/</loc>\n    <lastmod>${buildDate}</lastmod>\n  </url>\n`;
    return !expectedHtml.includes("https://freehub.co.za/play/airtime-dash/") &&
      actualHtml.split(entry).length === 2 && actualHtml.replace(entry, "") === expectedHtml;
  }
  return false;
}

module.exports = {
  getGeneratedEntryHash,
  isExactReviewedDifference,
  isAirtimeDashDiscoveryDifference,
};
