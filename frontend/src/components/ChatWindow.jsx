// ─────────────────────────────────────────────
//  ChatWindow Component
// ─────────────────────────────────────────────
// Renders the scrollable list of messages.
// Automatically scrolls to the bottom whenever
// a new message arrives or the AI starts typing.

import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import LoadingIndicator from "./LoadingIndicator";

export default function ChatWindow({ messages, loading, error }) {
  // A ref attached to an invisible div at the bottom of the list.
  // We scroll to it whenever content changes.
  const bottomRef = useRef(null);

  useEffect(() => {
    // Smooth-scroll to the bottom on every update
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <main className="chat-window" aria-live="polite" aria-label="Chat messages">
      {/* Render each message as a bubble */}
      {messages.map((msg, index) => (
        <MessageBubble key={index} message={msg} />
      ))}

      {/* Show the typing animation while waiting for AI */}
      {loading && <LoadingIndicator />}

      {/* Show an error banner if the API call failed */}
      {error && (
        <div className="error-banner" role="alert">
          <span className="error-banner__icon">⚠️</span>
          <span className="error-banner__text">{error}</span>
        </div>
      )}

      {/* Invisible anchor at the bottom for auto-scrolling */}
      <div ref={bottomRef} />
    </main>
  );
}
