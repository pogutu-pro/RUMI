'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useIsFetching } from '@tanstack/react-query';
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
  
  // Track global loading state for hostels to show spinner in search
  const isFetching = useIsFetching({ queryKey: ['hostels'] });

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
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out border-b',
          isScrolled
            ? 'bg-white border-gray-200 py-3 shadow-sm'
            : 'bg-white border-transparent py-4'
        )}
      >
        <div className="container mx-auto px-4 lg:px-6">
          <div className="grid grid-cols-12 gap-4 items-center">
            
            {/* Left: Brand (3 cols) */}
            <div className="col-span-3 lg:col-span-3 flex items-center">
              <Link
                href="/"
                className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 rounded-lg group"
              >
                <div className="relative h-8 w-8 overflow-hidden rounded-lg transition-transform group-hover:scale-105">
                  <Image
                    src="/images/logo/logo.svg"
                    alt="RUMI"
                    width={32}
                    height={32}
                    className="object-contain"
                    priority
                    style={{ height: 'auto' }}
                  />
                </div>
                <span className="font-bold text-lg tracking-tight text-gray-900 hidden sm:inline-block">
                  RUMI
                </span>
              </Link>
            </div>

            {/* Center: Search (6 cols) - Hidden on mobile, visible on tablet+ */}
            <div className="hidden md:flex col-span-6 justify-center">
              <SimpleHostelSearch 
                onSearch={handleSearch} 
                className="w-full max-w-sm" 
                isLoading={isFetching > 0}
              />
            </div>

            {/* Right: Actions (3 cols) */}
            <div className="col-span-9 md:col-span-3 flex justify-end items-center gap-3">
              {sanitizedUser ? (
                <>
                  <div className="hidden md:block">
                    <UserMenu
                      userName={sanitizedUser.name}
                      userRole={sanitizedUser.role}
                      userImage={sanitizedUser.image}
                      onSignOut={onSignOut ?? (async () => {})}
                    />
                  </div>
                  
                  {/* Mobile Profile Trigger */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden h-9 w-9 rounded-full border border-gray-200"
                    asChild
                  >
                    <Link href={`/${sanitizedUser.role}/dashboard`}>
                      {sanitizedUser.image ? (
                        <Image
                          src={sanitizedUser.image}
                          alt={sanitizedUser.name}
                          width={36}
                          height={36}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4 text-gray-700" />
                      )}
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                    <SheetTrigger asChild>
                      <Button
                        className="h-10 px-6 rounded-md text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm active:scale-95"
                      >
                        Menu
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0">
                       <div className="h-full flex flex-col pt-6 px-6">
                        <div className="mb-8 flex items-center gap-2">
                          <div className="relative h-7 w-7 rounded-sm overflow-hidden">
                             <Image src="/images/logo/logo.svg" alt="RUMI" fill className="object-cover" />
                          </div>
                          <span className="font-bold text-lg tracking-tight">RUMI</span>
                        </div>
                        <PublicMenuContent onClose={() => setIsMenuOpen(false)} />
                      </div>
                    </SheetContent>
                  </Sheet>
                  
                  {/* Login/Signup Links for Desktop - Optional based on "Action" requirement.
                      Keeping it minimal as per "Menu" instruction, but usually "Log in" is distinct.
                      If user said "remove login icon entirely", we stick to Menu. 
                  */}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Search Bar Row */}
          <div className="md:hidden mt-3 pb-1">
            <SimpleHostelSearch onSearch={handleSearch} isLoading={isFetching > 0} />
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay - Only for authenticated users */}
      {isMobileMenuOpen && sanitizedUser && (
        <div className="fixed inset-0 z-40 bg-black/40 duration-200">
          <div className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-sm duration-300">
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
