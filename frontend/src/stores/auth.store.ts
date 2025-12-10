
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getAccessToken, setTokens as setCookieTokens, clearTokens as clearCookieTokens } from '@/lib/auth/token';
import type {
  User,
  StudentProfile,
  LandlordProfile,
  CaretakerProfile,
} from '@/types/auth.types';

type UserProfile = StudentProfile | LandlordProfile | CaretakerProfile;

export const ROLES = {
  STUDENT: 'student',
  LANDLORD: 'landlord',
  CARETAKER: 'caretaker',
  SUPER_ADMIN: 'super_admin',
  TECH_SUPPORT_ADMIN: 'tech_support_admin',
} as const;

const AUTH_STORAGE_KEY = 'rumi-auth-storage';
const TOKEN_REFRESH_BUFFER_SECONDS = 30;

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isInitialized: boolean;

  setAuth: (payload: {
    user: User;
    profile?: UserProfile | null;
    accessToken?: string | null;
    refreshToken?: string | null;
  }) => void;

  setTokens: (accessToken: string | null, refreshToken?: string | null) => void;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;

  updateUser: (updates: Partial<User>) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;

  logout: () => void;
  hydrate: () => void;

  isTokenValid: () => boolean;
  getAccessToken: () => string | null;
}

const noopStorage: Storage = {
  length: 0,
  clear: () => {},
  getItem: () => null,
  key: () => null,
  removeItem: () => {},
  setItem: () => {},
};

function decodeJwtPayload(token: string): { exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const json = atob(padded);
    return JSON.parse(json) as { exp?: number };
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      profile: null,
      isAuthenticated: false,
      isInitialized: false,

      setAuth: ({ user, profile = null, accessToken, refreshToken }) => {
        const current = get();
        // Initialize state with provided values
        set({
          user,
          profile,
          accessToken:
            typeof accessToken === 'undefined'
              ? current.accessToken
              : accessToken,
          refreshToken:
            typeof refreshToken === 'undefined'
              ? current.refreshToken
              : refreshToken,
          isAuthenticated: true,
          isInitialized: true,
        });

        // Persist tokens to cookies if they are provided/updated
        // We do this AFTER setting state to ensure consistency
        if (accessToken) {
            setCookieTokens(accessToken, refreshToken || '');
        }
      },

      setTokens: (accessToken, refreshToken = null) => {
        if (accessToken) {
          setCookieTokens(accessToken, refreshToken || '');
        }
        set({ accessToken, refreshToken });
      },

      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
        });
      },

      setProfile: (profile) => {
        set({ profile });
      },

      updateUser: (updates) => {
        const current = get().user;
        if (!current) return;
        set({ user: { ...current, ...updates } });
      },

      updateProfile: (updates) => {
        const current = get().profile;
        if (!current) return;

        const merged = { ...current, ...updates } as UserProfile;
        set({ profile: merged });
      },

      logout: () => {
        clearCookieTokens();
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          profile: null,
          isAuthenticated: false,
          isInitialized: true,
        });
      },

      hydrate: () => {
        // HYBRID HYDRATION STRATEGY:
        // 1. Recover User/Profile from LocalStorage (handled by 'persist' automatically before this)
        // 2. Recover Token from HttpOnly/Secure Cookie
        // 3. If both exist, we are authenticated.

        const { user } = get();
        const tokenFromCookie = typeof window !== 'undefined' ? getAccessToken() : null;
        
        if (tokenFromCookie && user) {
           // Valid session: Cookie + LocalStorage matched
           set({
            accessToken: tokenFromCookie,
            isAuthenticated: true,
            isInitialized: true,
          });
        } else {
           // Invalid session: Missing token matches missing user, OR mismatch
           // If we have user data but no token, we must log out to clear the stale user data
           if (user && !tokenFromCookie) {
             get().logout();
           } else {
             set({
               isInitialized: true,
               isAuthenticated: false
             });
           }
        }
      },

      getAccessToken: () => get().accessToken,

      isTokenValid: () => {
        const token = get().accessToken;
        if (!token) return false;
        const decoded = decodeJwtPayload(token);
        if (!decoded || typeof decoded.exp !== 'number') return true;
        const now = Math.floor(Date.now() / 1000);
        return decoded.exp - now > TOKEN_REFRESH_BUFFER_SECONDS;
      },
    }),

    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : noopStorage,
      ),

      partialize: (state) => ({
        // PERSIST ONLY PUBLIC/NON-SENSITIVE DATA TO LOCAL STORAGE
        user: state.user,
        profile: state.profile,
        // We do NOT persist accessToken/refreshToken here - they live in cookies
        // isAuthenticated is re-calculated during hydration based on cookie presence
      }),

      onRehydrateStorage: () => (state) => {
        state?.hydrate();
      },
    },
  ),
);

// Selectors
export const useAuthUser = () => useAuthStore((s) => s.user);
export const useAuthProfile = () => useAuthStore((s) => s.profile);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useUserRole = () => useAuthStore((s) => s.user?.role ?? null);

