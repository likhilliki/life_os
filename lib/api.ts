import { supabase } from './supabase';

// Generic database operations with simplified types
export const db = {
  memories: {
    getAll: async (userId: string) => {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      return { data, error };
    },
    create: async (memory: Record<string, unknown>) => {
      const { data, error } = await supabase.from('memories').insert(memory).select().single();
      return { data, error };
    },
    update: async (id: string, updates: Record<string, unknown>) => {
      const { data, error } = await supabase.from('memories').update(updates).eq('id', id).select().single();
      return { data, error };
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('memories').delete().eq('id', id);
      return { error };
    },
  },
  goals: {
    getAll: async (userId: string) => {
      const { data, error } = await supabase.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      return { data, error };
    },
    create: async (goal: Record<string, unknown>) => {
      const { data, error } = await supabase.from('goals').insert(goal).select().single();
      return { data, error };
    },
    update: async (id: string, updates: Record<string, unknown>) => {
      const { data, error } = await supabase.from('goals').update(updates).eq('id', id).select().single();
      return { data, error };
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      return { error };
    },
  },
  decisions: {
    getAll: async (userId: string) => {
      const { data, error } = await supabase.from('decisions').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      return { data, error };
    },
    create: async (decision: Record<string, unknown>) => {
      const { data, error } = await supabase.from('decisions').insert(decision).select().single();
      return { data, error };
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('decisions').delete().eq('id', id);
      return { error };
    },
  },
  insights: {
    getAll: async (userId: string) => {
      const { data, error } = await supabase.from('insights').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      return { data, error };
    },
  },
  connections: {
    getAll: async (userId: string) => {
      const { data, error } = await supabase.from('connections').select('*').eq('user_id', userId);
      return { data, error };
    },
    create: async (connection: Record<string, unknown>) => {
      const { data, error } = await supabase.from('connections').insert(connection).select().single();
      return { data, error };
    },
  },
  projects: {
    getAll: async (userId: string) => {
      const { data, error } = await supabase.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      return { data, error };
    },
    create: async (project: Record<string, unknown>) => {
      const { data, error } = await supabase.from('projects').insert(project).select().single();
      return { data, error };
    },
  },
  profiles: {
    get: async (userId: string) => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      return { data, error };
    },
    update: async (userId: string, updates: Record<string, unknown>) => {
      const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single();
      return { data, error };
    },
  },
};
