function isPublishedFreeResource(resource) {
  if (!resource || typeof resource !== "object" || Array.isArray(resource)) return false;
  if (resource.availability === "retired") return false;
  // Preserve older directory entries that predate explicit verification states.
  if (!Object.prototype.hasOwnProperty.call(resource, "verificationStatus")) return true;
  return resource.verificationStatus === "verified" && ["active", "manual_check"].includes(resource.availability);
}

module.exports = { isPublishedFreeResource };
