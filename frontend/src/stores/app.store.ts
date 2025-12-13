import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createAuthSlice } from '@/features/auth/stores/auth.slice';
import { createUiSlice } from './ui.slice';
import { AppState } from '@/stores/types';
import { persistConfig } from './middleware';

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (...a) => ({
        ...createAuthSlice(...a),
        ...createUiSlice(...a),
      }),
      {
        name: 'rumi-app-storage',
        // Merge partializers from config
        partialize: (state) => ({
          ...persistConfig.auth.partialize(state),
          ...persistConfig.ui.partialize(state),
        }),
      }
    ),
    { name: 'RumiAppStore' }
  )
);
