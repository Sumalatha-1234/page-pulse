import React from "react";

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <a href="https://digitalheroesco.com" target="_blank" rel="noopener noreferrer" style={styles.link}>
        Built for Digital Heroes Training Task
      </a>
    </footer>
  );
}

const styles = {
  footer: {
    textAlign: "center",
    padding: "32px 16px",
    fontSize: "13px",
    color: "var(--text-muted)",
  },
  link: {
    color: "var(--text-muted)",
    textDecoration: "none",
    borderBottom: "1px solid var(--border-strong)",
    paddingBottom: "2px",
  },
};
