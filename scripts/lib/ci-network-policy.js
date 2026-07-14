const ACCESS_BLOCK_STATUSES = new Set([401, 403, 429]);

function getCiNetworkInconclusiveReason({ status, error } = {}, enabled = false) {
  if (!enabled) {
    return "";
  }

  if (Number.isInteger(status)) {
    if (ACCESS_BLOCK_STATUSES.has(status) || (status >= 500 && status <= 599)) {
      return `ci-network-inconclusive-http-${status}`;
    }

    return "";
  }

  if (error) {
    return error.name === "AbortError"
      ? "ci-network-inconclusive-timeout"
      : "ci-network-inconclusive-fetch-error";
  }

  return "";
}

module.exports = {
  getCiNetworkInconclusiveReason,
};
