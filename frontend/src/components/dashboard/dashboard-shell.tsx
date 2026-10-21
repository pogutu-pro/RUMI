'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { ChevronsLeft, ChevronsRight, Menu } from 'lucide-react';
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
import { useUnreadMessageCount } from '@/features/messaging';

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
  /** Where the top-right account menu's "Settings" item links to. */
  settingsHref: string;
  maxWidth?: string;
  bannerSlot?: React.ReactNode;
  /** OrganizationSwitcher writes to a landlord-scoped store (SelectedOrgStore)
   * — meaningless in shells whose sections are already platform-wide, not
   * org-scoped (e.g. the super-admin shell's own Users/Support sections).
   * Defaults true so every existing caller keeps today's behavior. */
  showOrgSwitcher?: boolean;
  /** Phones: up to four everyday destinations in a bottom tab bar (plus Menu
   * for everything else). Labels should be one short word. */
  mobileTabs?: { href: string; label: string; icon: LucideIcon }[];
  children: React.ReactNode;
}

/**
 * Bottom tab bar for phones: where the thumb rests, with the everyday pages one
 * tap away and "Menu" opening the full list. Counts come from the side nav.
 */
function MobileTabBar({
  tabs,
  nav,
  pathname,
  badges,
  onMenu,
}: {
  tabs: { href: string; label: string; icon: LucideIcon }[];
  nav: DashboardShellNavItem[];
  pathname: string;
  badges: Record<string, number>;
  onMenu: () => void;
}) {
  const current = activeHref(nav, pathname);
  const inTabs = tabs.some((t) => t.href === current);
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-background/85 dark:bg-card/95 dark:supports-[backdrop-filter]:bg-card/85"
    >
      <ul className="mx-auto flex h-16 max-w-md items-stretch">
        {tabs.map((tab) => {
          const active = tab.href === current;
          const item = nav.find((n) => n.href === tab.href);
          const count = (item?.badge ?? 0) + (badges[tab.href] ?? 0);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium',
                  active ? 'text-primary' : 'text-foreground/60',
                )}
              >
                <span className="relative">
                  <Icon className="h-[22px] w-[22px]" aria-hidden="true" strokeWidth={active ? 2.25 : 1.75} />
                  {count > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          <button
            type="button"
            onClick={onMenu}
            className={cn(
              'flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] font-medium',
              !inTabs ? 'text-primary' : 'text-foreground/60',
            )}
          >
            <Menu className="h-[22px] w-[22px]" aria-hidden="true" strokeWidth={!inTabs ? 2.25 : 1.75} />
            Menu
          </button>
        </li>
      </ul>
    </nav>
  );
}

function NavLinks({
  nav,
  collapsed,
  pathname,
  onNavigate,
  badges = {},
}: {
  nav: DashboardShellNavItem[];
  collapsed: boolean;
  pathname: string;
  onNavigate?: () => void;
  /** Unread counts keyed by nav href. */
  badges?: Record<string, number>;
}) {
  const current = activeHref(nav, pathname);
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3" aria-label="Main">
      {nav.map((item, index) => {
        const isActive = item.href === current;
        const Icon = item.icon;
        const heading = item.section && item.section !== nav[index - 1]?.section ? item.section : null;
        // Attention counts come with the nav item; unread chat counts arrive keyed by href.
        const count = (item.badge ?? 0) + (badges[item.href] ?? 0);
        const link = (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors',
              collapsed && 'justify-center px-0',
              // A soft tint with brand-coloured text marks the current page
              // (as Linear, Notion and GitHub do); a solid block glares,
              // most of all in dark mode.
              isActive
                ? 'bg-primary/10 font-medium text-primary dark:bg-primary/15'
                : 'text-foreground/70 hover:bg-muted hover:text-foreground',
            )}
          >
            <span className="relative">
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {collapsed && count > 0 && (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background" aria-hidden="true" />
              )}
            </span>
            {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
            {!collapsed && count > 0 && (
              <span
                aria-label={`${count} need attention`}
                className={cn(
                  'ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold',
                  'bg-destructive text-destructive-foreground',
                )}
              >
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>
        );

        const entry = collapsed ? (
          <Tooltip key={item.href} delayDuration={200}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{item.label}{count ? ` (${count})` : ''}</TooltipContent>
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

/**
 * Wraps the nav links so the list scrolls internally instead of pushing the
 * account footer down — but a plain `overflow-y-auto` div gives no hint that
 * there's more below: the last item just gets sliced off mid-row with no
 * scrollbar or fade, which reads as broken rather than scrollable on any
 * screen too short to fit every item (a landlord's 12-item nav on a
 * laptop-height window, for one). This adds that hint back.
 */
function NavScrollArea({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex-1">
      <div className="h-full overflow-y-auto py-2">{children}</div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}

/**
 * Pinned to the bottom-left of the sidebar: who is signed in, linking to
 * Settings. Signing out lives on the Settings page, not one tap away here.
 */
function SidebarFooter({
  name,
  email,
  photoUrl,
  collapsed,
  settingsHref,
  onNavigate,
}: {
  name: string;
  email: string;
  photoUrl: string | null;
  collapsed: boolean;
  settingsHref: string;
  onNavigate?: () => void;
}) {
  const avatar = (
    <Avatar className="h-9 w-9 shrink-0">
      {photoUrl && <AvatarImage src={photoUrl} alt={name} />}
      <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
        {getUserInitials(name) || 'U'}
      </AvatarFallback>
    </Avatar>
  );

  if (collapsed) {
    return (
      <div className="mt-auto flex justify-center border-t p-3">
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <Link href={settingsHref} aria-label="Settings" className="rounded-full transition-opacity hover:opacity-80">
              {avatar}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Settings</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="mt-auto border-t p-3">
      <Link
        href={settingsHref}
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted"
      >
        {avatar}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
      </Link>
    </div>
  );
}

/**
 * Shared dashboard chrome — collapsible desktop sidebar, mobile slide-over
 * drawer, avatar footer, and the `allowedRoles` auth-gate. Extracted
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
  mobileTabs,
  children,
}: DashboardShellProps) {
  const { user, status, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const isSidebarOpen = useUiStore((s) => s.isSidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const { data: unreadMessages = 0 } = useUnreadMessageCount(isAuthenticated);
  const navBadges = React.useMemo(
    () => Object.fromEntries(nav.filter((n) => n.href.endsWith('/messages')).map((n) => [n.href, unreadMessages])),
    [nav, unreadMessages],
  );

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
        <div className="flex min-h-screen bg-muted/40 dark:bg-background">
          {/* Desktop sidebar */}
          {isDesktop && (
            <aside
              className={cn(
                'sticky top-0 flex h-screen shrink-0 flex-col self-start border-r bg-background transition-all duration-200 dark:bg-card',
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

              <NavScrollArea>
                <NavLinks nav={nav} collapsed={collapsed} pathname={pathname} badges={navBadges} />
              </NavScrollArea>

              <SidebarFooter name={name} email={email} photoUrl={photoUrl} collapsed={collapsed} settingsHref={settingsHref} />
            </aside>
          )}

          {/* Mobile top bar + drawer */}
          {!isDesktop && (
            <>
              <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b bg-background px-4 dark:bg-card">
                {/* With a bottom tab bar, Menu lives there; one menu button, not two. */}
                {!mobileTabs?.length && (
                  <button
                    onClick={() => setMobileNavOpen(true)}
                    aria-label="Open menu"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                )}
                <span className="text-base font-semibold text-foreground">
                  Rumia<span className="text-primary">Rent</span>
                </span>
                <div className="ml-auto flex items-center gap-1">
                  <NotificationBell />
                  <AccountMenu name={name} email={email} photoUrl={photoUrl} settingsHref={settingsHref} />
                </div>
              </header>
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetContent side="left" className="flex w-72 flex-col p-0 dark:bg-card">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <div className="flex h-16 items-center px-4">
                    <span className="text-lg font-semibold text-foreground">RumiaRent</span>
                  </div>
                  {isSuperAdmin && showOrgSwitcher && <OrganizationSwitcher collapsed={false} />}
                  <NavScrollArea>
                    <NavLinks nav={nav} collapsed={false} pathname={pathname} badges={navBadges} onNavigate={() => setMobileNavOpen(false)} />
                  </NavScrollArea>
                  <SidebarFooter name={name} email={email} photoUrl={photoUrl} collapsed={false} settingsHref={settingsHref} onNavigate={() => setMobileNavOpen(false)} />
                </SheetContent>
              </Sheet>
            </>
          )}

          <div className="min-w-0 flex-1">
            {isDesktop && (
              <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-background px-6 dark:bg-card">
                <p className="truncate text-sm font-medium text-foreground">Welcome back, {firstName}</p>
                <div className="flex items-center gap-1">
                  <NotificationBell />
                  <AccountMenu name={name} email={email} photoUrl={photoUrl} settingsHref={settingsHref} />
                </div>
              </header>
            )}
            <main
              className={cn(
                'mx-auto space-y-6 px-4 py-6 md:py-8',
                maxWidth ?? 'max-w-5xl',
                !isDesktop && 'pt-[4.5rem]',
                !isDesktop && mobileTabs?.length && 'pb-28',
              )}
            >
              {bannerSlot}
              {children}
            </main>
            {!isDesktop && mobileTabs && mobileTabs.length > 0 && (
              <MobileTabBar
                tabs={mobileTabs}
                nav={nav}
                pathname={pathname}
                badges={navBadges}
                onMenu={() => setMobileNavOpen(true)}
              />
            )}
          </div>
        </div>
      </TooltipProvider>
    </UnifiedThemeProvider>
  );
}
