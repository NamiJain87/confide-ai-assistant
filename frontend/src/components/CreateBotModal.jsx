import React, { useState } from "react";

const AVATARS = ["🤖","🦊","🐉","🦋","🌙","⚡","🌸","🎭","🔮","🦁","🐺","🌊","🔥","🌿","💎","🦅"];

const PERSONALITIES = [
  { id: "empathetic",  label: "Empathetic Friend",  desc: "Warm, caring, always listens" },
  { id: "coach",       label: "Life Coach",          desc: "Motivating, goal-oriented" },
  { id: "therapist",   label: "Calm Therapist",      desc: "Gentle, reflective, grounded" },
  { id: "hype",        label: "Hype Partner",        desc: "Energetic, positive, encouraging" },
  { id: "philosopher", label: "Philosopher",         desc: "Deep, thoughtful, questioning" },
  { id: "bestie",      label: "Best Friend",         desc: "Funny, real, no filter" },
];

// `existing` — pre-filled bot config when editing
export default function CreateBotModal({ onClose, onSave, existing }) {
  const [name,         setName]         = useState(existing?.name         || "");
  const [avatar,       setAvatar]       = useState(existing?.avatar       || "🤖");
  const [personality,  setPersonality]  = useState(existing?.personality  || "empathetic");
  const [customPrompt, setCustomPrompt] = useState(existing?.customPrompt || "");

  function handleSave() {
    if (!name.trim()) return;
    onSave({ name: name.trim(), avatar, personality, customPrompt });
    onClose();
  }

  const isEditing = !!existing;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={isEditing ? "Edit your AI bot" : "Create your AI bot"}
      >
        <div className="modal__header">
          <h2 className="modal__title">
            {isEditing ? `✏️ Edit ${existing.avatar} ${existing.name}` : "✨ Create Your AI Bot"}
          </h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Bot Name */}
        <div className="modal__field">
          <label className="modal__label" htmlFor="bot-name-input">Bot Name</label>
          <input
            id="bot-name-input"
            className="modal__input"
            placeholder="e.g. Luna, Sage, Max…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            autoFocus
          />
        </div>

        {/* Avatar */}
        <div className="modal__field">
          <label className="modal__label">Choose Avatar</label>
          <div className="modal__avatars">
            {AVATARS.map((a) => (
              <button
                key={a}
                className={`modal__avatar-btn ${avatar === a ? "modal__avatar-btn--active" : ""}`}
                onClick={() => setAvatar(a)}
                aria-label={`Avatar ${a}`}
                aria-pressed={avatar === a}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Personality */}
        <div className="modal__field">
          <label className="modal__label">Personality</label>
          <div className="modal__personalities">
            {PERSONALITIES.map((p) => (
              <button
                key={p.id}
                className={`modal__personality ${personality === p.id ? "modal__personality--active" : ""}`}
                onClick={() => setPersonality(p.id)}
                aria-pressed={personality === p.id}
              >
                <span className="modal__personality-label">{p.label}</span>
                <span className="modal__personality-desc">{p.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom system prompt */}
        <div className="modal__field">
          <label className="modal__label">
            Custom Instructions <span className="modal__optional">(optional)</span>
          </label>
          <textarea
            className="modal__textarea"
            placeholder="Tell your bot anything special — how to talk to you, topics to focus on, your name…"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={3}
          />
        </div>

        <div className="modal__actions">
          <button className="modal__cancel" onClick={onClose}>Cancel</button>
          <button
            id="bot-save-button"
            className={`modal__save ${name.trim() ? "modal__save--active" : ""}`}
            onClick={handleSave}
            disabled={!name.trim()}
          >
            {avatar} {isEditing ? `Update ${name.trim() || "Bot"}` : `Create ${name.trim() || "Bot"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
