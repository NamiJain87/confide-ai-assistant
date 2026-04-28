import React, { useState, useRef } from "react";

// Curated playlists per mood — no API key needed
const MOOD_PLAYLISTS = {
  neutral:  { id: "PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSK", label: "Lofi Chill Mix 🌿" },
  sad:      { id: "PLDfKAXSRaWn23hGkE5eXQHlFrqdYHFHuV", label: "Healing Melodies 💙" },
  anxious:  { id: "PLgzTt0k8mXzEk586ze4BjvDXR7c-TUSnx", label: "Calm Your Mind 🌊" },
  happy:    { id: "PLFgquLnL59akA2PflFpeQG9L01VFg90wS", label: "Feel-Good Vibes ✨" },
  angry:    { id: "PLw-VjHDlEOgs658kAHR_LAaQ8I6WHRRQ1", label: "Release the Energy 🔥" },
  calm:     { id: "PLMpM3Z0SVgJFqHHMvsZRDauhBEhJMt8Tb", label: "Peaceful Ambient 🌙" },
};

const QUICK_VIBES = [
  { query: "lofi hip hop study beats",    label: "📚 Study"    },
  { query: "morning motivation music",    label: "☀️ Morning"  },
  { query: "workout gym music 2024",      label: "🏋️ Workout"  },
  { query: "deep sleep music relaxing",   label: "😴 Sleep"    },
  { query: "bollywood songs 2024",        label: "🎬 Bollywood" },
  { query: "top hits pop music 2024",     label: "🎤 Pop Hits" },
];

export default function MusicMode({ mood = "neutral" }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activePlaylist, setActivePlaylist] = useState(null);
  const [activeSearch, setActiveSearch] = useState("");

  const playlist = MOOD_PLAYLISTS[mood] || MOOD_PLAYLISTS.neutral;

  function playMoodPlaylist() {
    setActivePlaylist(playlist.id);
    setActiveSearch("");
  }

  function playSearch(query) {
    // Check if it's a Youtube URL
    let videoId = query;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = query.match(regExp);
    if (match && match[2].length === 11) {
      videoId = match[2];
    } else {
      // It's just a text query, but since search doesn't work, we'll try to just show a generic playlist or error
      // Actually, we can prompt them to use a URL.
      alert("Please paste a valid YouTube Video URL.");
      return;
    }
    setActiveSearch(videoId);
    setActivePlaylist(null);
  }

  const embedSrc = activePlaylist
    ? `https://www.youtube.com/embed/videoseries?list=${activePlaylist}&autoplay=1`
    : activeSearch
    ? `https://www.youtube.com/embed/${activeSearch}?autoplay=1`
    : null;

  return (
    <div className="mode-panel">
      <div className="mode-panel__header">
        <span className="mode-panel__title">🎵 Music Player</span>
        <span className="mode-panel__sub">Mood detected: <strong>{mood}</strong></span>
      </div>

      {/* Mood auto-playlist */}
      <div className="music__mood-card" onClick={playMoodPlaylist}>
        <div className="music__mood-card-info">
          <span className="music__mood-card-label">✨ Play for your mood</span>
          <span className="music__mood-card-name">{playlist.label}</span>
        </div>
        <button className="music__play-btn" aria-label="Play mood playlist">▶</button>
      </div>

      {/* Quick vibes */}
      <div className="music__section-label">Quick Vibes</div>
      <div className="music__quick-grid">
        {QUICK_VIBES.map((v) => (
          <button key={v.query} className="music__vibe-btn" onClick={() => playSearch(v.query)}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="music__search-row">
        <input
          className="music__search-input"
          placeholder="Paste a YouTube Video URL..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchQuery.trim() && playSearch(searchQuery.trim())}
        />
        <button className="music__search-btn" onClick={() => searchQuery.trim() && playSearch(searchQuery.trim())}>
          🔍
        </button>
      </div>

      {/* Player */}
      {embedSrc ? (
        <div className="music__player">
          <iframe
            src={embedSrc}
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="Music Player"
            className="music__iframe"
          />
        </div>
      ) : (
        <div className="music__empty">
          <span>🎶</span>
          <p>Choose a vibe or paste a YouTube URL to start playing</p>
        </div>
      )}
    </div>
  );
}
