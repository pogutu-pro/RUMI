'use client';

/**
 * Mobile Bottom Navigation for public pages
 * Sticky navigation bar with Home, Pricing, Profile, and More tabs
 */

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CreditCard, User, Menu } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { PublicMenuContent } from '@/components/layouts/public-menu-content';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: <Home className="h-5 w-5" />,
  },
  {
    href: '/pricing',
    label: 'Pricing',
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: <User className="h-5 w-5" />,
  },
  {
    href: '/more',
    label: 'More',
    icon: <Menu className="h-5 w-5" />,
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = React.useState(true);
  const [lastScrollY, setLastScrollY] = React.useState(0);
  const [isOpen, setIsOpen] = React.useState(false);

  // Auto-hide on scroll down, show on scroll up (only applies after significant scroll)
  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Always show near the top
      if (currentScrollY < 50) {
        setIsVisible(true);
        setLastScrollY(currentScrollY);
        return;
      }
      
      // Show if scrolling up
      if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      } 
      // Hide if scrolling down and past threshold
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const is_active = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 md:hidden',
        'bg-white border-t border-gray-200',
        'transition-transform duration-300 ease-in-out',
        'pb-safe-bottom',
        'shadow-[0_-2px_10px_rgba(0,0,0,0.05)]',
        isVisible ? 'translate-y-0' : 'translate-y-full'
      )}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const active = is_active(item.href);
          
          if (item.href === '/more') {
             return (
                <Sheet key={item.href} open={isOpen} onOpenChange={setIsOpen}>
                  <SheetTrigger asChild>
                    <button
                      className={cn(
                        'flex flex-col items-center justify-center gap-1',
                        'min-w-[64px] h-14 rounded-lg',
                        'transition-all duration-200',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        isOpen
                          ? 'text-primary'
                          : 'text-gray-500 hover:text-gray-900 active:scale-95'
                      )}
                    >
                      <div
                        className={cn(
                          'transition-all duration-200',
                          isOpen && 'scale-110'
                        )}
                      >
                        {item.icon}
                      </div>
                      <span
                        className={cn(
                          'text-xs font-medium transition-all',
                          isOpen ? 'font-semibold' : 'font-normal'
                        )}
                      >
                        {item.label}
                      </span>
                    </button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[85vh] rounded-none p-0 border-t-2 border-primary">
                     <SheetHeader className="sr-only">
                         <SheetTitle>Navigation Menu</SheetTitle>
                         <SheetDescription>Mobile navigation menu for accessing additional pages.</SheetDescription>
                     </SheetHeader>
                     <div className="flex flex-col h-full">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <span className="font-bold text-lg text-primary uppercase tracking-widest">More</span>
                            <div className="w-12 h-1.5 bg-gray-100 rounded-full" />
                        </div>
                        <PublicMenuContent 
                          onClose={() => setIsOpen(false)} 
                          isGrid 
                          excludeItems={['/', '/pricing']}
                        />
                     </div>
                  </SheetContent>
                </Sheet>
             );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1',
                'min-w-[64px] h-14 rounded-lg',
                'transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                active
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-gray-900 active:scale-95'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <div
                className={cn(
                  'transition-all duration-200',
                  active && 'scale-110'
                )}
              >
                {item.icon}
              </div>
              <span
                className={cn(
                  'text-xs font-medium transition-all',
                  active ? 'font-semibold' : 'font-normal'
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
