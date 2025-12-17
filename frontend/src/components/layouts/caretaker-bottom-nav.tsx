'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ClipboardList, 
  MessageSquare, 
  Menu, 
  User, 
  Shield, 
  LifeBuoy, 
  LogOut, 
  Home, 
  Wrench,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/features/auth';

const mainNavItems = [
  { 
    icon: LayoutDashboard, 
    label: 'Home', 
    href: '/caretaker/dashboard',
    match: (path: string) => path === '/caretaker/dashboard' || path === '/caretaker'
  },
  { 
    icon: ClipboardList, 
    label: 'Ops', 
    href: '/caretaker/check-in', // Direct access to widely used feature
    match: (path: string) => path.startsWith('/caretaker/check-in') || path.startsWith('/caretaker/check-out') || path.startsWith('/caretaker/approvals')
  },
  { 
    icon: MessageSquare, 
    label: 'Chat', 
    href: '/caretaker/message',
    match: (path: string) => path.startsWith('/caretaker/message')
  },
];

const menuItems = [
  { icon: Users, label: 'Tenants & Roommates', href: '/caretaker/tenants' },
  { icon: Home, label: 'Rooms & Property', href: '/caretaker/room-management' },
  { icon: Wrench, label: 'Maintenance & Damage', href: '/caretaker/maintenance' },
  { icon: Shield, label: 'Security Logs', href: '/caretaker/security/visitor-logs' },
  { icon: User, label: 'My Profile', href: '/caretaker/profile' },
  { icon: LifeBuoy, label: 'Support', href: '/caretaker/support' },
];

export function CaretakerBottomNav() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { logout } = useAuth();

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Sign out failed', error);
    }
  };

  return (
    <>
      {/* Safe Area Spacer */}
      <div className="h-16 md:hidden" aria-hidden="true" />
      
      {/* Premium Fixed Bottom Bar (Airbnb Style) */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-xl border-t border-border/40 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-around h-16 w-full max-w-lg mx-auto px-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.match(pathname || '');
            
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors duration-200",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn("relative transition-transform duration-200", isActive ? "scale-105" : "")}>
                  <Icon className={cn("h-6 w-6", isActive ? "fill-current" : "fill-none")} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn("text-[10px] font-medium leading-none", isActive ? "font-semibold" : "")}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Menu Trigger */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors duration-200",
                  isMenuOpen 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Menu className="h-6 w-6" strokeWidth={2} />
                <span className="text-[10px] font-medium leading-none">More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh] rounded-t-[20px] p-0 border-t-0 bg-background/95 backdrop-blur-xl z-[60]">
              <SheetHeader className="p-6 text-left border-b">
                <SheetTitle className="text-xl font-bold">Menu</SheetTitle>
              </SheetHeader>
              
              <div className="p-4 grid grid-cols-2 gap-3 overflow-y-auto max-h-[calc(85vh-80px)]">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex flex-col gap-3 p-4 rounded-2xl bg-muted/50 hover:bg-muted active:scale-95 transition-all border border-border/50"
                    >
                      <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center shadow-sm text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="font-semibold text-sm">{item.label}</span>
                    </Link>
                  );
                })}

                <button
                  onClick={handleSignOut}
                  className="col-span-2 flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 mt-4 active:scale-95 transition-all"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-semibold">Sign Out</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </>
  );
}
