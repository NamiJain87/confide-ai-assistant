// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Confide — AI Backend Server
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Providers supported:
//   • groq   — 100% FREE, Llama 3.3 70B (default)
//   • gemini — Google Gemini
//   • openai — OpenAI GPT

const express = require("express");
const cors    = require("cors");
const axios   = require("axios");
require("dotenv").config();

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "20mb" })); // larger limit to support image payloads

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CONFIDE SYSTEM PROMPT
//  This is the default persona injected at the
//  start of every conversation.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CONFIDE_SYSTEM_PROMPT = `You are Confide — a warm, deeply empathetic, and highly knowledgeable AI companion. You are the user's personal best friend, therapist, life coach, and guide all in one.

## Response Length — MOST IMPORTANT RULE
- **Keep replies SHORT by default: 2-4 sentences max.**
- Be direct, warm, and to the point — like a text message from a close friend.
- Only give a longer response if the user explicitly asks to "elaborate", "explain more", "go deeper", or asks a complex multi-part question.
- Never pad responses with unnecessary preamble, summaries, or filler phrases.

## Your Personality
- Warm and conversational — like texting a best friend who happens to be an expert
- Empathetic first — always acknowledge feelings before giving advice
- Non-judgmental. No topic is too sensitive
- Honest but kind
- Use emojis occasionally to keep the tone human 🤝
- Never robotic or clinical. Use natural language, casual when appropriate

## Your Areas of Deep Expertise
- 🧠 Mental health: depression, anxiety, stress, burnout, trauma, grief, PTSD, OCD, bipolar disorder, ADHD
- 💪 Physical health: nutrition, fitness, sleep hygiene, wellness habits, body positivity
- 💼 Career: resume writing, interview prep, salary negotiation, workplace stress, goal-setting
- 🚀 Business: startups, marketing, branding, financial basics, entrepreneurship mindset
- 👗 Fashion & style: personal style, body types, colour palettes, wardrobe advice
- ❤️ Relationships: friendships, romance, family dynamics, communication, heartbreak recovery
- 🎯 Personal growth: habits, productivity, purpose, confidence, financial literacy

## Crisis Protocol
If someone expresses thoughts of self-harm or suicide, respond with compassion, provide crisis resources (iCall India: 9152987821, Vandrevala Foundation: 1860-2662-345), and encourage immediate professional help.

## How You Respond
1. Acknowledge what the user said/felt first
2. Give ONE clear, specific piece of advice or insight
3. End with a short follow-up question (optional, only if natural)
4. If the user wants more detail, they'll ask — trust them

## Important Boundaries
- You are NOT a replacement for professional medical, legal, or financial advice — always say so when relevant
- For serious mental health crises, always provide crisis resources alongside your support
- You don't make decisions FOR the user — you help them think clearly and decide for themselves

Remember: Short is kind. The user wants a real conversation, not an essay.`;


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Build system prompt — optionally personalised
//  with a user-created bot config.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const PERSONALITY_DESCS = {
  empathetic:  "You are an empathetic, warm, caring friend who always listens and validates feelings first.",
  coach:       "You are a motivating life coach who is goal-oriented, structured, and pushes the user to act.",
  therapist:   "You are a calm, gentle therapist who asks reflective questions and helps users gain insight.",
  hype:        "You are an energetic hype partner — super positive, encouraging, and enthusiastic.",
  philosopher: "You are a thoughtful philosopher who explores deeper meaning, asks big questions, and challenges assumptions.",
  bestie:      "You are the user's best friend — funny, real, no filter, honest, and always in their corner.",
};

function buildSystemPrompt(botConfig) {
  if (!botConfig || !botConfig.name) return CONFIDE_SYSTEM_PROMPT;

  const personalityDesc = PERSONALITY_DESCS[botConfig.personality] || PERSONALITY_DESCS.empathetic;
  const customSection   = botConfig.customPrompt
    ? `\n\n## Special Instructions from the User\n${botConfig.customPrompt}`
    : "";

  return `You are ${botConfig.avatar} ${botConfig.name} — a personalised AI companion.

${personalityDesc}

## Core Rules (always follow these)
- Keep replies SHORT: 2-4 sentences max, unless asked to elaborate.
- Be direct, warm, and conversational — like a text from a close friend.
- Use the name "${botConfig.name}" if you introduce yourself.
- Use the ${botConfig.avatar} emoji occasionally to reinforce your identity.
- No topic is too sensitive. Be non-judgmental at all times.

## Crisis Protocol
If someone expresses thoughts of self-harm or suicide, respond with compassion, provide crisis resources (iCall India: 9152987821, Vandrevala Foundation: 1860-2662-345), and encourage immediate professional help.${customSection}`;
}


