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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserInitials } from '@/lib/utils/user';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/cn';
import { RumiaLoader } from '@/components/ui/rumia-loader';
import { OrganizationSwitcher } from '@/features/rental/components/organization-switcher';
import { AccountMenu } from '@/components/dashboard/account-menu';
import { NotificationBell } from '@/features/notifications';

export interface DashboardShellNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface DashboardShellProps {
  allowedRoles: UserRole[];
  nav: DashboardShellNavItem[];
  /** Where the top-right account menu's "Settings" item links to. */
  settingsHref: string;
  maxWidth?: string;
  bannerSlot?: React.ReactNode;
  /** OrganizationSwitcher writes to a landlord-scoped store (SelectedOrgStore)
   * — meaningless in shells whose sections are already platform-wide, not
   * org-scoped (e.g. the super-admin shell's own Users/Support sections).
   * Defaults true so every existing caller keeps today's behavior. */
  showOrgSwitcher?: boolean;
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
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {nav.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
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
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );

        if (!collapsed) return link;

        return (
          <Tooltip key={item.href} delayDuration={200}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}

/**
 * Pinned to the bottom-left of the sidebar: who is signed in, and the one-click
 * way out. Collapses to a lone logout icon when the sidebar is collapsed.
 */
function SidebarFooter({
  name,
  email,
  photoUrl,
  collapsed,
  onLogout,
}: {
  name: string;
  email: string;
  photoUrl: string | null;
  collapsed: boolean;
  onLogout: () => void;
}) {
  const logoutButton = (
    <button
      type="button"
      onClick={onLogout}
      aria-label="Log out"
      className={cn(
        'flex items-center gap-2 rounded-xl text-sm font-medium text-destructive transition-colors hover:bg-destructive/10',
        collapsed ? 'h-10 w-10 justify-center' : 'w-full px-3 py-2.5',
      )}
    >
      <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
      {!collapsed && <span>Log out</span>}
    </button>
  );

  return (
    <div className={cn('mt-auto space-y-2 border-t p-3', collapsed && 'flex flex-col items-center')}>
      {!collapsed && (
        <div className="flex items-center gap-3 px-1 py-1">
          <Avatar className="h-9 w-9 shrink-0">
            {photoUrl && <AvatarImage src={photoUrl} alt={name} />}
            <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
              {getUserInitials(name) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
        </div>
      )}
      {collapsed ? (
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>{logoutButton}</TooltipTrigger>
          <TooltipContent side="right">Log out</TooltipContent>
        </Tooltip>
      ) : (
        logoutButton
      )}
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
export function DashboardShell({
  allowedRoles,
  nav,
  settingsHref,
  maxWidth,
  bannerSlot,
  showOrgSwitcher = true,
  children,
}: DashboardShellProps) {
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <RumiaLoader size={96} label="Loading your dashboard" />
      </div>
    );
  }

  const name = user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email : '';
  const firstName = user?.first_name?.trim() || name;
  const email = user?.email ?? '';
  const photoUrl = user?.profile_picture ?? null;
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  return (
    <UnifiedThemeProvider>
      <TooltipProvider>
        <div className="flex min-h-screen bg-muted/40">
          {/* Desktop sidebar */}
          {isDesktop && (
            <aside
              className={cn(
                'sticky top-0 flex h-screen shrink-0 flex-col self-start border-r bg-background transition-all duration-200',
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

              {isSuperAdmin && showOrgSwitcher && <OrganizationSwitcher collapsed={collapsed} />}

              <div className="flex-1 overflow-y-auto py-2">
                <NavLinks nav={nav} collapsed={collapsed} pathname={pathname} />
              </div>

              <SidebarFooter name={name} email={email} photoUrl={photoUrl} collapsed={collapsed} onLogout={logout} />
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
                <div className="ml-auto flex items-center gap-1">
                  <NotificationBell />
                  <AccountMenu name={name} email={email} photoUrl={photoUrl} settingsHref={settingsHref} onLogout={logout} />
                </div>
              </header>
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetContent side="left" className="flex w-72 flex-col p-0">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <div className="flex h-16 items-center px-4">
                    <span className="text-lg font-semibold text-foreground">RumiaRent</span>
                  </div>
                  {isSuperAdmin && showOrgSwitcher && <OrganizationSwitcher collapsed={false} />}
                  <div className="flex-1 overflow-y-auto py-2">
                    <NavLinks nav={nav} collapsed={false} pathname={pathname} onNavigate={() => setMobileNavOpen(false)} />
                  </div>
                  <SidebarFooter name={name} email={email} photoUrl={photoUrl} collapsed={false} onLogout={logout} />
                </SheetContent>
              </Sheet>
            </>
          )}

          <div className="min-w-0 flex-1">
            {isDesktop && (
              <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background px-6">
                <p className="truncate text-sm font-medium text-foreground">Welcome back, {firstName}</p>
                <div className="flex items-center gap-1">
                  <NotificationBell />
                  <AccountMenu name={name} email={email} photoUrl={photoUrl} settingsHref={settingsHref} onLogout={logout} />
                </div>
              </header>
            )}
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
