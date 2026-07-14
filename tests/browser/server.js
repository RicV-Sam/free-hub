const fs = require("fs");
const http = require("http");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const PORT = Number(process.env.PORT || 4318);
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8",
};

function resolveRequestPath(urlPath) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(urlPath, "http://127.0.0.1").pathname);
  } catch (error) {
    return "";
  }
  if (pathname === "/firebase-config.json") {
    return "";
  }
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\//, "");
  const candidate = path.resolve(ROOT_DIR, relative.endsWith("/") ? path.join(relative, "index.html") : relative);
  if (!candidate.startsWith(`${ROOT_DIR}${path.sep}`) && candidate !== path.join(ROOT_DIR, "index.html")) {
    return "";
  }
  return candidate;
}

const server = http.createServer((request, response) => {
  let filePath = resolveRequestPath(request.url || "/");
  let status = 200;
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    filePath = path.join(ROOT_DIR, "404.html");
    status = 404;
  }
  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-type": MIME_TYPES[extension] || "application/octet-stream",
  });
  fs.createReadStream(filePath).pipe(response);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Freehub test server listening on http://127.0.0.1:${PORT}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
