const artwork = require("./mascot-artwork.json");

// Brand artwork stays separate from campaign imagery and public listing data.
function renderMascot(pose, { heading = false, hidden = false, alt = "", animate = true } = {}) {
  const art = artwork.poses[pose];
  if (!art) throw new Error(`Unknown FreeHub mascot pose: ${pose}`);
  const fallback = art.variants.find(variant => variant.width === 160);
  const featured = pose === "welcome" || pose === "recover";
  const greeting = animate && featured;
  const safeAlt = String(alt).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return `<span class="mascot${featured ? " mascot--featured" : ""}${greeting ? " mascot--greet" : ""}" data-mascot="${pose}"${heading ? ' data-mascot-heading' : ''}${hidden ? ' hidden' : ''}${greeting ? ' data-mascot-greeted' : ''}><img src="${fallback.src}" srcset="${art.variants.map(variant => `${variant.src} ${variant.width}w`).join(", ")}" sizes="${featured ? '(max-width: 767px) 80px, 150px' : '(max-width: 767px) 60px, 80px'}" width="${fallback.width}" height="${fallback.height}" alt="${safeAlt}" decoding="async"${heading ? '' : ' loading="lazy"'} /></span>`;
}

module.exports = { renderMascot };
