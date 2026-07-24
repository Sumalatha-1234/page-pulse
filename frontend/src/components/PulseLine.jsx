import React from "react";

/**
 * The signature visual: an EKG-style pulse line.
 * Flat and calm at rest, spikes while a check is running, in the signal color.
 */
export default function PulseLine({ active = false }) {
  const flatPath = "M0,30 L140,30 L150,30 L160,30 L700,30";
  const activePath =
    "M0,30 L120,30 L132,30 L140,8 L148,52 L156,12 L164,30 L176,30 L560,30 L572,30 L580,10 L588,50 L596,30 L700,30";

  return (
    <svg
      viewBox="0 0 700 60"
      width="100%"
      height="48"
      preserveAspectRatio="none"
      role="img"
      aria-label={active ? "Audit in progress" : "Idle"}
      style={{ display: "block" }}
    >
      <path
        d={active ? activePath : flatPath}
        fill="none"
        stroke="var(--signal)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          transition: "d 0.3s ease",
          filter: active ? "drop-shadow(0 0 4px rgba(61,220,151,0.5))" : "none",
        }}
      >
        {active && (
          <animate
            attributeName="d"
            values={`${activePath};${flatPath};${activePath}`}
            dur="1.4s"
            repeatCount="indefinite"
          />
        )}
      </path>
    </svg>
  );
}
