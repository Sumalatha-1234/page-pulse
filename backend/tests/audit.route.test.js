const request = require("supertest");
const nock = require("nock");
const { createApp } = require("../src/app");

const app = createApp();

describe("POST /api/audit", () => {
  afterEach(() => {
    nock.cleanAll();
  });

  test("happy path returns 200 with a full report", async () => {
    nock("https://good-site.com")
      .get("/")
      .reply(
        200,
        `<html><head><title>Good Site</title></head><body><h1>Hi</h1></body></html>`,
        { "Content-Type": "text/html" }
      );

    const res = await request(app).post("/api/audit").send({ url: "https://good-site.com/" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Good Site");
    expect(res.body.httpStatus).toBe(200);
  });

  test("invalid URL returns 400, never crashes", async () => {
    const res = await request(app).post("/api/audit").send({ url: "definitely not a url" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_URL");
  });

  test("missing url field returns 400", async () => {
    const res = await request(app).post("/api/audit").send({});
    expect(res.status).toBe(400);
  });

  test("timeout from upstream returns a 504, not a crash", async () => {
    nock("https://slow-site.com").get("/").delay(9000).reply(200, "<html></html>");

    const res = await request(app).post("/api/audit").send({ url: "https://slow-site.com/" });
    expect(res.status).toBe(504);
    expect(res.body.error.code).toBe("TIMEOUT");
  }, 12000);

  test("non-HTML response returns 422", async () => {
    nock("https://api-site.com")
      .get("/data")
      .reply(200, { a: 1 }, { "Content-Type": "application/json" });

    const res = await request(app).post("/api/audit").send({ url: "https://api-site.com/data" });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("NON_HTML_RESPONSE");
  });

  test("health check endpoint responds", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
