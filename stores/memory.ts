import { create } from 'zustand';
import type { Memory, Insight, Goal, Project } from '@/types/database';

interface MemoryState {
  memories: Memory[];
  insights: Insight[];
  goals: Goal[];
  projects: Project[];
  memoryHealthScore: number;
  totalMemories: number;
  setMemories: (memories: Memory[]) => void;
  addMemory: (memory: Memory) => void;
  updateMemory: (id: string, updates: Partial<Memory>) => void;
  deleteMemory: (id: string) => void;
  setInsights: (insights: Insight[]) => void;
  dismissInsight: (id: string) => void;
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setMemoryHealthScore: (score: number) => void;
  setTotalMemories: (count: number) => void;
}

export const useMemoryStore = create<MemoryState>((set) => ({
  memories: [],
  insights: [],
  goals: [],
  projects: [],
  memoryHealthScore: 0,
  totalMemories: 0,
  setMemories: (memories) => set({ memories }),
  addMemory: (memory) =>
    set((state) => ({ memories: [memory, ...state.memories] })),
  updateMemory: (id, updates) =>
    set((state) => ({
      memories: state.memories.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),
  deleteMemory: (id) =>
    set((state) => ({
      memories: state.memories.filter((m) => m.id !== id),
    })),
  setInsights: (insights) => set({ insights }),
  dismissInsight: (id) =>
    set((state) => ({
      insights: state.insights.map((i) =>
        i.id === id ? { ...i, dismissed: true } : i
      ),
    })),
  setGoals: (goals) => set({ goals }),
  addGoal: (goal) => set((state) => ({ goals: [goal, ...state.goals] })),
  updateGoal: (id, updates) =>
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    })),
  deleteGoal: (id) =>
    set((state) => ({
      goals: state.goals.filter((g) => g.id !== id),
    })),
  setProjects: (projects) => set({ projects }),
  addProject: (project) =>
    set((state) => ({ projects: [project, ...state.projects] })),
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),
  deleteProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
    })),
  setMemoryHealthScore: (memoryHealthScore) => set({ memoryHealthScore }),
  setTotalMemories: (totalMemories) => set({ totalMemories }),
}));
