'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, File, FileText, Link as LinkIcon, X, CheckCircle, AlertCircle, Loader2, Brain, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'sonner';

const schema = z.object({ title: z.string().min(1), content: z.string().optional(), memory_type: z.enum(['note', 'idea', 'document', 'url']), tags: z.string().optional() });
type Form = z.infer<typeof schema>;

interface UploadingFile { id: string; name: string; progress: number; status: 'uploading' | 'processing' | 'complete' | 'error'; }

export default function UploadPage() {
  const { user } = useAuthStore();
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [activeTab, setActiveTab] = useState<'file' | 'note' | 'url'>('file');
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { memory_type: 'note' } });

  const uploadFile = async (file: File) => {
    const id = Math.random().toString(36).slice(2);
    setFiles((p) => [...p, { id, name: file.name, progress: 0, status: 'uploading' }]);
    try {
      const path = `${user!.id}/${id}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('memories').upload(path, file);
      if (uploadError) throw uploadError;
      setFiles((p) => p.map((f) => f.id === id ? { ...f, status: 'processing', progress: 50 } : f));
      await supabase.from('memories').insert({ user_id: user!.id, title: file.name, content: `Uploaded: ${file.name}`, memory_type: 'document', metadata: { file_path: path } });
      setFiles((p) => p.map((f) => f.id === id ? { ...f, status: 'complete', progress: 100 } : f));
      toast.success(`Processed: ${file.name}`);
    } catch { setFiles((p) => p.map((f) => f.id === id ? { ...f, status: 'error' } : f)); toast.error('Upload failed'); }
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); Array.from(e.dataTransfer.files).forEach(uploadFile); }, [user]);
  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => { Array.from(e.target.files || []).forEach(uploadFile); e.target.value = ''; };

  const onSubmitNote = async (data: Form) => {
    await supabase.from('memories').insert({ user_id: user!.id, title: data.title, content: data.content, memory_type: data.memory_type, tags: data.tags?.split(',').map((t) => t.trim()).filter(Boolean) });
    toast.success('Memory saved!'); reset();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div><h1 className="text-3xl font-bold flex items-center gap-2"><Upload className="w-8 h-8 text-primary" />Add Memory</h1><p className="text-muted-foreground mt-1">Upload files, notes, or URLs</p></div>

      <div className="flex gap-2 border-b border-border pb-4">
        {(['file', 'note', 'url'] as const).map((t) => (
          <Button key={t} variant={activeTab === t ? 'default' : 'ghost'} onClick={() => setActiveTab(t)} className="capitalize gap-2">
            {t === 'file' && <Upload className="w-4 h-4" />}
            {t === 'note' && <FileText className="w-4 h-4" />}
            {t === 'url' && <LinkIcon className="w-4 h-4" />}
            {t}
          </Button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'file' && (
          <motion.div key="file" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <Card className="glass-card"><CardContent className="p-8">
              <div onDrop={onDrop} onDragOver={(e) => e.preventDefault()} className="border-2 border-dashed border-border rounded-2xl p-12 text-center hover:border-primary/50 transition-colors">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4"><Upload className="w-8 h-8 text-primary" /></div>
                <p className="text-lg font-medium mb-1">Drag files here or click to browse</p>
                <p className="text-sm text-muted-foreground mb-4">PDF, DOCX, images supported</p>
                <Input type="file" multiple className="hidden" id="file-upload" onChange={onFileSelect} />
                <Button asChild variant="outline"><label htmlFor="file-upload" className="cursor-pointer">Select Files</label></Button>
              </div>
              {files.length > 0 && <div className="mt-6 space-y-3">{files.map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                  {f.status === 'complete' ? <CheckCircle className="w-5 h-5 text-green-500" /> : f.status === 'error' ? <AlertCircle className="w-5 h-5 text-destructive" /> : <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                  <div className="flex-1"><div className="font-medium text-sm">{f.name}</div><div className="h-1.5 bg-muted rounded-full mt-1"><motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${f.progress}%` }} /></div></div>
                  <Button variant="ghost" size="icon" onClick={() => setFiles((p) => p.filter((x) => x.id !== f.id))}><X className="w-4 h-4" /></Button>
                </div>
              ))}</div>}
            </CardContent></Card>
          </motion.div>
        )}

        {activeTab === 'note' && (
          <motion.div key="note" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <Card className="glass-card"><CardHeader><CardTitle className="flex items-center gap-2"><Brain className="w-5 h-5 text-primary" />Create Memory</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmitNote)} className="space-y-4">
                  <div><Label>Title</Label><Input {...register('title')} placeholder="What's on your mind?" /></div>
                  <div><Label>Content</Label><textarea {...register('content')} className="w-full rounded-lg border p-3 min-h-[150px]" placeholder="Write your note..." /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Type</Label>
                      <Select value={watch('memory_type')} onValueChange={(v) => setValue('memory_type', v as any)}><SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="note">Note</SelectItem><SelectItem value="idea">Idea</SelectItem><SelectItem value="document">Document</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div><Label>Tags</Label><Input {...register('tags')} placeholder="work, ideas" /></div>
                  </div>
                  <Button type="submit" variant="glow" className="w-full"><Sparkles className="w-4 h-4 mr-2" />Save to Memory</Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'url' && (
          <motion.div key="url" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <Card className="glass-card"><CardHeader><CardTitle className="flex items-center gap-2"><LinkIcon className="w-5 h-5 text-primary" />Save URL</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(async (data) => { await supabase.from('memories').insert({ user_id: user!.id, title: data.title, content: data.content, memory_type: 'url' }); toast.success('URL saved!'); reset(); })} className="space-y-4">
                  <div><Label>URL</Label><Input {...register('content')} placeholder="https://..." /></div>
                  <div><Label>Title</Label><Input {...register('title')} placeholder="Link title" /></div>
                  <Button type="submit" variant="glow" className="w-full">Save URL</Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
