import React, { useState } from "react";
import pptxgen from "pptxgenjs";

const SLIDE_COUNTS = [3, 5, 7, 10, 15];

const THEMES = [
  { id: "confide",    label: "🌸 Confide",    bg: "2D1840", accent: "F43F8E", text: "FFFFFF" },
  { id: "ocean",      label: "🌊 Ocean",      bg: "020E1A", accent: "0EA5E9", text: "D0F0FF" },
  { id: "midnight",   label: "🌑 Midnight",   bg: "0D0D1A", accent: "7C3AED", text: "E8E0FF" },
  { id: "sunset",     label: "🔥 Sunset",     bg: "1A0500", accent: "F97316", text: "FFF0E6" },
  { id: "meadow",     label: "🌿 Meadow",     bg: "022C22", accent: "10B981", text: "D1FAE5" },
  { id: "corporate",  label: "💼 Corporate",  bg: "1E293B", accent: "3B82F6", text: "F1F5F9" },
];

export default function PPTMode() {
  const [topic,      setTopic]      = useState("");
  const [slides,     setSlides]     = useState(5);
  const [words,      setWords]      = useState("");
  const [themeId,    setThemeId]    = useState("confide");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [preview,    setPreview]    = useState(null); // array of {title, bullets}

  const theme = THEMES.find((t) => t.id === themeId);

  async function generate() {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setPreview(null);

    try {
      const prompt = `Create a ${slides}-slide presentation on: "${topic}".
${words ? `\nCRITICAL INSTRUCTION: Each slide MUST contain EXACTLY ${words} words of content (not less). DO NOT summarize, DO NOT shorten content. You MUST write out exactly ${words} words per slide.` : ""}

Return ONLY valid JSON in this exact format (no extra text, no markdown):
[
  { "title": "Slide Title", "bullets": ["Point 1", "Point 2", "Point 3"] },
  ...
]

Rules:
- Exactly ${slides} slide objects
- Each slide has 1 title and multiple bullet points that combine to reach the required word count.
- First slide is the intro/title slide
- Last slide is a summary/conclusion
- DO NOT ignore word limits!`;

      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed.");

      // Parse the JSON — strip any markdown fences if present
      let cleaned = data.reply.replace(/```json|```/g, "").trim();
      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch (err) {
        // Attempt to fix truncated JSON array if response limit was hit
        const lastBrace = cleaned.lastIndexOf('}');
        if (lastBrace !== -1) {
          try {
            parsed = JSON.parse(cleaned.substring(0, lastBrace + 1) + ']');
          } catch(e) {
            throw err;
          }
        } else {
          throw err;
        }
      }
      setPreview(parsed);
    } catch (e) {
      setError("Couldn't parse the slides completely. The requested word count might be too high for a single response. " + e.message);
    } finally {
      setLoading(false);
    }
  }

  function buildPPT() {
    if (!preview) return;
    const prs = new pptxgen();
    prs.layout = "LAYOUT_WIDE";

    preview.forEach((slide, idx) => {
      const s = prs.addSlide();

      // Background
      s.background = { color: theme.bg };

      // Accent bar at top
      s.addShape(prs.ShapeType.rect, {
        x: 0, y: 0, w: "100%", h: 0.08,
        fill: { color: theme.accent },
        line: { color: theme.accent },
      });

      // Slide number
      s.addText(`${idx + 1} / ${preview.length}`, {
        x: 8.8, y: 0.1, w: 0.8, h: 0.3,
        fontSize: 9, color: theme.accent,
        align: "right",
      });

      // Title
      s.addText(slide.title, {
        x: 0.5, y: 0.25, w: 9, h: 1.1,
        fontSize: idx === 0 ? 36 : 28,
        bold: true,
        color: theme.text,
        fontFace: "Calibri",
      });

      // Divider
      s.addShape(prs.ShapeType.rect, {
        x: 0.5, y: 1.4, w: 8, h: 0.04,
        fill: { color: theme.accent },
        line: { color: theme.accent },
      });

      // Bullets
      s.addText(
        slide.bullets.map((b) => ({ text: b, options: { bullet: true, breakLine: true } })),
        {
          x: 0.5, y: 1.6, w: 9, h: 3.5,
          fontSize: 18,
          color: theme.text,
          fontFace: "Calibri",
          valign: "top",
          autoFit: true
        }
      );

      // Confide watermark
      s.addText("✦ Confide", {
        x: 0, y: 5.0, w: "100%", h: 0.3,
        fontSize: 9, color: theme.accent,
        align: "center", italic: true,
      });
    });

    prs.writeFile({ fileName: `${topic.slice(0, 30).replace(/\s+/g, "_")}_presentation.pptx` });
  }

  return (
    <div className="mode-panel">
      <div className="mode-panel__header">
        <span className="mode-panel__title">🎯 PPT Generator</span>
        <span className="mode-panel__sub">Type a topic → get a real .pptx file instantly</span>
      </div>

      {/* Topic */}
      <div className="docs__input-row">
        <input
          className="docs__input"
          placeholder="e.g. Machine Learning, Climate Change, Business Plan…"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && generate()}
        />
        <input
          className="docs__input"
          style={{ width: "160px" }}
          placeholder="Words per slide"
          type="number"
          value={words}
          onChange={(e) => setWords(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && generate()}
        />
      </div>

      {/* Controls row */}
      <div className="ppt__controls">
        <div className="ppt__control-group">
          <label className="ppt__control-label">Slides</label>
          <div className="ppt__slide-count">
            {SLIDE_COUNTS.map((n) => (
              <button
                key={n}
                className={`ppt__count-btn ${slides === n ? "ppt__count-btn--active" : ""}`}
                onClick={() => setSlides(n)}
              >{n}</button>
            ))}
          </div>
        </div>

        <div className="ppt__control-group">
          <label className="ppt__control-label">Theme</label>
          <div className="ppt__themes">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`ppt__theme-btn ${themeId === t.id ? "ppt__theme-btn--active" : ""}`}
                onClick={() => setThemeId(t.id)}
                title={t.label}
                style={{ background: `#${t.bg}`, color: `#${t.accent}`, border: `1.5px solid #${themeId === t.id ? t.accent : "444"}` }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        className={`docs__generate-btn ${topic.trim() && !loading ? "docs__generate-btn--active" : ""}`}
        style={{ width: "100%", marginTop: 12 }}
        onClick={generate}
        disabled={!topic.trim() || loading}
      >
        {loading ? "✨ Generating slides…" : "✨ Generate Presentation"}
      </button>

      {error && <div className="docs__error">⚠️ {error}</div>}

      {/* Slide preview */}
      {preview && (
        <div className="ppt__preview-wrap">
          <div className="docs__preview-toolbar">
            <span className="docs__preview-label">🖼️ {preview.length} Slides Preview</span>
            <button className="docs__dl-btn docs__dl-btn--primary" onClick={buildPPT}>
              ⬇️ Download .pptx
            </button>
          </div>
          <div className="ppt__slide-list">
            {preview.map((slide, i) => (
              <div key={i} className="ppt__slide-card" style={{ borderColor: `#${theme.accent}22`, background: `#${theme.bg}` }}>
                <div className="ppt__slide-num" style={{ color: `#${theme.accent}` }}>{i + 1}</div>
                <div className="ppt__slide-title" style={{ color: `#${theme.text}` }}>{slide.title}</div>
                <ul className="ppt__slide-bullets">
                  {slide.bullets.map((b, j) => (
                    <li key={j} style={{ color: `#${theme.text}99` }}>• {b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {!preview && !loading && (
        <div className="music__empty">
          <span>🎯</span>
          <p>Enter a topic and Confide will write, design, and package a full presentation for you</p>
        </div>
      )}
    </div>
  );
}
