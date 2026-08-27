'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth';
import { UserRole } from '@/features/auth/stores/auth.types';
import { cn } from '@/lib/utils/cn';

const NAV = [
  { href: '/landlord/rental', label: 'Dashboard' },
  { href: '/landlord/rental/properties', label: 'Properties' },
  { href: '/landlord/rental/tenants', label: 'Tenants' },
  { href: '/landlord/rental/tenancies', label: 'Tenancies' },
  { href: '/landlord/rental/rent', label: 'Rent' },
  { href: '/landlord/rental/payments', label: 'Payments' },
];

/**
 * Deliberately its own light layout, not the legacy hostel LandlordSidebar
 * shell — the rental product is meant to be exceptionally simple, not a
 * dashboard with charts and nested menus (see product-scope notes).
 */
export default function RentalLandlordLayout({ children }: { children: React.ReactNode }) {
  const { user, status, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (status === 'checking' || status === 'idle') return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (user && user.role !== UserRole.LANDLORD && user.role !== UserRole.SUPER_ADMIN) {
      router.replace('/login');
    }
  }, [status, isAuthenticated, user, router]);

  if (status === 'checking' || status === 'idle' || !isAuthenticated) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="text-lg font-semibold">RUMIA — Rentals</span>
          <nav className="flex gap-1 overflow-x-auto">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm whitespace-nowrap',
                  pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
