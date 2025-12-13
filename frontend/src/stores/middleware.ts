import { StateCreator, StoreMutatorIdentifier } from 'zustand';

// Middleware types helper
export type Middleware<
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
> = StateCreator<T, Mps, Mcs>;

// Logger middleware configuration (if needed custom, otherwise devtools handles it)
export const loggerConfig = {
  enabled: process.env.NODE_ENV === 'development',
};

// Persistence configuration
export const persistConfig = {
    auth: {
        name: 'rumi-auth-storage',
        // We only persist non-sensitive user profile data, NOT tokens (cookies handle that)
        partialize: (state: any) => ({
            user: state.user,
            profile: state.profile,
        }),
    },
    ui: {
        name: 'rumi-ui-storage',
        partialize: (state: any) => ({
            theme: state.theme,
            sidebarOpen: state.sidebarConfig?.isOpen ?? state.sidebarOpen, // Adapt based on actual shape
        }),
    }
};
