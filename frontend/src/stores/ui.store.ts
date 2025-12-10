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

/**
 * ================================================================================
 * README: UI Store (ui.store.ts)
 * ================================================================================
 *
 * OVERVIEW:
 * ---------
 * Simple global UI state for theme and sidebar visibility.
 * No persistence - resets to defaults on page refresh.
 *
 * STATE:
 * ------
 * | Field         | Type           | Purpose                   |
 * |---------------|----------------|---------------------------|
 * | theme         | 'light'|'dark' | Current color theme       |
 * | isSidebarOpen | boolean        | Sidebar visibility state  |
 *
 * ACTIONS:
 * --------
 * | Action         | Description                    |
 * |----------------|--------------------------------|
 * | setTheme()     | Set theme to light or dark     |
 * | toggleSidebar()| Toggle sidebar open/closed     |
 *
 * USAGE:
 * ------
 * ```typescript
 * import { useUiStore } from '@/stores/ui.store';
 *
 * const { theme, setTheme, isSidebarOpen, toggleSidebar } = useUiStore();
 *
 * setTheme('dark');
 * toggleSidebar();
 * ```
 *
 * ================================================================================
 */

