import { StateCreator } from 'zustand';
import { AuthSlice } from './auth.types';
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

  login: ({ user, accessToken, refreshToken, profile }) => {
    setTokens(accessToken, refreshToken || '');
    set({ 
      status: 'authenticated', 
      user, 
      accessToken, 
      profile: profile || null, 
      error: null 
    });
  },

  logout: () => {
    clearTokens();
    set({ 
      status: 'unauthenticated', 
      user: null, 
      profile: null, 
      accessToken: null,
      error: null
    });
    // Optional: Clear other stores or query cache here if logic permits
  },

  hydrate: () => {
    const token = getAccessToken();
    // We trust the token presence initially, but real validation happens via API usually.
    // If we have a token but no user, we might be in a 'checking' state or need to fetch profile.
    // For now, if we have a token, we assume checking until profile loads, or 'authenticated' if we persisted user.
    // The persist middleware handles 'user' restoration. 
    // This hydrate action is manually called to sync cookie existence.
    
    const { user } = get();
    if (token && user) {
        set({ status: 'authenticated', accessToken: token });
    } else if (token && !user) {
        // Token exists but no user data? We need to fetch it.
        set({ status: 'checking', accessToken: token });
    } else {
        set({ status: 'unauthenticated' });
    }
  },

  setProfile: (profile) => set({ profile }),

  updateUser: (updates) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, ...updates } });
    }
  },

  setError: (error) => set({ status: 'error', error }),
});
