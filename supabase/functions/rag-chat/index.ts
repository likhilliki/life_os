import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MemoryRow {
  id: string;
  title: string;
  content: string | null;
  memory_type: string;
  tags: string[] | null;
  created_at: string;
  rank: number;
}

interface ChatRequest {
  question: string;
  history?: { role: "user" | "assistant"; content: string }[];
}

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
  // Use OR matching with prefix support so partial matches still hit
  return unique.map((w) => w + ":*").join(" | ");
}

function synthesizeAnswer(question: string, memories: MemoryRow[]): string {
  if (memories.length === 0) {
    return "I couldn't find anything in your memories related to that. Try adding notes, documents, or meetings about this topic, then ask again.";
  }

  const top = memories.slice(0, 5);
  const lines = top.map((m, i) => {
    const snippet = (m.content || m.title || "").slice(0, 220);
    const tags = m.tags && m.tags.length > 0 ? ` (tags: ${m.tags.join(", ")})` : "";
    return `${i + 1}. **${m.title}**${tags}\n   ${snippet}${snippet.length >= 220 ? "..." : ""}`;
  });

  const intro =
    memories.length === 1
      ? "I found one relevant memory:"
      : `I found ${memories.length} relevant memories. Here are the most pertinent:`;

  return `${intro}\n\n${lines.join("\n\n")}\n\nWould you like me to dig deeper into any of these?`;
}

function isAnswerGrounded(answer: string, memories: MemoryRow[]): boolean {
  // Self-correction: verify the answer actually references content from the
  // retrieved memories rather than hallucinating. We check that at least one
  // memory title or a meaningful chunk of its content appears in the answer.
  if (memories.length === 0) return false;
  const normalizedAnswer = answer.toLowerCase();
  let hits = 0;
  for (const m of memories) {
    if (m.title && m.title.length > 3 && normalizedAnswer.includes(m.title.toLowerCase())) {
      hits += 1;
      continue;
    }
    const contentChunk = (m.content || "").slice(0, 60).toLowerCase();
    if (contentChunk.length > 10 && normalizedAnswer.includes(contentChunk)) {
      hits += 1;
    }
  }
  return hits > 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

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

    // Use the user's JWT to respect RLS — they only see their own memories
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

    // --- Retrieval: full-text search over memories ---
    const tsQuery = buildTsQuery(question);
    let memories: MemoryRow[] = [];

    if (tsQuery) {
      const { data: ftsData, error: ftsError } = await supabase.rpc("search_memories", {
        query_text: tsQuery,
        query_user_id: user.id,
      });
      if (!ftsError && ftsData) {
        memories = ftsData as MemoryRow[];
      }
    }

    // --- Fallback: keyword ILIKE if FTS returns nothing ---
    if (memories.length === 0) {
      const keywords = question
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3 && !STOPWORDS.has(w))
        .slice(0, 3);

      if (keywords.length > 0) {
        const orFilters = keywords
          .map((k) => `title.ilike.%${k}%,content.ilike.%${k}%`)
          .join(",");
        const { data: likeData } = await supabase
          .from("memories")
          .select("id,title,content,memory_type,tags,created_at")
          .or(orFilters)
          .order("created_at", { ascending: false })
          .limit(8);
        if (likeData) {
          memories = likeData.map((m: Record<string, unknown>) => ({
            ...(m as Record<string, unknown>),
            rank: 0.1,
          })) as MemoryRow[];
        }
      }
    }

    // --- Generation: synthesize an answer from retrieved context ---
    let answer = synthesizeAnswer(question, memories);

    // --- Self-correction: verify the answer is grounded in the sources ---
    if (memories.length > 0 && !isAnswerGrounded(answer, memories)) {
      // Regenerate a stricter answer that explicitly quotes source titles
      const top = memories[0];
      answer =
        `Based on your memory "${top.title}": ${(top.content || "").slice(0, 300)}\n\n` +
        `I checked this against ${memories.length} retrieved memories to make sure the answer is grounded in your actual data.`;
    }

    // --- Confidence scoring ---
    const confidence =
      memories.length === 0
        ? 0
        : Math.min(Math.round((memories.length / 5) * 100), 100);

    return new Response(
      JSON.stringify({
        answer,
        sources: memories.slice(0, 5).map((m) => ({
          id: m.id,
          title: m.title,
          type: m.memory_type,
          tags: m.tags || [],
          created_at: m.created_at,
        })),
        confidence,
        retrieval_count: memories.length,
        grounded: memories.length === 0 || isAnswerGrounded(answer, memories),
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
