import { StateCreator } from 'zustand';
import { AppState } from './types';

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

export type UiSlice = UiState & UiActions;

export const createUiSlice: StateCreator<
  AppState,
  [['zustand/devtools', never], ['zustand/persist', unknown]],
  [],
  UiSlice
> = (set) => ({
  theme: 'light',
  isSidebarOpen: false,
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
});
