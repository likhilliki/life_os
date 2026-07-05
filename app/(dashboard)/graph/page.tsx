'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, Node, Edge, MarkerType, Panel, NodeTypes } from 'reactflow';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Brain, Network, Search, RefreshCw, X, Lightbulb, Target, FileText, Calendar, CheckCircle2, FolderOpen, User, Briefcase, Link as LinkIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';

const typeColors: Record<string, string> = { note: '#3B82F6', idea: '#F59E0B', goal: '#EC4899', project: '#10B981', task: '#EF4444', document: '#8B5CF6', meeting: '#06B6D4', decision: '#F97316', contact: '#84CC16', email: '#14B8A6', url: '#6366F1' };
const typeIcons: Record<string, typeof FileText> = { note: FileText, idea: Lightbulb, goal: Target, project: FolderOpen, task: CheckCircle2, document: FileText, meeting: Calendar, decision: Briefcase, contact: User, email: FileText, url: LinkIcon };

const MemoryNode = ({ data }: { data: { label: string; type: string; onClick?: () => void } }) => {
  const config = typeColors[data.type] || '#3B82F6';
  const Icon = typeIcons[data.type] || Brain;
  return (
    <motion.div whileHover={{ scale: 1.05 }} onClick={data.onClick} className="relative cursor-pointer group">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: config + '20' }}>
        <Icon className="w-6 h-6" style={{ color: config }} />
      </div>
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full" style={{ backgroundColor: config }} />
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium bg-card px-2 py-1 rounded shadow-lg border border-border">
        {(data.label || '').slice(0, 20)}
      </div>
    </motion.div>
  );
};

const nodeTypes: NodeTypes = { memory: MemoryNode };

export default function GraphPage() {
  const { user } = useAuthStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { if (user) fetchGraph(); }, [user]);

  const fetchGraph = async () => {
    setLoading(true);
    const [memoriesRes, connectionsRes] = await Promise.all([
      supabase.from('memories').select('*').eq('user_id', user!.id).limit(100),
      supabase.from('connections').select('*').eq('user_id', user!.id),
    ]);
    const memories = memoriesRes.data || [];
    const connections = connectionsRes.data || [];

    const graphNodes: Node[] = memories.map((m, i) => {
      const angle = (i / memories.length) * 2 * Math.PI;
      const radius = 200 + Math.random() * 100;
      return { id: m.id, type: 'memory', position: { x: 400 + radius * Math.cos(angle), y: 300 + radius * Math.sin(angle) }, data: { label: m.title, type: m.memory_type } };
    });

    const graphEdges: Edge[] = connections.map((c) => ({ id: c.id, source: c.source_id, target: c.target_id, type: 'smoothstep', animated: true, style: { stroke: '#3B82F6', opacity: 0.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#3B82F6' } }));

    setNodes(graphNodes);
    setEdges(graphEdges);
    setLoading(false);
  };

  const filteredNodes = useMemo(() => nodes.filter((n) => !searchQuery || (n.data.label || '').toLowerCase().includes(searchQuery.toLowerCase())), [nodes, searchQuery]);

  return (
    <div className="space-y-6 h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold flex items-center gap-2"><Network className="w-8 h-8 text-primary" />Knowledge Graph</h1><p className="text-muted-foreground mt-1">Visualize connections</p></div>
        <Button variant="glow" onClick={fetchGraph}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search nodes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      <div className="relative flex-1 rounded-2xl border border-border overflow-hidden bg-muted/30 h-[600px]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center"><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><RefreshCw className="w-8 h-8 text-primary" /></motion.div></div>
        ) : nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center"><Network className="w-16 h-16 text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">No Memories Yet</h3><p className="text-muted-foreground">Add memories to see them visualized</p></div>
        ) : (
          <ReactFlow nodes={filteredNodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 50 }}>
            <Background color="#888" gap={20} size={1} />
            <Controls className="glass-card rounded-lg border border-border" />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
