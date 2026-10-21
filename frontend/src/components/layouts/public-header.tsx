'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { AUTH_ROUTES, getDashboardRoute } from '@/lib/constants/routes';
import { cn } from '@/lib/utils/cn';
import { useAuthStore } from '@/features/auth/stores/auth.store';

// Kept to what a first-time visitor needs; everything else is in the footer.
const NAV = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/rentals', label: 'Find a rental' },
];

function Logo() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
      <Image src="/images/logo/logo.png" alt="" width={36} height={36} priority className="h-9 w-9" />
      <span className="text-lg font-semibold tracking-tight text-gray-900">
        Rumia<span className="text-primary">Rent</span>
      </span>
    </Link>
  );
}

/**
 * One header for every public page: logo, two links, Sign in and one
 * primary action. On phones the primary action stays visible next to a
 * single menu button, so it is always clear where to start.
 */
export function PublicHeader() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const signedIn = useAuthStore((s) => s.status === 'authenticated') && !!user;
  const dashboard = signedIn && user?.role ? getDashboardRoute(user.role) : null;
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => setOpen(false), [pathname]);
  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const primary = dashboard
    ? { href: dashboard, label: 'Open dashboard' }
    : { href: AUTH_ROUTES.REGISTER, label: 'Start free' };

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900',
                pathname === item.href && 'text-gray-900',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!dashboard && (
            <Link href={AUTH_ROUTES.LOGIN} className="hidden rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 md:inline-flex">
              Sign in
            </Link>
          )}
          <Link
            href={primary.href}
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            {primary.label}
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-700 hover:bg-gray-100 md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

    </header>
    {/* Outside the header on purpose: its backdrop blur would make this
        fixed panel size itself to the 64px header instead of the screen. */}
      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 top-16 bottom-0 z-50 overflow-y-auto border-t border-gray-200 bg-white md:hidden">
          <nav aria-label="Mobile" className="mx-auto flex max-w-6xl flex-col px-4 py-4">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="border-b border-gray-100 py-4 text-lg font-medium text-gray-900">
                {item.label}
              </Link>
            ))}
            <Link href="/faq" className="border-b border-gray-100 py-4 text-lg font-medium text-gray-900">Help</Link>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href={primary.href}
                className="inline-flex h-12 items-center justify-center rounded-lg bg-primary text-base font-semibold text-white"
              >
                {dashboard ? 'Open dashboard' : 'Start free for 30 days'}
              </Link>
              {!dashboard && (
                <Link href={AUTH_ROUTES.LOGIN} className="inline-flex h-12 items-center justify-center rounded-lg border border-gray-300 text-base font-semibold text-gray-900">
                  Sign in
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
