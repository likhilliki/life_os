'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Brain, LayoutDashboard, Network, Calendar, Target, BookOpen,
  MessageSquare, Upload, Settings, BarChart3, Bell, Search, Menu,
  LogOut, Moon, Sun, ChevronLeft, Sparkles, Gauge, Bug,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useTheme } from 'next-themes';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Network, label: 'Knowledge Graph', href: '/graph' },
  { icon: Calendar, label: 'Timeline', href: '/timeline' },
  { icon: Target, label: 'Goals', href: '/goals' },
  { icon: BookOpen, label: 'Decisions', href: '/decisions' },
  { icon: MessageSquare, label: 'AI Chat', href: '/chat' },
  { icon: Gauge, label: 'Evaluation', href: '/evaluation' },
  { icon: Bug, label: 'Pipeline Debug', href: '/pipeline' },
  { icon: Upload, label: 'Add Memory', href: '/upload' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkUser();

    // Keyboard shortcut for quick search
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }
    if (session.user) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (profile) setUser(profile);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    router.push('/');
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background flex">
      <motion.aside initial={false} animate={{ width: sidebarCollapsed ? 80 : 260 }}
        className="fixed left-0 top-0 bottom-0 z-50 bg-card/50 backdrop-blur-xl border-r border-border flex flex-col">
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2">
            <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
              <Brain className="w-8 h-8 text-primary" />
            </motion.div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="text-lg font-bold gradient-text whitespace-nowrap overflow-hidden">
                  LifeOS
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden lg:flex">
            <ChevronLeft className={cn('w-4 h-4 transition-transform', sidebarCollapsed && 'rotate-180')} />
          </Button>
        </div>

        {!sidebarCollapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 py-3">
            <button
              onClick={() => setCommandOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-muted-foreground text-sm hover:bg-muted transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Quick Search</span>
              <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">K</kbd>
            </button>
          </motion.div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative',
                pathname === item.href
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {pathname === item.href && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
              )}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-border space-y-1">
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
              pathname === '/settings'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <Settings className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Settings</span>}
          </Link>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            {theme === 'dark' ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
            {!sidebarCollapsed && <span className="text-sm font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <div className="flex items-center gap-3 px-3 py-2 mt-2 border-t border-border pt-4">
            <Avatar className="w-9 h-9">
              <AvatarImage src={user?.avatar_url || ''} />
              <AvatarFallback className="bg-primary/20 text-primary text-sm">
                {user?.full_name?.split(' ').map((n) => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            {!sidebarCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{user?.full_name || 'User'}</div>
                  <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="shrink-0"><LogOut className="w-4 h-4" /></Button>
              </>
            )}
          </div>
        </div>
      </motion.aside>

      <motion.main initial={false} animate={{ marginLeft: sidebarCollapsed ? 80 : 260 }} className="flex-1 min-h-screen">
        <header className="sticky top-0 z-40 h-16 bg-background/80 backdrop-blur-xl border-b border-border px-6 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="lg:hidden"><Menu className="w-5 h-5" /></Button>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm">
              <Sparkles className="w-4 h-4" /><span>AI Active</span>
            </div>
            <Button variant="ghost" size="icon" className="relative"><Bell className="w-5 h-5" /><span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" /></Button>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </motion.main>

      {/* Quick Search Command Dialog */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Search pages..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigate">
            {navItems.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => {
                  router.push(item.href);
                  setCommandOpen(false);
                }}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </CommandItem>
            ))}
            <CommandItem
              onSelect={() => {
                router.push('/settings');
                setCommandOpen(false);
              }}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
