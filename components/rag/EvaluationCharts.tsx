'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Brain, AlertTriangle, Clock } from 'lucide-react';
import type { AggregatedMetrics } from '@/lib/rag/types';

const TOOLTIP_STYLE = { background: 'hsl(224 71% 4%)', border: '1px solid hsl(216 34% 17%)', borderRadius: '0.5rem' };

export function EvaluationCharts({ normal, sc }: { normal: AggregatedMetrics; sc: AggregatedMetrics }) {
  const barData = [
    { metric: 'Precision', Normal: normal.precision_score, 'Self-Correcting': sc.precision_score },
    { metric: 'Recall', Normal: normal.recall_score, 'Self-Correcting': sc.recall_score },
    { metric: 'Faithfulness', Normal: normal.faithfulness, 'Self-Correcting': sc.faithfulness },
    { metric: 'Relevancy', Normal: normal.answer_relevancy, 'Self-Correcting': sc.answer_relevancy },
    { metric: 'Context', Normal: normal.context_precision, 'Self-Correcting': sc.context_precision },
    { metric: 'Confidence', Normal: normal.avg_confidence, 'Self-Correcting': sc.avg_confidence },
  ];

  const hallucinationData = [
    { pipeline: 'Normal RAG', rate: normal.hallucination_rate },
    { pipeline: 'Self-Correcting', rate: sc.hallucination_rate },
  ];

  const latencyData = [
    { pipeline: 'Normal RAG', latency: normal.avg_latency_ms },
    { pipeline: 'Self-Correcting', latency: sc.avg_latency_ms },
  ];

  const confidenceData = [
    { pipeline: 'Normal RAG', confidence: normal.avg_confidence },
    { pipeline: 'Self-Correcting', confidence: sc.avg_confidence },
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="glass-card lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" /> All Metrics: Normal vs Self-Correcting RAG
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 34% 17%)" />
              <XAxis dataKey="metric" stroke="hsl(215 16% 57%)" tick={{ fontSize: 11 }} />
              <YAxis stroke="hsl(215 16% 57%)" tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend />
              <Bar dataKey="Normal" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Self-Correcting" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Hallucination Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={hallucinationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 34% 17%)" />
              <XAxis dataKey="pipeline" stroke="hsl(215 16% 57%)" tick={{ fontSize: 11 }} />
              <YAxis stroke="hsl(215 16% 57%)" tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="rate" name="Hallucination %" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" /> Latency Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={latencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(216 34% 17%)" />
              <XAxis dataKey="pipeline" stroke="hsl(215 16% 57%)" tick={{ fontSize: 11 }} />
              <YAxis stroke="hsl(215 16% 57%)" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="latency" name="Latency (ms)" fill="#06B6D4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
