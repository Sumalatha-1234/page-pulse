import React, { useState } from "react";
import axios from "axios";
import PulseLine from "./components/PulseLine.jsx";
import AuditForm from "./components/AuditForm.jsx";
import ReportCard from "./components/ReportCard.jsx";
import ErrorBanner from "./components/ErrorBanner.jsx";
import Footer from "./components/Footer.jsx";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export default function App() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function runAudit(url) {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const response = await axios.post(`${API_BASE}/audit`, { url });
      setReport(response.data);
    } catch (err) {
      const message =
        err.response?.data?.error?.message ||
        "Couldn't reach the audit service. Check your connection and try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <main style={styles.main}>
        <header style={styles.header}>
          <div style={styles.eyebrow}>page pulse</div>
          <h1 style={styles.title}>Audit any URL in seconds</h1>
          <p style={styles.subtitle}>
            Status, timing, SEO basics, and accessibility gaps — one request away.
          </p>
        </header>

        <PulseLine active={loading} />

        <div style={styles.formWrap}>
          <AuditForm onSubmit={runAudit} loading={loading} />
        </div>

        <div style={styles.resultWrap}>
          {error && <ErrorBanner message={error} />}
          {report && <ReportCard report={report} />}
        </div>
      </main>
      <Footer />
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  main: {
    maxWidth: "680px",
    width: "100%",
    margin: "0 auto",
    padding: "72px 20px 40px",
    display: "flex",
    flexDirection: "column",
    gap: "28px",
  },
  header: {
    textAlign: "center",
  },
  eyebrow: {
    fontFamily: "var(--font-display)",
    fontSize: "13px",
    color: "var(--signal)",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: "14px",
  },
  title: {
    fontSize: "clamp(28px, 5vw, 38px)",
    fontWeight: 600,
    margin: "0 0 12px",
    letterSpacing: "-0.01em",
  },
  subtitle: {
    fontSize: "16px",
    color: "var(--text-secondary)",
    margin: 0,
    lineHeight: 1.6,
  },
  formWrap: {
    width: "100%",
  },
  resultWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
};
