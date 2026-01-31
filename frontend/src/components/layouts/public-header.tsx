'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/layouts/user-menu';
import { cn } from '@/lib/utils/cn';
import { sanitizeInput, sanitizeImageUrl } from '@/lib/utils/security';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { PublicMenuContent } from '@/components/layouts/public-menu-content';
import { AUTH_ROUTES } from '@/lib/constants/routes';

const LOGIN_HREF = AUTH_ROUTES.LOGIN;

interface PublicHeaderProps {
  user?: {
    name: string;
    role: 'student' | 'landlord' | 'admin';
    image?: string;
  } | null;
  onSignOut?: () => Promise<void>;
}

export const PublicHeader = React.memo(function PublicHeader({
  user,
  onSignOut,
}: PublicHeaderProps = {}) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  // Handle scroll effect
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const sanitizedUser = React.useMemo(() => {
    if (!user) return null;
    return {
      name: sanitizeInput(user.name),
      role: user.role,
      image: user.image ? sanitizeImageUrl(user.image) : undefined,
    };
  }, [user]);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out',
          isScrolled
            ? 'bg-white shadow-sm py-2 xs:py-3'
            : isHome
            ? 'bg-transparent py-3 xs:py-5'
            : 'bg-white py-3 xs:py-4'
        )}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm group shrink-0"
            >
              <div className="relative h-8 w-8 xs:h-9 xs:w-9 overflow-hidden rounded-lg transition-transform group-hover:scale-105">
                <Image
                  src="/images/logo/logo.svg"
                  alt="RUMI"
                  width={36}
                  height={36}
                  priority
                  style={{ height: 'auto' }}
                />
              </div>
              <span
                className={cn(
                  'font-bold text-lg xs:text-xl hidden sm:block tracking-tight transition-colors',
                  !isScrolled && isHome ? 'text-primary' : 'text-primary',
                )}
              >
                RUMI
              </span>
            </Link>

            {/* Center – Quick Links */}
            <div className="flex-1 flex justify-center max-w-4xl mx-auto">
              <nav
                className="hidden lg:flex items-center gap-1"
                aria-label="Main navigation"
              >
                {[
                    { href: '/hostels', label: 'Find a Hostel' },
                    { href: '/host', label: 'List your Hostel' },
                    { href: '/about', label: 'About Us' },
                    { href: '/pricing', label: 'Pricing' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'px-4 py-2 text-lg font-bold transition-colors',
                      pathname.startsWith(item.href)
                        ? 'text-primary underline decoration-2 underline-offset-8'
                        : 'text-primary hover:text-primary/80',
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3 shrink-0">

              {sanitizedUser ? (
                <UserMenu
                  userName={sanitizedUser.name}
                  userRole={sanitizedUser.role}
                  userImage={sanitizedUser.image}
                  onSignOut={onSignOut ?? (async () => {})}
                />
              ) : (
                <div className="flex items-center gap-2">
                    {/* Menu Icon */}
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                      <SheetTrigger asChild>
                        <Button
                          variant="ghost"
                          className={cn(
                            "hidden lg:flex font-black text-sm tracking-widest text-primary hover:bg-primary/10",
                          )}
                        >
                          MENU
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                        <SheetHeader className="sr-only">
                          <SheetTitle>Navigation Menu</SheetTitle>
                          <SheetDescription>Main navigation menu for accessing public pages.</SheetDescription>
                        </SheetHeader>
                        <div className="h-full flex flex-col pt-8">
                            <PublicMenuContent onClose={() => setIsOpen(false)} excludeHeader />
                        </div>
                      </SheetContent>
                    </Sheet>

                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      {/* Spacer for fixed header on non-home pages */}
      {!isHome && <div className="h-20" />}
    </>
  );
});

