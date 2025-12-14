"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Home, 
  CalendarDays, 
  Menu, 
  Wallet, 
  PieChart, 
  Settings, 
  LifeBuoy, 
  LogOut,
  ShieldCheck,
  FileText,
  UserCog,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/features/auth';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Home', href: '/admin/dashboard' },
  { icon: Users, label: 'Users', href: '/admin/users' },
  { icon: Home, label: 'Properties', href: '/admin/hostels' },
  { icon: CalendarDays, label: 'Bookings', href: '/admin/bookings' },
];

const moreRoutes = [
  '/admin/payments',
  '/admin/analytics',
  '/admin/reports',
  '/admin/settings',
  '/admin/support',
  '/admin/reviews'
];

export function AdminBottomNav() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);
  const { logout } = useAuth(); // Assuming useAuth is available and has logout

  const is_active = (href: string) => {
    if (!pathname) return false;

    // Direct match or specific sub-paths for main items
    if (href === '/admin/dashboard') return pathname === '/admin' || pathname === '/admin/dashboard';
    if (href === '/admin/users') return pathname.startsWith('/admin/users');
    if (href === '/admin/hostels') return pathname.startsWith('/admin/hostels');
    if (href === '/admin/bookings') return pathname.startsWith('/admin/bookings');

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
    { icon: Wallet, label: 'Finance', href: '/admin/payments' },
    { icon: PieChart, label: 'Analytics', href: '/admin/analytics' },
    { icon: FileText, label: 'Reports', href: '/admin/reports' },
    { icon: FileText, label: 'Reviews', href: '/admin/reviews' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
    { icon: LifeBuoy, label: 'Support', href: '/admin/support' },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border transform-gpu will-change-transform"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)',
        contain: 'paint layout'
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
                "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 transition-transform duration-100 min-w-[64px]",
                "active:scale-95 touch-manipulation transform-gpu",
                active && "bg-accent/50"
              )}
            >
              <div className="relative will-change-transform">
                <Icon 
                  className={cn(
                    "h-6 w-6 transition-transform duration-200",
                    active 
                      ? "text-primary scale-110" 
                      : "text-muted-foreground"
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
                {item.badge && item.badge > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-2 h-4 min-w-4 p-0 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground border-2 border-background"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span 
                className={cn(
                  "text-[10px] font-medium",
                  active 
                    ? "text-primary" 
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
                "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 transition-all duration-200 min-w-[64px]",
                "active:scale-95 touch-manipulation",
                (isMoreOpen || isMoreActive) && "bg-primary/10"
              )}
            >
              <div className="relative">
                <Menu 
                  className={cn(
                    "h-6 w-6 transition-all duration-200",
                    (isMoreOpen || isMoreActive)
                      ? "text-primary scale-110" 
                      : "text-muted-foreground"
                  )}
                  strokeWidth={(isMoreOpen || isMoreActive) ? 2.5 : 2}
                />
              </div>
              <span 
                className={cn(
                  "text-[10px] font-medium transition-all duration-200",
                  (isMoreOpen || isMoreActive)
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}
              >
                More
              </span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-[20px] p-0 flex flex-col">
            <SheetHeader className="p-6 border-b text-left shrink-0">
              <SheetTitle>Admin Menu</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-3">
                {moreMenuItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname?.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMoreOpen(false)}
                      className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-xl transition-all border",
                        active 
                          ? "bg-primary/5 border-primary/20" 
                          : "bg-card border-border hover:bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "p-3 rounded-full",
                        active 
                          ? "bg-primary/10 text-primary" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className={cn(
                        "font-medium text-sm text-center",
                        active ? "text-primary" : "text-foreground"
                      )}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
              
              <div className="my-6 border-t" />
              
              <button
                onClick={handleSignOut}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-destructive/10 active:bg-destructive/20 transition-colors text-destructive w-full border border-transparent hover:border-destructive/20"
              >
                <div className="p-2 rounded-full bg-destructive/10">
                  <LogOut className="h-5 w-5" />
                </div>
                <span className="font-medium text-base">Sign Out</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
