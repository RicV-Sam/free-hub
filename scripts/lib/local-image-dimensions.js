const fs = require("node:fs");
const path = require("node:path");
const { imageSize } = require("image-size");
const responsiveImages = require("../../data/responsive-images.json");

// Read local assets once per build. Never fetch third-party images or guess sizes.
function createLocalImageDimensionWriter(rootDir, origin) {
  const cache = new Map();
  return function addLocalImageDimensions(html, outputPath) {
    const pageUrl = new URL(path.relative(rootDir, outputPath).split(path.sep).join("/"), `${origin}/`);
    return html.replace(/<img\b[^>]*>/gi, (tag) => {
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
      const sourcePath = `/${path.relative(rootDir, filename).split(path.sep).join("/")}`;
      const variants = responsiveImages[sourcePath]?.variants;
      if (variants?.length && !/\ssrcset\s*=/.test(tag)) {
        const preferred = variants.find(item => item.width >= 640) || variants[variants.length - 1];
        const detail = /[\\/](?:competition|offer|opportunity)[\\/]/.test(outputPath);
        const sizes = detail ? "(max-width: 767px) calc(100vw - 2rem), 880px" : "(max-width: 600px) calc(100vw - 2rem), (max-width: 1000px) calc((100vw - 3rem) / 2), 400px";
        tag = tag.replace(source[0], ` src="${preferred.src}"`)
          .replace(/<img\b/i, `<img srcset="${variants.map(item => `${item.src} ${item.width}w`).join(", ")}" sizes="${sizes}"`);
        filename = path.join(rootDir, preferred.src);
      }
      if (/\s(?:width|height)\s*=/i.test(tag)) return tag;
      if (!cache.has(filename)) cache.set(filename, imageSize(fs.readFileSync(filename)));
      const { width, height } = cache.get(filename);
      if (!(width > 0 && height > 0)) return tag;
      return tag.replace(/<img\b/i, `<img width="${width}" height="${height}"`);
    });
  };
}

module.exports = { createLocalImageDimensionWriter };
