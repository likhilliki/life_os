'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format, isToday, isYesterday, isThisWeek, parseISO } from 'date-fns';
import { Calendar, Filter, Search, FileText, File, Clock, Plus, List, Grid, MoreHorizontal, Tag, Eye, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { Memory } from '@/types/database';

const typeColors: Record<string, string> = { note: '#3B82F6', document: '#10B981', idea: '#F59E0B', goal: '#EC4899' };

function groupByDate(memories: Memory[]) {
  const groups: Record<string, Memory[]> = {};
  memories.forEach((m) => {
    const date = parseISO(m.created_at);
    const key = isToday(date) ? 'Today' : isYesterday(date) ? 'Yesterday' : isThisWeek(date) ? 'This Week' : format(date, 'MMMM yyyy');
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });
  return groups;
}

export default function TimelinePage() {
  const { user } = useAuthStore();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => { if (user) fetchMemories(); }, [user]);

  const fetchMemories = async () => {
    const { data } = await supabase.from('memories').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
    if (data) setMemories(data);
    setLoading(false);
  };

  const filtered = memories.filter((m) => (!search || m.title.toLowerCase().includes(search.toLowerCase())) && (typeFilter === 'all' || m.memory_type === typeFilter));
  const grouped = groupByDate(filtered);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold flex items-center gap-2"><Calendar className="w-8 h-8 text-primary" />Timeline</h1><p className="text-muted-foreground mt-1">Chronicle of your memory</p></div>
        <Button variant="glow"><Plus className="w-4 h-4 mr-2" />Add Memory</Button>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search memories..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="note">Notes</SelectItem>
            <SelectItem value="idea">Ideas</SelectItem>
            <SelectItem value="goal">Goals</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? <div className="text-center py-20">Loading...</div> : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-20"><Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">No memories yet</p></div>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <h2 className="text-xl font-semibold mb-4 sticky top-[68px] py-2 bg-background/80 backdrop-blur-lg z-10">{group}</h2>
              <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                {items.map((m, i) => (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                    <Card className="glass-card card-hover">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: (typeColors[m.memory_type] || '#3B82F6') + '20' }}>
                            <FileText className="w-5 h-5" style={{ color: typeColors[m.memory_type] || '#3B82F6' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{m.title}</h3>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs capitalize">{m.memory_type}</Badge>
                              <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto"><Clock className="w-3 h-3" />{format(parseISO(m.created_at), 'h:mm a')}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
