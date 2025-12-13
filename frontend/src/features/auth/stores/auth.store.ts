import { useAppStore } from '@/stores/app.store';
import { ROLES } from '@/types/auth.types';

// Re-export ROLES for compatibility
export { ROLES };

// -- Selectors --
// Retaining the hook-based API for compatibility with existing components

export const useAuthStore = useAppStore; // Warning: direct usage gives full store now

export const useAuthUser = () => useAppStore((s) => s.user);
export const useAuthProfile = () => useAppStore((s) => s.profile);
export const useIsAuthenticated = () => useAppStore((s) => s.status === 'authenticated');
export const useAuthStatus = () => useAppStore((s) => s.status);
export const useAuthError = () => useAppStore((s) => s.error);

export const useUserRole = () => useAppStore((s) => s.user?.role ?? null);

export const useAccessToken = () => useAppStore((s) => s.accessToken);

export const useIsStudent = () =>
  useAppStore((s) => s.user?.role === ROLES.STUDENT);

export const useIsLandlord = () =>
  useAppStore((s) => s.user?.role === ROLES.LANDLORD);

export const useIsCaretaker = () =>
  useAppStore((s) => s.user?.role === ROLES.CARETAKER);

export const useIsAdmin = () =>
  useAppStore(
    (s) =>
      s.user?.role === ROLES.SUPER_ADMIN ||
      s.user?.role === ROLES.TECH_SUPPORT_ADMIN
  );

// -- Actions --
export const hydrateAuthStore = () => useAppStore.getState().hydrate();
export const logout = () => useAppStore.getState().logout();
export const login = (payload: any) => useAppStore.getState().login(payload); // Type safety looseness for quick compat, strictly use AppStore in new code

// Profile completeness checks (logic moved from old store)
export const useIsStudentProfileComplete = () =>
  useAppStore((s) => {
    if (
      s.profile?.hasOwnProperty('type') &&
      (s.profile as any).type === 'student'
    ) {
      // @ts-ignore
      return Boolean(s.profile.is_profile_complete);
    }
    return true; // Default true if not student or unknown to avoid blocking
  });

export const useIsLandlordVerified = () =>
    useAppStore((s) => {
      if (
        s.profile?.hasOwnProperty('type') &&
        (s.profile as any).type === 'landlord'
      ) {
        // @ts-ignore
        return Boolean(s.profile.is_verified);
      }
      return true;
    });
