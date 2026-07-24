import React from "react";

function StatusPill({ status }) {
  const ok = status >= 200 && status < 300;
  return (
    <span
      style={{
        fontFamily: "var(--font-display)",
        fontSize: "13px",
        fontWeight: 500,
        padding: "3px 10px",
        borderRadius: "999px",
        color: ok ? "var(--signal)" : "var(--amber)",
        background: ok ? "rgba(61,220,151,0.12)" : "rgba(232,163,61,0.12)",
        border: `1px solid ${ok ? "var(--signal-dim)" : "var(--amber)"}`,
      }}
    >
      HTTP {status}
    </span>
  );
}

function Metric({ label, value }) {
  return (
    <div style={{ padding: "16px", background: "var(--surface)", borderRadius: "10px", border: "1px solid var(--border)" }}>
      <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
        {label}
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 500 }}>{value}</div>
    </div>
  );
}

export default function ReportCard({ report }) {
  const altCoverage =
    report.images.total === 0
      ? "n/a"
      : `${report.images.total - report.images.missingAlt}/${report.images.total}`;

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>audited</div>
          <a href={report.url} target="_blank" rel="noopener noreferrer" style={styles.url}>
            {report.url}
          </a>
        </div>
        <StatusPill status={report.httpStatus} />
      </div>

      <div style={styles.grid}>
         <Metric label="Response time" value={`${report.responseTimeMs} ms`} />
         <Metric label="Word count" value={report.wordCount.toLocaleString()} />
         <Metric label="H1 tags" value={report.h1Count} />
         <Metric label="Image count" value={report.images.total} />
         <Metric label="Alt text coverage" value={altCoverage} />
      </div>

      <div style={styles.textFields}>
        <div>
          <div style={styles.fieldLabel}>Title</div>
          <div style={styles.fieldValue}>{report.title || <em style={{ color: "var(--text-muted)" }}>missing</em>}</div>
        </div>
        <div>
          <div style={styles.fieldLabel}>Meta description</div>
          <div style={styles.fieldValue}>
            {report.metaDescription || <em style={{ color: "var(--text-muted)" }}>missing</em>}
          </div>
        </div>
      </div>

      {report.images.missingAlt > 0 && (
        <div style={styles.notice}>
          {report.images.missingAlt} of {report.images.total} images are missing alt text.
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: "var(--surface-raised)",
    border: "1px solid var(--border)",
    borderRadius: "14px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
  },
  url: {
    fontFamily: "var(--font-display)",
    fontSize: "15px",
    color: "var(--text-primary)",
    textDecoration: "none",
    wordBreak: "break-all",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "10px",
  },
  textFields: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    borderTop: "1px solid var(--border)",
    paddingTop: "18px",
  },
  fieldLabel: {
    fontSize: "12px",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "4px",
  },
  fieldValue: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
  },
  notice: {
    fontSize: "13px",
    color: "var(--amber)",
    background: "rgba(232,163,61,0.08)",
    border: "1px solid rgba(232,163,61,0.25)",
    borderRadius: "8px",
    padding: "10px 14px",
  },
};
