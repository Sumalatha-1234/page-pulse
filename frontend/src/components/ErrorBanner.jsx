import React from "react";

export default function ErrorBanner({ message }) {
  return (
    <div
      role="alert"
      style={{
        background: "rgba(232,97,93,0.08)",
        border: "1px solid rgba(232,97,93,0.35)",
        color: "var(--coral)",
        borderRadius: "10px",
        padding: "14px 16px",
        fontSize: "14px",
        fontFamily: "var(--font-display)",
      }}
    >
      {message}
    </div>
  );
}
