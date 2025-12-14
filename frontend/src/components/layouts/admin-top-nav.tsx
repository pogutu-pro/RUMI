'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  Bell,
  Menu,
  LogOut,
  User,
  Settings,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  UserPlus,
  Building2,
  Search,
  Info,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/features/auth';
import { useNotifications } from '@/features/notifications';
import { getUserInitials } from '@/lib/utils/user';
import { sanitizeImageUrl } from '@/lib/utils/security';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

// Helper function to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

// Helper function to get notification icon and colors based on type
function getNotificationStyle(type: string): { icon: LucideIcon; color: string; bgColor: string } {
  switch (type) {
    case 'success':
      return { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-500', bgColor: 'bg-emerald-500/10' };
    case 'warning':
      return { icon: AlertCircle, color: 'text-amber-600 dark:text-amber-500', bgColor: 'bg-amber-500/10' };
    case 'error':
      return { icon: X, color: 'text-red-600 dark:text-red-500', bgColor: 'bg-red-500/10' };
    case 'info':
    default:
      return { icon: Info, color: 'text-indigo-600 dark:text-indigo-500', bgColor: 'bg-indigo-500/10' };
  }
}

interface AdminTopNavProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
  isMobile: boolean;
}

export function AdminTopNav({
  onMenuClick,
  isSidebarOpen,
  isMobile,
}: AdminTopNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState('');
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch real notifications from API
  const { data: notificationsData, isLoading: isLoadingNotifications } = useNotifications({ page: 1 });
  const notifications = notificationsData?.results || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Detect which admin context we're in
  const isTechSupport = pathname?.startsWith('/tech-support');
  const baseRoute = isTechSupport ? '/tech-support' : '/admin';
  const roleLabel = isTechSupport ? 'Tech Support' : 'Super Admin';


  const displayName = React.useMemo(() => {
    if (!user) return 'Admin';
    if (user.first_name || user.last_name) {
      return [user.first_name, user.last_name].filter(Boolean).join(' ');
    }
    return user.email.split('@')[0];
  }, [user]);

  const initials = React.useMemo(() => {
    return displayName ? getUserInitials(displayName) : 'AD';
  }, [displayName]);

  const image = React.useMemo(() => {
    const src = user?.profile_picture || user?.avatar;
    return src ? sanitizeImageUrl(src) : undefined;
  }, [user?.profile_picture, user?.avatar]);

  const handleSignOut = React.useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Sign out failed', error);
    }
  }, [logout]);

  const handleSearch = React.useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/admin/search?q=${encodeURIComponent(searchQuery.trim())}`);
      console.log('Searching for:', searchQuery);
    }
  }, [searchQuery, router]);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-md transition-all duration-300"
      )}
    >
      {/* Toggle Button - Positioned at the edge of sidebar */}
      <div 
        className={cn(
          "flex items-center justify-center shrink-0 transition-all duration-300",
          !isMobile && (isSidebarOpen ? "w-72" : "w-20")
        )}
      >
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onMenuClick}
          className="shrink-0"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </div>

      {/* Zone 1: Branding - Logo + RUMI · Admin */}
      <div className="flex items-center gap-2 mr-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-8 w-8">
            <Image src="/images/logo/logo.svg" alt="RUMI Logo" fill className="object-contain" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">RUMI</span>
            <span className="text-xs font-medium tracking-[0.18em] text-indigo-600/70 dark:text-indigo-400/70">· ADMIN</span>
          </div>
        </Link>
      </div>

      {/* Zone 2: Global Search */}
      <div className="flex-1 flex justify-center">
        <form onSubmit={handleSearch} className="w-full max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search users, hostels, transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-20 bg-muted/50 border-muted-foreground/20 focus-visible:ring-indigo-500"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </form>
      </div>

      {/* Zone 3: Utilities */}
      <div className="flex items-center gap-2 pr-4">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-950" />
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Notifications {unreadCount > 0 && `(${unreadCount})`}</p>
                <Link href="/admin/notifications" className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                  View all
                </Link>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="h-[300px]">
              <div className="flex flex-col gap-1 p-1">
                {isLoadingNotifications ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-md p-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-2 w-1/4" />
                      </div>
                    </div>
                  ))
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Bell className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notification) => {
                    const style = getNotificationStyle(notification.type);
                    const IconComponent = style.icon;
                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "flex items-start gap-3 rounded-md p-2 hover:bg-muted transition-colors cursor-pointer",
                          !notification.isRead && "bg-muted/50"
                        )}
                      >
                        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", style.bgColor)}>
                          <IconComponent className={cn("h-4 w-4", style.color)} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="text-sm font-medium leading-none">{notification.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{formatRelativeTime(notification.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button asChild variant="outline" className="w-full justify-center text-xs h-8">
                <Link href="/admin/notifications">
                  View All Notifications
                </Link>
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={image} alt={displayName} />
                <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                <p className="text-xs leading-none text-indigo-600 dark:text-indigo-400 font-medium pt-1">
                  {roleLabel}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`${baseRoute}/profile`}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`${baseRoute}/settings`}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
