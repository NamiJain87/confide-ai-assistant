import React, { useState } from "react";
import { useChat } from "./hooks/useChat";
import ChatWindow from "./components/ChatWindow";
import InputBar from "./components/InputBar";
import ThemeBar from "./components/ThemeBar";
import CreateBotModal from "./components/CreateBotModal";
import ModeDock from "./components/ModeDock";
import YouTubeMode from "./components/modes/YouTubeMode";
import MusicMode from "./components/modes/MusicMode";
import DocsMode from "./components/modes/DocsMode";
import PPTMode from "./components/modes/PPTMode";
import TasksMode from "./components/modes/TasksMode";
import TrainerMode from "./components/modes/TrainerMode";

const MOOD_LABELS = {
  neutral:  { label: "Here for you",    emoji: "🤝" },
  sad:      { label: "I'm listening",   emoji: "💙" },
  anxious:  { label: "Breathe with me", emoji: "🌿" },
  happy:    { label: "Love this energy",emoji: "✨" },
  angry:    { label: "Let it out",      emoji: "🔥" },
  calm:     { label: "Peaceful vibes",  emoji: "🌙" },
};

export default function App() {
  const { 
    messages, loading, error, mood, sendMessage, clearChat, setBotConfig,
    sessions, currentSessionId, loadSession, deleteSession
  } = useChat();

  const [activeTheme,     setActiveTheme]     = useState("bright-blossom");
  const [showBotModal,    setShowBotModal]    = useState(false);
  const [showSidebar,     setShowSidebar]     = useState(false);
  const [botConfig,       setBotConfigState]  = useState(null);
  const [activeMode,      setActiveMode]      = useState("chat");

  const moodInfo    = MOOD_LABELS[mood] || MOOD_LABELS.neutral;
  const displayName = botConfig ? `${botConfig.avatar} ${botConfig.name}` : "Confide";
  const displayAvatar = botConfig ? botConfig.avatar : null;

  function handleBotSave(cfg) {
    setBotConfigState(cfg);
    setBotConfig(cfg);
    sendMessage(`Hey! I just set up my AI — you're now ${cfg.avatar} ${cfg.name}. Please introduce yourself!`);
    setActiveMode("chat");
  }

  function downloadChatHistory() {
    const textContent = messages
      .filter(m => m.role !== "system")
      .map(m => {
        const name = m.role === "user" ? "You" : (botConfig ? botConfig.name : "Confide AI");
        const time = new Date(m.timestamp || Date.now()).toLocaleString();
        return `[${time}] ${name}:\n${m.content}\n`;
      })
      .join("\n----------------------------------------\n\n");

    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Confide_Chat_History_${new Date().toLocaleDateString().replace(/\//g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function renderMode() {
    switch (activeMode) {
      case "youtube":  return <YouTubeMode />;
      case "music":    return (
        <div className="split-mode">
          <MusicMode mood={mood} />
          <div className="split-mode__chat">
            <ChatWindow messages={messages} loading={loading} error={error} />
            <InputBar onSend={sendMessage} loading={loading} />
          </div>
        </div>
      );
      case "docs":     return <DocsMode />;
      case "ppt":      return <PPTMode />;
      case "tasks":    return <TasksMode />;
      case "trainer":  return <TrainerMode />;
      default:         return (
        <>
          <ChatWindow messages={messages} loading={loading} error={error} />
          <InputBar onSend={sendMessage} loading={loading} />
        </>
      );
    }
  }

  return (
    <>
      {/* Aurora Background */}
      <div className="aurora" aria-hidden="true" data-mood={mood}>
        <div className="aurora__blob aurora__blob--1" />
        <div className="aurora__blob aurora__blob--2" />
        <div className="aurora__blob aurora__blob--3" />
        <div className="aurora__blob aurora__blob--4" />
      </div>

      {/* Theme Sidebar */}
      <ThemeBar activeThemeId={activeTheme} onThemeChange={setActiveTheme} />

      {/* Create Bot Modal */}
      {showBotModal && (
        <CreateBotModal
          onClose={() => setShowBotModal(false)}
          onSave={handleBotSave}
          existing={botConfig}
        />
      )}

      <div className="app">
        {/* ── Header ── */}
        <header className="header">
          <div className="header__left">
            <button 
              className="header__menu-btn" 
              onClick={() => setShowSidebar(true)}
              aria-label="Open chat history"
              style={{ background: "transparent", border: "none", fontSize: "24px", color: "var(--text)", cursor: "pointer", marginRight: "10px" }}
            >
              ☰
            </button>
            <div className="header__orb" aria-hidden="true">
              <div className="header__orb-inner">
                {displayAvatar && <span className="header__bot-avatar">{displayAvatar}</span>}
              </div>
            </div>
            <div className="header__brand">
              <h1 className="header__title">{displayName}</h1>
              <span className="header__tagline">
                {botConfig ? botConfig.personality.replace("-", " ") : "Your AI Assistant ✨"}
              </span>
            </div>
          </div>

          <div className="header__right">
            {/* Mood pill */}
            <div className="header__status" aria-label={`Current mood: ${mood}`}>
              <span className="header__status-dot" />
              <span className="header__mood-emoji">{moodInfo.emoji}</span>
              <span>{moodInfo.label}</span>
            </div>

            {/* Create Bot button */}
            <button
              id="create-bot-button"
              className="header__bot-btn"
              onClick={() => setShowBotModal(true)}
              aria-label="Create personal AI bot"
              title="Create your AI bot"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                <line x1="19" y1="3" x2="19" y2="9"/><line x1="16" y1="6" x2="22" y2="6"/>
              </svg>
              {botConfig ? "Edit Bot" : "My Bot"}
            </button>

            {/* Clear & Save buttons — only on chat */}
            {activeMode === "chat" && (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  id="save-chat-button"
                  className="header__clear-btn"
                  onClick={downloadChatHistory}
                  aria-label="Save conversation"
                  title="Save conversation"
                  style={{ background: "var(--surface-hover)", borderColor: "var(--glass-border)", color: "var(--text)" }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Save
                </button>

                <button
                  id="clear-chat-button"
                  className="header__clear-btn"
                  onClick={clearChat}
                  aria-label="New chat"
                  title="New chat"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  New Chat
                </button>
              </div>
            )}
          </div>
        </header>

        {/* ── Sidebar ── */}
        {showSidebar && (
          <div className="sidebar-overlay" onClick={() => setShowSidebar(false)} />
        )}
        <div className={`sidebar ${showSidebar ? "sidebar--open" : ""}`}>
          <div className="sidebar__header">
            <h2>Chat History</h2>
            <button className="sidebar__close" onClick={() => setShowSidebar(false)}>✕</button>
          </div>
          <div className="sidebar__list">
            {sessions.length === 0 && <div style={{padding: "20px", color: "var(--text-muted)", fontSize: "14px"}}>No past chats</div>}
            {sessions.map(s => (
              <div 
                key={s.id} 
                className={`sidebar__item ${s.id === currentSessionId ? "sidebar__item--active" : ""}`}
                onClick={() => {
                  loadSession(s.id);
                  if (window.innerWidth < 768) setShowSidebar(false);
                }}
              >
                <div className="sidebar__item-text">
                  <div className="sidebar__item-title">{s.title}</div>
                  <div className="sidebar__item-date">{new Date(s.date).toLocaleDateString()}</div>
                </div>
                <button 
                  className="sidebar__item-delete" 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(s.id);
                  }}
                  title="Delete chat"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14H6L5 6"/>
                    <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Active Mode ── */}
        <div className="mode-content">
          {renderMode()}
        </div>

        {/* ── Mode Dock ── */}
        <ModeDock activeMode={activeMode} onModeChange={setActiveMode} />
      </div>
    </>
  );
}
