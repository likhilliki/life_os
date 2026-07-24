'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Brain, Sparkles, Loader2, Bot, User, FileText, Target, BookOpen, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/auth';
import { supabase } from '@/lib/supabase';

interface Source {
  id: string;
  title: string;
  type: string;
  tags: string[];
  created_at: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Source[];
  confidence?: number;
  grounded?: boolean;
  isTyping?: boolean;
}

const suggestions = [
  'What projects have I been working on?',
  'Who did I meet with this week?',
  'What goals am I behind on?',
  'Summarize everything I learned about AI.',
];

const typeIcon = (type: string) => {
  switch (type) {
    case 'goal': return Target;
    case 'decision': return BookOpen;
    default: return FileText;
  }
};

export default function ChatPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const animateTyping = (messageId: string, fullText: string, sources?: Source[], confidence?: number, grounded?: boolean) => {
    let i = 0;
    const chunkSize = Math.max(2, Math.ceil(fullText.length / 80));
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);

    typingTimerRef.current = setInterval(() => {
      i += chunkSize;
      if (i >= fullText.length) {
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, content: fullText, isTyping: false, sources, confidence, grounded }
              : m
          )
        );
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, content: fullText.slice(0, i), isTyping: true } : m
          )
        );
      }
    }, 16);
  };

  const sendMessage = async (text?: string) => {
    const queryText = text || input.trim();
    if (!queryText || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: queryText,
      timestamp: new Date(),
    };
    setMessages((p) => [...p, userMessage]);
    setInput('');
    setLoading(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages((p) => [...p, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true,
    }]);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        animateTyping(assistantId, 'Your session expired. Please sign in again to use the chat.');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/rag-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          },
          body: JSON.stringify({
            question: queryText,
            history: messages
              .filter((m) => !m.isTyping)
              .slice(-6)
              .map((m) => ({ role: m.role, content: m.content })),
          }),
        }
      );

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || `Request failed (${response.status})`);
      }

      const data = await response.json();
      if (!data || typeof data.answer !== 'string') {
        throw new Error('Unexpected response from the server.');
      }

      animateTyping(
        assistantId,
        data.answer,
        data.sources,
        data.confidence,
        data.grounded
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      animateTyping(assistantId, `I ran into a problem retrieving that: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => { if (typingTimerRef.current) clearInterval(typingTimerRef.current); };
  }, []);

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-primary" />AI Chat
          </h1>
          <p className="text-muted-foreground">Ask about your memories — answers are grounded in your saved data</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setMessages([])}
          disabled={loading || messages.length === 0}
        >
          Clear
        </Button>
      </div>

      <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 scroll-smooth">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mb-6"
              >
                <Brain className="w-10 h-10 text-primary" />
              </motion.div>
              <h2 className="text-xl font-semibold mb-2">Ask Me Anything</h2>
              <p className="text-muted-foreground mb-8">I search your memories and verify the answer against what I found</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl">
                {suggestions.map((s, i) => (
                  <motion.div
                    key={s}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Button
                      variant="outline"
                      className="h-auto py-3 px-4 text-left justify-start w-full"
                      onClick={() => sendMessage(s)}
                    >
                      {s}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className={msg.role === 'assistant' ? 'bg-primary/20 shrink-0' : 'shrink-0'}>
                      <AvatarFallback>
                        {msg.role === 'assistant' ? <Bot className="w-4 h-4 text-primary" /> : <User className="w-4 h-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 min-w-0 ${msg.role === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block max-w-[85%] text-left ${msg.role === 'user' ? 'text-right' : ''}`}>
                        <Card className={`glass-card ${msg.role === 'user' ? 'bg-primary/10' : ''}`}>
                          <CardContent className="p-4">
                            {msg.content === '' && msg.isTyping ? (
                              <div className="flex items-center gap-1.5 py-1">
                                <motion.span className="w-2 h-2 rounded-full bg-primary/60" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity }} />
                                <motion.span className="w-2 h-2 rounded-full bg-primary/60" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} />
                                <motion.span className="w-2 h-2 rounded-full bg-primary/60" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} />
                              </div>
                            ) : (
                              <div className="leading-relaxed whitespace-pre-wrap">
                                {msg.content}
                                {msg.isTyping && <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary/70 rounded-sm animate-pulse align-middle" />}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {msg.role === 'assistant' && !msg.isTyping && msg.sources && msg.sources.length > 0 && (
                          <SourceList sources={msg.sources} confidence={msg.confidence} grounded={msg.grounded} />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-4">
                  <Avatar className="bg-primary/20 shrink-0">
                    <AvatarFallback><Bot className="w-4 h-4 text-primary" /></AvatarFallback>
                  </Avatar>
                  <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Searching your memories...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border bg-muted/20">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            className="flex gap-3 max-w-4xl mx-auto"
          >
            <Input
              placeholder="Ask about your memories..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1"
              disabled={loading}
              autoComplete="off"
            />
            <Button
              type="submit"
              variant="glow"
              disabled={loading || !input.trim()}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function SourceList({ sources, confidence, grounded }: { sources: Source[]; confidence?: number; grounded?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.3 }}
      className="mt-2 ml-1"
    >
      <div className="flex items-center gap-2 flex-wrap mb-2">
        {grounded === true && (
          <Badge variant="outline" className="gap-1 text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
            <CheckCircle2 className="w-3 h-3" /> Verified
          </Badge>
        )}
        {grounded === false && (
          <Badge variant="outline" className="gap-1 text-amber-500 border-amber-500/30 bg-amber-500/10">
            <AlertCircle className="w-3 h-3" /> Low grounding
          </Badge>
        )}
        {typeof confidence === 'number' && (
          <Badge variant="outline" className="gap-1">
            <Sparkles className="w-3 h-3" /> {confidence}% confidence
          </Badge>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          {sources.length} source{sources.length !== 1 ? 's' : ''}
          <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1.5 overflow-hidden"
          >
            {sources.map((s, i) => {
              const Icon = typeIcon(s.type);
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2"
                >
                  <span className="text-muted-foreground/60 font-mono w-4">{i + 1}</span>
                  <Icon className="w-3.5 h-3.5 text-primary/70 shrink-0" />
                  <span className="truncate">{s.title}</span>
                  {s.tags.length > 0 && (
                    <span className="ml-auto text-muted-foreground/60 truncate">{s.tags.slice(0, 2).join(', ')}</span>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
