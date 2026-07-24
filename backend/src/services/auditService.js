const axios = require("axios");
const cheerio = require("cheerio");

const REQUEST_TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 5;
const USER_AGENT = "PagePulse/1.0 (+https://digitalheroesco.com)";

class AuditError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.name = "AuditError";
    this.statusCode = statusCode; // HTTP status to send back to the client
    this.code = code; // machine-readable error code
  }
}

/**
 * Fetches a URL and returns { data, status, headers, responseTimeMs }.
 * Wraps every axios failure mode (timeout, DNS, non-2xx, network) into an AuditError.
 */
async function fetchPage(url) {
  const startedAt = Date.now();
  try {
    const response = await axios.get(url, {
      timeout: REQUEST_TIMEOUT_MS,
      maxRedirects: MAX_REDIRECTS,
      responseType: "text",
      // We want to inspect non-2xx responses ourselves rather than have axios throw.
      validateStatus: () => true,
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,*/*" },
    });
    const responseTimeMs = Date.now() - startedAt;

    if (response.status >= 400) {
      throw new AuditError(
        `The target page responded with HTTP ${response.status}.`,
        502,
        "UPSTREAM_HTTP_ERROR"
      );
    }

    const contentType = response.headers["content-type"] || "";
    if (!contentType.includes("text/html")) {
      throw new AuditError(
        `Expected an HTML page but got content-type "${contentType || "unknown"}".`,
        422,
        "NON_HTML_RESPONSE"
      );
    }

    return {
      html: response.data,
      status: response.status,
      responseTimeMs,
    };
  } catch (err) {
    if (err instanceof AuditError) throw err;

    if (err.code === "ECONNABORTED") {
      throw new AuditError("The request timed out while fetching the page.", 504, "TIMEOUT");
    }
    if (err.code === "ENOTFOUND" || err.code === "EAI_AGAIN") {
      throw new AuditError("Could not resolve that domain.", 502, "DNS_ERROR");
    }
    if (err.code === "ECONNREFUSED") {
      throw new AuditError("Connection to the target server was refused.", 502, "CONNECTION_REFUSED");
    }
    throw new AuditError("Failed to fetch the page.", 502, "FETCH_FAILED");
  }
}

/**
 * Parses raw HTML into the audit report fields.
 */
function analyzeHtml(html) {
  const $ = cheerio.load(html);

  const title = $("title").first().text().trim() || null;

  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    null;

  const h1Count = $("h1").length;

  const images = $("img");
  const totalImages = images.length;
  let imagesMissingAlt = 0;
  images.each((_, el) => {
    const alt = $(el).attr("alt");
    if (alt === undefined || alt.trim() === "") imagesMissingAlt += 1;
  });

  // Approximate word count from visible text only.
  $("script, style, noscript").remove();
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const wordCount = bodyText.length === 0 ? 0 : bodyText.split(" ").length;

  return {
    title,
    metaDescription,
    h1Count,
    images: { total: totalImages, missingAlt: imagesMissingAlt },
    wordCount,
  };
}

/**
 * Runs a full audit for a validated URL and returns the JSON report.
 */
async function auditUrl(url) {
  const { html, status, responseTimeMs } = await fetchPage(url);
  const analysis = analyzeHtml(html);

  return {
    url,
    httpStatus: status,
    responseTimeMs,
    ...analysis,
    checkedAt: new Date().toISOString(),
  };
}

module.exports = { auditUrl, AuditError };
