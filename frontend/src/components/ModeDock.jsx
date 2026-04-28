import React from "react";

export const MODES = [
  { id: "chat",    icon: "💬", label: "Chat"     },
  { id: "youtube", icon: "📺", label: "YouTube"  },
  { id: "music",   icon: "🎵", label: "Music"    },
  { id: "tasks",   icon: "✅", label: "Tasks"    },
  { id: "docs",    icon: "📄", label: "Docs"     },
  { id: "ppt",     icon: "🎯", label: "PPT"      },
  { id: "trainer", icon: "🏋️", label: "Trainer"  },
];

export default function ModeDock({ activeMode, onModeChange }) {
  return (
    <nav className="mode-dock" aria-label="App modes">
      {MODES.map((m) => (
        <button
          key={m.id}
          id={`mode-${m.id}`}
          className={`mode-dock__btn ${activeMode === m.id ? "mode-dock__btn--active" : ""}`}
          onClick={() => onModeChange(m.id)}
          aria-label={m.label}
          title={m.label}
        >
          <span className="mode-dock__icon">{m.icon}</span>
          <span className="mode-dock__label">{m.label}</span>
        </button>
      ))}
    </nav>
  );
}
