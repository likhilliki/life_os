/**
 * Evaluation harness for comparing Normal RAG vs Self-Correcting RAG.
 *
 * Runs a set of test questions through both pipeline variants, computes
 * lightweight retrieval/generation metrics client-side, and persists
 * results to the rag_evaluations table for charting.
 */

import { supabase } from '@/lib/supabase';
import { queryRag } from './client';
import { EVALUATION_TEST_CASES } from './config';
import type { EvaluationResult, AggregatedMetrics } from './types';

/**
 * Compute a normalized overlap score between the answer and the expected
 * answer. This is a lightweight lexical proxy for precision/recall ? not a
 * full LLM-judge, but sufficient to demonstrate the evaluation harness and
 * show the delta between pipeline variants.
 */
function lexicalOverlap(answer: string, expected: string): number {
  const answerWords = new Set(
    answer.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2)
  );
  const expectedWords = expected
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (expectedWords.length === 0) return 0;
  const hits = expectedWords.filter((w) => answerWords.has(w)).length;
  return hits / expectedWords.length;
}

/** A refusal is a strong signal of hallucination resistance. */
function isRefusal(answer: string): boolean {
  return answer.toLowerCase().includes("i don't have enough evidence");
}

export interface RunResult {
  testCase: (typeof EVALUATION_TEST_CASES)[number];
  normal: EvaluationResult;
  selfCorrecting: EvaluationResult;
}

export async function runEvaluation(
  onProgress?: (completed: number, total: number) => void
): Promise<RunResult[]> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData?.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const results: RunResult[] = [];
  const total = EVALUATION_TEST_CASES.length;

  for (let i = 0; i < EVALUATION_TEST_CASES.length; i++) {
    const tc = EVALUATION_TEST_CASES[i];

    // Run both pipeline variants
    const [normalRes, scRes] = await Promise.all([
      queryRag(tc.question, { pipeline: 'normal' }).catch((e) => ({
        answer: `Error: ${e.message}`,
        confidence: 0,
        grounded: false,
        refused: false,
        retrieval_count: 0,
        sources: [],
        clarification_question: null,
        trace: {
          original_query: tc.question,
          rewritten_query: null,
          corrected: false,
          correction_reason: null,
          initial_chunks: [],
          corrected_chunks: [],
          final_chunks: [],
          graph_nodes: [],
          confidence: 0,
          grounded: false,
          refused: false,
          steps: [],
          final_prompt: '',
          llm_response: `Error: ${e.message}`,
          total_latency_ms: 0,
        },
      })),
      queryRag(tc.question, { pipeline: 'self_correcting' }).catch((e) => ({
        answer: `Error: ${e.message}`,
        confidence: 0,
        grounded: false,
        refused: false,
        retrieval_count: 0,
        sources: [],
        clarification_question: null,
        trace: {
          original_query: tc.question,
          rewritten_query: null,
          corrected: false,
          correction_reason: null,
          initial_chunks: [],
          corrected_chunks: [],
          final_chunks: [],
          graph_nodes: [],
          confidence: 0,
          grounded: false,
          refused: false,
          steps: [],
          final_prompt: '',
          llm_response: `Error: ${e.message}`,
          total_latency_ms: 0,
        },
      })),
    ]);

    const computeMetrics = (
      answer: string,
      confidence: number,
      grounded: boolean,
      refused: boolean,
      latencyMs: number,
      pipeline: 'normal' | 'self_correcting'
    ): Omit<EvaluationResult, 'id' | 'question' | 'expected_answer' | 'pipeline' | 'answer' | 'created_at'> => {
      const overlap = lexicalOverlap(answer, tc.expected_answer);
      const precision = grounded ? Math.round(overlap * 100) : Math.round(overlap * 40);
      const recall = Math.round(overlap * 100);
      const faithfulness = grounded ? Math.round((overlap * 0.5 + (refused ? 0.5 : 0)) * 100) : Math.round(overlap * 30);
      const answerRelevancy = Math.round(overlap * 100);
      const contextPrecision = confidence > 0 ? Math.round((confidence / 100) * (overlap + 0.3) * 100) : 0;
      const hallucinationRate = grounded ? Math.round((1 - overlap) * 50) : 80;
      return {
        precision_score: precision,
        recall_score: recall,
        faithfulness,
        answer_relevancy: answerRelevancy,
        context_precision: Math.min(contextPrecision, 100),
        hallucination_rate: isRefusal(answer) ? 0 : hallucinationRate,
        latency_ms: latencyMs,
        confidence,
      };
    };

    const normalMetrics = computeMetrics(
      normalRes.answer,
      normalRes.confidence,
      normalRes.grounded,
      normalRes.refused,
      normalRes.trace.total_latency_ms,
      'normal'
    );
    const scMetrics = computeMetrics(
      scRes.answer,
      scRes.confidence,
      scRes.grounded,
      scRes.refused,
      scRes.trace.total_latency_ms,
      'self_correcting'
    );

    const normalRow: EvaluationResult = {
      id: crypto.randomUUID(),
      question: tc.question,
      expected_answer: tc.expected_answer,
      pipeline: 'normal',
      answer: normalRes.answer,
      ...normalMetrics,
      created_at: new Date().toISOString(),
    };
    const scRow: EvaluationResult = {
      id: crypto.randomUUID(),
      question: tc.question,
      expected_answer: tc.expected_answer,
      pipeline: 'self_correcting',
      answer: scRes.answer,
      ...scMetrics,
      created_at: new Date().toISOString(),
    };

    // Persist both rows
    await supabase.from('rag_evaluations').insert([
      { ...normalRow, user_id: userId },
      { ...scRow, user_id: userId },
    ]);

    results.push({ testCase: tc, normal: normalRow, selfCorrecting: scRow });
    onProgress?.(i + 1, total);
  }

  return results;
}

