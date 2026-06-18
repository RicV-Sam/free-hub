#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..");
const DATA_PATH = path.join(ROOT_DIR, "data", "competitions.json");
const CANONICAL_ORIGIN = "https://freehub.co.za";
const DEFAULT_MAIL_COLLECTION = "mail";
const DEFAULT_CAMPAIGN_COLLECTION = "emailCampaigns";
const BATCH_LIMIT = 400;

function parseArgs(argv) {
  const options = {
    send: false,
    since: null,
    competitionIds: [],
    campaignId: null,
    mailCollection: process.env.FREEHUB_MAIL_COLLECTION || DEFAULT_MAIL_COLLECTION,
    campaignCollection: process.env.FREEHUB_EMAIL_CAMPAIGN_COLLECTION || DEFAULT_CAMPAIGN_COLLECTION,
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS || null,
    projectId: process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || null,
    limit: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--send") {
      options.send = true;
    } else if (arg === "--since") {
      options.since = requireValue(arg, next);
      index += 1;
    } else if (arg === "--competition-id") {
      options.competitionIds.push(requireValue(arg, next));
      index += 1;
    } else if (arg === "--campaign-id") {
      options.campaignId = requireValue(arg, next);
      index += 1;
    } else if (arg === "--mail-collection") {
      options.mailCollection = requireValue(arg, next);
      index += 1;
    } else if (arg === "--campaign-collection") {
      options.campaignCollection = requireValue(arg, next);
      index += 1;
    } else if (arg === "--service-account") {
      options.serviceAccountPath = requireValue(arg, next);
      index += 1;
    } else if (arg === "--project-id") {
      options.projectId = requireValue(arg, next);
      index += 1;
    } else if (arg === "--limit") {
      options.limit = Number(requireValue(arg, next));
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (options.since && !/^\d{4}-\d{2}-\d{2}$/.test(options.since)) {
    throw new Error("--since must use YYYY-MM-DD format.");
  }

  if (options.limit !== null && (!Number.isInteger(options.limit) || options.limit < 1)) {
    throw new Error("--limit must be a positive integer.");
  }

  return options;
}

function requireValue(arg, value) {
  if (!value || value.startsWith("--")) {
    throw new Error(`${arg} requires a value.`);
  }

  return value;
}

function printUsage() {
  console.log(`Queue Freehub competition alert emails.

Dry run by default:
  npm run email:alerts -- --since 2026-06-11

Queue emails through the Firebase Trigger Email collection:
  npm run email:alerts -- --since 2026-06-11 --campaign-id june-11-new-competitions --send

Useful options:
  --competition-id <id>       Include one competition ID. Can be repeated.
  --since <YYYY-MM-DD>        Include published active competitions checked on/after this date.
  --campaign-id <id>          Required with --send. Used for de-dupe.
  --mail-collection <name>    Defaults to FREEHUB_MAIL_COLLECTION or "mail".
  --limit <number>            Limit recipients for a small live test.
  --service-account <path>    Optional service-account JSON path.
`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const competitions = selectCompetitions(loadCompetitions(), options);

  if (competitions.length === 0) {
    console.log("No published active competitions matched the alert criteria.");
    return;
  }

  const campaignId = options.campaignId || buildDefaultCampaignId(competitions, options);
  const email = buildEmail(competitions);

  console.log(JSON.stringify({
    mode: options.send ? "send" : "dry-run",
    campaignId,
    mailCollection: options.mailCollection,
    competitions: competitions.map((competition) => competition.id),
    subject: email.subject,
  }, null, 2));

  if (!options.send) {
    console.log("\nDry run only. Add --send and a stable --campaign-id to queue emails.");
    return;
  }

  if (!options.campaignId) {
    throw new Error("--campaign-id is required with --send so alerts can be de-duped.");
  }

  const admin = loadFirebaseAdmin(options);
  const db = admin.firestore();
  const recipients = await getEligibleRecipients(db, options);

  if (recipients.length === 0) {
    console.log("No opted-in recipients found.");
    return;
  }

  const summary = await queueCampaignEmails(db, admin, {
    campaignId,
    email,
    recipients,
    competitions,
    mailCollection: options.mailCollection,
    campaignCollection: options.campaignCollection,
  });

  console.log(JSON.stringify(summary, null, 2));
}

function loadCompetitions() {
  return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
}

function selectCompetitions(competitions, options) {
  const today = new Date().toISOString().slice(0, 10);
  const selectedIds = new Set(options.competitionIds);

  return competitions
    .filter((competition) => competition.verificationStatus === "published")
    .filter((competition) => !competition.doNotPublish)
    .filter((competition) => !competition.publicationStatus || competition.publicationStatus === "published")
    .filter((competition) => !competition.closingDate || competition.closingDate >= today)
    .filter((competition) => {
      if (selectedIds.size > 0) {
        return selectedIds.has(competition.id);
      }

      return options.since ? String(competition.lastChecked || "") >= options.since : false;
    })
    .sort((a, b) => String(a.closingDate || "").localeCompare(String(b.closingDate || "")));
}

function buildDefaultCampaignId(competitions, options) {
  if (options.since) {
    return `new-competitions-since-${options.since}`;
  }

  return competitions.length === 1
    ? `new-competition-${competitions[0].id}`
    : `new-competitions-${new Date().toISOString().slice(0, 10)}`;
}

function buildEmail(competitions) {
  const plural = competitions.length === 1 ? "competition" : "competitions";
  const subject =
    competitions.length === 1
      ? `New Freehub competition: ${competitions[0].title}`
      : `New Freehub competitions: ${competitions.length} fresh listings`;

  const htmlItems = competitions
    .map((competition) => {
      const url = `${CANONICAL_ORIGIN}/competition/${competition.id}/`;
      return `<li><strong>${escapeHtml(competition.title)}</strong><br>Prize: ${escapeHtml(
        competition.prizeName || competition.category || "Competition prize"
      )}<br>Closes: ${escapeHtml(formatDate(competition.closingDate))}<br><a href="${url}">View on Freehub</a></li>`;
    })
    .join("");

  const textItems = competitions
    .map((competition) => {
      const url = `${CANONICAL_ORIGIN}/competition/${competition.id}/`;
      return `- ${competition.title}\n  Prize: ${competition.prizeName || competition.category || "Competition prize"}\n  Closes: ${formatDate(competition.closingDate)}\n  ${url}`;
    })
    .join("\n\n");

  return {
    subject,
    html: `<p>Hi from Freehub,</p><p>We added ${competitions.length} new ${plural} you may want to check:</p><ul>${htmlItems}</ul><p>Freehub lists competitions only. Always confirm details on the official promoter source before entering.</p><p>You are receiving this because you signed in and opted into Freehub competition alerts.</p>`,
    text: `Hi from Freehub,\n\nWe added ${competitions.length} new ${plural} you may want to check:\n\n${textItems}\n\nFreehub lists competitions only. Always confirm details on the official promoter source before entering.\n\nYou are receiving this because you signed in and opted into Freehub competition alerts.`,
  };
}

function loadFirebaseAdmin(options) {
  let admin;

  try {
    admin = require("firebase-admin");
  } catch (error) {
    throw new Error("Missing firebase-admin. Run npm install before queueing email alerts.");
  }

  if (admin.apps.length > 0) {
    return admin;
  }

  if (options.serviceAccountPath) {
    const resolvedPath = path.resolve(options.serviceAccountPath);
    const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: options.projectId || serviceAccount.project_id,
    });
    return admin;
  }

  admin.initializeApp({
    projectId: options.projectId || undefined,
  });
  return admin;
}

