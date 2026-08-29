'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { UserRole } from '@/features/auth/stores/auth.types';
import { UnifiedThemeProvider } from '@/components/providers/unified-theme-provider';
import { cn } from '@/lib/utils/cn';

const NAV = [
  { href: '/tenant/rental', label: 'My Rental' },
  { href: '/tenant/rental/support', label: 'Support' },
];

/**
 * Own light layout, not the legacy (student) shell — 'student' role maps to
 * canonical 'tenant' server-side (User.get_canonical_role()), so both are
 * allowed here.
 */
export default function RentalTenantLayout({ children }: { children: React.ReactNode }) {
  const { user, status, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
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
    <UnifiedThemeProvider forcedTheme="light">
      <div className="min-h-screen bg-muted/40">
        <header className="border-b bg-background px-4 pt-3">
          <span className="text-lg font-semibold">RumiaRent</span>
          <nav className="mt-3 flex gap-1 -mb-px">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-md px-4 py-6">{children}</main>
      </div>
    </UnifiedThemeProvider>
  );
}
