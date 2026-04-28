import React, { useState, useRef, useEffect, useCallback } from "react";

export default function InputBar({ onSend, loading }) {
  const [text,        setText]        = useState("");
  const [recording,   setRecording]   = useState(false);
  const [transcript,  setTranscript]  = useState(""); // live interim text
  const [recSecs,     setRecSecs]     = useState(0);
  const [attachMenu,  setAttachMenu]  = useState(false);
  const [attachments, setAttachments] = useState([]);

  const textareaRef  = useRef(null);
  const fileInputRef = useRef(null);
  const srRef        = useRef(null);
  const timerRef     = useRef(null);
  const finalRef     = useRef("");     // accumulates final transcript words

  // Auto-focus on mount
  useEffect(() => { textareaRef.current?.focus(); }, []);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 180)}px`; }
  }, [text, transcript]);

  // ── Send ─────────────────────────────────────
  function handleSend(msg, imgs) {
    const content = (msg ?? text).trim();
    const images  = imgs ?? attachments.filter((a) => a.base64);
    const files   = attachments.filter((a) => !a.base64);
    const fullMsg = content + (files.length ? `\n📎 ${files.map(a => a.name).join(", ")}` : "");
    if (!fullMsg.trim() && images.length === 0) return;
    if (loading) return;
    onSend(fullMsg, images);
    setText("");
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  // ── Voice → Text (Web Speech API) ────────────
  function toggleVoice() {
    if (recording) { srRef.current?.stop(); return; }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice input needs Chrome or Edge browser."); return; }

    const sr = new SR();
    sr.lang           = "en-US";
    sr.continuous     = false;
    sr.interimResults = true;
    finalRef.current  = "";

    sr.onstart = () => {
      setRecording(true);
      setTranscript("");
      setRecSecs(0);
      timerRef.current = setInterval(() => setRecSecs((s) => s + 1), 1000);
    };

    sr.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalRef.current += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      setTranscript(finalRef.current + interim);
    };

    sr.onerror  = () => srRef.current?.stop();

    sr.onend = () => {
      clearInterval(timerRef.current);
      setRecording(false);
      setTranscript("");
      setRecSecs(0);
      const spoken = finalRef.current.trim();
      finalRef.current = "";
      if (spoken) {
        // Auto-send the spoken words directly — no audio file attached
        onSend(spoken, []);
      }
    };

    srRef.current = sr;
    sr.start();
  }

  // ── File picker ───────────────────────────────
  function handleFilePick(accept) {
    setAttachMenu(false);
    fileInputRef.current.accept = accept;
    fileInputRef.current.click();
  }

  function handleFiles(e) {
    Array.from(e.target.files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const base64 = ev.target.result.split(",")[1];
          setAttachments((p) => [...p, { name: file.name, type: file.type, mimeType: file.type, base64 }]);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachments((p) => [...p, { name: file.name, type: file.type }]);
      }
    });
    e.target.value = "";
  }

  function removeAttachment(idx) {
    setAttachments((p) => p.filter((_, i) => i !== idx));
  }

  const canSend   = (!!text.trim() || attachments.length > 0) && !loading && !recording;
  const recMin    = String(Math.floor(recSecs / 60)).padStart(2, "0");
  const recSec    = String(recSecs % 60).padStart(2, "0");
  const showValue = recording
    ? (transcript ? `🎙️ ${transcript}` : `🎙️ Listening… ${recMin}:${recSec}`)
    : text;

  return (
    <div className="input-bar">
      <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={handleFiles} />

      {/* Attachment chips */}
      {attachments.length > 0 && (
        <div className="input-bar__attachments">
          {attachments.map((a, i) => (
            <div key={i} className="attach-chip">
              <span className="attach-chip__icon">
                {a.type?.startsWith("video") ? "🎬" : a.type?.startsWith("image") ? "🖼️" : "📎"}
              </span>
              <span className="attach-chip__name">{a.name}</span>
              <button className="attach-chip__remove" onClick={() => removeAttachment(i)} aria-label="Remove">×</button>
            </div>
          ))}
        </div>
      )}

      <div className="input-bar__inner">

        {/* Attach */}
        <div className="attach-wrap">
          <button id="attach-button" className="input-bar__icon-btn"
            onClick={() => setAttachMenu((o) => !o)} aria-label="Attach" title="Attach">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41a2 2 0 01-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>
          {attachMenu && (
            <div className="attach-menu" role="menu">
              <button className="attach-menu__item" onClick={() => handleFilePick("image/*")}>🖼️ Photo</button>
              <button className="attach-menu__item" onClick={() => handleFilePick("video/*")}>🎬 Video</button>
              <button className="attach-menu__item" onClick={() => handleFilePick("*/*")}>📎 File</button>
            </div>
          )}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          id="chat-input"
          className={`input-bar__textarea${recording ? " input-bar__textarea--listening" : ""}`}
          placeholder="Tell me anything… or tap 🎙️ to speak"
          value={showValue}
          onChange={(e) => !recording && setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          rows={1}
          readOnly={recording}
          aria-label="Type your message"
        />

        {/* Mic / Voice button */}
        <button
          id="voice-button"
          className={`input-bar__icon-btn input-bar__voice${recording ? " input-bar__voice--active" : ""}`}
          onClick={toggleVoice}
          disabled={loading}
          aria-label={recording ? "Stop listening" : "Speak to Confide"}
          title={recording ? "Tap to stop" : "Tap to speak"}
        >
          {recording
            ? <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                <path d="M19 10v2a7 7 0 01-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8"  y1="23" x2="16" y2="23"/>
              </svg>
          }
        </button>

        {/* Send */}
        <button
          id="send-button"
          className={`input-bar__send${canSend ? " input-bar__send--active" : ""}`}
          onClick={() => handleSend()}
          disabled={!canSend}
          aria-label="Send message"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5"/>
            <polyline points="5 12 12 5 19 12"/>
          </svg>
        </button>
      </div>

      <p className="input-bar__hint">
        {recording
          ? "🎙️ Listening — Confide will reply when you stop speaking"
          : "Confide is here for you. No judgment, ever."}
      </p>
    </div>
  );
}