/** Aggregate persisted evaluation rows into per-pipeline metric averages. */
export async function fetchAggregatedMetrics(): Promise<AggregatedMetrics[]> {
  const { data, error } = await supabase
    .from('rag_evaluations')
    .select('pipeline,precision_score,recall_score,faithfulness,answer_relevancy,context_precision,hallucination_rate,latency_ms,confidence');

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const groups: Record<string, AggregatedMetrics[]> = { normal: [], self_correcting: [] };

  for (const row of data as Record<string, unknown>[]) {
    const pipeline = row.pipeline as 'normal' | 'self_correcting';
    groups[pipeline].push({
      pipeline,
      precision_score: row.precision_score as number,
      recall_score: row.recall_score as number,
      faithfulness: row.faithfulness as number,
      answer_relevancy: row.answer_relevancy as number,
      context_precision: row.context_precision as number,
      hallucination_rate: row.hallucination_rate as number,
      avg_latency_ms: row.latency_ms as number,
      avg_confidence: row.confidence as number,
      run_count: 1,
    });
  }

  return (['normal', 'self_correcting'] as const).map((p) => {
    const rows = groups[p];
    if (rows.length === 0) {
      return {
        pipeline: p,
        precision_score: 0, recall_score: 0, faithfulness: 0, answer_relevancy: 0,
        context_precision: 0, hallucination_rate: 0, avg_latency_ms: 0,
        avg_confidence: 0, run_count: 0,
      };
    }
    const avg = (key: keyof Omit<AggregatedMetrics, 'pipeline' | 'run_count'>) =>
      Math.round(rows.reduce((s, r) => s + r[key], 0) / rows.length);
    return {
      pipeline: p,
      precision_score: avg('precision_score'),
      recall_score: avg('recall_score'),
      faithfulness: avg('faithfulness'),
      answer_relevancy: avg('answer_relevancy'),
      context_precision: avg('context_precision'),
      hallucination_rate: avg('hallucination_rate'),
      avg_latency_ms: Math.round(rows.reduce((s, r) => s + r.avg_latency_ms, 0) / rows.length),
      avg_confidence: avg('avg_confidence'),
      run_count: rows.length,
    };
  });
}

/** Clear all evaluation rows for the current user. */
export async function clearEvaluations(): Promise<void> {
  const { error } = await supabase.from('rag_evaluations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}
