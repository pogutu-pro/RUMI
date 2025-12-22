'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Building2, 
  MessageSquare, 
  User, 
  Menu, 
  Bell, 
  CreditCard, 
  Settings, 
  Star, 
  Users, 
  ArrowRightLeft, 
  CalendarCheck, 
  UserCheck, 
  LifeBuoy, 
  Shield, 
  Clock, 
  Wallet, 
  Files, 
  Search,
  Inbox,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const MY_STAY_ITEMS = [
  { icon: Home, label: 'Current Room', href: '/student/bookings/active' },
  { icon: Users, label: 'Roommates', href: '/student/roommates' },
  { icon: CalendarCheck, label: 'Move In/Out', href: '/student/check-in' },
  { icon: ArrowRightLeft, label: 'Transfers', href: '/student/transfers' },
  { icon: History, label: 'History', href: '/student/bookings' },
  { icon: Star, label: 'Reviews', href: '/student/reviews' },
  // Security Items
  { icon: UserCheck, label: 'Visitors', href: '/student/security/visitor-invitations' },
  { icon: Clock, label: 'Late Entries', href: '/student/security?tab=late-entries' },
  { icon: Shield, label: 'Security', href: '/student/security' },
];

const FIND_HOSTEL_ITEMS = [
  { icon: Search, label: 'Browse', href: '/student/hostels' },
  { icon: Star, label: 'Favorites', href: '/student/hostels/favorites' },
  { icon: ArrowRightLeft, label: 'Compare', href: '/student/hostels/compare' },
];

const FINANCE_ITEMS = [
  { icon: CreditCard, label: 'Payments', href: '/student/payments' },
  { icon: Files, label: 'History', href: '/student/payments/receipts' },
  { icon: Wallet, label: 'Methods', href: '/student/payments/methods' },
];

const ACCOUNT_ITEMS = [
  // Find Hostel Items
  { icon: Search, label: 'Browse', href: '/student/hostels' },
  { icon: Star, label: 'Favorites', href: '/student/hostels/favorites' },
  { icon: ArrowRightLeft, label: 'Compare', href: '/student/hostels/compare' },
  
  // App & Profile
  { icon: User, label: 'Profile', href: '/student/profile' },
  { icon: MessageSquare, label: 'Messages', href: '/student/messages' },
  { icon: Bell, label: 'Notifications', href: '/student/notifications' },
  { icon: LifeBuoy, label: 'Support', href: '/student/support' },
  { icon: Settings, label: 'Settings', href: '/student/settings' },
];

const NavLink = ({ item, active }: { item: any, active: boolean }) => (
    <Link
      href={item.href}
      className={cn(
        'flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 transition-transform duration-100 min-w-[50px] h-full w-full',
        'active:scale-95 touch-manipulation transform-gpu',
        active && 'bg-primary/10'
      )}
    >
      <div className="relative will-change-transform">
        <item.icon 
          className={cn(
            'h-5 w-5 transition-transform duration-200',
            active ? 'text-primary scale-110' : 'text-muted-foreground'
          )}
          strokeWidth={active ? 2.5 : 2}
        />
      </div>
      <span className={cn(
        'text-[10px] font-medium truncate w-full text-center',
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
        'flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 transition-all duration-200 min-w-[50px] h-full w-full',
        'active:scale-95 touch-manipulation',
        isOpen && 'bg-primary/10'
      )}
    >
      <Icon 
        className={cn(
          'h-5 w-5 transition-all duration-200',
          isOpen ? 'text-primary scale-110' : 'text-muted-foreground'
        )}
        strokeWidth={isOpen ? 2.5 : 2}
      />
      <span className={cn(
        'text-[10px] font-medium transition-all duration-200 truncate w-full text-center',
        isOpen ? 'text-primary font-semibold' : 'text-muted-foreground'
      )}>
        {label}
      </span>
    </button>
  );

  const MenuSheet = ({ title, items, isOpen, onOpenChange, pathname }: { title: string, items: any[], isOpen: boolean, onOpenChange: (open: boolean) => void, pathname: string | null }) => (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl p-0 ring-0 focus:ring-0 outline-none">
        <SheetHeader className="sr-only">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Navigation options</SheetDescription>
        </SheetHeader>
        
        <div className="p-4 border-b border-border flex items-center justify-center bg-muted/20 rounded-t-3xl">
          <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full" />
        </div>

        <ScrollArea className="h-full pb-8">
          <div className="p-4 grid grid-cols-3 gap-3">
            {items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border bg-card hover:bg-accent/50 transition-all duration-200 active:scale-95 aspect-square",
                  pathname?.startsWith(item.href) || (item.href.includes('?') && pathname === item.href.split('?')[0]) ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20" : "border-border/50"
                )}
              >
                <div className={cn(
                  "p-2.5 rounded-full bg-background shadow-sm",
                  pathname?.startsWith(item.href) ? "text-primary" : "text-muted-foreground"
                )}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold text-center leading-tight">{item.label}</span>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );

