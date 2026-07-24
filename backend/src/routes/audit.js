const express = require("express");
const { validateUrl } = require("../utils/validateUrl");
const { auditUrl, AuditError } = require("../services/auditService");

const router = express.Router();

router.post("/audit", async (req, res) => {
  const { url } = req.body || {};

  const validation = validateUrl(url);
  if (!validation.valid) {
    return res.status(400).json({ error: { message: validation.reason, code: "INVALID_URL" } });
  }

  try {
    const report = await auditUrl(validation.url);
    return res.status(200).json(report);
  } catch (err) {
    if (err instanceof AuditError) {
      return res.status(err.statusCode).json({ error: { message: err.message, code: err.code } });
    }
    // Unexpected error — never leak internals, never crash the process.
    // eslint-disable-next-line no-console
    console.error("Unexpected audit error:", err);
    return res.status(500).json({ error: { message: "Something went wrong auditing that page.", code: "INTERNAL_ERROR" } });
  }
});

module.exports = router;