export const useAccessToken = () => useAuthStore((s) => s.accessToken);
export const useRefreshToken = () => useAuthStore((s) => s.refreshToken);

export const useIsStudent = () =>
  useAuthStore((s) => s.user?.role === ROLES.STUDENT);

export const useIsLandlord = () =>
  useAuthStore((s) => s.user?.role === ROLES.LANDLORD);

export const useIsCaretaker = () =>
  useAuthStore((s) => s.user?.role === ROLES.CARETAKER);

export const useIsAdmin = () =>
  useAuthStore(
    (s) =>
      s.user?.role === ROLES.SUPER_ADMIN ||
      s.user?.role === ROLES.TECH_SUPPORT_ADMIN,
  );

export const useIsStudentProfileComplete = () =>
  useAuthStore((s) => {
    if (
      s.profile?.hasOwnProperty('type') &&
      (s.profile as any).type === 'student'
    ) {
      return Boolean((s.profile as StudentProfile).isProfileComplete);
    }
    return true;
  });

export const useIsLandlordVerified = () =>
  useAuthStore((s) => {
    if (
      s.profile?.hasOwnProperty('type') &&
      (s.profile as any).type === 'landlord'
    ) {
      return Boolean((s.profile as LandlordProfile).isVerified);
    }
    return true;
  });

export const useCanBook = () =>
  useAuthStore((s) => {
    if (s.user?.role !== ROLES.STUDENT) return false;
    if (
      s.profile?.hasOwnProperty('type') &&
      (s.profile as any).type === 'student'
    ) {
      return Boolean((s.profile as StudentProfile).isProfileComplete);
    }
    return false;
  });

export const useCanListHostels = () =>
  useAuthStore((s) => {
    if (s.user?.role !== ROLES.LANDLORD) return false;
    if (
      s.profile?.hasOwnProperty('type') &&
      (s.profile as any).type === 'landlord'
    ) {
      return Boolean((s.profile as LandlordProfile).isVerified);
    }
    return false;
  });

export const clearAuthStorage = () => {
  useAuthStore.getState().logout();
  if (typeof window !== 'undefined') localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const hydrateAuthStore = () => {
  if (typeof window !== 'undefined') {
    useAuthStore.getState().hydrate();
  }
};

export const authStore = useAuthStore;

/**
 * ================================================================================
 * README: Authentication Store (auth.store.ts)
 * ================================================================================
 *
 * OVERVIEW:
 * ---------
 * Central authentication state management using Zustand with persist middleware.
 * Implements a hybrid storage strategy: tokens in cookies, user data in localStorage.
 *
 * STATE:
 * ------
 * | Field          | Type                | Description                           |
 * |----------------|---------------------|---------------------------------------|
 * | accessToken    | string | null       | JWT access token (short-lived)        |
 * | refreshToken   | string | null       | JWT refresh token (long-lived)        |
 * | user           | User | null         | Current authenticated user            |
 * | profile        | UserProfile | null  | Role-specific profile data            |
 * | isAuthenticated| boolean             | Whether user is logged in             |
 * | isInitialized  | boolean             | Whether hydration is complete         |
 *
 * ACTIONS:
 * --------
 * | Action        | Description                                      |
 * |---------------|--------------------------------------------------|
 * | setAuth()     | Sets user, profile, and tokens after login       |
 * | setTokens()   | Updates access/refresh tokens                    |
 * | logout()      | Clears all auth state and cookies                |
 * | hydrate()     | Restores session from cookies + localStorage     |
 * | updateUser()  | Partial update of user object                    |
 * | updateProfile()| Partial update of profile                       |
 *
 * SELECTORS (Optimized Hooks):
 * ----------------------------
 * - useAuthUser() - Current user object
 * - useAuthProfile() - Role-specific profile
 * - useIsAuthenticated() - Auth status
 * - useUserRole() - User's role string
 * - useIsStudent/Landlord/Caretaker/Admin() - Role checks
 * - useCanBook() - Can student make bookings?
 * - useCanListHostels() - Can landlord list hostels?
 *
 * STORAGE STRATEGY:
 * -----------------
 * 1. TOKENS → HttpOnly Cookies (via token.ts utility)
 *    - More secure, prevents XSS access
 * 2. USER/PROFILE → localStorage (via Zustand persist)
 *    - Non-sensitive data, fast access
 * 3. On HYDRATION → Validates cookie exists + localStorage user matches
 *
 * JWT HANDLING:
 * -------------
 * - decodeJwtPayload(): Extracts exp claim from token
 * - isTokenValid(): Checks if token expires in > 30 seconds
 *
 * USAGE:
 * ------
 * ```typescript
 * import { useAuthStore, useIsAuthenticated, useUserRole } from '@/stores/auth.store';
 *
 * // In component
 * const isLoggedIn = useIsAuthenticated();
 * const role = useUserRole();
 * const { logout } = useAuthStore();
 *
 * // On login
 * useAuthStore.getState().setAuth({
 *   user: userData,
 *   profile: profileData,
 *   accessToken: tokens.access,
 *   refreshToken: tokens.refresh,
 * });
 * ```
 *
 * ================================================================================
 */

