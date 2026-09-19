'use client';

/**
 * Mobile bottom navigation for public pages.
 * Leads with what RumiaRent does (Features, How it works, Pricing) and puts the
 * account action at the far right: Sign in for visitors, Dashboard once signed in.
 */

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Sparkles,
  ListChecks,
  CreditCard,
  LogIn,
  LayoutDashboard,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { AUTH_ROUTES } from '@/lib/constants/routes';
import { useAuthStore } from '@/features/auth/stores/auth.store';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', icon: <Home className="h-5 w-5" /> },
  {
    href: '/features',
    label: 'Features',
    icon: <Sparkles className="h-5 w-5" />,
  },
  {
    href: '/how-it-works',
    label: 'How it works',
    icon: <ListChecks className="h-5 w-5" />,
  },
  {
    href: '/pricing',
    label: 'Pricing',
    icon: <CreditCard className="h-5 w-5" />,
  },
];

const SIGN_IN_ITEM: NavItem = {
  href: AUTH_ROUTES.LOGIN,
  label: 'Sign in',
  icon: <LogIn className="h-5 w-5" />,
};

const DASHBOARD_ITEM: NavItem = {
  href: '/dashboard',
  label: 'Dashboard',
  icon: <LayoutDashboard className="h-5 w-5" />,
};

export function MobileBottomNav() {
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');
  const [isVisible, setIsVisible] = React.useState(true);
  const lastScrollY = React.useRef(0);

  // Hide on scroll down, show on scroll up; always visible near the top.
  React.useEffect(() => {
    const handleScroll = (): void => {
      const current = window.scrollY;
      if (current < 50 || current < lastScrollY.current) {
        setIsVisible(true);
      } else if (current > 100) {
        setIsVisible(false);
      }
      lastScrollY.current = current;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (href: string): boolean =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const items = [...NAV_ITEMS, isAuthenticated ? DASHBOARD_ITEM : SIGN_IN_ITEM];

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 md:hidden',
        'bg-white border-t border-gray-200',
        'transition-transform duration-300 ease-in-out',
        'pb-safe-bottom',
        'shadow-[0_-2px_10px_rgba(0,0,0,0.05)]',
        isVisible ? 'translate-y-0' : 'translate-y-full',
      )}
      aria-label="Mobile navigation"
    >
      <div className="flex h-16 items-center justify-around px-1">
        {items.map((item) => {
          const active = isActive(item.href);
          const isAccount = item === SIGN_IN_ITEM || item === DASHBOARD_ITEM;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                active || isAccount
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-gray-900 active:scale-95',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <span
                className={cn(
                  'transition-all duration-200',
                  active && 'scale-110',
                )}
              >
                {item.icon}
              </span>
              <span
                className={cn(
                  'max-w-full truncate text-[11px] leading-none',
                  active || isAccount ? 'font-semibold' : 'font-normal',
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
