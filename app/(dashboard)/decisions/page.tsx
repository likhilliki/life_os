'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BookOpen, Plus, Search, Scale, Calendar, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { format } from 'date-fns';
import { toast } from 'sonner';

const schema = z.object({ title: z.string().min(1), context: z.string().optional(), decision: z.string().min(1), reasoning: z.string().optional(), impact: z.enum(['low', 'medium', 'high', 'critical']).optional(), confidence: z.coerce.number().min(0).max(100).optional() });
type Form = z.infer<typeof schema>;
const impactColors: Record<string, string> = { low: '#10B981', medium: '#F59E0B', high: '#F97316', critical: '#EF4444' };

export default function DecisionsPage() {
  const { user } = useAuthStore();
  const [decisions, setDecisions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  useEffect(() => { if (user) fetchDecisions(); }, [user]);

  const fetchDecisions = async () => {
    const { data } = await supabase.from('decisions').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
    if (data) setDecisions(data);
  };

  const onSubmit = async (formData: Form) => {
    await supabase.from('decisions').insert({ ...formData, user_id: user!.id });
    setDialogOpen(false); reset(); fetchDecisions(); toast.success('Decision logged');
  };

  const deleteDecision = async (id: string) => { await supabase.from('decisions').delete().eq('id', id); fetchDecisions(); };

  const filtered = decisions.filter((d) => d.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold flex items-center gap-2"><BookOpen className="w-8 h-8 text-primary" />Decision Journal</h1><p className="text-muted-foreground">Never forget why you made a choice</p></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button variant="glow"><Plus className="w-4 h-4 mr-2" />New Decision</Button></DialogTrigger>
          <DialogContent className="glass-card max-w-lg">
            <DialogHeader><DialogTitle>Log a Decision</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div><Label>Title</Label><Input {...register('title')} placeholder="Key decision" /></div>
              <div><Label>Context</Label><textarea {...register('context')} className="w-full rounded-lg border p-3 min-h-[80px]" /></div>
              <div><Label>Decision</Label><textarea {...register('decision')} className="w-full rounded-lg border p-3 min-h-[60px]" /></div>
              <div><Label>Reasoning</Label><textarea {...register('reasoning')} className="w-full rounded-lg border p-3 min-h-[60px]" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Impact</Label>
                  <Select onValueChange={(v) => setValue('impact', v as any)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="critical">Critical</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Confidence</Label><Input {...register('confidence')} type="number" /></div>
              </div>
              <DialogFooter><Button type="submit">Save</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search decisions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="grid gap-4">
        {filtered.length === 0 ? <div className="text-center py-12"><Scale className="w-16 h-16 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No decisions logged</p></div> : filtered.map((d, i) => (
          <Card key={d.id} className="glass-card card-hover">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{d.title}</h3>
                    {d.impact && <Badge style={{ backgroundColor: impactColors[d.impact] + '20', color: impactColors[d.impact] }}>{d.impact}</Badge>}
                  </div>
                  <p className="font-medium text-primary mb-2">{d.decision}</p>
                  {d.reasoning && <p className="text-sm text-muted-foreground mb-3">{d.reasoning}</p>}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(d.created_at), 'MMM d, yyyy')}</span>
                    <span>Confidence: {d.confidence}%</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteDecision(d.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
