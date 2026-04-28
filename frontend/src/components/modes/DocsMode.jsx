import React, { useState } from "react";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

const TEMPLATES = [
  { id: "essay",      label: "📝 Essay",         prompt: (t) => `Write a well-structured essay on: "${t}". MUST include an introduction, 3 body paragraphs with evidence, and a conclusion. Use clear, academic language.` },
  { id: "assignment", label: "📋 Assignment",     prompt: (t) => `Create a complete assignment on: "${t}". MUST include exactly: 1) Learning objectives 2) 5 short answer questions 3) 2 long answer questions (with model answers) 4) A practical task. Do not skip any section.` },
  { id: "mcq",        label: "❓ MCQ Quiz",       prompt: (t) => `Generate 10 multiple choice questions on: "${t}". MUST format each as: Q1. [question] A) B) C) D) — Answer: [letter]. Do not output anything else.` },
  { id: "notes",      label: "📚 Study Notes",    prompt: (t) => `Create comprehensive study notes on: "${t}". MUST use headings, bullet points, key terms in bold, and include a summary at the end.` },
  { id: "report",     label: "📊 Report",         prompt: (t) => `Write a professional report on: "${t}". MUST include exactly these sections: Executive Summary, Introduction, Findings, Analysis, Recommendations, and Conclusion. Use bullet points for findings.` },
  { id: "letter",     label: "✉️ Letter/Email",    prompt: (t) => `Write a professional letter/email about: "${t}". MUST include standard formal letterhead/formatting, proper salutation, body, and formal closing. Do not omit the standard structural elements.` },
];

export default function DocsMode() {
  const [topic,     setTopic]     = useState("");
  const [template,  setTemplate]  = useState("essay");
  const [content,   setContent]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const selectedTemplate = TEMPLATES.find((t) => t.id === template);

  async function generate() {
    if (!topic.trim()) return;
    setLoading(true);
    setError("");
    setContent("");

    try {
      const prompt = selectedTemplate.prompt(topic);
      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed.");
      setContent(data.reply);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function downloadDocx() {
    if (!content) return;

    const lines = content.split("\n").filter(Boolean);
    const children = lines.map((line) => {
      if (/^#{1,2}\s/.test(line)) {
        return new Paragraph({ text: line.replace(/^#+\s/, ""), heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 } });
      }
      if (/^#{3,}\s/.test(line)) {
        return new Paragraph({ text: line.replace(/^#+\s/, ""), heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 } });
      }
      if (/^[-•*]\s/.test(line)) {
        return new Paragraph({ text: "• " + line.replace(/^[-•*]\s/, ""), bullet: { level: 0 }, spacing: { after: 60 } });
      }
      return new Paragraph({ children: [new TextRun({ text: line, size: 24 })], spacing: { after: 80 } });
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            text: `${selectedTemplate.label.replace(/\p{Emoji}/gu, "").trim()} — ${topic}`,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
          ...children,
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${topic.slice(0, 30).replace(/\s+/g, "_")}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadTxt() {
    const blob = new Blob([content], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `${topic.slice(0, 30).replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mode-panel">
      <div className="mode-panel__header">
        <span className="mode-panel__title">📄 Document Generator</span>
        <span className="mode-panel__sub">Essays, assignments, notes — download as .docx</span>
      </div>

      {/* Template picker */}
      <div className="docs__templates">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            className={`docs__template-btn ${template === t.id ? "docs__template-btn--active" : ""}`}
            onClick={() => setTemplate(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Topic input */}
      <div className="docs__input-row">
        <input
          className="docs__input"
          placeholder={`Topic or prompt for your ${selectedTemplate?.label}…`}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && generate()}
        />
        <button
          className={`docs__generate-btn ${topic.trim() && !loading ? "docs__generate-btn--active" : ""}`}
          onClick={generate}
          disabled={!topic.trim() || loading}
        >
          {loading ? "✨ Writing…" : "✨ Generate"}
        </button>
      </div>

      {error && <div className="docs__error">⚠️ {error}</div>}

      {/* Preview */}
      {content && (
        <div className="docs__preview-wrap">
          <div className="docs__preview-toolbar">
            <span className="docs__preview-label">📄 Preview</span>
            <div className="docs__download-btns">
              <button className="docs__dl-btn" onClick={downloadTxt}>⬇️ .txt</button>
              <button className="docs__dl-btn docs__dl-btn--primary" onClick={downloadDocx}>⬇️ .docx</button>
            </div>
          </div>
          <pre className="docs__preview">{content}</pre>
        </div>
      )}

      {!content && !loading && (
        <div className="music__empty">
          <span>📄</span>
          <p>Choose a template, enter your topic, and generate a full document instantly</p>
        </div>
      )}
    </div>
  );
}
