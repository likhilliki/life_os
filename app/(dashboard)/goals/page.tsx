'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Target, Plus, Clock, CheckCircle2, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'sonner';

const goalSchema = z.object({ title: z.string().min(1), description: z.string().optional() });
type GoalForm = z.infer<typeof goalSchema>;

export default function GoalsPage() {
  const { user } = useAuthStore();
  const [goals, setGoals] = useState<{ id: string; title: string; status: string; progress: number }[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { register, handleSubmit, reset, formState } = useForm<GoalForm>({ resolver: zodResolver(goalSchema) });

  useEffect(() => { if (user) fetchGoals(); }, [user]);

  const fetchGoals = async () => {
    const { data } = await supabase.from('goals').select('id, title, status, progress').eq('user_id', user!.id).order('created_at', { ascending: false });
    if (data) setGoals(data);
  };

  const onSubmit = async (formData: GoalForm) => {
    await supabase.from('goals').insert({ ...formData, user_id: user!.id });
    setDialogOpen(false); reset(); fetchGoals(); toast.success('Goal created');
  };

  const updateProgress = async (id: string, progress: number) => {
    await supabase.from('goals').update({ progress, status: progress === 100 ? 'completed' : 'active' }).eq('id', id);
    fetchGoals();
  };

  const deleteGoal = async (id: string) => {
    await supabase.from('goals').delete().eq('id', id);
    fetchGoals();
  };

  const active = goals.filter((g) => g.status === 'active');
  const completed = goals.filter((g) => g.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold flex items-center gap-2"><Target className="w-8 h-8 text-primary" />Goals</h1><p className="text-muted-foreground mt-1">Track your progress</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button variant="glow"><Plus className="w-4 h-4 mr-2" />New Goal</Button></DialogTrigger>
          <DialogContent className="glass-card">
            <DialogHeader><DialogTitle>New Goal</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div><Label>Title</Label><Input {...register('title')} placeholder="Learn React" /></div>
              <div><Label>Description</Label><textarea {...register('description')} className="w-full rounded-lg border p-3 min-h-[80px]" /></div>
              <DialogFooter><Button type="submit">Save</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ icon: Clock, label: 'Active', value: active.length, color: 'text-primary' },
          { icon: CheckCircle2, label: 'Completed', value: completed.length, color: 'text-green-500' }].map((s) => (
          <Card key={s.label} className="glass-card"><CardContent className="p-6"><s.icon className={`w-5 h-5 ${s.color} mb-2`} /><div className="text-2xl font-bold">{s.value}</div><div className="text-sm text-muted-foreground">{s.label}</div></CardContent></Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="glass-card"><CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-primary" />Active</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {active.map((goal) => (
              <div key={goal.id} className="p-4 rounded-xl bg-muted/30 border">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium">{goal.title}</h3>
                  <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end"><DropdownMenuItem onClick={() => deleteGoal(goal.id)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem></DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${goal.progress}%` }} /></div>
                  <span className="text-sm">{goal.progress}%</span>
                </div>
                <div className="flex gap-2">{[25, 50, 75, 100].map((p) => (<Button key={p} variant={goal.progress >= p ? 'default' : 'outline'} size="sm" onClick={() => updateProgress(goal.id, p)}>{p}%</Button>))}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="glass-card"><CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" />Completed</CardTitle></CardHeader>
          <CardContent className="space-y-3">{completed.map((goal) => (<div key={goal.id} className="p-4 rounded-xl bg-muted/30 flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-green-500" /><span>{goal.title}</span></div>))}</CardContent></Card>
      </div>
    </div>
  );
}
