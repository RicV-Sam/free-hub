const fs = require("node:fs");
const path = require("node:path");
const { imageSize } = require("image-size");

// Read local assets once per build. Never fetch third-party images or guess sizes.
function createLocalImageDimensionWriter(rootDir, origin) {
  const cache = new Map();
  return function addLocalImageDimensions(html, outputPath) {
    const pageUrl = new URL(path.relative(rootDir, outputPath).split(path.sep).join("/"), `${origin}/`);
    return html.replace(/<img\b[^>]*>/gi, (tag) => {
      if (/\s(?:width|height)\s*=/i.test(tag)) return tag;
      const source = tag.match(/\ssrc\s*=\s*(["'])(.*?)\1/i);
      if (!source) return tag;
      let filename;
      try {
        const url = new URL(source[2].replace(/&amp;/g, "&"), pageUrl);
        if (url.origin !== origin) return tag;
        filename = path.resolve(rootDir, `.${decodeURIComponent(url.pathname)}`);
        const relative = path.relative(rootDir, filename);
        if (relative.startsWith("..") || path.isAbsolute(relative)) return tag;
      } catch {
        return tag;
      }
      if (!/\.(png|jpe?g|webp|gif|svg)$/i.test(filename) || !fs.existsSync(filename)) return tag;
      if (!cache.has(filename)) cache.set(filename, imageSize(fs.readFileSync(filename)));
      const { width, height } = cache.get(filename);
      if (!(width > 0 && height > 0)) return tag;
      return tag.replace(/<img\b/i, `<img width="${width}" height="${height}"`);
    });
  };
}

module.exports = { createLocalImageDimensionWriter };
