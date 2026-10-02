const fs = require("node:fs");
const path = require("node:path");
const shared = require("../../shared/page-data.js");

function featuredVideoSlugs(competitions) {
  return new Set(competitions.map(row => row.featuredVideo).filter(video =>
    video && String(video.youtubeId || "").trim() && Number.isFinite(Number(video.durationSeconds))
  ).map(video => video.slug));
}

// The September 24 reviewed count of 64 included six tag pages and two
// competition videos. Its fixed component is 56; only inventory varies.
// Derive their expected presence from source inventory, never from generated output.
function inventorySitemapCount(active, canonicalAliases) {
  const tags = shared.TAG_SLUGS.filter(slug =>
    !canonicalAliases[`/tag/${slug}/`] && shared.getTagFilteredCompetitions(active, slug).length >= 2
  );
  return tags.length + featuredVideoSlugs(active).size;
}

function removeExpiredVideoPages(directory, knownSlugs, activeSlugs) {
  const root = path.resolve(directory);
  for (const slug of knownSlugs) {
    if (activeSlugs.has(slug)) continue;
    if (typeof slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new Error("Unsafe competition video slug");
    }
    const target = path.resolve(root, slug);
    if (path.dirname(target) !== root) throw new Error("Video path escapes managed directory");
    if (!fs.existsSync(target) || fs.lstatSync(target).isSymbolicLink()) continue;
    // Remove only the generated page; preserve unrelated assets or editorial files.
    const page = path.join(target, "index.html");
    if (fs.existsSync(page)) fs.unlinkSync(page);
    if (fs.readdirSync(target).length === 0) fs.rmdirSync(target);
  }
}
module.exports = { featuredVideoSlugs, inventorySitemapCount, removeExpiredVideoPages };
