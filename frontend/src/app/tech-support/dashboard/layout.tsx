'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { LifeBuoy, ChevronsLeft, ChevronsRight, LogOut, Menu } from 'lucide-react';
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

function SidebarContent({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex flex-1 flex-col px-3">
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground shadow-sm',
          collapsed && 'justify-center px-0',
        )}
      >
        <LifeBuoy className="h-5 w-5 shrink-0" aria-hidden="true" />
        {!collapsed && <span>Tickets</span>}
      </div>
    </div>
  );
}

function SidebarUserFooter({ collapsed, name, email, onLogout }: { collapsed: boolean; name: string; email: string; onLogout: () => void }) {
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
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
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

/** Tech support's own dashboard — ticket queue across every organization. */
export default function TechSupportLayout({ children }: { children: React.ReactNode }) {
  const { user, status, isAuthenticated, logout } = useAuth();
  const router = useRouter();
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
    if (
      user &&
      user.role !== UserRole.TECH_SUPPORT &&
      user.role !== UserRole.TECH_SUPPORT_ADMIN &&
      user.role !== UserRole.SUPER_ADMIN
    ) {
      router.replace('/login');
    }
  }, [status, isAuthenticated, user, router]);

  if (status === 'checking' || status === 'idle' || !isAuthenticated) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  const name = user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email : '';
  const email = user?.email ?? '';

  return (
    <UnifiedThemeProvider forcedTheme="light">
      <TooltipProvider>
        <div className="flex min-h-screen bg-muted/40">
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

              <div className="flex-1 overflow-y-auto py-2">
                <SidebarContent collapsed={collapsed} />
              </div>

              <SidebarUserFooter collapsed={collapsed} name={name} email={email} onLogout={logout} />
            </aside>
          )}

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
                  <div className="flex-1 overflow-y-auto py-2">
                    <SidebarContent collapsed={false} />
                  </div>
                  <SidebarUserFooter collapsed={false} name={name} email={email} onLogout={logout} />
                </SheetContent>
              </Sheet>
            </>
          )}

          <div className="min-w-0 flex-1">
            <main className={cn('mx-auto max-w-4xl px-4 py-6 md:py-8', !isDesktop && 'pt-[4.5rem]')}>{children}</main>
          </div>
        </div>
      </TooltipProvider>
    </UnifiedThemeProvider>
  );
}
