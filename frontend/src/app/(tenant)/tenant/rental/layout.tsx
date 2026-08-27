'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { UserRole } from '@/features/auth/stores/auth.types';

/**
 * Own light layout, not the legacy (student) shell — 'student' role maps to
 * canonical 'tenant' server-side (User.get_canonical_role()), so both are
 * allowed here.
 */
export default function RentalTenantLayout({ children }: { children: React.ReactNode }) {
  const { user, status, isAuthenticated } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (status === 'checking' || status === 'idle') return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (user && user.role !== UserRole.TENANT && user.role !== UserRole.STUDENT) {
      router.replace('/login');
    }
  }, [status, isAuthenticated, user, router]);

  if (status === 'checking' || status === 'idle' || !isAuthenticated) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-4 py-3">
        <span className="text-lg font-semibold">RUMIA — My Rental</span>
      </header>
      <main className="mx-auto max-w-md px-4 py-6">{children}</main>
    </div>
  );
}
