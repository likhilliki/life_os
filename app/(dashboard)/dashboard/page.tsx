'use client';

import { motion } from 'framer-motion';
import { Brain, TrendingUp, Calendar, Target as GoalIcon, Activity, Network, Sparkles, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

interface Memory { id: string; title: string; created_at: string; memory_type: string; }
interface Goal { id: string; title: string; progress: number; }
interface Insight { id: string; title: string; content: string; }

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [stats, setStats] = useState({ totalMemories: 0, healthScore: 78, connections: 247, activeGoals: 0 });

  useEffect(() => { if (user) fetchDashboardData(); }, [user]);

  const fetchDashboardData = async () => {
    const [memoriesRes, goalsRes, insightsRes] = await Promise.all([
      supabase.from('memories').select('id, title, created_at, memory_type').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('goals').select('id, title, progress').eq('user_id', user!.id).eq('status', 'active').limit(5),
      supabase.from('insights').select('id, title, content').eq('user_id', user!.id).eq('dismissed', false).order('created_at', { ascending: false }).limit(5),
    ]);
    if (memoriesRes.data) setMemories(memoriesRes.data);
    if (goalsRes.data) setGoals(goalsRes.data);
    if (insightsRes.data) setInsights(insightsRes.data);
    setStats({ totalMemories: memoriesRes.data?.length || 0, healthScore: user?.memory_health_score || 78, connections: 247, activeGoals: goalsRes.data?.length || 0 });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{getGreeting()}, {user?.full_name?.split(' ')[0] || 'there'}</h1>
          <p className="text-muted-foreground mt-1">Here&apos;s what&apos;s happening in your digital brain</p>
        </div>
        <Button variant="glow" className="hidden sm:flex"><Sparkles className="w-4 h-4 mr-2" />Ask AI</Button>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ icon: Brain, label: 'Total Memories', value: stats.totalMemories, color: 'text-primary' },
          { icon: Activity, label: 'Memory Health', value: `${stats.healthScore}%`, color: 'text-green-500' },
          { icon: Network, label: 'Connections', value: stats.connections, color: 'text-blue-500' },
          { icon: GoalIcon, label: 'Active Goals', value: stats.activeGoals, color: 'text-yellow-500' },
        ].map((s) => (
          <Card key={s.label} className="glass-card card-hover">
            <CardContent className="p-6"><s.icon className={`w-5 h-5 ${s.color} mb-2`} /><div className="text-2xl font-bold">{s.value}</div><div className="text-sm text-muted-foreground">{s.label}</div></CardContent>
          </Card>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="glass-card h-full">
            <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />AI Insights</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {insights.length > 0 ? insights.map((insight) => (
                <div key={insight.id} className="p-4 rounded-xl bg-muted/50 border border-border/50">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0"><TrendingUp className="w-4 h-4 text-primary" /></div>
                    <div><div className="font-medium mb-1">{insight.title}</div><div className="text-sm text-muted-foreground">{insight.content}</div></div>
                  </div>
                </div>
              )) : <div className="text-center py-8"><Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">AI insights will appear here</p></div>}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="glass-card h-full">
            <CardHeader><CardTitle className="flex items-center gap-2"><GoalIcon className="w-5 h-5 text-yellow-500" />Goals</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {goals.length > 0 ? goals.map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between"><span className="text-sm font-medium">{goal.title}</span><span className="text-sm text-muted-foreground">{goal.progress}%</span></div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${goal.progress}%` }} /></div>
                </div>
              )) : <div className="text-center py-8"><GoalIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">Set your first goal</p></div>}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={item}>
        <Card className="glass-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-blue-500" />Recent Memories</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {memories.length > 0 ? memories.slice(0, 5).map((memory) => (
                <div key={memory.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0"><Brain className="w-5 h-5 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{memory.title}</div>
                    <div className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(memory.created_at), { addSuffix: true })}</div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">{memory.memory_type}</span>
                </div>
              )) : <div className="text-center py-8"><Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No memories yet</p></div>}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="glass-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-500" />Today&apos;s Activity</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end justify-between h-40 gap-2">
              {[6, 8, 5, 9, 12, 7, 10, 15, 8, 6, 4, 2].map((h, i) => (
                <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h * 10}px` }} transition={{ delay: i * 0.05 }} className="flex-1 rounded-t-lg bg-gradient-to-t from-primary/50 to-primary" />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground"><span>6AM</span><span>12PM</span><span>6PM</span></div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
