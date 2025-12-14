'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Building2, MessageSquare, User, Menu, Bell, CreditCard, Settings, Star, Users, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { icon: Home, label: 'Dashboard', href: '/student/dashboard' },
  { icon: Building2, label: 'My Hostel', href: '/student/bookings/active' },
  { icon: MessageSquare, label: 'Messages', href: '/student/messages' },
  { icon: User, label: 'Profile', href: '/student/profile' },
];

const SECONDARY_MENU_ITEMS = [
  { icon: Bell, label: 'Notifications', href: '/student/notifications' },
  { icon: CreditCard, label: 'Payments', href: '/student/payments' },
  { icon: Star, label: 'Reviews', href: '/student/reviews' },
  { icon: MessageSquare, label: 'Support', href: '/student/support' },
  { icon: Users, label: 'Roommates', href: '/student/roommates' },
  { icon: ArrowRightLeft, label: 'Transfers', href: '/student/transfers' },
  { icon: Settings, label: 'Settings', href: '/student/settings' },
];

export function StudentBottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = React.useState(true);
  const [lastScrollY, setLastScrollY] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);

  // Auto-hide on scroll down, show on scroll up
  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 50) {
        setIsVisible(true);
        setLastScrollY(currentScrollY);
        return;
      }
      
      if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const is_active = (href: string) => {
    if (href === '/student/dashboard') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Spacer */}
      <div className="h-16 md:hidden" aria-hidden="true" />
      
      <nav 
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 md:hidden',
          'bg-background border-t border-border',
          'transition-transform duration-300 ease-in-out transform-gpu will-change-transform',
          isVisible ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)',
          contain: 'paint layout'
        }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = is_active(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 transition-transform duration-100 min-w-[64px]',
                  'active:scale-95 touch-manipulation transform-gpu',
                  active && 'bg-primary/10'
                )}
              >
                <div className="relative will-change-transform">
                  <Icon 
                    className={cn(
                      'h-6 w-6 transition-transform duration-200',
                      active 
                        ? 'text-primary scale-110' 
                        : 'text-muted-foreground'
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
                    'text-[11px] font-medium',
                    active 
                      ? 'text-primary font-semibold' 
                      : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* More Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  'flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 transition-all duration-200 min-w-[64px]',
                  'active:scale-95 touch-manipulation',
                  isOpen && 'bg-primary/10'
                )}
              >
                <Menu 
                  className={cn(
                    'h-6 w-6 transition-all duration-200',
                    isOpen ? 'text-primary scale-110' : 'text-muted-foreground'
                  )}
                  strokeWidth={isOpen ? 2.5 : 2}
                />
                <span 
                  className={cn(
                    'text-[11px] font-medium transition-all duration-200',
                    isOpen ? 'text-primary font-semibold' : 'text-muted-foreground'
                  )}
                >
                  More
                </span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Student Menu</SheetTitle>
                <SheetDescription>Additional navigation options</SheetDescription>
              </SheetHeader>
              
              <div className="p-4 border-b border-border flex items-center justify-center">
                <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full" />
              </div>

              <ScrollArea className="h-full pb-20">
                <div className="p-6 space-y-6">
                  {/* User Info */}
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src="/images/avatars/default.jpg" />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                        ST
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-base">Student Account</p>
                      <p className="text-sm text-muted-foreground">Manage your hostel life</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Quick Access */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">
                      Quick Access
                    </p>
                    {SECONDARY_MENU_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const active = pathname?.startsWith(item.href);
                      
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200',
                            active
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'hover:bg-muted text-foreground'
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>

                  <Separator />

                  {/* Additional Links */}
                  <div className="space-y-2">
                    <Link
                      href="/student/hostels"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Building2 className="h-5 w-5" />
                      <span>Browse Hostels</span>
                    </Link>
                    <Link
                      href="/student/hostels/favorites"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Star className="h-5 w-5" />
                      <span>My Favorites</span>
                    </Link>
                  </div>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}

