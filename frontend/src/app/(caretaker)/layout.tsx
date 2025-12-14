'use client';

import * as React from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Bell, Clock, User, Settings, AlertTriangle, CheckCircle, Info, type LucideIcon } from 'lucide-react';

import { useAuth } from '@/features/auth';
import { useNotifications } from '@/features/notifications';
import type { Notification } from '@/features/notifications';
import { CaretakerSidebar } from '@/components/layouts/caretaker-sidebar';
import { CaretakerBottomNav } from '@/components/layouts/caretaker-bottom-nav';
import { DashboardThemeProvider } from '@/components/providers/dashboard-theme-provider';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils/cn';
import { getUserInitials } from '@/lib/utils/user';
import { sanitizeImageUrl } from '@/lib/utils/security';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useCaretakerStore } from '@/features/caretaker';
import { useAppStore } from '@/stores/app.store';

// Helper functions for notification display
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

function getNotificationStyle(type?: string): { icon: LucideIcon; borderClass: string } {
  switch (type) {
    case 'warning':
    case 'alert':
      return { icon: AlertTriangle, borderClass: 'border-l-amber-500' };
    case 'success':
    case 'booking':
    case 'payment':
      return { icon: CheckCircle, borderClass: 'border-l-green-500' };
    default:
      return { icon: Info, borderClass: 'border-l-blue-500' };
  }
}

interface CaretakerLayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: CaretakerLayoutProps) {
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Real notifications from API
  const { data: notificationsData, isLoading: notificationsLoading } = useNotifications();
  const notifications = notificationsData?.slice(0, 5) || [];
  const unreadCount = notifications.filter((n: Notification) => !n.is_read).length;
  
  // Connect to Global UI Store
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);

  const displayName = React.useMemo(() => {
    if (!user) return 'Caretaker';
    if (user.first_name || user.last_name) {
      return [user.first_name, user.last_name].filter(Boolean).join(' ');
    }
    return user.email;
  }, [user]);

  const initials = React.useMemo(() => {
    return displayName ? getUserInitials(displayName) : 'CT';
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

  return (
    <DashboardThemeProvider>
      <div className="min-h-screen bg-background flex">
        {/* Sidebar - Hidden on Mobile */}
        {!isMobile && (
          <CaretakerSidebar 
            isOpen={isSidebarOpen} 
            setIsOpen={setSidebarOpen} 
            isMobile={false}
          />
        )}

        <div 
          className={cn(
            "flex-1 min-h-screen transition-all duration-300",
            !isMobile && (isSidebarOpen ? "md:pl-72" : "md:pl-20")
          )}
        >
          {/* Top Navigation Bar */}
          <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
                    RUMI · Caretaker
                  </span>
                  <span className="text-sm text-muted-foreground hidden sm:block">
                    Manage daily operations and student needs
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Notifications */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                        >
                          {unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <div className="flex items-center justify-between p-4 border-b">
                      <h3 className="font-semibold">Notifications</h3>
                      {unreadCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {unreadCount} new
                        </Badge>
                      )}
                    </div>
                    <ScrollArea className="h-[400px]">
                      {notificationsLoading ? (
                        <div className="p-4 space-y-3">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="space-y-2">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-3 w-full" />
                              <Skeleton className="h-3 w-1/4" />
                            </div>
                          ))}
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                          <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No notifications</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {notifications.map((notification: Notification) => {
                            const style = getNotificationStyle(notification.type);
                            return (
                              <div
                                key={notification.id}
                                className={cn(
                                  "p-4 hover:bg-muted/50 transition-colors cursor-pointer border-l-4",
                                  !notification.is_read && "bg-muted/30",
                                  style.borderClass
                                )}
                              >
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h4 className="font-medium text-sm">{notification.title}</h4>
                                  {!notification.is_read && (
                                    <span className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {formatRelativeTime(notification.created_at)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                    {notifications.length > 0 && (
                      <div className="p-2 border-t">
                        <Button variant="ghost" size="sm" className="w-full" asChild>
                          <Link href="/caretaker/notifications">View all notifications</Link>
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 gap-2 px-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={image} alt={displayName} />
                        <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-400 text-xs font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden sm:flex flex-col items-start text-left">
                        <span className="text-xs font-medium truncate max-w-[140px]">
                          {displayName}
                        </span>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                          Caretaker
                        </span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/caretaker/profile" className="cursor-pointer flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/caretaker/settings" className="cursor-pointer flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600 dark:text-red-400 cursor-pointer">
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main
            id="main-content"
            className={cn(
              "relative z-0 transition-all duration-300 ease-in-out min-h-screen",
              "px-3 pt-4 pb-20 sm:px-4",
              "md:px-6 md:pt-8 md:pb-8 lg:px-8"
            )}
          >
            <div className="mx-auto max-w-6xl xl:max-w-7xl">{children}</div>
          </main>
        </div>

        {/* Bottom Navigation - Mobile Only */}
        <CaretakerBottomNav />
      </div>
    </DashboardThemeProvider>
  );
}
