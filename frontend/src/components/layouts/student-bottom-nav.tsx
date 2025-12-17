'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Building2, MessageSquare, User, Menu, Bell, CreditCard, Settings, Star, Users, ArrowRightLeft, CalendarCheck, UserCheck, LifeBuoy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const HOSTEL_MENU_ITEMS = [
  { icon: CalendarCheck, label: 'Current Booking', href: '/student/bookings/active' },
  { icon: Users, label: 'My Roommates', href: '/student/roommates' },
  { icon: UserCheck, label: 'Check-In/Out', href: '/student/check-in' },
  { icon: Building2, label: 'Browse Hostels', href: '/student/hostels' },
  { icon: Star, label: 'Favorites', href: '/student/hostels/favorites' },
  { icon: ArrowRightLeft, label: 'Transfers', href: '/student/transfers' },
];

const MORE_MENU_ITEMS = [
  { icon: MessageSquare, label: 'Messages', href: '/student/messages' },
  { icon: User, label: 'Profile', href: '/student/profile' },
  { icon: Bell, label: 'Notifications', href: '/student/notifications' },
  { icon: Star, label: 'Reviews', href: '/student/reviews' },
  { icon: LifeBuoy, label: 'Support', href: '/student/support' },
  { icon: Settings, label: 'Settings', href: '/student/settings' },
];

export function StudentBottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = React.useState(true);
  const [lastScrollY, setLastScrollY] = React.useState(0);
  
  // State for sheets
  const [isHostelOpen, setIsHostelOpen] = React.useState(false);
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);

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
    if (href === '/student/dashboard') return pathname === href;
    return pathname?.startsWith(href);
  };

  const NavLink = ({ item, active }: { item: any, active: boolean }) => (
    <Link
      href={item.href}
      className={cn(
        'flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 transition-transform duration-100 min-w-[64px] h-full w-full',
        'active:scale-95 touch-manipulation transform-gpu',
        active && 'bg-primary/10'
      )}
    >
      <div className="relative will-change-transform">
        <item.icon 
          className={cn(
            'h-6 w-6 transition-transform duration-200',
            active ? 'text-primary scale-110' : 'text-muted-foreground'
          )}
          strokeWidth={active ? 2.5 : 2}
        />
      </div>
      <span className={cn(
        'text-[11px] font-medium',
        active ? 'text-primary font-semibold' : 'text-muted-foreground'
      )}>
        {item.label}
      </span>
    </Link>
  );

  const MenuButton = ({ icon: Icon, label, isOpen, onClick }: { icon: any, label: string, isOpen: boolean, onClick: () => void }) => (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 transition-all duration-200 min-w-[64px] h-full w-full',
        'active:scale-95 touch-manipulation',
        isOpen && 'bg-primary/10'
      )}
    >
      <Icon 
        className={cn(
          'h-6 w-6 transition-all duration-200',
          isOpen ? 'text-primary scale-110' : 'text-muted-foreground'
        )}
        strokeWidth={isOpen ? 2.5 : 2}
      />
      <span className={cn(
        'text-[11px] font-medium transition-all duration-200',
        isOpen ? 'text-primary font-semibold' : 'text-muted-foreground'
      )}>
        {label}
      </span>
    </button>
  );

  const MenuSheet = ({ title, items, isOpen, onOpenChange }: { title: string, items: any[], isOpen: boolean, onOpenChange: (open: boolean) => void }) => (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[60vh] rounded-t-3xl p-0 ring-0 focus:ring-0 outline-none">
        <SheetHeader className="sr-only">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Navigation options</SheetDescription>
        </SheetHeader>
        
        <div className="p-4 border-b border-border flex items-center justify-center bg-muted/20 rounded-t-3xl">
          <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full" />
        </div>

        <ScrollArea className="h-full pb-8">
          <div className="p-4 grid grid-cols-2 gap-3">
            {items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border bg-card hover:bg-accent/50 transition-all duration-200 active:scale-95",
                  pathname?.startsWith(item.href) ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20" : "border-border/50"
                )}
              >
                <div className={cn(
                  "p-3 rounded-full bg-background shadow-sm",
                  pathname?.startsWith(item.href) ? "text-primary" : "text-muted-foreground"
                )}>
                  <item.icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-center">{item.label}</span>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      {/* Spacer */}
      <div className="h-20 md:hidden" aria-hidden="true" />
      
      <nav 
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 md:hidden',
          'bg-background/95 backdrop-blur-lg border-t border-border shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]',
          'transition-transform duration-300 ease-in-out transform-gpu will-change-transform',
          isVisible ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)',
        }}
      >
        <div className="grid grid-cols-4 h-[68px] items-center px-2">
          {/* 1. Home */}
          <NavLink 
            item={{ label: 'Home', href: '/student/dashboard', icon: Home }} 
            active={is_active('/student/dashboard')} 
          />

          {/* 2. Hostel Menu */}
          <div>
            <MenuButton 
              icon={Building2} 
              label="Hostel" 
              isOpen={isHostelOpen} 
              onClick={() => setIsHostelOpen(true)} 
            />
            <MenuSheet 
              title="Hostel Options" 
              items={HOSTEL_MENU_ITEMS} 
              isOpen={isHostelOpen} 
              onOpenChange={setIsHostelOpen} 
            />
          </div>

          {/* 3. Payments */}
          <NavLink 
            item={{ label: 'Payments', href: '/student/payments', icon: CreditCard }} 
            active={is_active('/student/payments')} 
          />

          {/* 4. More Menu */}
          <div>
            <MenuButton 
              icon={Menu} 
              label="More" 
              isOpen={isMoreOpen} 
              onClick={() => setIsMoreOpen(true)} 
            />
            <MenuSheet 
              title="More Options" 
              items={MORE_MENU_ITEMS} 
              isOpen={isMoreOpen} 
              onOpenChange={setIsMoreOpen} 
            />
          </div>
        </div>
      </nav>
    </>
  );
}

