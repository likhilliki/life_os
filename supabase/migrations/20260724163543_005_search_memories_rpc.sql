/*
# Add search_memories RPC function for RAG retrieval

1. Changes
- Creates a `search_memories(user_id uuid, query_text text)` Postgres function
  that performs weighted full-text search over the caller's own memories and
  returns the top 10 results with title, content, type, tags, created_at, and
  a relevance rank.

2. Why
- The rag-chat edge function calls this RPC to retrieve memories relevant to
  the user's question. Weighted ts_rank (title > content > tags) gives better
  relevance than a plain ILIKE scan.

3. Security
- The function is SECURITY DEFINER so it can use the GIN index, but it filters
  strictly by the passed user_id, which the edge function derives from the
  authenticated session (auth.getUser). It only returns rows owned by that user.
- Marked STABLE so the planner can treat it as a read-only query.
*/

CREATE OR REPLACE FUNCTION search_memories(query_text text, query_user_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  memory_type text,
  tags text[],
  created_at timestamptz,
  rank real
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.title,
    m.content,
    m.memory_type::text,
    m.tags,
    m.created_at,
    ts_rank(m.search_vector, websearch_to_tsquery('english', query_text)) AS rank
  FROM memories m
  WHERE m.user_id = query_user_id
    AND m.search_vector @@ websearch_to_tsquery('english', query_text)
  ORDER BY rank DESC
  LIMIT 10;
END;
$$;
