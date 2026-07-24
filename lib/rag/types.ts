/**
 * Shared types for the Self-Correcting RAG pipeline.
 *
 * These types are the contract between the frontend (lib/rag/client.ts),
 * the edge function (supabase/functions/rag-chat/index.ts), and the
 * evaluation/observability pages. Keeping them in one place ensures the
 * pipeline trace structure is identical across every consumer.
 */

/** A single retrieved memory chunk with its relevance metadata. */
export interface RetrievedChunk {
  id: string;
  title: string;
  content: string;
  memory_type: string;
  tags: string[];
  created_at: string;
  /** Normalized relevance score from full-text search (0-1). */
  fts_rank: number;
  /** Graph-based relevance score (0-1). 0 when graph search is unused. */
  graph_rank: number;
  /** Final merged score after hybrid ranking (0-1). */
  merged_score: number;
}

/** A knowledge-graph node hit during graph search. */
export interface GraphNodeHit {
  id: string;
  title: string;
  relationship_type: string;
  strength: number;
}

/** One discrete step in the self-correction trace. */
export interface PipelineStep {
  step: number;
  name: string;
  description: string;
  /** Duration of this step in milliseconds. */
  duration_ms: number;
}

/** The full observability trace for a single RAG invocation. */
export interface RagTrace {
  /** The original user question. */
  original_query: string;
  /** Rewritten query used on the second pass, if a correction occurred. */
  rewritten_query: string | null;
  /** Whether the pipeline performed a self-correction pass. */
  corrected: boolean;
  /** Reason the correction was triggered (or null if none). */
  correction_reason: string | null;
  /** Top-K chunks retrieved on the first pass. */
  initial_chunks: RetrievedChunk[];
  /** Top-K chunks retrieved on the correction pass (empty if no correction). */
  corrected_chunks: RetrievedChunk[];
  /** Final merged + deduplicated evidence set sent to the generator. */
  final_chunks: RetrievedChunk[];
  /** Graph nodes traversed during graph search. */
  graph_nodes: GraphNodeHit[];
  /** The confidence score (0-100) computed by the evaluator. */
  confidence: number;
  /** Whether the answer is grounded in the retrieved evidence. */
  grounded: boolean;
  /** Whether the pipeline returned a "not enough evidence" refusal. */
  refused: boolean;
  /** Ordered list of pipeline steps with timing. */
  steps: PipelineStep[];
  /** The final prompt sent to the generation stage (template, no secrets). */
  final_prompt: string;
  /** The generated answer. */
  llm_response: string;
  /** Total pipeline latency in milliseconds. */
  total_latency_ms: number;
}

/** The response shape returned by the rag-chat edge function. */
export interface RagChatResponse {
  answer: string;
  sources: SourceRef[];
  confidence: number;
  retrieval_count: number;
  grounded: boolean;
  refused: boolean;
  clarification_question: string | null;
  trace: RagTrace;
}

/** A lightweight source reference shown in the chat UI. */
export interface SourceRef {
  id: string;
  title: string;
  type: string;
  tags: string[];
  created_at: string;
}

/** A single evaluation result row. */
export interface EvaluationResult {
  id: string;
  question: string;
  expected_answer: string;
  pipeline: 'normal' | 'self_correcting';
  answer: string;
  precision_score: number;
  recall_score: number;
  faithfulness: number;
  answer_relevancy: number;
  context_precision: number;
  hallucination_rate: number;
  latency_ms: number;
  confidence: number;
  created_at: string;
}

/** Aggregated metrics for a pipeline variant, used by the comparison chart. */
export interface AggregatedMetrics {
  pipeline: 'normal' | 'self_correcting';
  precision_score: number;
  recall_score: number;
  faithfulness: number;
  answer_relevancy: number;
  context_precision: number;
  hallucination_rate: number;
  avg_latency_ms: number;
  avg_confidence: number;
  run_count: number;
}

/** A predefined evaluation test case. */
export interface EvaluationTestCase {
  id: string;
  question: string;
  expected_answer: string;
  category: string;
}
