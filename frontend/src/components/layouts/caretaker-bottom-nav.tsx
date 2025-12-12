'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, ClipboardList, Menu, X, Shield, LifeBuoy, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { icon: Home, label: 'Home', href: '/caretaker/dashboard' },
  { icon: Users, label: 'Students', href: '/caretaker/tenants' },
  { icon: ClipboardList, label: 'Tasks', href: '/caretaker/tasks' },
];

const taskRoutes = [
  '/caretaker/tasks',
  '/caretaker/maintenance',
  '/caretaker/approvals',
  '/caretaker/check-in',
  '/caretaker/check-out',
  '/caretaker/damage-reports',
  '/caretaker/room-management',
];

const moreRoutes = [
  '/caretaker/profile',
  '/caretaker/security',
  '/caretaker/support',
];

export function CaretakerBottomNav() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);
  const { logout } = useAuth();

  const is_active = (href: string) => {
    if (!pathname) return false;

    // Home
    if (href === '/caretaker/dashboard') {
      return pathname === '/caretaker' || pathname === '/caretaker/dashboard';
    }

    // Tasks Hub & Sub-pages
    if (href === '/caretaker/tasks') {
      return taskRoutes.some(route => pathname.startsWith(route));
    }

    // Students
    if (href === '/caretaker/tenants') {
      return pathname.startsWith('/caretaker/tenants');
    }

    return pathname.startsWith(href);
  };

  const isMoreActive = React.useMemo(() => {
    if (!pathname) return false;
    return moreRoutes.some(route => pathname.startsWith(route));
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Sign out failed', error);
    }
  };

  const moreMenuItems = [
    { icon: User, label: 'Profile', href: '/caretaker/profile' },
    { icon: Shield, label: 'Security', href: '/caretaker/security' },
    { icon: LifeBuoy, label: 'Support', href: '/caretaker/support' },
  ];

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed nav */}
      <div className="h-16 md:hidden" aria-hidden="true" />
      
      {/* Bottom Navigation - Mobile Only */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-lg border-t border-border"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)',
        }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = is_active(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-xl px-4 py-2 transition-all duration-200 min-w-[64px]",
                  "active:scale-95 touch-manipulation",
                  active && "bg-emerald-50 dark:bg-emerald-900/20"
                )}
              >
                <div className="relative">
                  <Icon 
                    className={cn(
                      "h-6 w-6 transition-all duration-200",
                      active 
                        ? "text-emerald-600 dark:text-emerald-400 scale-110" 
                        : "text-muted-foreground"
                    )}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  {item.badge && item.badge > 0 && (
                    <Badge 
                      className="absolute -top-1 -right-1 h-4 min-w-4 p-0 flex items-center justify-center text-[10px] bg-red-500 text-white border-2 border-background"
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  )}
                </div>
                <span 
                  className={cn(
                    "text-[11px] font-medium transition-all duration-200",
                    active 
                      ? "text-emerald-600 dark:text-emerald-400" 
                      : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* More Menu */}
          <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-xl px-4 py-2 transition-all duration-200 min-w-[64px]",
                  "active:scale-95 touch-manipulation",
                  (isMoreOpen || isMoreActive) && "bg-emerald-50 dark:bg-emerald-900/20"
                )}
              >
                <div className="relative">
                  <Menu 
                    className={cn(
                      "h-6 w-6 transition-all duration-200",
                      (isMoreOpen || isMoreActive)
                        ? "text-emerald-600 dark:text-emerald-400 scale-110" 
                        : "text-muted-foreground"
                    )}
                    strokeWidth={(isMoreOpen || isMoreActive) ? 2.5 : 2}
                  />
                </div>
                <span 
                  className={cn(
                    "text-[11px] font-medium transition-all duration-200",
                    (isMoreOpen || isMoreActive)
                      ? "text-emerald-600 dark:text-emerald-400" 
                      : "text-muted-foreground"
                  )}
                >
                  More
                </span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-[20px] p-0">
              <SheetHeader className="p-6 border-b text-left">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="p-4 grid gap-2">
                {moreMenuItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname?.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMoreOpen(false)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl transition-colors",
                        active 
                          ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100" 
                          : "hover:bg-muted/50 active:bg-muted"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-full",
                        active 
                          ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400" 
                          : "bg-emerald-100/50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-medium text-base">{item.label}</span>
                    </Link>
                  );
                })}
                
                <div className="my-2 border-t" />
                
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-red-50 active:bg-red-100 dark:hover:bg-red-900/10 dark:active:bg-red-900/20 transition-colors text-red-600 dark:text-red-400 w-full text-left"
                >
                  <div className="p-2 rounded-full bg-red-100/50 dark:bg-red-900/20">
                    <LogOut className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-base">Sign Out</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}
