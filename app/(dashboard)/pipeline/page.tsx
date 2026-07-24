'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bug, Search, Brain, GitBranch, AlertTriangle, FileText,
  CheckCircle2, Clock, ChevronRight, RefreshCw, Loader2,
  Network, Sparkles, MessageSquare, XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchRecentTraces } from '@/lib/rag/client';
import type { RagTrace, RetrievedChunk, GraphNodeHit, PipelineStep } from '@/lib/rag/types';

export default function PipelineDebugPage() {
  const [traces, setTraces] = useState<RagTrace[]>([]);
  const [selected, setSelected] = useState<RagTrace | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const t = await fetchRecentTraces(20);
      setTraces(t);
      if (t.length > 0 && !selected) setSelected(t[0]);
    } catch {
      // no data yet
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bug className="w-8 h-8 text-primary" /> Pipeline Debug
          </h1>
          <p className="text-muted-foreground mt-1">
            Inspect every step of the Self-Correcting RAG pipeline ? retrieval, correction, generation, and verification
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>

      {traces.length === 0 && !loading ? (
        <Card className="glass-card">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4"
            >
              <Bug className="w-8 h-8 text-primary" />
            </motion.div>
            <h2 className="text-xl font-semibold mb-2">No traces yet</h2>
            <p className="text-muted-foreground max-w-md">
              Ask a question in the AI Chat and pipeline traces will appear here automatically.
              Each trace shows the full retrieval ? correction ? generation ? verification flow.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          {/* Trace list */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground px-2">Recent Traces</h3>
            <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto">
              {traces.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(t)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selected === t
                      ? 'bg-primary/10 border-primary/50'
                      : 'bg-muted/20 border-border/50 hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {t.refused ? (
                      <XCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    ) : t.grounded ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                    <span className="text-sm truncate">{t.original_query}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{t.confidence}%</span>
                    <span>?</span>
                    <span>{t.total_latency_ms}ms</span>
                    {t.corrected && <Badge variant="outline" className="text-xs py-0">corrected</Badge>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Trace detail */}
          <AnimatePresence mode="wait">
            {selected && (
              <motion.div
                key={selected.original_query + selected.total_latency_ms}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <TraceDetail trace={selected} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function TraceDetail({ trace }: { trace: RagTrace }) {
  return (
    <>
      {/* Overview badges */}
      <Card className="glass-card">
        <CardContent className="p-4 flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className="gap-1">
            <Sparkles className="w-3 h-3" /> {trace.confidence}% confidence
          </Badge>
          {trace.grounded ? (
            <Badge variant="outline" className="gap-1 text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
              <CheckCircle2 className="w-3 h-3" /> Grounded
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-amber-500 border-amber-500/30 bg-amber-500/10">
              <AlertTriangle className="w-3 h-3" /> Not grounded
            </Badge>
          )}
          {trace.refused && (
            <Badge variant="outline" className="gap-1 text-amber-500 border-amber-500/30 bg-amber-500/10">
              <XCircle className="w-3 h-3" /> Refused
            </Badge>
          )}
          {trace.corrected && (
            <Badge variant="outline" className="gap-1 text-blue-400 border-blue-400/30 bg-blue-400/10">
              <RefreshCw className="w-3 h-3" /> Self-corrected
            </Badge>
          )}
          <Badge variant="outline" className="gap-1 ml-auto">
            <Clock className="w-3 h-3" /> {trace.total_latency_ms}ms
          </Badge>
        </CardContent>
      </Card>

      {/* Pipeline steps */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <GitBranch className="w-4 h-4 text-primary" /> Pipeline Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {trace.steps.map((s: PipelineStep, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {s.step}
                  </div>
                  {i < trace.steps.length - 1 && <div className="w-px h-6 bg-border" />}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{s.name}</span>
                    <span className="text-xs text-muted-foreground">{s.duration_ms}ms</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Query rewriting */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="w-4 h-4 text-primary" /> Query Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Original Query</div>
            <div className="p-3 rounded-lg bg-muted/30 text-sm">{trace.original_query}</div>
          </div>
          {trace.rewritten_query && (
            <div>
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                Rewritten Query
                <Badge variant="outline" className="text-xs py-0">correction</Badge>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10 text-sm border border-blue-500/20">{trace.rewritten_query}</div>
              {trace.correction_reason && (
                <div className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {trace.correction_reason}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Retrieved chunks */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="w-4 h-4 text-primary" /> Initial Retrieval
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trace.initial_chunks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No chunks retrieved.</p>
            ) : (
              <div className="space-y-2">
                {trace.initial_chunks.map((c: RetrievedChunk) => (
                  <ChunkRow key={c.id} chunk={c} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {trace.corrected_chunks.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <RefreshCw className="w-4 h-4 text-blue-400" /> Correction Retrieval
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {trace.corrected_chunks.map((c: RetrievedChunk) => (
                  <ChunkRow key={c.id} chunk={c} highlight />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Graph nodes */}
      {trace.graph_nodes.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Network className="w-4 h-4 text-primary" /> Graph Traversal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {trace.graph_nodes.map((g: GraphNodeHit, i: number) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-sm">
                  <GitBranch className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                  <span className="truncate">{g.title}</span>
                  <Badge variant="outline" className="text-xs py-0 ml-auto">{g.relationship_type}</Badge>
                  <span className="text-xs text-muted-foreground">{g.strength.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final merged evidence */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Brain className="w-4 h-4 text-primary" /> Final Evidence ({trace.final_chunks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trace.final_chunks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No evidence ? pipeline refused to answer.</p>
          ) : (
            <div className="space-y-2">
              {trace.final_chunks.map((c: RetrievedChunk) => (
                <ChunkRow key={c.id} chunk={c} showMerged />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Final prompt */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="w-4 h-4 text-primary" /> Final Prompt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs whitespace-pre-wrap p-4 rounded-lg bg-muted/30 overflow-x-auto max-h-64 font-mono">
            {trace.final_prompt}
          </pre>
        </CardContent>
      </Card>

      {/* LLM response */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-primary" /> LLM Response
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-primary/5 text-sm whitespace-pre-wrap leading-relaxed">
            {trace.llm_response}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function ChunkRow({ chunk, highlight, showMerged }: {
  chunk: RetrievedChunk;
  highlight?: boolean;
  showMerged?: boolean;
}) {
  return (
    <div className={`p-3 rounded-lg ${highlight ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-muted/30'}`}>
      <div className="flex items-center gap-2 mb-1">
        <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium truncate">{chunk.title}</span>
        <Badge variant="outline" className="text-xs py-0 ml-auto">{chunk.memory_type}</Badge>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 ml-5">
        {(chunk.content || '').slice(0, 120)}...
      </p>
      {(chunk.fts_rank > 0 || showMerged) && (
        <div className="flex items-center gap-3 ml-5 mt-1 text-xs text-muted-foreground">
          {chunk.fts_rank > 0 && <span>FTS: {chunk.fts_rank.toFixed(3)}</span>}
          {chunk.graph_rank > 0 && <span>Graph: {chunk.graph_rank.toFixed(2)}</span>}
          {showMerged && <span className="text-primary font-medium">Merged: {chunk.merged_score.toFixed(3)}</span>}
        </div>
      )}
    </div>
  );
}
