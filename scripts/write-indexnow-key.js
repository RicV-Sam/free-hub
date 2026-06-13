const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");

function getKey() {
  return (process.env.INDEXNOW_API_KEY || "").trim();
}

function assertSafeKey(key) {
  if (!key) {
    throw new Error("INDEXNOW_API_KEY is required");
  }

  if (!/^[A-Za-z0-9_-]{8,128}$/.test(key)) {
    throw new Error("INDEXNOW_API_KEY contains characters that are unsafe for a public key file name");
  }
}

function main() {
  const key = getKey();
  assertSafeKey(key);

  fs.writeFileSync(path.join(ROOT_DIR, `${key}.txt`), key, "utf8");
  console.log(`Wrote IndexNow key file to ${key}.txt`);
}

main();
