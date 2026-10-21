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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { PublicMenuContent } from '@/components/layouts/public-menu-content';
import { AUTH_ROUTES } from '@/lib/constants/routes';
import { RumiaLogoCompact } from '@/components/ui/rumia-animated-logo';
import { useAuthStore } from '@/features/auth/stores/auth.store';

const LOGIN_HREF = AUTH_ROUTES.LOGIN;

interface PublicHeaderProps {
  user?: {
    name: string;
    role: 'tenant' | 'landlord' | 'admin';
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
  const isAuthenticated = useAuthStore((s) => s.status === 'authenticated');
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
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out',
          isScrolled
            ? 'bg-white/80 backdrop-blur-md shadow-lg py-2 xs:py-3'
            : isHome
              ? 'bg-transparent py-4 xs:py-6'
              : 'bg-white/90 backdrop-blur-sm py-3 xs:py-5',
        )}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm group shrink-0"
            >
              <div className="relative h-16 w-16 xs:h-20 xs:w-20 overflow-hidden rounded-lg transition-transform group-hover:scale-105">
                <Image
                  src="/images/logo/logo.png"
                  alt="RumiaRent Logo"
                  width={80}
                  height={80}
                  priority
                  style={{ height: 'auto' }}
                />
              </div>
              <RumiaLogoCompact />
            </Link>

            {/* Center – Quick Links */}
            <div className="flex-1 flex justify-center max-w-4xl mx-auto">
              <nav
                className="hidden lg:flex items-center gap-1"
                aria-label="Main navigation"
              >
                {[
                  { href: '/features', label: 'Features' },
                  { href: '/how-it-works', label: 'How It Works' },
                  { href: '/pricing', label: 'Pricing' },
                  { href: '/about', label: 'About' },
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
                  {isAuthenticated ? (
                    <Link href="/dashboard" className="hidden md:block">
                      <Button size="sm" className="rounded-full">
                        Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href={LOGIN_HREF} className="hidden md:block">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="font-semibold text-primary hover:bg-primary/10"
                        >
                          Sign in
                        </Button>
                      </Link>
                      <Link
                        href={`${AUTH_ROUTES.REGISTER}?role=landlord`}
                        className="hidden md:block"
                      >
                        <Button size="sm" className="rounded-full">
                          Get started
                        </Button>
                      </Link>
                    </>
                  )}
                  <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-primary hover:bg-primary/10"
                        aria-label="Open menu"
                      >
                        <Menu className="h-6 w-6" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="right"
                      className="w-[300px] sm:w-[400px]"
                    >
                      <SheetHeader className="sr-only">
                        <SheetTitle>Navigation Menu</SheetTitle>
                        <SheetDescription>
                          Main navigation menu for accessing public pages.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="flex h-full flex-col pt-8">
                        <PublicMenuContent
                          onClose={() => setIsOpen(false)}
                          excludeHeader
                        />
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
