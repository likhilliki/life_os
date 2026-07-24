/**
 * Frontend client for the Self-Correcting RAG edge function.
 *
 * Wraps fetch with auth, error handling, and response validation so the UI
 * never binds a malformed response as success data.
 */

import { supabase } from '@/lib/supabase';
import type { RagChatResponse, RagTrace } from './types';

export interface ChatOptions {
  pipeline?: 'self_correcting' | 'normal';
  history?: { role: 'user' | 'assistant'; content: string }[];
}

export async function queryRag(
  question: string,
  options?: ChatOptions
): Promise<RagChatResponse> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/rag-chat`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({
        question,
        history: options?.history,
        pipeline: options?.pipeline ?? 'self_correcting',
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(
      (errBody as { error?: string }).error || `Request failed (${response.status})`
    );
  }

  const data = await response.json();

  if (!data || typeof data.answer !== 'string' || !data.trace) {
    throw new Error('Unexpected response shape from the RAG service.');
  }

  return data as RagChatResponse;
}

/** Fetch the most recent pipeline traces for the observability page. */
export async function fetchRecentTraces(limit = 20): Promise<RagTrace[]> {
  const { data, error } = await supabase
    .from('rag_traces')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map((row) => ({
    original_query: row.original_query,
    rewritten_query: row.rewritten_query,
    corrected: row.corrected,
    correction_reason: row.correction_reason,
    initial_chunks: row.initial_chunks,
    corrected_chunks: row.corrected_chunks,
    final_chunks: row.final_chunks,
    graph_nodes: row.graph_nodes,
    confidence: row.confidence,
    grounded: row.grounded,
    refused: row.refused,
    steps: row.steps,
    final_prompt: row.final_prompt,
    llm_response: row.llm_response,
    total_latency_ms: row.total_latency_ms,
  }));
}
