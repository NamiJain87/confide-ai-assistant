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

function makeDefaultMessages() {
  return [
    {
      role:      "assistant",
      content:   "Hey! I'm Confide 🤝 — your best friend. Tell me anything, I'm all ears.",
      timestamp: Date.now(),
    },
  ];
}


export function useChat() {
  const [messages, setMessages] = useState(makeDefaultMessages);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [mood,     setMood]     = useState("neutral");

  // botConfig ref so sendMessage always has access to the latest value
  // without being a dependency (avoids stale closure without re-creating cb)
  const botConfigRef = useRef(null);

  function setBotConfig(cfg) {
    botConfigRef.current = cfg;
  }



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
      const apiMessages = updatedMessages.map(({ role, content }) => ({ role, content }));

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    localStorage.setItem(MOOD_KEY, "neutral");
  }, []);

  return { messages, loading, error, mood, sendMessage, clearChat, setBotConfig };
}
