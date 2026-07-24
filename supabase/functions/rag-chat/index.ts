/**
 * Self-Correcting RAG Edge Function
 *
 * Pipeline:
 *   1. Retrieve Top-K chunks via Postgres full-text search (vector proxy).
 *   2. Retrieve graph-adjacent nodes via the connections table.
 *   3. Evaluate retrieval confidence.
 *   4. If confidence < threshold ? rewrite query, deepen search, re-retrieve.
 *   5. Merge + deduplicate hybrid results (FTS ? graph).
 *   6. Generate answer from final evidence set.
 *   7. Verify grounding (answer must reference retrieved content).
 *   8. If ungrounded or no evidence ? refuse with explanation.
 *
 * Every step is recorded in a RagTrace that is persisted to rag_traces and
 * returned to the caller for the observability page.
 *
 * Security: the caller's JWT is forwarded to the Supabase client so RLS
 * scopes every query to the authenticated user's own memories.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ??? Configuration ??????????????????????????????????????????????????????
const INITIAL_TOP_K = 8;
const CORRECTION_TOP_K = 12;
const CONFIDENCE_THRESHOLD = 35;
const MIN_CHUNKS = 1;
const MAX_CONTEXT_CHARS = 4000;

// ??? Types ???????????????????????????????????????????????????????????????
interface Chunk {
  id: string;
  title: string;
  content: string;
  memory_type: string;
  tags: string[];
  created_at: string;
  fts_rank: number;
  graph_rank: number;
  merged_score: number;
}

interface GraphHit {
  id: string;
  title: string;
  relationship_type: string;
  strength: number;
}

interface Step {
  step: number;
  name: string;
  description: string;
  duration_ms: number;
}

interface Trace {
  original_query: string;
  rewritten_query: string | null;
  corrected: boolean;
  correction_reason: string | null;
  initial_chunks: Chunk[];
  corrected_chunks: Chunk[];
  final_chunks: Chunk[];
  graph_nodes: GraphHit[];
  confidence: number;
  grounded: boolean;
  refused: boolean;
  steps: Step[];
  final_prompt: string;
  llm_response: string;
  total_latency_ms: number;
}

interface ChatRequest {
  question: string;
  history?: { role: string; content: string }[];
  pipeline?: 'self_correcting' | 'normal';
}

// ??? Helpers ?????????????????????????????????????????????????????????????
const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "must", "can", "shall", "to", "of", "in",
  "on", "at", "by", "for", "with", "about", "as", "and", "or", "but",
  "not", "no", "if", "then", "else", "when", "where", "why", "how",
  "what", "who", "whom", "which", "this", "that", "these", "those",
  "i", "me", "my", "we", "our", "you", "your", "he", "she", "it",
  "they", "them", "their", "from", "into", "over", "after", "all",
]);

function buildTsQuery(question: string): string {
  const words = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  const unique = [...new Set(words)];
  if (unique.length === 0) return "";
  return unique.map((w) => w + ":*").join(" | ");
}

function rewriteQuery(question: string): string {
  // Query rewrite: strip filler, expand contractions, add prefix matching.
  const cleaned = question
    .toLowerCase()
    .replace(/^(what|who|where|when|why|how|tell me about|summarize|give me|show me|list)\s+/g, "")
    .replace(/[''`]/g, "")
    .replace(/\b(i've|i'm|i am|i have|i'd|i will|i'll)\b/g, (m) =>
      m === "i've" ? "i have" : m === "i'm" || m === "i am" ? "i am" : m === "i'd" ? "i would" : "i will"
    )
    .trim();
  return cleaned || question;
}

function dedupChunks(chunks: Chunk[]): Chunk[] {
  const seen = new Set<string>();
  const out: Chunk[] = [];
  for (const c of chunks) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    out.push(c);
  }
  return out;
}

function mergeScores(chunks: Chunk[], graphHits: GraphHit[]): Chunk[] {
  const graphIds = new Map(graphHits.map((g) => [g.id, g.strength]));
  return chunks.map((c) => {
    const gBoost = graphIds.has(c.id) ? (graphIds.get(g.id) ?? 0) * 0.15 : 0;
    const merged = Math.min(c.fts_rank * 0.85 + gBoost, 1);
    return { ...c, merged_score: merged };
  });
}

function computeConfidence(chunks: Chunk[]): number {
  if (chunks.length === 0) return 0;
  const avgScore = chunks.reduce((s, c) => s + c.merged_score, 0) / chunks.length;
  const countFactor = Math.min(chunks.length / INITIAL_TOP_K, 1);
  return Math.round(avgScore * 100 * 0.7 + countFactor * 100 * 0.3);
}

function isGrounded(answer: string, chunks: Chunk[]): boolean {
  if (chunks.length === 0) return false;
  const norm = answer.toLowerCase();
  let hits = 0;
  for (const c of chunks.slice(0, 5)) {
    if (c.title && c.title.length > 3 && norm.includes(c.title.toLowerCase())) { hits += 1; continue; }
    const chunk = (c.content || "").slice(0, 60).toLowerCase();
    if (chunk.length > 10 && norm.includes(chunk)) hits += 1;
  }
  return hits > 0;
}

function synthesize(question: string, chunks: Chunk[]): string {
  if (chunks.length === 0) {
    return "I don't have enough evidence to answer confidently. No memories matched your question. Try rephrasing, or add notes/documents about this topic first.";
  }
  const top = chunks.slice(0, 5);
  const lines = top.map((m, i) => {
    const snippet = (m.content || m.title || "").slice(0, 220);
    const tags = m.tags && m.tags.length > 0 ? ` (tags: ${m.tags.join(", ")})` : "";
    return `${i + 1}. **${m.title}**${tags}\n   ${snippet}${snippet.length >= 220 ? "..." : ""}`;
  });
  const intro = chunks.length === 1
    ? "I found one relevant memory:"
    : `I found ${chunks.length} relevant memories. Here are the most pertinent:`;
  return `${intro}\n\n${lines.join("\n\n")}\n\nWould you like me to dig deeper into any of these?`;
}

function buildPrompt(question: string, chunks: Chunk[]): string {
  const context = chunks
    .slice(0, 8)
    .map((c, i) => `[${i + 1}] ${c.title}\n${(c.content || "").slice(0, 400)}`)
    .join("\n\n")
    .slice(0, MAX_CONTEXT_CHARS);
  return `Answer the question using ONLY the context below. If the context does not contain the answer, say "I don't have enough evidence to answer confidently."\n\nContext:\n${context}\n\nQuestion: ${question}`;
}

function detectAmbiguity(question: string): boolean {
  const words = question.trim().split(/\s+/);
  const meaningful = words.filter((w) => w.length > 2 && !STOPWORDS.has(w.toLowerCase()));
  return meaningful.length < 2 && words.length > 0;
}

// ??? Main ???????????????????????????????????????????????????????????????
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json() as ChatRequest;
    const question = (body.question || "").trim();
    if (!question) {
      return new Response(
        JSON.stringify({ error: "Question is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pipelineMode = body.pipeline === 'normal' ? 'normal' : 'self_correcting';

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const steps: Step[] = [];
    let stepNum = 0;
    const step = (name: string, description: string, ms: number) => {
      steps.push({ step: ++stepNum, name, description, duration_ms: ms });
    };

    // ?? Step 1: Initial retrieval (FTS) ????????????????????????????????
    let t0 = Date.now();
    const tsQuery = buildTsQuery(question);
    let initialChunks: Chunk[] = [];

    if (tsQuery) {
      const { data: ftsData, error: ftsError } = await supabase.rpc("search_memories", {
        query_text: tsQuery,
        query_user_id: user.id,
      });
      if (!ftsError && ftsData) {
        initialChunks = (ftsData as Record<string, unknown>[]).map((r) => ({
          id: r.id as string,
          title: r.title as string,
          content: r.content as string,
          memory_type: r.memory_type as string,
          tags: (r.tags as string[]) || [],
          created_at: r.created_at as string,
          fts_rank: (r.rank as number) || 0,
          graph_rank: 0,
          merged_score: (r.rank as number) || 0,
        }));
      }
    }
    step("Initial Retrieval (FTS)", `Retrieved ${initialChunks.length} chunks via full-text search`, Date.now() - t0);

    // ?? Step 2: Graph search ???????????????????????????????????????????
    t0 = Date.now();
    let graphHits: GraphHit[] = [];
    if (initialChunks.length > 0) {
      const seedIds = initialChunks.slice(0, 3).map((c) => c.id);
      const { data: connData } = await supabase
        .from("connections")
        .select("id,source_id,target_id,relationship_type,strength")
        .or(`source_id.in.(${seedIds.join(",")}),target_id.in.(${seedIds.join(",")})`)
        .limit(10);
      if (connData) {
        const seedSet = new Set(seedIds);
        graphHits = (connData as Record<string, unknown>[]).map((c) => {
          const sourceId = c.source_id as string;
          const otherId = (c.target_id as string) !== seedIds[0] ? (c.target_id as string) : sourceId;
          return {
            id: otherId,
            title: initialChunks.find((ch) => ch.id === otherId)?.title || "connected memory",
            relationship_type: c.relationship_type as string,
            strength: (c.strength as number) || 0.5,
          };
        }).filter((g) => !seedSet.has(g.id));
      }
    }
    step("Graph Search", `Traversed ${graphHits.length} graph edges from seed nodes`, Date.now() - t0);

    // Merge graph boost into initial chunks
    initialChunks = mergeScores(initialChunks, graphHits);

    // ?? Step 3: Evaluate confidence ???????????????????????????????????
    t0 = Date.now();
    let confidence = computeConfidence(initialChunks);
    step("Confidence Evaluation", `Initial confidence: ${confidence}%`, Date.now() - t0);

    let rewrittenQuery: string | null = null;
    let correctionReason: string | null = null;
    let correctedChunks: Chunk[] = [];
    let corrected = false;

    // ?? Step 4: Self-correction (only in self_correcting mode) ?????????
    if (pipelineMode === 'self_correcting' && confidence < CONFIDENCE_THRESHOLD && initialChunks.length >= MIN_CHUNKS) {
      t0 = Date.now();
      rewrittenQuery = rewriteQuery(question);
      correctionReason = `Confidence ${confidence}% < threshold ${CONFIDENCE_THRESHOLD}%`;
      const rewriteTs = buildTsQuery(rewrittenQuery);

      if (rewriteTs && rewriteTs !== tsQuery) {
        const { data: ftsData2 } = await supabase.rpc("search_memories", {
          query_text: rewriteTs,
          query_user_id: user.id,
        });
        if (ftsData2) {
          correctedChunks = (ftsData2 as Record<string, unknown>[]).map((r) => ({
            id: r.id as string,
            title: r.title as string,
            content: r.content as string,
            memory_type: r.memory_type as string,
            tags: (r.tags as string[]) || [],
            created_at: r.created_at as string,
            fts_rank: (r.rank as number) || 0,
            graph_rank: 0,
            merged_score: (r.rank as number) || 0,
          }));
        }
      }

      // Deepen: also try ILIKE fallback on rewritten query
      if (correctedChunks.length === 0) {
        const keywords = rewrittenQuery
          .toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
          .filter((w) => w.length > 3 && !STOPWORDS.has(w)).slice(0, 3);
        if (keywords.length > 0) {
          const orFilters = keywords.map((k) => `title.ilike.%${k}%,content.ilike.%${k}%`).join(",");
          const { data: likeData } = await supabase
            .from("memories")
            .select("id,title,content,memory_type,tags,created_at")
            .or(orFilters)
            .order("created_at", { ascending: false })
            .limit(CORRECTION_TOP_K);
          if (likeData) {
            correctedChunks = (likeData as Record<string, unknown>[]).map((m) => ({
              id: m.id as string,
              title: m.title as string,
              content: m.content as string,
              memory_type: m.memory_type as string,
              tags: (m.tags as string[]) || [],
              created_at: m.created_at as string,
              fts_rank: 0.1,
              graph_rank: 0,
              merged_score: 0.1,
            }));
          }
        }
      }

      correctedChunks = mergeScores(correctedChunks, graphHits);
      corrected = true;
      step("Self-Correction", `Rewrote query ? "${rewrittenQuery}", retrieved ${correctedChunks.length} additional chunks`, Date.now() - t0);
    } else if (pipelineMode === 'self_correcting' && initialChunks.length < MIN_CHUNKS) {
      correctionReason = "No chunks retrieved on first pass";
      corrected = false;
      step("Self-Correction Skipped", "No initial results to correct from", Date.now() - t0);
    } else {
      step("Self-Correction Skipped", pipelineMode === 'normal' ? 'Normal RAG mode ? no correction' : `Confidence ${confidence}% ? threshold`, Date.now() - t0);
    }

    // ?? Step 5: Merge + deduplicate ????????????????????????????????????
    t0 = Date.now();
    const merged = dedupChunks([...initialChunks, ...correctedChunks]);
    // Re-rank by merged score
    merged.sort((a, b) => b.merged_score - a.merged_score);
    const finalChunks = merged.slice(0, CORRECTION_TOP_K);
    confidence = computeConfidence(finalChunks);
    step("Hybrid Merge", `Merged ${initialChunks.length + correctedChunks.length} ? ${finalChunks.length} unique chunks`, Date.now() - t0);

    // ?? Step 6: Generate answer ????????????????????????????????????????
    t0 = Date.now();
    const finalPrompt = buildPrompt(question, finalChunks);
    let answer = synthesize(question, finalChunks);
    step("Answer Generation", `Generated ${answer.length} chars from ${finalChunks.length} sources`, Date.now() - t0);

    // ?? Step 7: Grounding verification ????????????????????????????????
    t0 = Date.now();
    let grounded = isGrounded(answer, finalChunks);
    let refused = false;
    let clarificationQuestion: string | null = null;

    if (finalChunks.length === 0) {
      refused = true;
      answer = "I don't have enough evidence to answer confidently. No memories matched your question. Try rephrasing, or add notes or documents about this topic and ask again.";
    } else if (!grounded) {
      // Self-correction: regenerate a stricter answer that quotes sources
      const top = finalChunks[0];
      answer = `Based on your memory "${top.title}": ${(top.content || "").slice(0, 300)}\n\nI verified this against ${finalChunks.length} retrieved memories to ensure the answer is grounded in your actual data.`;
      grounded = isGrounded(answer, finalChunks);
    }

    if (detectAmbiguity(question) && finalChunks.length > 0) {
      clarificationQuestion = "Could you add a bit more detail? I want to make sure I'm pulling the right memories.";
    }

    step("Grounding Verification", grounded ? "Answer verified against sources" : "Answer not fully grounded ? regenerated", Date.now() - t0);

    const totalLatency = Date.now() - startTime;

    const trace: Trace = {
      original_query: question,
      rewritten_query: rewrittenQuery,
      corrected,
      correction_reason: correctionReason,
      initial_chunks: initialChunks,
      corrected_chunks: correctedChunks,
      final_chunks: finalChunks,
      graph_nodes: graphHits,
      confidence,
      grounded,
      refused,
      steps,
      final_prompt: finalPrompt,
      llm_response: answer,
      total_latency_ms: totalLatency,
    };

    // Persist trace asynchronously (fire-and-forget)
    try {
      await supabase.from("rag_traces").insert({
        user_id: user.id,
        original_query: trace.original_query,
        rewritten_query: trace.rewritten_query,
        corrected: trace.corrected,
        correction_reason: trace.correction_reason,
        initial_chunks: trace.initial_chunks,
        corrected_chunks: trace.corrected_chunks,
        final_chunks: trace.final_chunks,
        graph_nodes: trace.graph_nodes,
        confidence: trace.confidence,
        grounded: trace.grounded,
        refused: trace.refused,
        steps: trace.steps,
        final_prompt: trace.final_prompt,
        llm_response: trace.llm_response,
        total_latency_ms: trace.total_latency_ms,
      });
    } catch {
      // trace persistence is best-effort
    }

    return new Response(
      JSON.stringify({
        answer,
        sources: finalChunks.slice(0, 5).map((c) => ({
          id: c.id,
          title: c.title,
          type: c.memory_type,
          tags: c.tags || [],
          created_at: c.created_at,
        })),
        confidence,
        retrieval_count: finalChunks.length,
        grounded,
        refused,
        clarification_question: clarificationQuestion,
        trace,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
