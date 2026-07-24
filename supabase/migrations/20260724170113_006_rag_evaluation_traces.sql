/*
# Add RAG evaluation and pipeline trace tables

1. New Tables
- `rag_evaluations`: stores per-question evaluation results comparing the
  Normal RAG pipeline vs the Self-Correcting RAG pipeline. Each row records
  precision, recall, faithfulness, answer relevancy, context precision,
  hallucination rate, latency, and confidence.
- `rag_traces`: stores the full observability trace for a single RAG
  invocation — original query, rewritten query, retrieved chunks, graph
  nodes, correction steps, final prompt, LLM response, confidence, and
  latency. This powers the AI Pipeline Debug page.

2. Security
- Both tables are owner-scoped (user_id) with full CRUD RLS policies for
  authenticated users. user_id defaults to auth.uid() so inserts that omit
  it still satisfy the WITH CHECK policy.
- No public/anon access — these are private per-user analytics.

3. Indexes
- rag_evaluations: (user_id, pipeline) for grouped metric aggregation.
- rag_traces: (user_id, created_at DESC) for recent-trace listing.
*/

CREATE TABLE IF NOT EXISTS rag_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  question text NOT NULL,
  expected_answer text,
  pipeline text NOT NULL CHECK (pipeline IN ('normal', 'self_correcting')),
  answer text NOT NULL,
  precision_score float NOT NULL DEFAULT 0,
  recall_score float NOT NULL DEFAULT 0,
  faithfulness float NOT NULL DEFAULT 0,
  answer_relevancy float NOT NULL DEFAULT 0,
  context_precision float NOT NULL DEFAULT 0,
  hallucination_rate float NOT NULL DEFAULT 0,
  latency_ms integer NOT NULL DEFAULT 0,
  confidence float NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT NOW()
);

ALTER TABLE rag_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_rag_evaluations" ON rag_evaluations;
CREATE POLICY "select_own_rag_evaluations" ON rag_evaluations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_rag_evaluations" ON rag_evaluations;
CREATE POLICY "insert_own_rag_evaluations" ON rag_evaluations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_rag_evaluations" ON rag_evaluations;
CREATE POLICY "delete_own_rag_evaluations" ON rag_evaluations FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_rag_evaluations_user_pipeline
  ON rag_evaluations(user_id, pipeline);

CREATE TABLE IF NOT EXISTS rag_traces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  original_query text NOT NULL,
  rewritten_query text,
  corrected boolean NOT NULL DEFAULT false,
  correction_reason text,
  initial_chunks jsonb NOT NULL DEFAULT '[]',
  corrected_chunks jsonb NOT NULL DEFAULT '[]',
  final_chunks jsonb NOT NULL DEFAULT '[]',
  graph_nodes jsonb NOT NULL DEFAULT '[]',
  confidence float NOT NULL DEFAULT 0,
  grounded boolean NOT NULL DEFAULT false,
  refused boolean NOT NULL DEFAULT false,
  steps jsonb NOT NULL DEFAULT '[]',
  final_prompt text,
  llm_response text,
  total_latency_ms integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT NOW()
);

ALTER TABLE rag_traces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_rag_traces" ON rag_traces;
CREATE POLICY "select_own_rag_traces" ON rag_traces FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_rag_traces" ON rag_traces;
CREATE POLICY "insert_own_rag_traces" ON rag_traces FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_rag_traces" ON rag_traces;
CREATE POLICY "delete_own_rag_traces" ON rag_traces FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_rag_traces_user_created
  ON rag_traces(user_id, created_at DESC);
