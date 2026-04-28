import React, { useState, useEffect } from "react";

const DARK_THEMES = [
  {
    id: "dark-midnight",
    label: "Midnight",
    emoji: "🌑",
    vars: {
      "--bg-a": "#0d0d1a", "--bg-b": "#13132b", "--bg-c": "#1a1a3a", "--bg-d": "#0a0a15",
      "--accent-a": "#7c3aed", "--accent-b": "#a855f7",
      "--glow-a": "rgba(124,58,237,0.35)", "--glow-b": "rgba(168,85,247,0.25)",
      "--text": "#e8e0ff", "--text-muted": "#9d8fcc", "--text-faint": "#5a4e80",
      "--surface": "rgba(255,255,255,0.05)", "--surface-hover": "rgba(255,255,255,0.10)",
      "--glass-border": "rgba(255,255,255,0.08)", "--glass-border-h": "rgba(255,255,255,0.18)",
    },
  },
  {
    id: "dark-ocean",
    label: "Deep Ocean",
    emoji: "🌊",
    vars: {
      "--bg-a": "#020e1a", "--bg-b": "#051829", "--bg-c": "#07233a", "--bg-d": "#030f1e",
      "--accent-a": "#0ea5e9", "--accent-b": "#06b6d4",
      "--glow-a": "rgba(14,165,233,0.35)", "--glow-b": "rgba(6,182,212,0.25)",
      "--text": "#d0f0ff", "--text-muted": "#7ab8d4", "--text-faint": "#3a6e88",
      "--surface": "rgba(255,255,255,0.05)", "--surface-hover": "rgba(255,255,255,0.10)",
      "--glass-border": "rgba(255,255,255,0.08)", "--glass-border-h": "rgba(255,255,255,0.18)",
    },
  },
  {
    id: "dark-ember",
    label: "Ember",
    emoji: "🔥",
    vars: {
      "--bg-a": "#1a0500", "--bg-b": "#2a0c00", "--bg-c": "#1f0800", "--bg-d": "#120300",
      "--accent-a": "#f97316", "--accent-b": "#ef4444",
      "--glow-a": "rgba(249,115,22,0.35)", "--glow-b": "rgba(239,68,68,0.25)",
      "--text": "#fff0e6", "--text-muted": "#cc8c60", "--text-faint": "#7a4830",
      "--surface": "rgba(255,255,255,0.05)", "--surface-hover": "rgba(255,255,255,0.10)",
      "--glass-border": "rgba(255,255,255,0.08)", "--glass-border-h": "rgba(255,255,255,0.18)",
    },
  },
];

const BRIGHT_THEMES = [
  {
    id: "bright-blossom",
    label: "Blossom",
    emoji: "🌸",
    vars: {
      "--bg-a": "#ffe4f0", "--bg-b": "#ead5ff", "--bg-c": "#d6eeff", "--bg-d": "#ffecd2",
      "--accent-a": "#f43f8e", "--accent-b": "#a855f7",
      "--glow-a": "rgba(244,63,142,0.22)", "--glow-b": "rgba(168,85,247,0.15)",
      "--text": "#2d1840", "--text-muted": "#7c6090", "--text-faint": "#b8a8c8",
      "--surface": "rgba(255,255,255,0.75)", "--surface-hover": "rgba(255,255,255,0.90)",
      "--glass-border": "rgba(0,0,0,0.07)", "--glass-border-h": "rgba(0,0,0,0.14)",
    },
  },
  {
    id: "bright-sky",
    label: "Sky",
    emoji: "☁️",
    vars: {
      "--bg-a": "#dbeafe", "--bg-b": "#e0e7ff", "--bg-c": "#ede9fe", "--bg-d": "#f0f9ff",
      "--accent-a": "#3b82f6", "--accent-b": "#6366f1",
      "--glow-a": "rgba(59,130,246,0.22)", "--glow-b": "rgba(99,102,241,0.15)",
      "--text": "#1e1b4b", "--text-muted": "#4f518c", "--text-faint": "#9ea3d4",
      "--surface": "rgba(255,255,255,0.75)", "--surface-hover": "rgba(255,255,255,0.90)",
      "--glass-border": "rgba(0,0,0,0.07)", "--glass-border-h": "rgba(0,0,0,0.14)",
    },
  },
  {
    id: "bright-meadow",
    label: "Meadow",
    emoji: "🌿",
    vars: {
      "--bg-a": "#d1fae5", "--bg-b": "#a7f3d0", "--bg-c": "#ccfbf1", "--bg-d": "#cffafe",
      "--accent-a": "#10b981", "--accent-b": "#06b6d4",
      "--glow-a": "rgba(16,185,129,0.22)", "--glow-b": "rgba(6,182,212,0.15)",
      "--text": "#022c22", "--text-muted": "#065f46", "--text-faint": "#6ee7b7",
      "--surface": "rgba(255,255,255,0.75)", "--surface-hover": "rgba(255,255,255,0.90)",
      "--glass-border": "rgba(0,0,0,0.07)", "--glass-border-h": "rgba(0,0,0,0.14)",
    },
  },
  {
    id: "bright-sunny",
    label: "Sunny",
    emoji: "🌻",
    vars: {
      "--bg-a": "#fef9c3", "--bg-b": "#d9f99d", "--bg-c": "#bbf7d0", "--bg-d": "#fde68a",
      "--accent-a": "#eab308", "--accent-b": "#22c55e",
      "--glow-a": "rgba(234,179,8,0.22)", "--glow-b": "rgba(34,197,94,0.15)",
      "--text": "#1a1200", "--text-muted": "#6b5700", "--text-faint": "#c8a700",
      "--surface": "rgba(255,255,255,0.75)", "--surface-hover": "rgba(255,255,255,0.90)",
      "--glass-border": "rgba(0,0,0,0.07)", "--glass-border-h": "rgba(0,0,0,0.14)",
    },
  },
  {
    id: "bright-peach",
    label: "Peach",
    emoji: "🍑",
    vars: {
      "--bg-a": "#fff7ed", "--bg-b": "#ffedd5", "--bg-c": "#fef3c7", "--bg-d": "#fde68a",
      "--accent-a": "#f97316", "--accent-b": "#eab308",
      "--glow-a": "rgba(249,115,22,0.22)", "--glow-b": "rgba(234,179,8,0.15)",
      "--text": "#431407", "--text-muted": "#9a3412", "--text-faint": "#fdba74",
      "--surface": "rgba(255,255,255,0.75)", "--surface-hover": "rgba(255,255,255,0.90)",
      "--glass-border": "rgba(0,0,0,0.07)", "--glass-border-h": "rgba(0,0,0,0.14)",
    },
  },
  {
    id: "bright-rose",
    label: "Rose",
    emoji: "🌹",
    vars: {
      "--bg-a": "#ffe4e6", "--bg-b": "#fecdd3", "--bg-c": "#fed7aa", "--bg-d": "#ffedd5",
      "--accent-a": "#f43f5e", "--accent-b": "#ef4444",
      "--glow-a": "rgba(244,63,94,0.22)", "--glow-b": "rgba(239,68,68,0.15)",
      "--text": "#4c0519", "--text-muted": "#9f1239", "--text-faint": "#fb7185",
      "--surface": "rgba(255,255,255,0.75)", "--surface-hover": "rgba(255,255,255,0.90)",
      "--glass-border": "rgba(0,0,0,0.07)", "--glass-border-h": "rgba(0,0,0,0.14)",
    },
  },
];

