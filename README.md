# Antigravity — AI Chat Web App 🚀

A full-stack AI chat application with a modern dark UI.  
Connect it to **Google Gemini** or **OpenAI (ChatGPT)** with a single config change.

---

## 📁 Folder Structure

```
antigravity project/
├── backend/                  ← Node.js + Express API server
│   ├── server.js             ← Main server file (POST /chat endpoint)
│   ├── package.json
│   ├── .env.example          ← Copy this to .env and add your API key
│   └── .env                  ← Your real keys (gitignored, don't commit!)
│
├── frontend/                 ← React app (Vite)
│   ├── index.html
│   ├── vite.config.js        ← Proxies /api → backend
│   ├── package.json
│   └── src/
│       ├── main.jsx          ← React entry point
│       ├── App.jsx           ← Root component
│       ├── App.css           ← All styles (dark mode)
│       ├── hooks/
│       │   └── useChat.js    ← Chat logic (state, API calls)
│       └── components/
│           ├── ChatWindow.jsx      ← Scrollable message list
│           ├── MessageBubble.jsx   ← Single message (user/AI)
│           ├── InputBar.jsx        ← Text input + send button
│           └── LoadingIndicator.jsx ← Animated typing dots
│
├── .gitignore
└── README.md
```

---

## ⚡ Quick Start

### Step 1 — Set up the Backend

```bash
cd backend
npm install
```

Copy the example environment file and add your API key:

```bash
# Windows (PowerShell)
copy .env.example .env

# Mac / Linux
cp .env.example .env
```

Open `.env` and fill in your key:

```env
# Choose "gemini" or "openai"
API_PROVIDER=gemini

# Paste your key here:
GEMINI_API_KEY=AIza...your_key_here...
```

Start the backend:

```bash
npm run dev
# ✅ Running at http://localhost:5000
```

---

### Step 2 — Set up the Frontend

Open a **second terminal**:

```bash
cd frontend
npm install
npm run dev
# ✅ Running at http://localhost:5173
```

Open your browser and go to → **http://localhost:5173**

---

## 🔑 Getting an API Key

| Provider | Link | Free Tier |
|---|---|---|
| **Google Gemini** | https://aistudio.google.com/ | ✅ Yes |
| **OpenAI** | https://platform.openai.com/ | ⚠️ Paid |

---

## 🔧 Switching Between Gemini & OpenAI

In `backend/.env`, change one line:

```env
API_PROVIDER=openai   # use OpenAI
API_PROVIDER=gemini   # use Gemini (default)
```

Then restart the backend (`Ctrl+C` → `npm run dev`).

---

## ✨ Features

- 💬 Real-time AI chat with message history
- 🌙 Dark mode UI with smooth animations
- ⌨️ Typing indicator while AI responds
- ⚠️ Friendly error messages for API failures
- 📱 Fully responsive (works on mobile)
- ↵ Press `Enter` to send, `Shift+Enter` for newlines
- 🗑️ Clear chat button to start fresh

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Vanilla CSS |
| Backend | Node.js, Express |
| AI Providers | Google Gemini, OpenAI |

---

> **Never commit your `.env` file.** It's already in `.gitignore` for safety.
