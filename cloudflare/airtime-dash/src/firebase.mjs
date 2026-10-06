import { importX509, jwtVerify } from "jose";
const CERT_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
export function firebaseVerifier({ fetcher = fetch, clock = Date.now } = {}) {
  let certs, until = 0;
  const imported = new Map();
  return async (token, projectId) => {
    if (typeof token !== "string" || token.length > 8192) throw new Error("Invalid sign-in token.");
    const result = await jwtVerify(token, async header => {
      if (header.alg !== "RS256" || typeof header.kid !== "string") throw new Error("Invalid sign-in signature.");
      if (!certs || clock() >= until) {
        const response = await fetcher(CERT_URL, { signal: AbortSignal.timeout(5000) });
        if (!response.ok) throw new Error("Sign-in verification unavailable.");
        certs = await response.json(); imported.clear();
        const seconds = Number(/max-age=(\d+)/.exec(response.headers.get("cache-control") || "")?.[1] || 300);
        until = clock() + Math.min(seconds, 86400) * 1000;
      }
      if (!Object.hasOwn(certs, header.kid)) throw new Error("Unknown sign-in signature.");
      if (!imported.has(header.kid)) imported.set(header.kid, await importX509(certs[header.kid], "RS256"));
      return imported.get(header.kid);
    }, { algorithms: ["RS256"], audience: projectId, issuer: `https://securetoken.google.com/${projectId}`,
      requiredClaims: ["exp", "iat", "sub", "auth_time"], currentDate: new Date(clock()) });
    const p = result.payload, seconds = Math.floor(clock() / 1000);
    if (typeof p.sub !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(p.sub) ||
      !Number.isInteger(p.iat) || p.iat > seconds || !Number.isInteger(p.auth_time) || p.auth_time > seconds) throw new Error("Invalid sign-in identity.");
    return p.sub;
  };
}
function decode(value) {
  if ("booleanValue" in value) return value.booleanValue;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("nullValue" in value) return null;
  if ("timestampValue" in value) return value.timestampValue;
  if ("mapValue" in value) return Object.fromEntries(Object.entries(value.mapValue.fields || {}).map(([k, v]) => [k, decode(v)]));
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(decode);
  return null;
}
export function firebaseProfiles(projectId, bearer, fetcher = fetch) {
  const cache = new Map();
  return path => {
    if (!/^(users|admins)\/[a-zA-Z0-9_-]{1,100}$/.test(path)) throw new Error("Invalid profile path.");
    if (!bearer) return Promise.resolve(null);
    if (!cache.has(path)) cache.set(path, (async () => {
      const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${path}`;
      // The user's token keeps existing Firestore rules in force. No service-account key.
      const response = await fetcher(url, { headers: { Authorization: `Bearer ${bearer}` }, signal: AbortSignal.timeout(5000) });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error("FreeHub account verification is temporarily unavailable.");
      const record = await response.json();
      return Object.fromEntries(Object.entries(record.fields || {}).map(([k, v]) => [k, decode(v)]));
    })());
    return cache.get(path);
  };
}