async function getEligibleRecipients(db, options) {
  const preferenceSnapshot = await db
    .collectionGroup("alertPreferences")
    .where("competitionAlerts", "==", true)
    .get();
  const recipients = [];

  for (const preferenceDoc of preferenceSnapshot.docs) {
    const userRef = preferenceDoc.ref.parent.parent;

    if (!userRef) {
      continue;
    }

    const userSnapshot = await userRef.get();
    const user = userSnapshot.exists ? userSnapshot.data() : null;
    const preference = preferenceDoc.data();

    if (
      user &&
      user.email &&
      user.alertsMarketingConsent === true &&
      preference.marketingOptIn === true
    ) {
      recipients.push({
        userId: userRef.id,
        email: user.email,
      });
    }

    if (options.limit && recipients.length >= options.limit) {
      break;
    }
  }

  return recipients;
}

async function queueCampaignEmails(db, admin, context) {
  const campaignRef = db.collection(context.campaignCollection).doc(context.campaignId);
  await campaignRef.set(
    {
      campaignId: context.campaignId,
      competitionIds: context.competitions.map((competition) => competition.id),
      mailCollection: context.mailCollection,
      subject: context.email.subject,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  let queued = 0;
  let skipped = 0;
  let batch = db.batch();
  let batchOps = 0;

  for (const recipient of context.recipients) {
    const recipientRef = campaignRef.collection("recipients").doc(recipient.userId);
    const existing = await recipientRef.get();

    if (existing.exists) {
      skipped += 1;
      continue;
    }

    const mailRef = db.collection(context.mailCollection).doc();
    batch.set(mailRef, {
      to: [recipient.email],
      message: context.email,
      freehub: {
        campaignId: context.campaignId,
        userId: recipient.userId,
        competitionIds: context.competitions.map((competition) => competition.id),
        type: "competition-alert",
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    batch.set(recipientRef, {
      userId: recipient.userId,
      email: recipient.email,
      mailDocumentPath: mailRef.path,
      queuedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    queued += 1;
    batchOps += 2;

    if (batchOps >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      batchOps = 0;
    }
  }

  if (batchOps > 0) {
    await batch.commit();
  }

  await campaignRef.set(
    {
      queued,
      skipped,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return {
    campaignId: context.campaignId,
    recipientCount: context.recipients.length,
    queued,
    skipped,
  };
}

function formatDate(value) {
  if (!value) {
    return "Check listing";
  }

  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
