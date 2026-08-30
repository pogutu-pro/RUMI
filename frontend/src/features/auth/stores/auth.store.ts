import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { AuthSlice, LoginPayload, AuthStatus, UserRole } from './auth.types';
import { getAccessToken, setTokens, clearTokens, setOnboardingStage, setUserRole } from '@/lib/auth/token';

export const useAuthStore = create<AuthSlice>()(
  devtools(
    persist(
      (set, get) => ({
        status: 'idle',
        user: null,
        profile: null,
        accessToken: null,
        error: null,

        login: (payload: LoginPayload) => {
          const { user, accessToken, refreshToken, profile } = payload;

          setTokens(accessToken, refreshToken || '');
          if (user.role) setUserRole(user.role);
          if (user.onboarding_stage) setOnboardingStage(user.onboarding_stage);

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
        },

        hydrate: () => {
          const token = getAccessToken();
          const { user, status } = get();

          // A live authenticated session already in memory must never be
          // downgraded by a redundant hydrate() call (e.g. a re-mount racing
          // a moment after login() before it re-reads the cookie) — hydrate()
          // exists to initialize state from storage, not to re-derive it away
          // from a session that's already correctly established.
          if (status === 'authenticated' && user) return;

          if (token) {
            if (user) {
              set({ status: 'authenticated', accessToken: token });
            } else {
              set({ status: 'checking', accessToken: token });
            }
          } else {
            set({ status: 'unauthenticated', accessToken: null, user: null, profile: null });
          }
        },

        setProfile: (profile) => {
          const { user } = get();
          if (user) {
            set({ profile });
          }
        },

        updateUser: (updates) => {
          const { user } = get();
          if (user) {
            if (updates.onboarding_stage) {
              setOnboardingStage(updates.onboarding_stage);
            }
            set({ user: { ...user, ...updates } });
          }
        },

        rehydrate: (user, profile) => {
          set({
            status: 'authenticated',
            user,
            profile,
            accessToken: getAccessToken(),
            error: null
          });
        },

        setError: (error) => set({ error, status: 'error' as AuthStatus }),
      }),
      {
        name: 'rumi-auth-storage',
        partialize: (state) => ({
          user: state.user,
          profile: state.profile,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);

// -- Selective Hooks for Performance --
export const useAuthUser = () => useAuthStore((s) => s.user);
export const useAuthProfile = () => useAuthStore((s) => s.profile);
export const useIsAuthenticated = () => useAuthStore((s) => s.status === 'authenticated');
export const useAuthStatus = () => useAuthStore((s) => s.status);
export const useAuthError = () => useAuthStore((s) => s.error);
export const useUserRole = () => useAuthStore((s) => s.user?.role ?? null);
export const useAccessToken = () => useAuthStore((s) => s.accessToken);

export const useIsStudent = () =>
  useAuthStore((s) => s.user?.role === UserRole.STUDENT);

export const useIsLandlord = () =>
  useAuthStore((s) => s.user?.role === UserRole.LANDLORD);

export const useIsCaretaker = () =>
  useAuthStore((s) => s.user?.role === UserRole.CARETAKER);

export const useIsAdmin = () =>
  useAuthStore(
    (s) =>
      s.user?.role === UserRole.SUPER_ADMIN ||
      s.user?.role === UserRole.TECH_SUPPORT_ADMIN
  );

// -- Actions --
export const hydrateAuthStore = () => useAuthStore.getState().hydrate();
export const logout = () => useAuthStore.getState().logout();

// Trigger hydration as soon as possible if in browser
if (typeof window !== 'undefined') {
  hydrateAuthStore();
}

// Profile completeness checks
export const useIsStudentProfileComplete = () =>
  useAuthStore((s) => {
    if (s.profile?.type === 'student') {
      return Boolean(s.profile.is_profile_complete);
    }
    return true;
  });

export const useIsLandlordVerified = () =>
  useAuthStore((s) => {
    if (s.profile?.type === 'landlord') {
      return Boolean(s.profile.is_verified);
    }
    return true;
  });
