/**
 * Configuration constants for the Self-Correcting RAG pipeline.
 *
 * Centralizing thresholds here makes the pipeline behavior tunable in one
 * place and makes the architecture explainable during an interview ? every
 * knob has a comment explaining why it exists.
 */

export const RAG_CONFIG = {
  /** Number of chunks to retrieve on the first pass. */
  INITIAL_TOP_K: 8,

  /** Number of chunks to retrieve on the correction pass (deeper search). */
  CORRECTION_TOP_K: 12,

  /** Minimum average merged score for the first pass to be considered sufficient. */
  CONFIDENCE_THRESHOLD: 35,

  /** Minimum number of chunks that must be retrieved to attempt an answer. */
  MIN_CHUNKS: 1,

  /** Maximum tokens of context to include in the final prompt. */
  MAX_CONTEXT_CHARS: 4000,

  /** Minimum query length (chars) before a clarification question is considered. */
  MIN_QUERY_LENGTH: 3,

  /** Maximum messages of conversation history to include. */
  MAX_HISTORY: 6,
} as const;

/** Predefined evaluation test cases for the evaluation harness. */
export const EVALUATION_TEST_CASES = [
  {
    id: 'tc-001',
    question: 'What projects have I been working on?',
    expected_answer: 'Should list active projects from memories',
    category: 'Project Recall',
  },
  {
    id: 'tc-002',
    question: 'What goals am I behind on?',
    expected_answer: 'Should identify goals with low progress',
    category: 'Goal Tracking',
  },
  {
    id: 'tc-003',
    question: 'Summarize everything I learned about AI.',
    expected_answer: 'Should synthesize AI-related memories',
    category: 'Topic Synthesis',
  },
  {
    id: 'tc-004',
    question: 'Who did I meet with recently?',
    expected_answer: 'Should list contacts from meetings',
    category: 'Contact Recall',
  },
  {
    id: 'tc-005',
    question: 'What decisions did I make and why?',
    expected_answer: 'Should surface decisions with reasoning',
    category: 'Decision Recall',
  },
  {
    id: 'tc-006',
    question: 'xyzzy quux non-existent topic',
    expected_answer: 'Should refuse ? no evidence found',
    category: 'Hallucination Resistance',
  },
] as const;
