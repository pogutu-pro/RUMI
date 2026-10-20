'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { ChevronsLeft, ChevronsRight, LogOut, Menu } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { UserRole } from '@/features/auth/stores/auth.types';
import { UnifiedThemeProvider } from '@/components/providers/unified-theme-provider';
import { useUiStore } from '@/stores/ui.store';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getUserInitials } from '@/lib/utils/user';
import { cn } from '@/lib/utils/cn';
import { OrganizationSwitcher } from '@/features/rental/components/organization-switcher';

export interface DashboardShellNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Group heading; a heading is shown whenever it changes between items. */
  section?: string;
  /** Count shown next to the label (e.g. items needing attention). Hidden when 0. */
  badge?: number;
}

/** The nav item for the current page: the longest href that prefixes the path. */
function activeHref(nav: DashboardShellNavItem[], pathname: string) {
  return nav
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

export interface DashboardShellProps {
  allowedRoles: UserRole[];
  nav: DashboardShellNavItem[];
  maxWidth?: string;
  bannerSlot?: React.ReactNode;
  children: React.ReactNode;
}

function NavLinks({
  nav,
  collapsed,
  pathname,
  onNavigate,
}: {
  nav: DashboardShellNavItem[];
  collapsed: boolean;
  pathname: string;
  onNavigate?: () => void;
}) {
  const current = activeHref(nav, pathname);
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3" aria-label="Main">
      {nav.map((item, index) => {
        const isActive = item.href === current;
        const Icon = item.icon;
        const heading = item.section && item.section !== nav[index - 1]?.section ? item.section : null;
        const link = (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-normal transition-colors',
              collapsed && 'justify-center px-0',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <span className="relative">
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {collapsed && !!item.badge && (
                <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-destructive" aria-hidden="true" />
              )}
            </span>
            {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
            {!collapsed && !!item.badge && (
              <span
                className={cn(
                  'min-w-5 rounded-full px-1.5 text-center text-xs font-semibold',
                  isActive ? 'bg-primary-foreground/20' : 'bg-destructive text-destructive-foreground',
                )}
                aria-label={`${item.badge} need attention`}
              >
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </Link>
        );

        const entry = collapsed ? (
          <Tooltip key={item.href} delayDuration={200}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{item.label}{item.badge ? ` (${item.badge})` : ''}</TooltipContent>
          </Tooltip>
        ) : link;

        if (!heading) return entry;
        return (
          <React.Fragment key={item.href}>
            {collapsed ? (
              <div className="mx-2 my-2 border-t" aria-hidden="true" />
            ) : (
              <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {heading}
              </p>
            )}
            {entry}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

function SidebarUserFooter({
  collapsed,
  name,
  email,
  onLogout,
}: {
  collapsed: boolean;
  name: string;
  email: string;
  onLogout: () => void;
}) {
  return (
    <div className="border-t px-3 py-3">
      <div className={cn('flex items-center gap-3', collapsed && 'flex-col')}>
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
            {getUserInitials(name) || 'U'}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        )}
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <button
              onClick={onLogout}
              aria-label="Log out"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Log out</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

/**
 * Shared dashboard chrome — collapsible desktop sidebar, mobile slide-over
 * drawer, avatar/logout footer, and the `allowedRoles` auth-gate. Extracted
 * from the landlord rental layout (the most mature of the four per-role
 * implementations) so every role layout gets identical structure/behavior
 * and the auth-gate is enforced by construction, not copy-paste.
 *
 * The `allowedRoles` check is a client-side UX guard only — the real
 * authorization boundary is the backend RBAC in
 * `Backend/core/permissions/rumia.py`, unchanged by this component.
 */
export function DashboardShell({ allowedRoles, nav, maxWidth, bannerSlot, children }: DashboardShellProps) {
  const { user, status, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const isSidebarOpen = useUiStore((s) => s.isSidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  const collapsed = isDesktop && !isSidebarOpen;

  React.useEffect(() => {
    if (status === 'checking' || status === 'idle') return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (user && !allowedRoles.some((role) => role === user.role)) {
      router.replace('/login');
    }
  }, [status, isAuthenticated, user, router, allowedRoles]);

  if (status === 'checking' || status === 'idle' || !isAuthenticated) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  const name = user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email : '';
  const email = user?.email ?? '';
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  return (
    <UnifiedThemeProvider forcedTheme="light">
      <TooltipProvider>
        <div className="flex min-h-screen bg-muted/40">
          {/* Desktop sidebar */}
          {isDesktop && (
            <aside
              className={cn(
                'sticky top-0 flex h-screen shrink-0 flex-col border-r bg-background transition-all duration-200',
                collapsed ? 'w-[76px]' : 'w-64',
              )}
            >
              <div className={cn('flex h-16 items-center gap-2 px-4', collapsed && 'justify-center px-0')}>
                {!collapsed && <span className="text-lg font-semibold text-foreground">RumiaRent</span>}
                <button
                  onClick={() => setSidebarOpen(!isSidebarOpen)}
                  aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                    !collapsed && 'ml-auto',
                  )}
                >
                  {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
                </button>
              </div>

              {isSuperAdmin && <OrganizationSwitcher collapsed={collapsed} />}

              <div className="flex-1 overflow-y-auto py-2">
                <NavLinks nav={nav} collapsed={collapsed} pathname={pathname} />
              </div>

              <SidebarUserFooter collapsed={collapsed} name={name} email={email} onLogout={logout} />
            </aside>
          )}

          {/* Mobile top bar + drawer */}
          {!isDesktop && (
            <>
              <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b bg-background px-4">
                <button
                  onClick={() => setMobileNavOpen(true)}
                  aria-label="Open menu"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <span className="text-base font-semibold text-foreground">RumiaRent</span>
              </header>
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetContent side="left" className="flex w-72 flex-col p-0">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <div className="flex h-16 items-center px-4">
                    <span className="text-lg font-semibold text-foreground">RumiaRent</span>
                  </div>
                  {isSuperAdmin && <OrganizationSwitcher collapsed={false} />}
                  <div className="flex-1 overflow-y-auto py-2">
                    <NavLinks nav={nav} collapsed={false} pathname={pathname} onNavigate={() => setMobileNavOpen(false)} />
                  </div>
                  <SidebarUserFooter collapsed={false} name={name} email={email} onLogout={logout} />
                </SheetContent>
              </Sheet>
            </>
          )}

          <div className="min-w-0 flex-1">
            <main className={cn('mx-auto space-y-6 px-4 py-6 md:py-8', maxWidth ?? 'max-w-5xl', !isDesktop && 'pt-[4.5rem]')}>
              {bannerSlot}
              {children}
            </main>
          </div>
        </div>
      </TooltipProvider>
    </UnifiedThemeProvider>
  );
}
