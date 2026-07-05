'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { eachDayOfInterval, format, subDays } from 'date-fns';
import { BarChart3, TrendingUp, Brain, Network, Target, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#EF4444', '#06B6D4', '#84CC16'];

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, connections: 0, goals: 0, health: 78 });
  const [byType, setByType] = useState<{ name: string; value: number }[]>([]);
  const [growth, setGrowth] = useState<{ date: string; count: number }[]>([]);
  const [goalProgress, setGoalProgress] = useState<{ name: string; progress: number }[]>([]);

  useEffect(() => { if (user) fetchAnalytics(); }, [user]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const [memoriesRes, connectionsRes, goalsRes] = await Promise.all([
      supabase.from('memories').select('memory_type, created_at').eq('user_id', user!.id),
      supabase.from('connections').select('id').eq('user_id', user!.id),
      supabase.from('goals').select('title, progress').eq('user_id', user!.id).eq('status', 'active'),
    ]);

    const memories = (memoriesRes.data as { memory_type: string; created_at: string }[]) || [];
    setStats({ total: memories.length, connections: connectionsRes.data?.length || 0, goals: goalsRes.data?.length || 0, health: user?.memory_health_score || 78 });

    // By type
    const typeCounts: Record<string, number> = {};
    memories.forEach((m) => { typeCounts[m.memory_type] = (typeCounts[m.memory_type] || 0) + 1; });
    setByType(Object.entries(typeCounts).map(([name, value]) => ({ name, value })));

    // Growth
    const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
    const growthMap: Record<string, number> = {};
    days.forEach((d) => { growthMap[format(d, 'MMM d')] = 0; });
    memories.forEach((m) => { const date = format(new Date(m.created_at), 'MMM d'); if (growthMap[date] !== undefined) growthMap[date]++; });
    setGrowth(days.map((d) => ({ date: format(d, 'MMM d'), count: growthMap[format(d, 'MMM d')] })));

    // Goals
    const goals = (goalsRes.data as { title: string; progress: number }[]) || [];
    if (goals.length) setGoalProgress(goals.slice(0, 5).map((g) => ({ name: g.title.slice(0, 15), progress: g.progress })));

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold flex items-center gap-2"><BarChart3 className="w-8 h-8 text-primary" />Analytics</h1><p className="text-muted-foreground mt-1">Insights about your memory</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ icon: Brain, label: 'Total Memories', value: stats.total, color: 'text-primary' },
          { icon: Network, label: 'Connections', value: stats.connections, color: 'text-blue-500' },
          { icon: Target, label: 'Active Goals', value: stats.goals, color: 'text-yellow-500' },
          { icon: Activity, label: 'Memory Health', value: `${stats.health}%`, color: 'text-green-500' }].map((s) => (
          <Card key={s.label} className="glass-card card-hover"><CardContent className="p-6"><s.icon className={`w-5 h-5 ${s.color} mb-2`} /><div className="text-2xl font-bold">{s.value}</div><div className="text-sm text-muted-foreground">{s.label}</div></CardContent></Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="glass-card"><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />Memory Growth (30 Days)</CardTitle></CardHeader>
          <CardContent>{loading ? <div className="h-64 flex items-center justify-center">Loading...</div> :
            <ResponsiveContainer width="100%" height={250}><AreaChart data={growth}>
              <defs><linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3B82F6" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" /><XAxis dataKey="date" stroke="#888" tick={{ fontSize: 10 }} /><YAxis stroke="#888" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }} />
              <Area type="monotone" dataKey="count" stroke="#3B82F6" fillOpacity={1} fill="url(#colorCount)" />
            </AreaChart></ResponsiveContainer>}
          </CardContent>
        </Card>

        <Card className="glass-card"><CardHeader><CardTitle className="flex items-center gap-2"><Brain className="w-5 h-5 text-primary" />Memory Types</CardTitle></CardHeader>
          <CardContent>{loading ? <div className="h-64 flex items-center justify-center">Loading...</div> : byType.length === 0 ? <div className="h-64 flex items-center justify-center text-muted-foreground">No data</div> :
            <ResponsiveContainer width="100%" height={250}><PieChart>
              <Pie data={byType} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" label={({ name }) => name}>{byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie>
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }} />
            </PieChart></ResponsiveContainer>}
          </CardContent>
        </Card>

        <Card className="glass-card lg:col-span-2"><CardHeader><CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-yellow-500" />Goals Progress</CardTitle></CardHeader>
          <CardContent>{loading ? <div className="h-64 flex items-center justify-center">Loading...</div> : goalProgress.length === 0 ? <div className="h-64 flex items-center justify-center text-muted-foreground">No goals</div> :
            <ResponsiveContainer width="100%" height={200}><BarChart data={goalProgress} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" /><XAxis type="number" domain={[0, 100]} stroke="#888" /><YAxis dataKey="name" type="category" stroke="#888" width={120} tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }} />
              <Bar dataKey="progress" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart></ResponsiveContainer>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
