'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Brain, Sparkles, Loader2, Bot, User, Copy, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase';

interface Message { id: string; role: 'user' | 'assistant'; content: string; timestamp: Date; }

const suggestions = ['What projects have I been working on?', 'Who did I meet with this week?', 'What goals am I behind on?', 'Summarize everything I learned about AI.'];

export default function ChatPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const sendMessage = async (text?: string) => {
    const queryText = text || input.trim();
    if (!queryText) return;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: queryText, timestamp: new Date() };
    setMessages((p) => [...p, userMessage]);
    setInput('');
    setLoading(true);

    await new Promise((r) => setTimeout(r, 1500));
    const { data } = await supabase.from('memories').select('*').eq('user_id', user!.id).limit(5);
    const memories = (data as { title: string }[]) || [];

    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: memories.length > 0 ? `Based on your memory, I found ${memories.length} relevant items. Recent: "${memories[0]?.title}". Would you like more details?` : 'I don\'t have enough memories yet. Add some to get better answers!',
      timestamp: new Date(),
    };
    setMessages((p) => [...p, aiResponse]);
    setLoading(false);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold flex items-center gap-2"><MessageSquare className="w-8 h-8 text-primary" />AI Chat</h1><p className="text-muted-foreground">Ask about your memories</p></div>
        <Button variant="outline" onClick={() => setMessages([])}>Clear</Button>
      </div>

      <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mb-6"><Brain className="w-10 h-10 text-primary" /></div>
              <h2 className="text-xl font-semibold mb-2">Ask Me Anything</h2>
              <p className="text-muted-foreground mb-8">Query your knowledge base</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl">
                {suggestions.map((s) => (<Button key={s} variant="outline" className="h-auto py-3 px-4 text-left justify-start" onClick={() => sendMessage(s)}>{s}</Button>))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <Avatar className={msg.role === 'assistant' ? 'bg-primary/20' : ''}>
                    <AvatarFallback>{msg.role === 'assistant' ? <Bot className="w-4 h-4 text-primary" /> : <User className="w-4 h-4" />}</AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <Card className={`inline-block max-w-[85%] text-left glass-card ${msg.role === 'user' ? 'bg-primary/10' : ''}`}><CardContent className="p-4"><p className="leading-relaxed">{msg.content}</p></CardContent></Card>
                  </div>
                </motion.div>
              ))}
              {loading && <div className="flex gap-4"><Avatar className="bg-primary/20"><AvatarFallback><Bot className="w-4 h-4 text-primary" /></AvatarFallback></Avatar><div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-primary" /><span className="text-sm">Searching...</span></div></div>}
            </div>
          )}
        </ScrollArea>
        <div className="p-4 border-t border-border bg-muted/20">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-3">
            <Input placeholder="Ask about your memories..." value={input} onChange={(e) => setInput(e.target.value)} className="flex-1" disabled={loading} />
            <Button type="submit" variant="glow" disabled={loading || !input.trim()}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
