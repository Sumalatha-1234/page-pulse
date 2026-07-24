const nock = require("nock");
const { auditUrl, AuditError } = require("../src/services/auditService");

describe("auditUrl (parsing logic)", () => {
  afterEach(() => {
    nock.cleanAll();
  });

  test("happy path: parses title, meta description, h1 count, image alt coverage, word count", async () => {
    const html = `
      <html>
        <head>
          <title>  Sample Page  </title>
          <meta name="description" content="A page about testing." />
        </head>
        <body>
          <h1>Welcome</h1>
          <h1>Second heading</h1>
          <img src="a.png" alt="a photo" />
          <img src="b.png" />
          <img src="c.png" alt="" />
          <p>This page has exactly eight words here.</p>
        </body>
      </html>
    `;
    nock("https://example.com").get("/").reply(200, html, { "Content-Type": "text/html" });

    const report = await auditUrl("https://example.com/");

    expect(report.httpStatus).toBe(200);
    expect(report.title).toBe("Sample Page");
    expect(report.metaDescription).toBe("A page about testing.");
    expect(report.h1Count).toBe(2);
    expect(report.images).toEqual({ total: 3, missingAlt: 2 });
    expect(report.wordCount).toBeGreaterThan(0);
    expect(typeof report.responseTimeMs).toBe("number");
  });

  test("failure case: non-HTML response is rejected with a clear error", async () => {
    nock("https://example.com")
      .get("/data.json")
      .reply(200, { hello: "world" }, { "Content-Type": "application/json" });

    await expect(auditUrl("https://example.com/data.json")).rejects.toMatchObject({
      name: "AuditError",
      code: "NON_HTML_RESPONSE",
      statusCode: 422,
    });
  });

  test("failure case: upstream 404 is surfaced as an AuditError, not a crash", async () => {
    nock("https://example.com").get("/missing").reply(404, "not found");

    await expect(auditUrl("https://example.com/missing")).rejects.toMatchObject({
      name: "AuditError",
      code: "UPSTREAM_HTTP_ERROR",
      statusCode: 502,
    });
  });

  test("failure case: connection error (DNS) is surfaced as an AuditError", async () => {
    nock("https://no-such-domain-page-pulse-test.invalid")
      .get("/")
      .replyWithError({ code: "ENOTFOUND" });

    await expect(
      auditUrl("https://no-such-domain-page-pulse-test.invalid/")
    ).rejects.toBeInstanceOf(AuditError);
  });

  test("page with no images, no h1, and no meta description still returns a valid report", async () => {
    const html = `<html><head><title>Bare</title></head><body><p>Hi.</p></body></html>`;
    nock("https://example.com").get("/bare").reply(200, html, { "Content-Type": "text/html" });

    const report = await auditUrl("https://example.com/bare");
    expect(report.h1Count).toBe(0);
    expect(report.metaDescription).toBeNull();
    expect(report.images).toEqual({ total: 0, missingAlt: 0 });
  });
});
