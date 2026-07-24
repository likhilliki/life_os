# LifeOS — AI-Powered Personal Operating System with Self-Correcting RAG

> A persistent-memory knowledge platform built around a **Self-Correcting Retrieval-Augmented Generation (RAG) pipeline** with hybrid vector + graph search, an evaluation harness, and full pipeline observability.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                        │
│  Dashboard · Chat · Graph · Timeline · Evaluation · Debug   │
└──────────────────┬──────────────────────────────────────────┘
                   │ fetch (JWT-authenticated)
                   ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase Edge Function: rag-chat               │
│                                                             │
│  1. Initial Retrieval (Postgres FTS + GIN index)           │
│  2. Graph Search (connections table traversal)             │
│  3. Confidence Evaluation                                   │
│  4. Self-Correction (query rewrite + deeper search)        │
│  5. Hybrid Merge + Deduplication                           │
│  6. Answer Generation                                       │
│  7. Grounding Verification                                   │
│  8. Refusal if insufficient evidence                        │
│                                                             │
│  → Emits RagTrace (persisted to rag_traces table)           │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase (PostgreSQL)                     │
│  memories (FTS) · connections (graph) · rag_traces ·       │
│  rag_evaluations · goals · decisions · insights · files    │
│  Row-Level Security on every table                          │
└─────────────────────────────────────────────────────────────┘
```

### Self-Correcting RAG Pipeline (Sequence)

```
User Query
    │
    ▼
[1] Retrieve Top-K chunks (full-text search, weighted: title > content > tags)
    │
    ▼
[2] Graph search — traverse connections from seed nodes
    │
    ▼
[3] Merge FTS + graph scores → compute confidence
    │
    ▼
[4] Confidence ≥ threshold? ──── Yes ──→ [6] Generate answer
    │                                        │
    No                                       ▼
    │                                   [7] Grounding check
    ▼                                        │
[5] Rewrite query + deepen search     Grounded? ── Yes → Return answer + sources + trace
    │                                        │
    └── re-retrieve, merge, re-evaluate      No → Regenerate with stricter grounding
                                             │
                                             ▼
                                     [8] Still no evidence → Refuse:
                                         "I don't have enough evidence
                                         to answer confidently."
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| **Postgres FTS instead of pgvector** | GIN-indexed `tsvector` with weighted `ts_rank` gives fast keyword retrieval without an embedding model dependency. The architecture supports swapping in pgvector later. |
| **Graph search via connections table** | Reuses the existing knowledge-graph schema. Seed nodes from FTS results traverse edges for related memories. |
| **Self-correction with query rewrite** | If initial confidence < threshold (35%), the pipeline rewrites the query (strips filler, expands contractions), deepens the search (Top-K 8→12), and adds an ILIKE fallback. |
| **Grounding verification** | After generation, the answer is checked against retrieved sources. If not grounded, a stricter answer is regenerated that explicitly quotes source titles. |
| **Refusal over hallucination** | When no evidence is found, the pipeline returns a structured refusal instead of fabricating an answer. |
| **Full trace persistence** | Every invocation records a `RagTrace` to the database, enabling the Pipeline Debug page to show every step with timing. |

---

## Project Structure

```
project/
├── app/
│   ├── (auth)/               # Login, signup, forgot-password
│   ├── (dashboard)/          # Authenticated pages
│   │   ├── chat/             # AI Chat with self-correcting RAG
│   │   ├── evaluation/       # Evaluation harness with charts
│   │   ├── pipeline/         # Pipeline debug / observability
│   │   ├── dashboard/        # Overview
│   │   ├── graph/            # Knowledge graph viewer
│   │   ├── timeline/         # Memory timeline
│   │   ├── goals/            # Goal tracking
│   │   ├── decisions/        # Decision log
│   │   ├── analytics/        # Analytics charts
│   │   ├── upload/           # Document ingestion
│   │   └── settings/         # User settings
│   └── (landing)/            # Marketing pages
├── lib/
│   ├── rag/
│   │   ├── types.ts          # Shared RAG pipeline types
│   │   ├── config.ts         # Pipeline thresholds + test cases
│   │   ├── client.ts         # Edge function client + trace fetcher
│   │   └── evaluation.ts    # Evaluation harness logic
│   ├── api.ts                # Database CRUD helpers
│   ├── supabase.ts           # Supabase client singleton
│   └── utils.ts              # Shared utilities
├── supabase/
│   ├── functions/
│   │   └── rag-chat/         # Self-correcting RAG edge function
│   └── migrations/           # SQL migrations (schema + FTS + RLS)
├── components/
│   ├── ui/                   # shadcn/ui components
│   └── landing/              # Landing page sections
├── stores/                   # Zustand state stores
├── types/                    # Shared TypeScript types
└── extension/                # Chrome extension (coming soon)
```

---

## Database Schema

