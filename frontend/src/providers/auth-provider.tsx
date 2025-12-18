'use client';

import { useEffect, useMemo, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { Route } from 'next';
import { getAccessToken } from '@/lib/auth/token';
import { useProfile } from '@/features/auth';
import { useAuthStore, hydrateAuthStore, UserRole } from '@/features/auth';
import { csrf } from '@/lib/security/csrf';
import { getApiUrl } from '@/lib/utils/env';

interface AuthProviderProps {
  children: ReactNode;
}

const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/faq',
  '/features',
  '/how-it-works',
  '/pricing',
  '/privacy',
  '/terms',
  '/blog',
  '/hostels',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/verify-phone',
];

const ROLE_REDIRECTS: Record<string, string> = {
  [UserRole.STUDENT]: '/student/dashboard',
  [UserRole.LANDLORD]: '/landlord/dashboard',
  [UserRole.CARETAKER]: '/caretaker/dashboard',
  [UserRole.SUPER_ADMIN]: '/admin/dashboard',
  [UserRole.TECH_SUPPORT_ADMIN]: '/tech-support/dashboard',
  'tech_support': '/tech-support/dashboard',
};

const AUTH_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

function isPublicPath(pathname: string | null | undefined) {
  if (!pathname) return true;
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const user = useAuthStore((state) => state.user);
  // Derived state from status
  const status = useAuthStore((state) => state.status);
  const isAuthenticated = status === 'authenticated';
  const isInitialized = status !== 'idle';

  useEffect(() => {
    hydrateAuthStore();
    // Initialize CSRF token for mutations
    csrf.fetch(getApiUrl());
  }, []);

  const shouldFetchProfile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return !!getAccessToken();
  }, []);

  const profileQuery = useProfile();

  // Wait for hydration and profile fetch if needed
  const ready =
    isInitialized &&
    (!shouldFetchProfile || (isAuthenticated && !!user) || profileQuery.isFetched);

  useEffect(() => {
    if (!ready) return;

    if (
      isAuthenticated &&
      pathname &&
      AUTH_ROUTES.some((r) => pathname.startsWith(r))
    ) {
      const redirect = user?.role
        ? (ROLE_REDIRECTS[user.role] ?? '/dashboard')
        : '/dashboard';
      router.replace(redirect as Route);
      return;
    }

    if (!isAuthenticated && pathname && !isPublicPath(pathname)) {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}` as Route);
    }
  }, [ready, isAuthenticated, pathname, router, user?.role]);

  const isPublic = isPublicPath(pathname);

  if (!ready) {
    return null;
  }

  if (!isAuthenticated && !isPublic) {
    return null;
  }

  return <>{children}</>;
}
