<div align="center">

# 🚀 TaskPilot AI

### An AI-Powered Project Manager Assistant

**Turns unstructured meeting notes and documents into clean, structured, actionable tasks — automatically.**

[![Python](https://img.shields.io/badge/Python-3.11-blue?style=for-the-badge&logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-Frontend-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite)](https://www.sqlite.org/)
[![AWS](https://img.shields.io/badge/AWS-EC2-FF9900?style=for-the-badge&logo=amazonaws)](https://aws.amazon.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](#license)

**[Live Demo (AWS)](#) · [Backup Demo (Vercel)](#) · [Architecture](#-architecture) · [API Reference](#-api-reference)**

</div>

---

## 💡 Why This Project Exists

Every project manager has lived this problem: a 45-minute meeting produces five minutes of actual decisions buried in forty minutes of discussion, status updates, and tangents. Someone still has to comb through it and turn "we should probably look into that" into a task with an owner, a deadline, and a priority.

**TaskPilot AI automates that translation** — not with a single naive prompt that treats every sentence as a task, but with a deliberately engineered, multi-stage AI pipeline built the way a production AI system should be: modular, explainable, deterministic where it matters, and resilient when a provider goes down.

This isn't a weekend hackathon wrapper around an API call. It's a demonstration of how I think about **shipping AI features as real software** — with the architecture discipline, failure handling, and observability that a production team would expect.

---

## 🎯 What This Project Demonstrates

| Skill Area | How It Shows Up Here |
|---|---|
| **Prompt Engineering** | A two-stage LLM pipeline that separates *reasoning* (is this actually a task?) from *structuring* (turn it into clean JSON) — because asking one prompt to do both produces worse, less consistent results |
| **AI Systems Reliability** | Automatic 3-provider fallback (Groq → Gemini → Ollama), retry-on-validation-failure logic, and a deterministic Python cleanup layer that catches what the LLM misses |
| **Backend Architecture** | Strict Repository + Service Layer separation, async FastAPI throughout, zero business logic leaking into routes |
| **Production Thinking** | SHA-256 deduplication to avoid re-billing an LLM for content already processed, real-time SSE progress streaming, environment-driven config, and a live deployment on AWS with Nginx + systemd |
| **Debugging Discipline** | Every non-trivial bug in this project was resolved through evidence-first, traceback-driven root cause analysis — not speculative patching (see [Engineering Highlights](#-engineering-highlights)) |
| **Full-Stack Delivery** | A complete, working product from raw text input to an editable, filterable, exportable task dashboard — deployed and reachable by anyone, not just running on localhost |

If you're evaluating this for an AI Engineering internship, the code is intentionally written so every design decision can be explained and defended in an interview — nothing here is a black box, including to me.

---

## 📖 Overview

Paste meeting notes or upload a `.txt`, `.pdf`, or `.docx` file. TaskPilot AI extracts genuine action items, infers who owns them, when they're due, and how urgent they are — then hands you back a structured, editable task list you can filter, update, and export as JSON.

---

## ✨ Features

**AI Task Generation**
- Paste raw text or upload TXT / PDF / DOCX
- Automatic owner extraction
- Automatic deadline inference
- Automatic priority assignment (High / Medium / Low)

**Intelligent Multi-Stage AI Pipeline**
- Stage 1 — Action Item Detection *(filters out agenda chatter, status updates, and decisions with no owner)*
- Stage 2 — Structured Task Extraction *(converts confirmed action items into clean JSON)*
- Deterministic Python Cleanup *(deduplicates titles, normalizes fields, catches anything the LLM missed)*
- Pydantic Validation *(nothing malformed ever reaches the database)*

**Real-Time Progress Tracking**
Live Server-Sent Events stream every processing stage to the UI as it happens — no spinner, no black box:

`Reading File → Extracting Text → Detecting Action Items → Creating Prompt → Calling Provider → Waiting for Response → Parsing JSON → Validating Output → Cleaning Tasks → Saving Tasks → Completed`

**Smart Deduplication**
Every submission is normalized and hashed (SHA-256). Resubmitting the same meeting notes skips the LLM call entirely — faster, cheaper, and fully deterministic, verified to survive full server restarts.

**Task Management**
View, edit, delete, and filter tasks by owner/priority/status. Export the full task list as clean JSON with one click.

---

## 🏗 Architecture
<img width="1376" height="2192" alt="diagram-export-7-7-2026-4_25_15-PM" src="https://github.com/user-attachments/assets/b0a40e96-02ff-4946-a0c6-3f84cf26c251" />


### AI Processing Pipeline

```
Meeting Notes / Uploaded File
            │
            ▼
      Text Extraction
            │
            ▼
  Action Item Detection  ◄── LLM Call #1 (filters signal from noise)
            │
            ▼
Structured Task Extraction  ◄── LLM Call #2 (clean JSON only)
            │
            ▼
   Python Cleanup Layer   ◄── deterministic, no LLM, fully unit-testable
            │
            ▼
   Pydantic Validation
            │
            ▼
    Repository Layer
            │
            ▼
     SQLite Database
```

**Why two LLM calls instead of one?** A single prompt asked to simultaneously understand intent, filter noise, extract structure, infer owners, and infer dates produces inconsistent results — the same meeting notes would occasionally get generate different priorities or invent tasks that were never actually agenda items. Splitting the reasoning from the structuring gave each call one job, and it visibly cleaned up extraction quality in testing.

### Backend Layered Architecture

```
API Routes → Service Layer → Repository Layer → SQLite Database
```

```
backend/
└── app/
    ├── api/          # Thin route handlers — no business logic
    ├── core/         # Config, logging
    ├── database/     # Session & engine setup
    ├── models/       # SQLAlchemy ORM models
    ├── providers/    # Groq / Gemini / Ollama — one shared interface
    ├── repository/   # All DB CRUD, nothing else
    ├── schemas/      # Pydantic request/response contracts
    ├── services/     # Orchestration: prompts → LLM → validation → repository
    └── utils/        # Text extraction, JSON parsing, deterministic cleanup
```

### LLM Provider Strategy

```
Groq → Gemini → Ollama
```

If Groq fails or times out, the system automatically falls back to Gemini, then Ollama — the service layer never knows or cares which provider actually generated the response. Every provider implements the exact same `generate(prompt) -> str` interface, making providers fully swappable.

### Real-Time Event Flow

```
User → POST /generate → Background AI Processing → Progress Emitter
     → GET /progress/{job_id} (SSE) → React Processing Timeline
     → Completed → GET /tasks → Task Table
```

### Frontend Structure

```
React
├── Navbar
├── Input Section / Upload Area / Generate Button
├── Processing Timeline      (live SSE-driven)
├── Summary Cards
├── Filter Bar
├── Task Table / Task Edit Modal
└── JSON Viewer (copy / download)
```

State is managed through two custom hooks — `useTaskGeneration()` for the generation + SSE lifecycle, and `useTasks()` for all CRUD + filtering — keeping every UI component purely presentational.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Axios, native EventSource (SSE) |
| **Backend** | FastAPI, SQLAlchemy (async), Pydantic, AsyncIO, SQLite |
| **AI Providers** | Groq, Gemini, Ollama *(direct API integration — no LangChain/LlamaIndex/CrewAI)* |
| **Deployment** | AWS EC2, Nginx, systemd, Vercel |

**Why no LangChain/agent frameworks?** Direct provider integration keeps every request/response fully transparent and easy to reason about — there's no framework abstraction between "what I sent the model" and "what came back." For a system this focused, that transparency is worth more than the convenience.

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/generate` | Submit text or a file, kick off the AI pipeline |
| `GET` | `/progress/{job_id}` | Live SSE stream of processing stages |
| `GET` | `/tasks` | Fetch all tasks (supports owner/priority/status filters) |
| `PUT` | `/tasks/{id}` | Update a task |
| `DELETE` | `/tasks/{id}` | Delete a task |
| `GET` | `/tasks/export/json` | Download all tasks as `tasks.json` |
| `GET` | `/health` | Health check |

---

## 📂 Supported Inputs

| Type | Supported |
|---|:---:|
| Pasted plain text | ✅ |
| `.txt` | ✅ |
| `.pdf` | ✅ |
| `.docx` | ✅ |

---

## 🚀 Getting Started

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

**Backend (`.env`)**
```env
DATABASE_URL=
GROQ_API_KEY=
GROQ_MODEL=
GEMINI_API_KEY=
GEMINI_MODEL=
OLLAMA_BASE_URL=
OLLAMA_MODEL=
```

**Frontend (`.env`)**
```env
VITE_API_URL=
```

---

## ☁️ Production Deployment

**Primary — AWS EC2:** Ubuntu instance running the FastAPI backend under systemd (auto-restart on crash/reboot), Nginx as a reverse proxy handling both the static React build and API routing — with dedicated SSE-safe proxy configuration (buffering disabled) so live progress streaming isn't broken by the proxy layer.

**Backup — Vercel:** The same frontend build, deployed statically and pointed at the same live AWS backend, as a redundant access point.

Full setup is documented in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

---

## 📈 Engineering Highlights

A few things worth knowing about how this project was actually built, beyond the feature list:

- **Debugged with evidence, not guesses.** Every non-trivial bug during development — including a subtle deduplication issue and a stale-process false alarm — was root-caused through captured tracebacks and controlled before/after verification, never through speculative "let's try this" patches.
- **Deduplication is verified to survive a full process restart**, proving the hash-check is backed by persisted database state rather than in-memory caching.
- **The cleanup layer is intentionally deterministic and LLM-free** — duplicate detection, field normalization, and priority validation don't depend on model behavior, so they're fast, free, and fully testable in isolation.
- **SSE was chosen deliberately over WebSockets** — the use case (streaming discrete pipeline stages, not bidirectional chat) doesn't need WebSocket's complexity, and SSE is simpler to reason about and debug.

---

## 🔮 Roadmap

- PostgreSQL for production-scale storage
- User authentication & multi-user workspaces
- Team collaboration & calendar integration
- Redis-backed background job queue
- Docker Compose for one-command local setup
- CI/CD pipeline
- Kubernetes deployment for horizontal scaling

---

## 👨‍💻 About the Author

**Shreyansh Pipaliya**
Computer Engineering Undergraduate · Full-Stack Developer · Aspiring AI Engineer

I built this project to demonstrate not just that I can call an LLM API, but that I can **design the system around it properly** — with the reliability, observability, and architectural discipline that separates a working demo from something a team could actually maintain in production. I'd welcome the chance to talk through any part of this design in more depth.

[GitHub](https://github.com/shreyyansh10) · [LinkedIn](https://linkedin.com/shreyansh-pipaliya)

---

## 📄 License

Licensed under the [MIT License](LICENSE).



### ⭐ If this project reflects the kind of engineer you're looking for, let's talk.

