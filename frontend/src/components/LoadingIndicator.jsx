import React from "react";

// Heartbeat loading animation — 3 rose-glowing pulsing dots
// with a "Confide is thinking…" label
export default function LoadingIndicator() {
  return (
    <div className="message-row message-row--ai" aria-label="Confide is thinking">
      <div className="avatar avatar--ai">✦</div>

      <div className="bubble bubble--ai bubble--loading">
        <span className="hb-dot" />
        <span className="hb-dot" />
        <span className="hb-dot" />
        <span className="thinking-label">thinking…</span>
      </div>
    </div>
  );
}
