function getGeneratedEntryHash(entry) {
  return entry && entry.hash ? entry.hash : "missing";
}

function isExactReviewedDifference(manifest, filePath, expectedEntry, actualEntry) {
  const reviewed = manifest && manifest.files ? manifest.files[filePath] : null;

  if (!reviewed) {
    return false;
  }

  return (
    reviewed.expected === getGeneratedEntryHash(expectedEntry) &&
    reviewed.actual === getGeneratedEntryHash(actualEntry)
  );
}

module.exports = {
  getGeneratedEntryHash,
  isExactReviewedDifference,
};
