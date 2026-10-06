// Explicit loopback-only test service. Never exports a Firebase trigger or uses live credentials.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { MemoryStore } = require("../functions/airtime-dash/store.cjs");
const { createService } = require("../functions/airtime-dash/service.cjs");
const Engine = require("../functions/airtime-dash/engine.js");
const root = path.resolve(__dirname, ".."), port = Number(process.env.DASH_PREVIEW_PORT || 4326), now = Date.now();
const competition = { id: "local-preview", title: "Local Airtime Dash test", prizeTitle: "R500 airtime (test only)", startAt: now - 60000,
  endAt: now + 30 * 86400000, timezone: "Africa/Johannesburg", status: "live", legalReviewed: true, termsVersion: "preview-1", claimDays: 7,
  rules: "Synthetic local testing only. No real prize entry, registration or payout. Three lives, endless ranked levels. Scores are verified from gameplay inputs. Only progress verified before closing counts. Highest verified score wins; earliest verification breaks ties.",
  eligibility: "Local test player only. This is not a public prize competition.", contactPolicy: "No winner will be contacted in this preview.", winnerPolicy: "Synthetic nicknames only.", versions: Engine.VERSION };
const store = new MemoryStore({ "dashConfig/current": { competitionId: competition.id }, [`dashCompetitions/${competition.id}`]: competition,
  "users/preview-player": { acceptedPrivacyPolicy: true }, "admins/preview-player": { active: true } });
const service = createService(store);
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".css": "text/css", ".webp": "image/webp", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg" };
const server = http.createServer(async (req, res) => {
  const host = req.headers.host;
  if (!["127.0.0.1", "localhost"].some(name => host === `${name}:${port}`)) { res.writeHead(403); res.end("Invalid preview host"); return; }
  res.setHeader("Cache-Control", "no-store"); res.setHeader("X-Content-Type-Options", "nosniff");
  const pathname = new URL(req.url, `http://${host}`).pathname;
  if (pathname === "/__dashapi") {
    if (req.method !== "POST" || (req.headers.origin && req.headers.origin !== `http://${host}`)) { res.writeHead(403); res.end(); return; }
    try {
      let body = "";
      for await (const chunk of req) { body += chunk; if (body.length > 50000) throw new Error("Request too large"); }
      const input = JSON.parse(body), result = await service.handle(input.action, input.data, { uid: "preview-player", ip: "local" });
      res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify(result));
    } catch (error) { res.writeHead(400, { "Content-Type": "application/json" }); res.end(JSON.stringify({ error: error.message })); }
    return;
  }
  let candidate;
  try { candidate = path.resolve(root, "." + decodeURIComponent(pathname)); } catch { candidate = ""; }
  if (candidate && fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) candidate = path.join(candidate, "index.html");
  if (!candidate.startsWith(root + path.sep) || /(?:^|\/)(?:\.|functions\/)|firebase-config\.json/.test(pathname) || !mime[path.extname(candidate)] || !fs.existsSync(candidate)) { res.writeHead(404); res.end("Not found"); return; }
  let data = fs.readFileSync(candidate);
  if (path.extname(candidate) === ".html") data = Buffer.from(data.toString("utf8").replace("</head>", "<script>window.FREEHUB_DASH_PREVIEW=true;</script></head>"));
  res.writeHead(200, { "Content-Type": mime[path.extname(candidate)] }); res.end(data);
});
server.listen(port, "127.0.0.1", () => console.log(`Local test only: http://127.0.0.1:${port}/play/airtime-dash/`));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.close(() => process.exit(0)));
