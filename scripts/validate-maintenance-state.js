const fs = require("fs");
const path = require("path");
const shared = require("../shared/page-data.js");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT_DIR, "data", "competitions.json");
const ARCHIVE_PATH = path.join(ROOT_DIR, "data", "archive", "competitions-expired.json");
const SITEMAP_PATH = path.join(ROOT_DIR, "sitemap.xml");

function parseArgs(argv) {
  const options = {
    today: null,
  };

  argv.forEach((arg) => {
    if (arg.startsWith("--today=")) {
      options.today = arg.slice("--today=".length);
    }
  });

  return options;
}

function normalizeDate(value) {
  if (!value) {
    throw new Error("Missing date value");
  }

  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(String(value))
    ? new Date(`${value}T00:00:00`)
    : new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }

  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readJson(filePath, fallbackValue = null) {
  if (!fs.existsSync(filePath)) {
    return fallbackValue;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function getCompetitionSlug(competition) {
  return shared.getCompetitionSlug(competition);
}

function walkPublicListingFiles(rootDir) {
  const files = [];
  const skippedDirectories = new Set([
    ".git",
    ".github",
    "admin",
    "assets",
    "club",
    "competition",
    "data",
    "docs",
    "node_modules",
    "out",
    "scripts",
    "shared",
  ]);

  function visit(directory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });
    entries.forEach((entry) => {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (skippedDirectories.has(entry.name)) {
          return;
        }
        visit(fullPath);
        return;
      }

      if (!entry.isFile() || path.extname(entry.name) !== ".html") {
        return;
      }

      files.push(fullPath);
    });
  }

  visit(rootDir);
  return files.sort();
}

function validateMaintenanceState(options = {}) {
  const today = options.today ? normalizeDate(options.today) : normalizeDate(new Date());
  const todayIso = formatDateLocal(today);
  const competitions = readJson(DATA_PATH, []);
  const archivedCompetitions = readJson(ARCHIVE_PATH, []);
  const sitemap = fs.existsSync(SITEMAP_PATH) ? fs.readFileSync(SITEMAP_PATH, "utf8") : "";
  const publicListingFiles = walkPublicListingFiles(ROOT_DIR);
  const archiveIds = new Set(archivedCompetitions.map((competition) => competition.id));

  const expiredPublishedCompetitions = competitions.filter((competition) => {
    if (!shared.isPublishedCompetition(competition) || !competition.closingDate) {
      return false;
    }

    return normalizeDate(competition.closingDate) < today;
  });

  const nonPublicCompetitions = competitions.filter(
    (competition) =>
      !shared.isPublishedCompetition(competition) ||
      competition.doNotPublish === true ||
      competition.publicationStatus === "held"
  );

  const summary = {
    today: todayIso,
    expiredPublishedCount: expiredPublishedCompetitions.length,
    archivedCompetitionCount: archivedCompetitions.length,
    publicListingFilesScanned: publicListingFiles.length,
    sitemapContainsOutUrls: sitemap.includes("/out/"),
    expiredMissingFromArchive: [],
    expiredInSitemap: [],
    expiredInPublicListings: [],
    expiredMissingDetailPage: [],
    expiredMissingClosedBanner: [],
    expiredMissingNoindex: [],
    expiredWithOutPage: [],
    nonPublicDetailPages: [],
    nonPublicInPublicListings: [],
  };

  expiredPublishedCompetitions.forEach((competition) => {
    const slug = getCompetitionSlug(competition);
    const detailPath = path.join(ROOT_DIR, "competition", slug, "index.html");
    const outPath = path.join(ROOT_DIR, "out", slug, "index.html");

    if (!archiveIds.has(competition.id)) {
      summary.expiredMissingFromArchive.push(slug);
    }

    if (sitemap.includes(`/competition/${slug}/`)) {
      summary.expiredInSitemap.push(slug);
    }

    if (!fs.existsSync(detailPath)) {
      summary.expiredMissingDetailPage.push(slug);
    } else {
      const html = fs.readFileSync(detailPath, "utf8");
      if (!html.includes("This competition has closed.")) {
        summary.expiredMissingClosedBanner.push(slug);
      }
      if (!html.includes('name="robots" content="noindex, follow"')) {
        summary.expiredMissingNoindex.push(slug);
      }
    }

    if (fs.existsSync(outPath)) {
      summary.expiredWithOutPage.push(slug);
    }
  });

  publicListingFiles.forEach((filePath) => {
    const relativePath = path.relative(ROOT_DIR, filePath).replace(/\\/g, "/");
    const html = fs.readFileSync(filePath, "utf8");

    expiredPublishedCompetitions.forEach((competition) => {
      const slug = getCompetitionSlug(competition);
      if (html.includes(`/competition/${slug}/`)) {
        summary.expiredInPublicListings.push({ page: relativePath, slug });
      }
    });

    nonPublicCompetitions.forEach((competition) => {
      const slug = getCompetitionSlug(competition);
      if (html.includes(`/competition/${slug}/`)) {
        summary.nonPublicInPublicListings.push({ page: relativePath, slug });
      }
    });
  });

  nonPublicCompetitions.forEach((competition) => {
    const slug = getCompetitionSlug(competition);
    const detailPath = path.join(ROOT_DIR, "competition", slug, "index.html");
    if (fs.existsSync(detailPath)) {
      summary.nonPublicDetailPages.push(slug);
    }
  });

  const errors = [];

  if (summary.sitemapContainsOutUrls) {
    errors.push("Sitemap contains /out/ URLs.");
  }
  if (summary.expiredMissingFromArchive.length > 0) {
    errors.push(`Expired competitions missing from archive: ${summary.expiredMissingFromArchive.join(", ")}`);
  }
  if (summary.expiredInSitemap.length > 0) {
    errors.push(`Expired competitions still in sitemap: ${summary.expiredInSitemap.join(", ")}`);
  }
  if (summary.expiredInPublicListings.length > 0) {
    errors.push("Expired competitions still appear in public listing pages.");
  }
  if (summary.expiredMissingDetailPage.length > 0) {
    errors.push(`Expired competitions missing detail pages: ${summary.expiredMissingDetailPage.join(", ")}`);
  }
  if (summary.expiredMissingClosedBanner.length > 0) {
    errors.push(`Expired detail pages missing closed banner: ${summary.expiredMissingClosedBanner.join(", ")}`);
  }
  if (summary.expiredMissingNoindex.length > 0) {
    errors.push(`Expired detail pages missing noindex: ${summary.expiredMissingNoindex.join(", ")}`);
  }
  if (summary.expiredWithOutPage.length > 0) {
    errors.push(`Expired competitions still have /out/ pages: ${summary.expiredWithOutPage.join(", ")}`);
  }
  if (summary.nonPublicDetailPages.length > 0) {
    errors.push(`Non-public competitions generated public detail pages: ${summary.nonPublicDetailPages.join(", ")}`);
  }
  if (summary.nonPublicInPublicListings.length > 0) {
    errors.push("Non-public competitions leaked into public listing pages.");
  }

  return {
    ok: errors.length === 0,
    errors,
    summary,
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = validateMaintenanceState(options);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);

  if (!result.ok) {
    process.exitCode = 1;
  }
}

main();
