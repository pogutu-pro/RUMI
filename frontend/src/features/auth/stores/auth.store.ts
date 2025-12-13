import { useAppStore } from '@/stores/app.store';
import { UserRole } from './auth.types';

// Re-export UserRole for consistency
export { UserRole };
export const ROLES = UserRole;


// -- Selectors --
export const useAuthStore = useAppStore;

export const useAuthUser = () => useAppStore((s) => s.user);
export const useAuthProfile = () => useAppStore((s) => s.profile);
export const useIsAuthenticated = () => useAppStore((s) => s.status === 'authenticated');
export const useAuthStatus = () => useAppStore((s) => s.status);
export const useAuthError = () => useAppStore((s) => s.error);

export const useUserRole = () => useAppStore((s) => s.user?.role ?? null);

export const useAccessToken = () => useAppStore((s) => s.accessToken);

export const useIsStudent = () =>
  useAppStore((s) => s.user?.role === UserRole.STUDENT);

export const useIsLandlord = () =>
  useAppStore((s) => s.user?.role === UserRole.LANDLORD);

export const useIsCaretaker = () =>
  useAppStore((s) => s.user?.role === UserRole.CARETAKER);

export const useIsAdmin = () =>
  useAppStore(
    (s) =>
      s.user?.role === UserRole.SUPER_ADMIN ||
      s.user?.role === UserRole.TECH_SUPPORT_ADMIN
  );

// -- Actions --
export const hydrateAuthStore = () => useAppStore.getState().hydrate();
export const logout = () => useAppStore.getState().logout();

// Profile completeness checks
export const useIsStudentProfileComplete = () =>
  useAppStore((s) => {
    if (
      s.profile?.type === 'student'
    ) {
      return Boolean(s.profile.is_profile_complete);
    }
    return true; 
  });

export const useIsLandlordVerified = () =>
    useAppStore((s) => {
      if (
        s.profile?.type === 'landlord'
      ) {
        return Boolean(s.profile.is_verified);
      }
      return true;
    });
