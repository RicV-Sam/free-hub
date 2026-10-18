// Local editorial review only. No deployment, credentials, checkout or data writes.
process.env.FREEHUB_ENABLE_OFFERS = "true";
process.env.FREEHUB_ENABLE_OPPORTUNITIES = "true";
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { writeGroceryPreview } = require("./generate-pages.js");
const result = writeGroceryPreview();
console.log(JSON.stringify(result));
if (process.argv.includes("--build-only")) process.exit(0);
const root = path.resolve(__dirname, ".."), port = Number(process.env.GROCERY_PREVIEW_PORT || 4337);
const mime = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon" };
const server = http.createServer((req, res) => {
  if (!["127.0.0.1", "localhost"].some(host => req.headers.host === `${host}:${port}`)) { res.writeHead(403); return res.end("Invalid local preview host"); }
  if (!["GET", "HEAD"].includes(req.method)) { res.writeHead(405); return res.end(); }
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Keep preview traffic out of live analytics and ad services. Navigation to
  // official sources still works; embedded external requests are blocked.
  const policy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'";
  res.setHeader("Content-Security-Policy", policy);
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname); }
  catch { res.writeHead(400); return res.end(); }
  pathname = pathname.replaceAll("\\", "/");
  if (pathname === "/robots.txt") { res.writeHead(200, { "Content-Type": "text/plain" }); return res.end("User-agent: *\nDisallow: /\n"); }
  if (/(?:^|\/)(?:\.[^/]*|node_modules|data|scripts|tests|functions|docs|output|cloudflare)(?:\/|$)/.test(pathname)) { res.writeHead(404); return res.end("Not found"); }
  let file = path.resolve(root, "." + pathname);
  if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(404); return res.end("Not found"); }
  try {
    if (fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!mime[path.extname(file)]) throw new Error("Unsupported preview file");
    let body = fs.readFileSync(file);
    if (path.extname(file) === ".html") {
      // Allow only the shared navigation bootstrap so mobile review reflects
      // production. Other inline trackers remain blocked in this local server.
      const navigation = body.toString("utf8").match(/<script data-freehub-navigation>([\s\S]*?)<\/script>/);
      if (navigation) {
        const hash = crypto.createHash("sha256").update(navigation[1].replace(/\r\n?/g, "\n")).digest("base64");
        res.setHeader("Content-Security-Policy", policy.replace("script-src 'self'", `script-src 'self' 'sha256-${hash}'`));
      }
      body = Buffer.from(body.toString("utf8")
        .replace(/<meta[^>]+name="robots"[^>]*>/gi, '<meta name="robots" content="noindex, nofollow">')
        .replace(/<body([^>]*)>/i, '<body$1><div class="grocery-preview-banner" style="background:#f8df8b;color:#3b321b;padding:12px 24px;font:700 14px/1.5 system-ui;text-align:center">Private editorial preview · Not published · Prices checked 18 October 2026</div>'));
    }
    res.writeHead(200, { "Content-Type": mime[path.extname(file)] });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch { res.writeHead(404); res.end("Not found"); }
});
server.listen(port, "127.0.0.1", () => console.log(`Private local preview: http://127.0.0.1:${port}/grocery-savings/`));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => process.exit(0)));
