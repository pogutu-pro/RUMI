'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Icon, IconName } from '@/components/ui/icons';
import { cn } from '@/lib/utils/cn';

interface NavItem {
  title: string;
  href: `/${string}`;
  icon: IconName;
}

interface MobileNavProps {
  navItems: NavItem[];
  menuTitle?: string;
  onSignOut: () => Promise<void>;
}

/**
 * Mobile navigation component using a slide-out sheet.
 * Automatically closes on navigation and handles sign-out with loading state.
 */
export const MobileNav = React.memo(function MobileNav({
  navItems,
  menuTitle = 'Menu',
  onSignOut,
}: MobileNavProps) {
  const [open, setOpen] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleSignOut = React.useCallback(async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      await onSignOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setIsSigningOut(false);
    }
  }, [onSignOut, isSigningOut]);

  const handleNavClick = React.useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{menuTitle}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-primary
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </SheetHeader>

        <nav
          className="flex-1 px-4 py-6 space-y-1"
          aria-label="Mobile navigation"
        >
          {navItems.map((item) => {
            const is_active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={cn(
                  'flex items-center gap-4 rounded-xl px-4 py-3.5 text-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  is_active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                )}
                aria-current={is_active ? 'page' : undefined}
              >
                <Icon name={item.icon} size={24} aria-hidden="true" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <Button
            variant="destructive"
            className="w-full h-12 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
            onClick={handleSignOut}
            disabled={isSigningOut}
            aria-label="Sign out"
          >
            <LogOut className="mr-3 h-5 w-5" />
            {isSigningOut ? 'Signing Out…' : 'Sign Out'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
});
