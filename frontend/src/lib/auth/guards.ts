import { redirect } from 'next/navigation';
import type { Route } from 'next';
import { cookies } from 'next/headers';
import { UserRole } from '@/features/auth/types/types';
import { useAuthStore, useIsAuthenticated } from '@/features/auth';

const TOKEN_COOKIE = 'rumi_access_token';
const ROLE_COOKIE = 'rumi_user_role';

export function useAuthGuard(options?: {
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string;
}) {
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    redirect((options?.redirectTo ?? '/login') as Route);
  }

  if (options?.requiredRole && user) {
    const required = Array.isArray(options.requiredRole)
      ? options.requiredRole
      : [options.requiredRole];
    if (!required.includes(user.role)) {
      redirect('/' as Route); // unauthorized
    }
  }

  return { user, isAuthenticated };
}

export async function requireAuth(options?: {
  requiredRole?: UserRole | UserRole[];
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  const role = cookieStore.get(ROLE_COOKIE)?.value as UserRole | undefined;

  if (!token) {
    redirect('/login' as Route);
  }

  if (options?.requiredRole) {
    const required = Array.isArray(options.requiredRole)
      ? options.requiredRole
      : [options.requiredRole];
    if (!role || !required.includes(role)) {
      redirect('/' as Route); // unauthorized
    }
  }

  return role;
}
