import { StateCreator } from 'zustand';
import { AuthSlice, LoginPayload, AuthStatus } from './auth.types';
import { AppState } from '@/stores/types';
import { getAccessToken, setTokens, clearTokens } from '@/lib/auth/token';

export const createAuthSlice: StateCreator<
  AppState,
  [['zustand/devtools', never], ['zustand/persist', unknown]],
  [],
  AuthSlice
> = (set, get) => ({
  status: 'idle',
  user: null,
  profile: null,
  accessToken: null,
  error: null,

  login: (payload: LoginPayload) => {
    const { user, accessToken, refreshToken, profile } = payload;
    
    // 1. Side Effects: Set Tokens
    setTokens(accessToken, refreshToken || '');
    
    // 2. State Update: Atomic update of all auth properties
    set({ 
      status: 'authenticated', 
      user, 
      accessToken, 
      profile: profile || null, 
      error: null 
    });
  },

  logout: () => {
    // 1. Side Effects: Clear Tokens
    clearTokens();
    
    // 2. State Update: Reset to initial state
    set({ 
      status: 'unauthenticated', 
      user: null, 
      profile: null, 
      accessToken: null,
      error: null
    });
  },

  hydrate: () => {
    // This function checks purely for the existence of a token to allow optimistic UI or fast-path
    // However, the real source of truth is the user object which is persisted.
    // If we have a token but no user, we might want to trigger a profile fetch (handled by hooks usually)
    // or set status to 'checking'.
    
    const token = getAccessToken();
    const { user, status } = get();

    if (token) {
        // If we are already authenticated, do nothing to avoid churn
        if (status === 'authenticated' && user) return;

        // If we have a user from persistence but status was idle, restore it
        if (user) {
             set({ status: 'authenticated', accessToken: token });
        } else {
            // Token exists, but no user. We are strictly 'checking'.
            // The consuming hook (useProfile) should see this and fetch the user.
            set({ status: 'checking', accessToken: token });
        }
    } else {
        set({ status: 'unauthenticated', accessToken: null, user: null, profile: null });
    }
  },

  setProfile: (profile) => {
    const { user } = get();
    // Only allow setting profile if we have a user (safety check)
    if (user) {
        set({ profile });
    }
  },

  updateUser: (updates) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, ...updates } });
    }
  },

  setError: (error) => set({ error, status: 'error' }),
});
