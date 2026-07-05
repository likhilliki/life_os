export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          memory_health_score: number;
          created_at: string;
          updated_at: string;
          onboarding_completed: boolean;
          theme_preference: string;
          ai_insights_enabled: boolean;
          weekly_digest: boolean;
          memory_retention_days: number;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          memory_health_score?: number;
          created_at?: string;
          updated_at?: string;
          onboarding_completed?: boolean;
          theme_preference?: string;
          ai_insights_enabled?: boolean;
          weekly_digest?: boolean;
          memory_retention_days?: number;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          memory_health_score?: number;
          created_at?: string;
          updated_at?: string;
          onboarding_completed?: boolean;
          theme_preference?: string;
          ai_insights_enabled?: boolean;
          weekly_digest?: boolean;
          memory_retention_days?: number;
        };
      };
      memories: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string | null;
          memory_type: string;
          metadata: Json;
          importance_score: number;
          created_at: string;
          updated_at: string;
          archived: boolean;
          tags: string[];
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          content?: string | null;
          memory_type?: string;
          metadata?: Json;
          importance_score?: number;
          created_at?: string;
          updated_at?: string;
          archived?: boolean;
          tags?: string[];
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string | null;
          memory_type?: string;
          metadata?: Json;
          importance_score?: number;
          created_at?: string;
          updated_at?: string;
          archived?: boolean;
          tags?: string[];
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          status: string;
          progress: number;
          target_date: string | null;
          completed_at: string | null;
          priority: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          status?: string;
          progress?: number;
          target_date?: string | null;
          completed_at?: string | null;
          priority?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          status?: string;
          progress?: number;
          target_date?: string | null;
          completed_at?: string | null;
          priority?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          status: string;
          color: string;
          icon: string | null;
          start_date: string;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          status?: string;
          color?: string;
          icon?: string | null;
          start_date?: string;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          status?: string;
          color?: string;
          icon?: string | null;
          start_date?: string;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          goal_id: string | null;
          title: string;
          description: string | null;
          status: string;
          priority: number;
          due_date: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          goal_id?: string | null;
          title: string;
          description?: string | null;
          status?: string;
          priority?: number;
          due_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          goal_id?: string | null;
          title?: string;
          description?: string | null;
          status?: string;
          priority?: number;
          due_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      decisions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          context: string | null;
          decision: string;
          reasoning: string | null;
          alternatives: Json;
          outcome: string | null;
          impact: string | null;
          confidence: number;
          created_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          context?: string | null;
          decision: string;
          reasoning?: string | null;
          alternatives?: Json;
          outcome?: string | null;
          impact?: string | null;
          confidence?: number;
          created_at?: string;
          reviewed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          context?: string | null;
          decision?: string;
          reasoning?: string | null;
          alternatives?: Json;
          outcome?: string | null;
          impact?: string | null;
          confidence?: number;
          created_at?: string;
          reviewed_at?: string | null;
        };
      };
      insights: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          content: string;
          category: string | null;
          actionable: boolean;
          dismissed: boolean;
          importance: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          content: string;
          category?: string | null;
          actionable?: boolean;
          dismissed?: boolean;
          importance?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          content?: string;
          category?: string | null;
          actionable?: boolean;
          dismissed?: boolean;
          importance?: number;
          created_at?: string;
        };
      };
      connections: {
        Row: {
          id: string;
          user_id: string;
          source_id: string;
          target_id: string;
          relationship_type: string;
          strength: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_id: string;
          target_id: string;
          relationship_type: string;
          strength?: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_id?: string;
          target_id?: string;
          relationship_type?: string;
          strength?: number;
          metadata?: Json;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string | null;
          read: boolean;
          actionable: boolean;
          link: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message?: string | null;
          read?: boolean;
          actionable?: boolean;
          link?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string | null;
          read?: boolean;
          actionable?: boolean;
          link?: string | null;
          created_at?: string;
        };
      };
      files: {
        Row: {
          id: string;
          user_id: string;
          memory_id: string | null;
          name: string;
          original_name: string;
          mime_type: string;
          size: number;
          storage_path: string;
          processed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          memory_id?: string | null;
          name: string;
          original_name: string;
          mime_type: string;
          size: number;
          storage_path: string;
          processed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          memory_id?: string | null;
          name?: string;
          original_name?: string;
          mime_type?: string;
          size?: number;
          storage_path?: string;
          processed?: boolean;
          created_at?: string;
        };
      };
      connected_apps: {
        Row: {
          id: string;
          user_id: string;
          app_name: string;
          app_type: string;
          connected_at: string;
          last_sync: string | null;
          status: string;
          config: Json;
        };
        Insert: {
          id?: string;
          user_id: string;
          app_name: string;
          app_type: string;
          connected_at?: string;
          last_sync?: string | null;
          status?: string;
          config?: Json;
        };
        Update: {
          id?: string;
          user_id?: string;
          app_name?: string;
          app_type?: string;
          connected_at?: string;
          last_sync?: string | null;
          status?: string;
          config?: Json;
        };
      };
      memory_access_logs: {
        Row: {
          id: string;
          user_id: string;
          memory_id: string | null;
          action: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          memory_id?: string | null;
          action: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          memory_id?: string | null;
          action?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      memory_type:
        | 'note'
        | 'document'
        | 'email'
        | 'meeting'
        | 'task'
        | 'goal'
        | 'project'
        | 'file'
        | 'url'
        | 'idea'
        | 'decision'
        | 'contact'
        | 'event';
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
