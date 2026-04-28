import React from "react";

function formatTime(ts) {
  const date = ts ? new Date(ts) : new Date();
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Render markdown-like formatting: **bold**, *italic*, bullet lists, line breaks
function renderContent(text) {
  if (!text) return null;

  // Split into lines for list handling
  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Bullet list items: "- " or "• "
    if (/^(\s*[-•*]\s)/.test(line)) {
      const listItems = [];
      while (i < lines.length && /^(\s*[-•*]\s)/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*[-•*]\s/, "").trim());
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="bubble__list">
          {listItems.map((item, j) => (
            <li key={j}>{inlineFormat(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list items: "1. " etc.
    if (/^\d+\.\s/.test(line)) {
      const listItems = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\.\s/, "").trim());
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="bubble__list bubble__list--ordered">
          {listItems.map((item, j) => (
            <li key={j}>{inlineFormat(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty line → small spacer
    if (line.trim() === "") {
      elements.push(<div key={`br-${i}`} className="bubble__spacer" />);
      i++;
      continue;
    }

    // Normal paragraph line
    elements.push(<p key={`p-${i}`} className="bubble__para">{inlineFormat(line)}</p>);
    i++;
  }

  return elements;
}

// Inline formatting: **bold**, *italic*, `code`
function inlineFormat(text) {
  // Split by bold/italic/code markers
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={idx}>{part.slice(2, -2)}</strong>;
    if (/^\*[^*]+\*$/.test(part))     return <em      key={idx}>{part.slice(1, -1)}</em>;
    if (/^`[^`]+`$/.test(part))       return <code    key={idx} className="bubble__code">{part.slice(1, -1)}</code>;
    return part;
  });
}

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`message-row ${isUser ? "message-row--user" : "message-row--ai"}`}>
      {/* AI avatar — glowing orb */}
      {!isUser && (
        <div className="avatar avatar--ai" aria-label="Confide">
          ✦
        </div>
      )}

      <div className={`bubble ${isUser ? "bubble--user" : "bubble--ai"}`}>
        <div className="bubble__text">
          {isUser
            ? <p className="bubble__para">{message.content}</p>
            : renderContent(message.content)
          }
        </div>
        <div className="bubble__footer">
          <span className="bubble__time">{formatTime(message.timestamp)}</span>
        </div>
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="avatar avatar--user" aria-label="You">
          🧑
        </div>
      )}
    </div>
  );
}