// ── Health Check ──────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "Confide backend is running 🤝" });
});


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  POST /api/chat  — Main Chat Endpoint
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
app.post("/api/chat", async (req, res) => {
  const { messages, images, botConfig } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "No messages provided." });
  }

  const systemPrompt = buildSystemPrompt(botConfig);
  const provider     = (process.env.API_PROVIDER || "groq").toLowerCase();

  try {
    let reply = "";
    if (provider === "openai") {
      reply = await callOpenAI([{ role: "system", content: systemPrompt }, ...messages], images);
    } else if (provider === "gemini") {
      reply = await callGemini(messages, images, systemPrompt);
    } else {
      reply = await callGroq([{ role: "system", content: systemPrompt }, ...messages], images);
    }

    res.json({ reply });
  } catch (err) {
    console.error("LLM API error:", err?.response?.data || err.message);
    res.status(500).json({
      error:
        err?.response?.data?.error?.message ||
        "Failed to get a response from the AI. Check your API key and try again.",
    });
  }
});


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Groq — 100% FREE, Llama 3.3 70B
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function callGroq(messages, images = []) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "your_groq_api_key_here") {
    throw new Error(
      "GROQ_API_KEY is not set in your .env file. Get a free key at https://console.groq.com/keys"
    );
  }

  const hasImages = images && images.length > 0;

  // Build the final messages array
  let finalMessages;
  if (hasImages) {
    // Vision model — replace the last user message with a multimodal content array
    const allButLast = messages.slice(0, -1);
    const lastMsg    = messages[messages.length - 1];

    const contentParts = [
      { type: "text", text: lastMsg.content || "What do you see in this image?" },
      ...images.map((img) => ({
        type:      "image_url",
        image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
      })),
    ];

    finalMessages = [...allButLast, { role: "user", content: contentParts }];
  } else {
    finalMessages = messages;
  }

  const model = hasImages
    ? "meta-llama/llama-4-scout-17b-16e-instruct"
    : "llama-3.1-8b-instant";

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model,
      messages:    finalMessages,
      temperature: 0.75,
      max_tokens:  4096,
    },
    {
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  const reply = response.data?.choices?.[0]?.message?.content;
  if (!reply) throw new Error("Empty response from Groq.");
  return reply;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  Google Gemini
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function callGemini(messages, images = [], systemPrompt = CONFIDE_SYSTEM_PROMPT) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new Error("GEMINI_API_KEY is not set in your .env file.");
  }

  // Inject system prompt as first user/model exchange for Gemini
  const systemInjected = [
    {
      role:    "user",
      content: `[System instructions — follow these throughout our conversation]: ${systemPrompt}`,
    },
    { role: "assistant", content: "Understood. I'm ready to help." },
    ...messages,
  ];

  // Build Gemini contents — support inline images on the last user turn
  const hasImages  = images && images.length > 0;
  const contents   = systemInjected.map((msg, idx) => {
    const isLast   = idx === systemInjected.length - 1;
    const role     = msg.role === "assistant" ? "model" : "user";

    if (isLast && hasImages && msg.role === "user") {
      const parts = [
        { text: msg.content || "What do you see in this image?" },
        ...images.map((img) => ({
          inlineData: { mimeType: img.mimeType, data: img.base64 },
        })),
      ];
      return { role, parts };
    }

    return { role, parts: [{ text: msg.content }] };
  });

  const model = hasImages
    ? "gemini-1.5-flash"           // multimodal
    : "gemini-2.0-flash-lite";

  const url      = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await axios.post(url, { contents });

  const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply) throw new Error("Empty response from Gemini.");
  return reply;
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  OpenAI
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function callOpenAI(messages, images = []) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "your_openai_api_key_here") {
    throw new Error("OPENAI_API_KEY is not set in your .env file.");
  }

  const hasImages = images && images.length > 0;
  let   finalMessages = messages;

  if (hasImages) {
    const allButLast = messages.slice(0, -1);
    const lastMsg    = messages[messages.length - 1];
    const contentParts = [
      { type: "text", text: lastMsg.content || "What do you see?" },
      ...images.map((img) => ({
        type:      "image_url",
        image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
      })),
    ];
    finalMessages = [...allButLast, { role: "user", content: contentParts }];
  }

  const model    = hasImages ? "gpt-4o" : "gpt-3.5-turbo";
  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    { model, messages: finalMessages },
    {
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  const reply = response.data?.choices?.[0]?.message?.content;
  if (!reply) throw new Error("Empty response from OpenAI.");
  return reply;
}


// ── Start Server ──────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🤝 Confide backend running at http://localhost:${PORT}`);
  console.log(`   Provider: ${process.env.API_PROVIDER || "groq"}`);
  console.log(`   Press Ctrl+C to stop.\n`);
});
