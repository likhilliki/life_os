export type MemoryType =
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

export type GoalStatus = 'active' | 'completed' | 'paused' | 'abandoned';
export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'archived';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Profile {
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
}

export interface Memory {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  memory_type: MemoryType;
  metadata: Record<string, unknown>;
  importance_score: number;
  created_at: string;
  updated_at: string;
  archived: boolean;
  tags: string[];
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: GoalStatus;
  progress: number;
  target_date: string | null;
  completed_at: string | null;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  color: string;
  icon: string | null;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  project_id: string | null;
  goal_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: number;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Decision {
  id: string;
  user_id: string;
  title: string;
  context: string | null;
  decision: string;
  reasoning: string | null;
  alternatives: unknown[];
  outcome: string | null;
  impact: ImpactLevel | null;
  confidence: number;
  created_at: string;
  reviewed_at: string | null;
}

export interface Insight {
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
}

export interface Connection {
  id: string;
  user_id: string;
  source_id: string;
  target_id: string;
  relationship_type: string;
  strength: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  actionable: boolean;
  link: string | null;
  created_at: string;
}

export interface File {
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
}

export interface ConnectedApp {
  id: string;
  user_id: string;
  app_name: string;
  app_type: string;
  connected_at: string;
  last_sync: string | null;
  status: string;
  config: Record<string, unknown>;
}

export interface MemoryAccessLog {
  id: string;
  user_id: string;
  memory_id: string | null;
  action: string;
  created_at: string;
}

export interface GraphNode {
  id: string;
  type: MemoryType;
  title: string;
  content?: string;
  importance?: number;
  created_at: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  strength: number;
}
