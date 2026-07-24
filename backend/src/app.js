const express = require("express");
const cors = require("cors");
const auditRouter = require("./routes/audit");

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "10kb" }));

  app.get("/api/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/api", auditRouter);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: { message: "Not found", code: "NOT_FOUND" } });
  });

  // Final safety net — guarantees the process never crashes on a thrown error.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: { message: "Internal server error", code: "INTERNAL_ERROR" } });
  });

  return app;
}

module.exports = { createApp };
