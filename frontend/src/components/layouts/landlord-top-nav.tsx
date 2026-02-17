import * as React from 'react';
import Link from 'next/link';
import { Bell, User, Settings, LogOut, PanelLeft } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useNotifications } from '@/features/notifications';
import { Notification } from '@/features/notifications';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, CheckCircle, AlertTriangle, Info, type LucideIcon } from 'lucide-react';

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

function getNotificationStyle(type?: string): { icon: LucideIcon; borderClass: string; textClass: string; bgClass: string } {
  switch (type) {
    case 'warning':
    case 'alert':
      return { icon: AlertTriangle, borderClass: 'border-l-warning', textClass: 'text-warning', bgClass: 'bg-warning/10' };
    case 'success':
    case 'booking':
    case 'payment':
      return { icon: CheckCircle, borderClass: 'border-l-success', textClass: 'text-success', bgClass: 'bg-success/10' };
    default:
      return { icon: Info, borderClass: 'border-l-info', textClass: 'text-info', bgClass: 'bg-info/10' };
  }
}

interface LandlordTopNavProps {
  onMenuClick?: () => void;
  isSidebarOpen?: boolean;
  isMobile?: boolean;
}

export function LandlordTopNav({ onMenuClick, isSidebarOpen, isMobile }: LandlordTopNavProps) {
  const { user, logout } = useAuth();
  
  // Real notifications from API
  const { data: notificationsData, isLoading: notificationsLoading } = useNotifications();
  const notifications = notificationsData?.data?.slice(0, 5) || [];
  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  const displayName = React.useMemo(() => {
    if (!user) return 'Landlord';
    if (user.first_name || user.last_name) {
      return [user.first_name, user.last_name].filter(Boolean).join(' ');
    }
    return user.email;
  }, [user]);

  const initials = React.useMemo(() => {
    return displayName ? getUserInitials(displayName) : 'LL';
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
    <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-muted-foreground hover:text-foreground"
            onClick={onMenuClick}
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <PanelLeft className="h-6 w-6" />
          </Button>
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-foreground">
              RUMI · Landlord
            </span>
            <span className="text-sm font-medium text-muted-foreground hidden sm:block">
              Manage your properties and tenants
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground" />
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
                <h3 className="font-semibold text-foreground">Notifications</h3>
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
                  <div className="divide-y border-border">
                    {notifications.map((notification: Notification) => {
                      const style = getNotificationStyle(notification.type);
                      return (
                          <div
                          key={notification.id}
                          className={cn(
                            "p-4 hover:bg-muted/50 transition-colors cursor-pointer border-l-4",
                            !notification.isRead && "bg-muted/30",
                            style.borderClass
                          )}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-sm text-foreground">{notification.title}</h4>
                            {!notification.isRead && (
                              <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(notification.createdAt)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
              {notifications.length > 0 && (
                <div className="p-2 border-t">
                  <Button variant="ghost" size="sm" className="w-full text-primary hover:text-primary/80" asChild>
                    <Link href="/landlord/notifications">View all notifications</Link>
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>


          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 gap-2 px-2 group">
                <Avatar className="h-8 w-8 ring-offset-background transition-all group-hover:ring-2 group-hover:ring-primary">
                  <AvatarImage src={image} alt={displayName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start text-left">
                  <span className="text-xs font-semibold truncate max-w-[140px] text-foreground">
                    {displayName}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    Landlord
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-foreground">My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/landlord/profile" className="cursor-pointer flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/landlord/settings" className="cursor-pointer flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
