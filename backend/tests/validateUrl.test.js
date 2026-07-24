const { validateUrl } = require("../src/utils/validateUrl");

describe("validateUrl", () => {
  test("accepts a well-formed https URL", () => {
    const result = validateUrl("https://example.com/page");
    expect(result.valid).toBe(true);
    expect(result.url).toBe("https://example.com/page");
  });

  test("rejects an empty string", () => {
    const result = validateUrl("");
    expect(result.valid).toBe(false);
  });

  test("rejects malformed URLs", () => {
    const result = validateUrl("not a url");
    expect(result.valid).toBe(false);
  });

  test("rejects non-http(s) protocols", () => {
    const result = validateUrl("ftp://example.com/file");
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/http/i);
  });

  test("rejects localhost to prevent internal probing", () => {
    const result = validateUrl("http://localhost:4000/admin");
    expect(result.valid).toBe(false);
  });

  test("rejects private IP ranges", () => {
    expect(validateUrl("http://192.168.1.1").valid).toBe(false);
    expect(validateUrl("http://10.0.0.5").valid).toBe(false);
  });
});
