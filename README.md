# 🧠 LifeOS – The AI Operating System That Never Forgets

> **Your digital life, connected through persistent AI memory.**

LifeOS is a next-generation AI-powered digital operating system that transforms scattered information into a living knowledge graph. Powered by **Cognee's hybrid graph-vector memory**, LifeOS remembers, organizes, and reasons across unlimited sessions, giving users an AI that truly understands their digital life.

---

## ✨ Features

- 🧠 **Persistent AI Memory** using Cognee
- 📄 Smart document ingestion (PDF, DOCX, TXT, Markdown)
- 🌐 Save and remember websites, research papers, and URLs
- 🔗 Interactive Knowledge Graph visualization
- 💬 AI Chat with long-term contextual memory
- 🔍 Hybrid Semantic + Graph Search
- 📅 Memory Timeline
- 🎯 Goal Tracking
- 📈 AI-generated Insights
- 📂 Project & Knowledge Management
- 🧩 Chrome Extension for one-click memory capture
- 🌙 Beautiful Dark Mode UI
- ⚡ Fast and responsive experience

---

# 🚀 The Problem

Modern AI assistants are **stateless**.

Every conversation starts from scratch.

They forget:

- Previous conversations
- Documents
- Projects
- Goals
- Research
- Personal context

This leads to repetitive interactions and fragmented knowledge.

---

# 💡 Our Solution

LifeOS gives AI **persistent memory**.

Every interaction becomes structured memory inside **Cognee's graph-vector memory layer**.

Instead of searching isolated documents, LifeOS reasons across connected knowledge.

The AI remembers:

- Documents
- Notes
- Projects
- People
- Meetings
- Ideas
- Goals
- Conversations
- Browser history (via extension)

---

# 🧠 Powered by Cognee

LifeOS uses Cognee as its core memory engine.

## Memory Lifecycle

### remember()

Store documents, notes, webpages, and conversations permanently.

### recall()

Retrieve information using semantic similarity and graph traversal.

### improve()

Continuously enrich and optimize memory relationships.

### forget()

Delete outdated or unwanted memories while preserving the rest of the knowledge graph.

---

# 🏗️ System Architecture

```text
Chrome Extension
        │
        ▼
Memory Capture API
        │
        ▼
FastAPI Backend
        │
        ▼
Cognee Memory Engine
(Graph + Vector)
        │
        ▼
PostgreSQL
        │
        ▼
Next.js Dashboard
        │
        ▼
AI Insights & Knowledge Graph
```

---

# 🖥️ Tech Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion

## Backend

- FastAPI
- Python
- SQLAlchemy

## Memory

- Cognee

## Database

- PostgreSQL

## Authentication

- JWT Authentication

## Browser Extension

- Chrome Extension (Manifest V3)

## Deployment

- Docker
- Vercel
- Railway / Render

---

# 📊 Core Modules

- Dashboard
- AI Chat
- Knowledge Graph
- Memory Timeline
- AI Insights
- Universal Search
- Document Upload
- Chrome Extension
- Goal Engine
- Settings

---

# 🔄 Workflow

1. User uploads documents or saves webpages.
2. Data is processed and stored using **Cognee**.
3. Cognee creates a hybrid graph-vector memory.
4. LifeOS generates relationships between memories.
5. Users search, chat, and explore connected knowledge.
6. AI continuously improves memory quality using `improve()`.


---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/likhilliki/life_os.git
```

```bash
cd lifeos
```

## Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# 📂 Project Structure

```
lifeos/
│
├── frontend/
├── backend/
├── extension/
├── database/
├── docs/
├── docker/
├── public/
└── README.md
```

---

# 🌟 Why LifeOS?

Unlike traditional AI assistants, LifeOS doesn't just answer questions—it builds a persistent understanding of your digital world.

By combining Cognee's graph-vector memory with intelligent reasoning, LifeOS transforms scattered information into connected knowledge that grows smarter over time.

---

# 🎯 Future Roadmap

- Gmail Integration
- Google Drive Integration
- GitHub Memory
- Calendar Sync
- Slack Integration
- Mobile App
- Voice Assistant
- Team Collaboration
- Multi-Agent Workflows
- Advanced Memory Analytics

---

# 🤝 Contributing

Contributions are welcome!

Feel free to open issues and submit pull requests.

---

# 📄 License

MIT License

---

# ❤️ Built for Devs Hangover × Cognee Hackathon

Built with ❤️ using **Cognee**, **FastAPI**, **Next.js**, and **TypeScript**.

> **LifeOS – The AI Operating System That Never Forgets.**
