'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import dynamicImport from 'next/dynamic';
import { motion } from 'framer-motion';
import {
  Gauge, Play, Trash2, Loader2, TrendingUp, TrendingDown,
  CheckCircle2, AlertTriangle, Clock, Target, Brain,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { runEvaluation, fetchAggregatedMetrics, clearEvaluations } from '@/lib/rag/evaluation';
import { EVALUATION_TEST_CASES } from '@/lib/rag/config';
import type { AggregatedMetrics } from '@/lib/rag/types';

const EvaluationCharts = dynamicImport(
  () => import('@/components/rag/EvaluationCharts').then((m) => m.EvaluationCharts),
  { ssr: false, loading: () => <div className="h-64 flex items-center justify-center text-muted-foreground">Loading charts...</div> }
);

export default function EvaluationPage() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<AggregatedMetrics[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const m = await fetchAggregatedMetrics();
      setMetrics(m);
    } catch {
      // no data yet is fine
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMetrics(); }, [loadMetrics]);

  const handleRun = async () => {
    setRunning(true);
    setProgress(0);
    try {
      await runEvaluation((completed, total) => setProgress(Math.round((completed / total) * 100)));
      await loadMetrics();
      toast({ title: 'Evaluation complete', description: 'Both pipelines have been benchmarked.' });
    } catch (e) {
      toast({
        title: 'Evaluation failed',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setRunning(false);
    }
  };

  const handleClear = async () => {
    try {
      await clearEvaluations();
      await loadMetrics();
      toast({ title: 'Results cleared' });
    } catch (e) {
      toast({ title: 'Could not clear', description: e instanceof Error ? e.message : '', variant: 'destructive' });
    }
  };

  const normal = metrics.find((m) => m.pipeline === 'normal');
  const sc = metrics.find((m) => m.pipeline === 'self_correcting');
  const hasData = metrics.length > 0 && normal && sc;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gauge className="w-8 h-8 text-primary" /> Evaluation Harness
          </h1>
          <p className="text-muted-foreground mt-1">
            Benchmark Normal RAG vs Self-Correcting RAG across retrieval and generation metrics
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={running || !hasData}
          >
            <Trash2 className="w-4 h-4 mr-2" /> Clear
          </Button>
          <Button variant="glow" onClick={handleRun} disabled={running}>
            {running ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {running ? `Running... ${progress}%` : 'Run Evaluation'}
          </Button>
        </div>
      </div>

      {running && (
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Running {EVALUATION_TEST_CASES.length} test cases through both pipelines...</span>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <div className="w-full bg-muted/40 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {!hasData && !running && (
        <Card className="glass-card">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4"
            >
              <Gauge className="w-8 h-8 text-primary" />
            </motion.div>
            <h2 className="text-xl font-semibold mb-2">No evaluation data yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Run the evaluation to send {EVALUATION_TEST_CASES.length} predefined questions through both
              the Normal and Self-Correcting RAG pipelines and compare the results.
            </p>
            <Button variant="glow" onClick={handleRun}>
              <Play className="w-4 h-4 mr-2" /> Run First Evaluation
            </Button>
          </CardContent>
        </Card>
      )}

      {hasData && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Summary stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Target}
              label="Avg Precision"
              normal={normal!.precision_score}
              sc={sc!.precision_score}
              higherIsBetter
            />
            <StatCard
              icon={Brain}
              label="Faithfulness"
              normal={normal!.faithfulness}
              sc={sc!.faithfulness}
              higherIsBetter
            />
            <StatCard
              icon={AlertTriangle}
              label="Hallucination Rate"
              normal={normal!.hallucination_rate}
              sc={sc!.hallucination_rate}
              higherIsBetter={false}
            />
            <StatCard
              icon={Clock}
              label="Avg Latency (ms)"
              normal={normal!.avg_latency_ms}
              sc={sc!.avg_latency_ms}
              higherIsBetter={false}
              suffix="ms"
            />
          </div>

          {/* Charts */}
          <EvaluationCharts normal={normal!} sc={sc!} />

          {/* Test cases */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" /> Test Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {EVALUATION_TEST_CASES.map((tc) => (
                  <div key={tc.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <Badge variant="outline" className="shrink-0">{tc.category}</Badge>
                    <span className="text-sm truncate">{tc.question}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon, label, normal, sc, higherIsBetter, suffix = '',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  normal: number;
  sc: number;
  higherIsBetter: boolean;
  suffix?: string;
}) {
  const delta = sc - normal;
  const isBetter = higherIsBetter ? delta > 0 : delta < 0;
  const pct = `${Math.abs(delta).toFixed(0)}${suffix}`;

  return (
    <Card className="glass-card card-hover">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <Icon className="w-5 h-5 text-primary" />
          <div className={`flex items-center gap-1 text-xs ${isBetter ? 'text-emerald-500' : 'text-amber-500'}`}>
            {isBetter ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {pct}
          </div>
        </div>
        <div className="text-sm text-muted-foreground mb-1">{label}</div>
        <div className="flex items-baseline gap-3">
          <span className="text-lg font-bold text-blue-400">{normal}{suffix}</span>
          <span className="text-muted-foreground text-xs">{"to"}</span>
          <span className="text-lg font-bold text-emerald-400">{sc}{suffix}</span>
        </div>
      </CardContent>
    </Card>
  );
}
