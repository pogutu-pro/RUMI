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
  [UserRole.STUDENT]: '/tenant/rental',
  [UserRole.TENANT]: '/tenant/rental',
  [UserRole.LANDLORD]: '/landlord/rental',
  [UserRole.CARETAKER]: '/caretaker/rental',
  [UserRole.SUPER_ADMIN]: '/landlord/rental',
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

  const isPublic = isPublicPath(pathname);

  // PASSIVE Guard: AuthProvider now only hydrates state.
  // Navigation authority is delegated to middleware.ts
  // This prevents hydration flicker and navigation conflict.

  return <>{children}</>;
}
