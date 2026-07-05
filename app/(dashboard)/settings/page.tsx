'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Settings, User, Shield, Bell, Palette, Moon, Sun, Laptop, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'sonner';

const profileSchema = z.object({ full_name: z.string().optional(), bio: z.string().optional() });
type ProfileForm = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState(user?.theme_preference || 'dark');

  const { register, handleSubmit } = useForm<ProfileForm>({ resolver: zodResolver(profileSchema), values: { full_name: user?.full_name || '', bio: user?.bio || '' } });

  const saveProfile = async (data: ProfileForm) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update(data).eq('id', user.id);
    setSaving(false);
    if (error) toast.error('Failed to update');
    else { toast.success('Updated'); setUser({ ...user, ...data }); }
  };

  const updateSettings = async (field: string, value: boolean) => {
    if (!user) return;
    await supabase.from('profiles').update({ [field]: value }).eq('id', user.id);
    setUser({ ...user, [field]: value });
    toast.success('Updated');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div><h1 className="text-3xl font-bold flex items-center gap-2"><Settings className="w-8 h-8 text-primary" />Settings</h1></div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="glass-card">
          <TabsTrigger value="profile" className="gap-2"><User className="w-4 h-4" />Profile</TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2"><Palette className="w-4 h-4" />Appearance</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="w-4 h-4" />Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="glass-card"><CardHeader><CardTitle>Profile</CardTitle><CardDescription>Update your details</CardDescription></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(saveProfile)} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div><Label>Full Name</Label><Input {...register('full_name')} /></div>
                  <div><Label>Email</Label><Input value={user?.email} disabled /></div>
                </div>
                <div><Label>Bio</Label><textarea {...register('bio')} className="w-full rounded-lg border p-3 min-h-[100px]" /></div>
                <Button type="submit" variant="glow" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card className="glass-card"><CardHeader><CardTitle>Theme</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {[{ id: 'light', icon: Sun, label: 'Light' }, { id: 'dark', icon: Moon, label: 'Dark' }, { id: 'system', icon: Laptop, label: 'System' }].map((t) => (
                  <Button key={t.id} variant={theme === t.id ? 'default' : 'outline'} onClick={() => setTheme(t.id)} className="h-auto py-6 flex-col gap-2"><t.icon className="w-6 h-6" /><span>{t.label}</span></Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="glass-card"><CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div><p className="font-medium">AI Insights</p><p className="text-sm text-muted-foreground">Daily AI insights</p></div>
                <Switch checked={user?.ai_insights_enabled} onCheckedChange={(v) => updateSettings('ai_insights_enabled', v)} />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="font-medium">Weekly Digest</p><p className="text-sm text-muted-foreground">Weekly summary</p></div>
                <Switch checked={user?.weekly_digest} onCheckedChange={(v) => updateSettings('weekly_digest', v)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
