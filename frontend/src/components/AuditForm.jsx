import React, { useState } from "react";

export default function AuditForm({ onSubmit, loading }) {
  const [value, setValue] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!value.trim() || loading) return;
    onSubmit(value.trim());
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.inputRow}>
        <span style={styles.prompt}>$</span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://example.com"
          aria-label="URL to audit"
          style={styles.input}
          autoFocus
        />
        <button type="submit" disabled={loading || !value.trim()} style={styles.button}>
          {loading ? "auditing…" : "run audit"}
        </button>
      </div>
    </form>
  );
}

const styles = {
  form: { width: "100%" },
  inputRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "var(--surface)",
    border: "1px solid var(--border-strong)",
    borderRadius: "10px",
    padding: "4px 6px 4px 16px",
  },
  prompt: {
    fontFamily: "var(--font-display)",
    color: "var(--signal)",
    fontSize: "16px",
  },
  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "var(--text-primary)",
    fontFamily: "var(--font-display)",
    fontSize: "15px",
    padding: "14px 0",
  },
  button: {
    fontFamily: "var(--font-display)",
    fontSize: "13px",
    fontWeight: 500,
    color: "#08110c",
    background: "var(--signal)",
    border: "none",
    borderRadius: "7px",
    padding: "11px 18px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "opacity 0.15s",
  },
};
