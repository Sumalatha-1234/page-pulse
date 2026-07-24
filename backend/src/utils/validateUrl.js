/**
 * Validates that a string is a well-formed, publicly-routable http(s) URL.
 * Rejects malformed input, non-http(s) protocols, and obvious local/internal
 * targets so the audit endpoint can't be used to probe internal infrastructure.
 */
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
]);

function isPrivateIpLike(hostname) {
  // Cheap heuristic checks for common private/reserved ranges.
  return (
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^169\.254\./.test(hostname)
  );
}

function validateUrl(rawUrl) {
  if (typeof rawUrl !== "string" || rawUrl.trim().length === 0) {
    return { valid: false, reason: "URL is required." };
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch (err) {
    return { valid: false, reason: "That doesn't look like a valid URL." };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { valid: false, reason: "Only http:// and https:// URLs are supported." };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname) || isPrivateIpLike(hostname)) {
    return { valid: false, reason: "Local or private network addresses are not allowed." };
  }

  return { valid: true, url: parsed.toString() };
}

module.exports = { validateUrl };
