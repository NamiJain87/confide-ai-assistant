import React, { useState } from "react";

const QUICK_SEARCHES = [
  "Python tutorial for beginners",
  "How to study effectively",
  "Motivation speech",
  "5 minute workout at home",
  "Meditation for anxiety",
  "How to make money online",
];

export default function YouTubeMode() {
  const [query,  setQuery]  = useState("");
  const [search, setSearch] = useState("");

  function doSearch(q) {
    setSearch(q);
    setQuery(q);
  }

  return (
    <div className="mode-panel">
      <div className="mode-panel__header">
        <span className="mode-panel__title">📺 YouTube</span>
        <span className="mode-panel__sub">Search and watch without leaving the app</span>
      </div>

      {/* Search bar */}
      <div className="yt__search-row">
        <input
          className="yt__search-input"
          placeholder="Search YouTube…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && query.trim() && doSearch(query.trim())}
        />
        <button className="yt__search-btn" onClick={() => query.trim() && doSearch(query.trim())}>
          🔍 Search
        </button>
      </div>

      {/* Quick searches */}
      {!search && (
        <>
          <div className="music__section-label">Trending Searches</div>
          <div className="yt__quick-grid">
            {QUICK_SEARCHES.map((q) => (
              <button key={q} className="yt__quick-btn" onClick={() => doSearch(q)}>
                🔎 {q}
              </button>
            ))}
          </div>
          <div className="music__empty">
            <span>📺</span>
            <p>Search anything to watch right here — no tab switching needed</p>
          </div>
        </>
      )}

      {/* Embedded search results */}
      {search && (
        <div className="yt__player">
          <iframe
            key={search}
            src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(search)}`}
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="YouTube Player"
            className="yt__iframe"
          />
        </div>
      )}
    </div>
  );
}
