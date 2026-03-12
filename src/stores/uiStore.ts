import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  adminSidebarOpen: boolean;
  setAdminSidebarOpen: (open: boolean) => void;
  toggleAdminSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  adminSidebarOpen: false,
  setAdminSidebarOpen: (open) => set({ adminSidebarOpen: open }),
  toggleAdminSidebar: () => set((state) => ({ adminSidebarOpen: !state.adminSidebarOpen })),
}));
