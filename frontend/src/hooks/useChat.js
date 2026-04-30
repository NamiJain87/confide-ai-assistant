import { useState, useCallback, useEffect, useRef } from "react";

// ─────────────────────────────────────────────
//  Mood Detection
//  Reads the user's message and returns a mood
//  string that drives the UI color theme.
// ─────────────────────────────────────────────
function detectMood(text) {
  const t = text.toLowerCase();

  if (/\b(depress|sad|cry|crying|hopeless|worthless|empty|numb|lonely|alone|heartbreak|grief|devastat|broken|suicid|can't go on|no point|miss you|hurt|pain|suffer|miserable|useless)\b/.test(t))
    return "sad";

  if (/\b(anxious|anxiety|stress|stressed|panic|worry|worr|scared|afraid|nervous|overwhelm|overthink|dread|restless|tense|fear|terrif|phobia)\b/.test(t))
    return "anxious";

  if (/\b(angry|anger|mad|furio|frustrat|rage|hate|upset|irritat|pissed|livid|bitter|resentful|explosive|annoyed)\b/.test(t))
    return "angry";

  if (/\b(happy|happines|excit|joy|amazing|wonderful|fantastic|awesome|love it|great|celebrat|thrill|elat|proud|grateful|blessed|on top of the world|best day)\b/.test(t))
    return "happy";

  if (/\b(calm|peace|peaceful|relax|okay|fine|better|chill|serene|content|settled|centred|centered|tranquil|at ease)\b/.test(t))
    return "calm";

  return "neutral";
}

const STORAGE_KEY = "confide_history";
const MOOD_KEY    = "confide_mood";
const SESSIONS_KEY = "confide_sessions";

const WELCOME_MESSAGES = [
  "Hey! I'm Confide 🤝 — your best friend. Tell me anything, I'm all ears.",
  "Hey you 👋 — I'm so glad you opened this. Whatever's on your mind, let it out. I'm here.",
  "Welcome back 🌸 — you've got a safe space here. What's going on today?",
  "Hi there! ✨ I'm Confide. No judgment, no pressure — just tell me how you're feeling.",
  "Hey 💙 — I've been waiting for you. What's on your heart today?",
  "Hello! 🌿 I'm Confide, your personal AI best friend. Talk to me about literally anything.",
  "You showed up — that already takes courage 🔥. I'm here. What's going on?",
  "Hey! 🌙 Whether it's 3am or 3pm, I'm always awake and always listening. Spill it.",
  "Hi! 💬 Think of me as that one friend who never judges and always has time for you. What's up?",
  "Welcome 🌻 — I'm Confide. Your feelings are valid, your thoughts matter. Talk to me!",
  "Hey bestie 🤍 — no small talk needed. What's really going on with you today?",
  "Good to see you 🌈 — I'm Confide. Whether you're happy, sad, or somewhere in between, I'm here.",
];

function makeDefaultMessages() {
  const randomMsg = WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
  return [
    {
      role:      "assistant",
      content:   randomMsg,
      timestamp: Date.now(),
    },
  ];
}


function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export function useChat() {
  const [sessions, setSessions] = useState(() => {
    try {
      const stored = localStorage.getItem(SESSIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [currentSessionId, setCurrentSessionId] = useState(() => {
    if (sessions.length > 0) return sessions[0].id;
    return generateId();
  });

  const [messages, setMessages] = useState(() => {
    if (sessions.length > 0) return sessions[0].messages;
    return makeDefaultMessages();
  });

  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [mood,     setMood]     = useState("neutral");
  const [memoryMode, setMemoryMode] = useState(true);

  // botConfig ref so sendMessage always has access to the latest value
  // without being a dependency (avoids stale closure without re-creating cb)
  const botConfigRef = useRef(null);

  function setBotConfig(cfg) {
    botConfigRef.current = cfg;
  }



  // Save sessions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }, [sessions]);

  // Update current session whenever messages change
  useEffect(() => {
    setSessions(prev => {
      const existingIndex = prev.findIndex(s => s.id === currentSessionId);
      const title = messages.length > 1 ? messages[1].content.substring(0, 30) + (messages[1].content.length > 30 ? "..." : "") : "New Chat";
      const sessionData = {
        id: currentSessionId,
        title,
        messages,
        date: Date.now()
      };

      if (existingIndex >= 0) {
        const newSessions = [...prev];
        newSessions[existingIndex] = sessionData;
        return newSessions;
      } else {
        return [sessionData, ...prev];
      }
    });
  }, [messages, currentSessionId]);

  const sendMessage = useCallback(
    async (userText, images = []) => {
      if (!userText.trim() && images.length === 0) return;

      setError(null);

      const detectedMood = detectMood(userText);
      setMood(detectedMood);

      const userMessage = {
        role:      "user",
        content:   userText,
        timestamp: Date.now(),
      };

      // Build the history that goes to the server (strip UI-only timestamp field)
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setLoading(true);

      // Strip UI-only fields before sending to the API
      let apiMessages = updatedMessages.map(({ role, content }) => ({ role, content }));

      if (memoryMode) {
        if (apiMessages.length > 4) {
          apiMessages = apiMessages.slice(-4);
        }
      } else {
        apiMessages = [apiMessages[apiMessages.length - 1]];
      }

      try {
        const body = { messages: apiMessages };

        // Pass bot config to backend so it can personalise the system prompt
        if (botConfigRef.current) {
          body.botConfig = botConfigRef.current;
        }

        // Attach image data if present so the backend can use a vision model
        if (images.length > 0) {
          body.images = images.map((img) => ({
            base64:   img.base64,
            mimeType: img.mimeType || img.type,
            name:     img.name,
          }));
        }

        const response = await fetch("/api/chat", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(body),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unknown server error.");

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply, timestamp: Date.now() },
        ]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [messages]
  );

  const clearChat = useCallback(() => {
    const fresh = makeDefaultMessages();
    setMessages(fresh);
    setError(null);
    setMood("neutral");
    setCurrentSessionId(generateId());
  }, []);

  const loadSession = useCallback((id) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setMessages(session.messages);
      setCurrentSessionId(id);
      setError(null);
    }
  }, [sessions]);

  const deleteSession = useCallback((id) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (currentSessionId === id) {
        if (filtered.length > 0) {
          setMessages(filtered[0].messages);
          setCurrentSessionId(filtered[0].id);
        } else {
          setMessages(makeDefaultMessages());
          setCurrentSessionId(generateId());
        }
      }
      return filtered;
    });
  }, [currentSessionId]);

  return { 
    messages, 
    loading, 
    error, 
    mood, 
    sendMessage, 
    clearChat, 
    setBotConfig,
    sessions,
    currentSessionId,
    loadSession,
    deleteSession,
    memoryMode,
    setMemoryMode
  };
}
