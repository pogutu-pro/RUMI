import { create } from 'zustand';

interface UiState {
  theme: 'light' | 'dark';
  setTheme: (theme: UiState['theme']) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
  isSidebarOpen: false,
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