export function StudentBottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = React.useState(true);
  const scrollYRef = React.useRef(0);
  
  // State for sheets
  const [isMyStayOpen, setIsMyStayOpen] = React.useState(false);
  const [isFinanceOpen, setIsFinanceOpen] = React.useState(false);
  const [isAccountOpen, setIsAccountOpen] = React.useState(false);

  // Auto-hide on scroll down, show on scroll up
  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const lastScrollY = scrollYRef.current;
      
      // Always show if near top
      if (currentScrollY < 50) {
        setIsVisible(true);
        scrollYRef.current = currentScrollY;
        return;
      }
      
      // Determine direction
      const isScrollingDown = currentScrollY > lastScrollY;
      const scrollDiff = Math.abs(currentScrollY - lastScrollY);

      // Only toggle visibility if we've scrolled enough to matter
      if (scrollDiff > 10) {
        if (isScrollingDown && currentScrollY > 100) {
           setIsVisible(false);
        } else if (!isScrollingDown) {
           setIsVisible(true);
        }
        scrollYRef.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const is_active = (href: string) => {
    if (href === '/student/dashboard') return pathname === href;
    return pathname?.startsWith(href);
  };

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
        <div className="grid grid-cols-4 h-[68px] items-center px-1">
          {/* 1. Home */}
          <NavLink 
            item={{ label: 'Home', href: '/student/dashboard', icon: Home }} 
            active={is_active('/student/dashboard')} 
          />

          {/* 2. My Stay */}
          <div>
            <MenuButton 
              icon={Building2} 
              label="My Stay" 
              isOpen={isMyStayOpen} 
              onClick={() => setIsMyStayOpen(true)} 
            />
            <MenuSheet 
              title="My Stay" 
              items={MY_STAY_ITEMS} 
              isOpen={isMyStayOpen} 
              onOpenChange={setIsMyStayOpen} 
              pathname={pathname}
            />
          </div>

          {/* 3. Finance */}
          <div>
            <MenuButton 
              icon={CreditCard} 
              label="Finance" 
              isOpen={isFinanceOpen} 
              onClick={() => setIsFinanceOpen(true)} 
            />
            <MenuSheet 
              title="Finance" 
              items={FINANCE_ITEMS} 
              isOpen={isFinanceOpen} 
              onOpenChange={setIsFinanceOpen} 
              pathname={pathname}
            />
          </div>

          {/* 4. Menu */}
          <div>
            <MenuButton 
              icon={Menu} 
              label="More" 
              isOpen={isAccountOpen} 
              onClick={() => setIsAccountOpen(true)} 
            />
            <MenuSheet 
              title="Menu" 
              items={ACCOUNT_ITEMS} 
              isOpen={isAccountOpen} 
              onOpenChange={setIsAccountOpen} 
              pathname={pathname}
            />
          </div>
        </div>
      </nav>
    </>
  );
}

