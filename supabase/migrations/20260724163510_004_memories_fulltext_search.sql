/*
# Add full-text search support to memories

1. Changes
- Adds a `search_vector` tsvector column to `memories` (plain column, not generated
  because to_tsvector('english', ...) is not immutable in Postgres).
- Adds a GIN index on `search_vector` for fast text queries.
- Adds a trigger to keep `search_vector` updated automatically on insert/update,
  combining title (weight A), content (weight B), and tags (weight C).

2. Why
- The AI Chat feature needs to retrieve relevant memories by keywords/meaning,
  not just exact matches. Postgres full-text search powers the retrieval step
  of the self-correcting RAG pipeline used by the chat edge function.

3. Security
- No RLS changes. Existing policies still apply. The new column is maintained
  by a trigger, not user-writable, so no new policy is needed.
*/

ALTER TABLE memories
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_memories_search_vector
  ON memories USING gin (search_vector);

CREATE OR REPLACE FUNCTION memories_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(NEW.tags, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_memories_search_vector ON memories;
CREATE TRIGGER trg_memories_search_vector
  BEFORE INSERT OR UPDATE ON memories
  FOR EACH ROW EXECUTE FUNCTION memories_search_vector_update();

-- Backfill existing rows
UPDATE memories SET search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(content, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(array_to_string(tags, ' '), '')), 'C')
WHERE search_vector IS NULL;
