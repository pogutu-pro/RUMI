import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

export interface UiState {
  theme: 'light' | 'dark';
  isSidebarOpen: boolean;
  modals: Record<string, boolean>; // Map of modalId -> isOpen
}

export interface UiActions {
  setTheme: (theme: UiState['theme']) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
}

export type UiStore = UiState & UiActions;

export const useUiStore = create<UiStore>()(
  devtools(
    persist(
      (set) => ({
        theme: 'light',
        isSidebarOpen: true,
        modals: {},

        setTheme: (theme) => set({ theme }),
        toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
        setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
        
        openModal: (modalId) => set((state) => ({ 
          modals: { ...state.modals, [modalId]: true } 
        })),
        
        closeModal: (modalId) => set((state) => {
          const newModals = { ...state.modals };
          delete newModals[modalId];
          return { modals: newModals };
        }),
      }),
      {
        name: 'rumi-ui-storage',
        partialize: (state) => ({
          theme: state.theme,
          isSidebarOpen: state.isSidebarOpen,
        }),
      }
    ),
    { name: 'UiStore' }
  )
);

// -- Performance Selectors --
export const useTheme = () => useUiStore((s) => s.theme);
export const useIsSidebarOpen = () => useUiStore((s) => s.isSidebarOpen);
export const useModalState = (modalId: string) => useUiStore((s) => !!s.modals[modalId]);
