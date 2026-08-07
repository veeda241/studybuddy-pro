# StudyBuddy Pro

**Adaptive AI-Powered Learning Suite**

Offline-capable smart quiz and flashcard generation from student notes using local NLP algorithms. A spaced repetition engine adjusts difficulty in real time. A gamified Pomodoro timer awards XP and coins, tracks daily streaks, and pairs with JWT-auth plus a local-first data architecture (browser IndexedDB for study content, SQLite for users).

**Key features:** Offline AI · RAG pipeline · Spaced repetition · Gamification · Local-first storage

---

## What it does

| Capability | How it works |
|------------|--------------|
| **Offline AI** | Client-side tokenization, keyword extraction, and TF-IDF — no cloud LLM required for quizzes, flashcards, or summaries |
| **RAG pipeline** | Notes are chunked, indexed, and retrieved by relevance before generation so questions come from the strongest passages |
| **Spaced repetition** | SM-2 scheduling with Again / Hard / Good / Easy; due cards resurface automatically |
| **Gamification** | Pomodoro sessions, task completion, quiz scores, and review sessions earn coins and XP; daily streak tracking |
| **Local-first** | Notes, decks, cards, quizzes, and tasks live in IndexedDB (Dexie); user auth and rewards live in Express + SQLite with JWT |

## Architecture

```
React (port 3001)
  ├── Study NLP / RAG / SM-2  →  Dexie (IndexedDB)   [works offline]
  └── Auth + rewards          →  Express (port 5000) → SQLite users
```

- **Browser:** offline TF-IDF NLP, RAG retrieval, quiz/flashcard generation, SM-2, local persistence
- **Express + SQLite:** JWT register/login, XP/coins/streaks, profile settings

## Features in the app

- Interactive dashboard (coins, XP, streak, level)
- Configurable Pomodoro timer with cumulative rewards
- Task manager persisted locally
- Smart quizzes & flashcards from pasted or saved notes
- Note summarizer (local NLP)
- Saved notes, decks, quiz history, and due-card review
- Theme toggle and profile settings
- Secure JWT authentication

## Local development

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
# Frontend
npm install

# Backend
cd studybuddy-pro-backend
npm install
cd ..
```

### Backend environment

```bash
cd studybuddy-pro-backend
# Copy .env.example → .env and set at least:
# JWT_SECRET=a-strong-random-string
# PORT=5000
```

## AI generation (on-device Flan-T5)

Quiz, flashcard, and summary generation use a **lightweight local model** in the browser:

- **Model:** `Xenova/flan-t5-small` via Transformers.js (~60MB quantized ONNX)
- **Flow:** TF-IDF RAG retrieves note chunks → Flan-T5 generates questions/summary
- **Fallback:** heuristic TF-IDF templates if the model fails to load
- **No Gemini/OpenAI API key required** for study generation

### First run

The browser downloads the model once and caches it. Generation is slower the first time.

### Optional: vendor model into the repo / GitHub Pages

```bash
npm run download-model
```

Files land in `public/models/Xenova/flan-t5-small/`.  
`public/models/` is gitignored by default (large binaries). To publish them on GitHub, use **Git LFS** for `*.onnx`.

Auth, Pomodoro rewards, and settings still use the Express backend.

### Run

**Terminal 1 — backend (auth + gamification):**

```bash
cd studybuddy-pro-backend
node server.js
```

**Terminal 2 — frontend:**

```bash
npm start
```

Open `http://localhost:3001` (production GitHub Pages builds use basename `/studybuddy-pro`).

Study tools (quiz, flashcards, summary, spaced repetition) keep working if the backend is stopped after the page has loaded. Login, Pomodoro rewards, and settings need the API.

### Optional frontend env

```env
REACT_APP_API_URL=http://127.0.0.1:5000
```

## API surface

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/register` | No | Create user + JWT |
| POST | `/api/login` | No | Login + JWT |
| PUT | `/api/user/gamification` | Bearer | Add coins/XP; returns cumulative totals |
| POST | `/api/pomodoro/complete` | Bearer | +25 coins, +50 XP, streak; returns totals |
| GET/POST | `/api/settings/:userId` | Bearer | Profile JSON |
| POST | `/api/summarize`, `/api/flashcards`, `/api/quiz` | No | Legacy server generators (UI uses client NLP) |

## Deployment

- **Frontend:** GitHub Pages via `npm run deploy` (see `homepage` in `package.json`)
- **Backend:** Host Express + SQLite separately (VPS, Railway, Render, Netlify Functions, etc.) and set `REACT_APP_API_URL` for production builds