export default function ThemeBar({ activeThemeId, onThemeChange }) {
  const [open, setOpen] = useState(false);

  function applyTheme(theme) {
    if (!theme) return;
    const root = document.documentElement;
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
    // Mark dark themes so CSS can fix hardcoded white surfaces
    const isDark = DARK_THEMES.some((t) => t.id === theme.id);
    root.setAttribute("data-dark", isDark ? "true" : "false");
    onThemeChange(theme.id);
  }

  useEffect(() => {
    const defaultTheme = [...DARK_THEMES, ...BRIGHT_THEMES].find(t => t.id === activeThemeId) || BRIGHT_THEMES[0];
    applyTheme(defaultTheme);
  }, []);

  return (
    <>
      {/* Toggle tab */}
      <button
        className="theme-tab"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open theme picker"
        title="Themes & Colors"
      >
        <span className="theme-tab__icon">🎨</span>
        <span className="theme-tab__label">Theme</span>
      </button>

      {/* Sidebar panel */}
      <div className={`theme-panel ${open ? "theme-panel--open" : ""}`}>
        <div className="theme-panel__header">
          <span>🎨 Choose Your Vibe</span>
          <button className="theme-panel__close" onClick={() => setOpen(false)}>✕</button>
        </div>

        <div className="theme-panel__section-label">🌑 Dark Themes</div>
        <div className="theme-panel__grid">
          {DARK_THEMES.map((t) => (
            <button
              key={t.id}
              className={`theme-swatch theme-swatch--dark ${activeThemeId === t.id ? "theme-swatch--active" : ""}`}
              onClick={() => applyTheme(t)}
              title={t.label}
              style={{ background: t.vars["--bg-b"] }}
            >
              <span className="theme-swatch__emoji">{t.emoji}</span>
              <span className="theme-swatch__label">{t.label}</span>
              {activeThemeId === t.id && <span className="theme-swatch__check">✓</span>}
            </button>
          ))}
        </div>

        <div className="theme-panel__divider" />

        <div className="theme-panel__section-label">☀️ Bright Themes</div>
        <div className="theme-panel__grid theme-panel__grid--2col">
          {BRIGHT_THEMES.map((t) => (
            <button
              key={t.id}
              className={`theme-swatch ${activeThemeId === t.id ? "theme-swatch--active" : ""}`}
              onClick={() => applyTheme(t)}
              title={t.label}
              style={{ background: `linear-gradient(135deg, ${t.vars["--bg-a"]}, ${t.vars["--bg-b"]})` }}
            >
              <span className="theme-swatch__emoji">{t.emoji}</span>
              <span className="theme-swatch__label">{t.label}</span>
              {activeThemeId === t.id && <span className="theme-swatch__check">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Backdrop */}
      {open && <div className="theme-backdrop" onClick={() => setOpen(false)} />}
    </>
  );
}