### Core Tables
- **profiles** — user profile, extends `auth.users`
- **memories** — title, content, type, tags, importance, FTS `search_vector` column with GIN index
- **connections** — knowledge graph edges (source → target, relationship type, strength)
- **goals** — goal tracking with progress and priority
- **decisions** — decision log with reasoning and alternatives
- **insights** — AI-generated insights
- **files** — uploaded file metadata
- **tasks** — task management
- **projects** — project organization
- **notifications** — user notifications

### RAG Pipeline Tables
- **rag_traces** — full observability trace per RAG invocation (query, chunks, steps, prompt, response, confidence, latency)
- **rag_evaluations** — per-question evaluation results comparing Normal vs Self-Correcting RAG

### Security
- Row-Level Security enabled on every table
- Owner-scoped policies (`auth.uid() = user_id`) on all user data tables
- `user_id` columns default to `auth.uid()` so client inserts succeed without explicitly passing the owner

---

## Evaluation Harness

The Evaluation page (`/evaluation`) benchmarks two pipeline variants:

1. **Normal RAG** — single-pass retrieval + generation, no correction
2. **Self-Correcting RAG** — multi-pass with query rewrite, deeper search, grounding verification

### Metrics Tracked
- **Precision** — overlap between answer and expected answer
- **Recall** — coverage of expected information
- **Faithfulness** — answer grounded in retrieved sources
- **Answer Relevancy** — answer addresses the question
- **Context Precision** — retrieved context is relevant
- **Hallucination Rate** — ungrounded claims (lower is better)
- **Latency** — total pipeline time in ms
- **Confidence** — pipeline's own confidence score

Results are visualized with bar charts, radar charts, and delta cards showing the improvement from self-correction.

---

## Pipeline Observability

The Pipeline Debug page (`/pipeline`) shows every step of the most recent RAG invocations:

- Original query and rewritten query (if correction occurred)
- Initial retrieval chunks with FTS scores
- Correction retrieval chunks
- Graph traversal nodes with relationship types
- Final merged evidence with hybrid scores
- The exact prompt sent to the generation stage
- The LLM response
- Confidence score and grounding status
- Per-step timing breakdown

---

## API Documentation

### `POST /functions/v1/rag-chat`

**Headers:**
- `Authorization: Bearer <access_token>`
- `apikey: <anon_key>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "question": "What projects have I been working on?",
  "history": [{ "role": "user", "content": "..." }, { "role": "assistant", "content": "..." }],
  "pipeline": "self_correcting" | "normal"
}
```

**Response:**
```json
{
  "answer": "...",
  "sources": [{ "id": "...", "title": "...", "type": "note", "tags": [], "created_at": "..." }],
  "confidence": 72,
  "retrieval_count": 5,
  "grounded": true,
  "refused": false,
  "clarification_question": null,
  "trace": { "original_query": "...", "steps": [...], "final_prompt": "...", ... }
}
```

### `search_memories(query_text, query_user_id)` — Postgres RPC

Weighted full-text search returning top 10 memories with `ts_rank` scores. Uses the GIN index on `memories.search_vector`.

---

## Deployment Guide

### Prerequisites
- Node.js 18+
- A Supabase project (URL + anon key + service role key in `.env`)

### Frontend
```bash
npm install
npm run build    # production build
npm run dev      # development server
```

### Environment Variables
All Supabase credentials are pre-populated in `.env`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Database Migrations
Migrations are applied via the Supabase MCP `apply_migration` tool. The following migrations exist:
1. `001_initial_schema` — core tables + RLS
2. `004_memories_fulltext_search` — FTS column + GIN index
3. `005_search_memories_rpc` — search RPC function
4. `006_rag_evaluation_traces` — evaluation + trace tables

### Edge Functions
Deployed via the Supabase MCP `deploy_edge_function` tool:
- `rag-chat` — self-correcting RAG pipeline

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | Supabase Edge Functions (Deno), Postgres RPC |
| Database | Supabase (PostgreSQL) with RLS, full-text search, GIN indexes |
| Auth | Supabase Auth (email/password) |
| Charts | Recharts |

---

## Chrome Extension (Coming Soon)

The Chrome extension is stubbed with a manifest and popup UI but is not yet functional. The roadmap includes:
- One-click memory capture from any webpage
- Automatic entity extraction from page content
- Background sync to Supabase

---

## Developer Guide

### Adding a New Evaluation Test Case
1. Add an entry to `EVALUATION_TEST_CASES` in `lib/rag/config.ts`
2. Run the evaluation from the Evaluation page

### Tuning Pipeline Thresholds
All thresholds are in `lib/rag/config.ts` (frontend) and the constants block at the top of `supabase/functions/rag-chat/index.ts` (edge function):
- `CONFIDENCE_THRESHOLD` — minimum confidence to skip self-correction
- `INITIAL_TOP_K` / `CORRECTION_TOP_K` — retrieval depth
- `MAX_CONTEXT_CHARS` — context window for the final prompt

### Extending the Pipeline
The edge function is structured as discrete steps (initial retrieval → graph search → confidence evaluation → self-correction → merge → generation → grounding). Each step records timing to the trace. To add a new step, add a new `step()` call and extend the `Trace` interface in `lib/rag/types.ts`.

---

## License

MIT
