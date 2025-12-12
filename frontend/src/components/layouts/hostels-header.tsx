'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/layouts/user-menu';
import { SimpleHostelSearch } from '@/features/hostels';
import { cn } from '@/lib/utils/cn';
import { sanitizeInput, sanitizeImageUrl } from '@/lib/utils/security';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { PublicMenuContent } from '@/components/layouts/public-menu-content';
import { AUTH_ROUTES } from '@/lib/constants/routes';
import { useFiltersStore } from '@/features/hostels';

interface HostelsHeaderProps {
  user?: {
    name: string;
    role: 'student' | 'landlord' | 'admin';
    image?: string;
  } | null;
  onSignOut?: () => Promise<void>;
}

const LOGIN_HREF = AUTH_ROUTES.LOGIN;
const REGISTER_HREF = AUTH_ROUTES.REGISTER;

/**
 * HostelsHeader - Minimalist header specifically for hostels discovery/detail pages
 * Mobile-first design with logo, search, and profile only
 */
export const HostelsHeader = React.memo(function HostelsHeader({
  user,
  onSignOut,
}: HostelsHeaderProps = {}) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  // Handle scroll effect for subtle background change
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
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

  const { setSearchQuery } = useFiltersStore();
  const router = useRouter();

  const handleSearch = React.useCallback((query: string) => {
    setSearchQuery(query);
    if (pathname !== '/hostels') {
      router.push('/hostels');
    }
  }, [pathname, router, setSearchQuery]);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out',
          isScrolled
            ? 'bg-white/98 backdrop-blur-md shadow-sm py-2.5'
            : 'bg-white py-3.5'
        )}
      >
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between gap-3 md:gap-6">
            {/* Left: Logo & Name */}
            <Link
              href="/"
              className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg group shrink-0"
            >
              <div className="relative h-9 w-9 md:h-10 md:w-10 overflow-hidden rounded-xl transition-transform group-hover:scale-105 group-active:scale-95">
                <Image
                  src="/images/logo/logo.svg"
                  alt="RUMI"
                  width={40}
                  height={40}
                  className="object-cover"
                  priority
                />
              </div>
              <span className="font-bold text-xl md:text-2xl tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                RUMI
              </span>
            </Link>

            {/* Center: Search Bar (Hidden on mobile, visible on tablet+) */}
            <div className="hidden md:flex flex-1 max-w-xl mx-auto">
              <SimpleHostelSearch onSearch={handleSearch} />
            </div>

            {/* Right: Profile & Menu */}
            <div className="flex items-center gap-2 shrink-0">
              {sanitizedUser ? (
                <>
                  {/* Desktop: User Menu */}
                  <div className="hidden md:block">
                    <UserMenu
                      userName={sanitizedUser.name}
                      userRole={sanitizedUser.role}
                      userImage={sanitizedUser.image}
                      onSignOut={onSignOut ?? (async () => {})}
                    />
                  </div>
                  
                  {/* Mobile: Profile Icon */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-10 w-10 rounded-full"
                    asChild
                  >
                    <Link href={`/${sanitizedUser.role}/dashboard`}>
                      {sanitizedUser.image ? (
                        <Image
                          src={sanitizedUser.image}
                          alt={sanitizedUser.name}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Hamburger Menu Icon - Desktop */}
                  <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hidden md:flex h-10 w-10 rounded-full text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                      >
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                      <SheetHeader className="sr-only">
                        <SheetTitle>Navigation Menu</SheetTitle>
                        <SheetDescription>Main navigation menu for accessing pages.</SheetDescription>
                      </SheetHeader>
                      <div className="h-full flex flex-col">
                        <div className="mb-6 flex items-center gap-2">
                          <div className="relative h-8 w-8 overflow-hidden rounded-lg">
                            <Image
                              src="/images/logo/logo.svg"
                              alt="RUMI"
                              width={32}
                              height={32}
                              className="object-cover"
                            />
                          </div>
                          <span className="font-bold text-xl tracking-tight">RUMI</span>
                        </div>
                        <PublicMenuContent onClose={() => setIsMenuOpen(false)} />
                      </div>
                    </SheetContent>
                  </Sheet>

                  {/* Profile Icon (Login) - Desktop */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden md:flex h-10 w-10 rounded-full text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                    asChild
                  >
                    <Link href={LOGIN_HREF} aria-label="Log in">
                      <User className="h-6 w-6" />
                    </Link>
                  </Button>
                </div>
              )}

              {/* Mobile Hamburger Menu */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-10 w-10 rounded-full hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle menu</span>
              </Button>
            </div>
          </div>

          {/* Mobile Search Bar & Profile Layout */}
          <div className="md:hidden mt-3 flex items-center gap-3">
            <div className="flex-1">
              <SimpleHostelSearch onSearch={handleSearch} />
            </div>
            {/* Mobile Profile Icon */}
            {!sanitizedUser && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full flex-shrink-0 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                asChild
              >
                <Link href={LOGIN_HREF} aria-label="Log in">
                  <User className="h-6 w-6" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay - Only for authenticated users */}
      {isMobileMenuOpen && sanitizedUser && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex flex-col h-full">
              {/* Menu Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-bold text-lg">Menu</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Menu Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {!sanitizedUser ? (
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full justify-start font-semibold"
                      asChild
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link href={LOGIN_HREF}>
                        <User className="mr-2 h-5 w-5" />
                        Log in
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 font-semibold"
                      asChild
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link href={REGISTER_HREF}>Sign up</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="font-semibold text-gray-900">{sanitizedUser.name}</div>
                      <div className="text-sm text-gray-500 capitalize">{sanitizedUser.role}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full justify-start"
                      asChild
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link href={`/${sanitizedUser.role}/dashboard`}>Dashboard</Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full justify-start"
                      onClick={async () => {
                        setIsMobileMenuOpen(false);
                        await onSignOut?.();
                      }}
                    >
                      Sign out
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer for fixed header */}
      <div
        className={cn(
          'transition-all duration-300',
          isScrolled ? 'h-[72px] md:h-[68px]' : 'h-[140px] md:h-[76px]'
        )}
      />
    </>
  );
});
