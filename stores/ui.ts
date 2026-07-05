import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  commandMenuOpen: boolean;
  selectedNodeId: string | null;
  activeTab: string;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setCommandMenuOpen: (open: boolean) => void;
  setSelectedNodeId: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      theme: 'dark',
      commandMenuOpen: false,
      selectedNodeId: null,
      activeTab: 'dashboard',
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setTheme: (theme) => set({ theme }),
      setCommandMenuOpen: (commandMenuOpen) => set({ commandMenuOpen }),
      setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
      setActiveTab: (activeTab) => set({ activeTab }),
    }),
    {
      name: 'lifeos-ui',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);
