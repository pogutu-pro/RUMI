'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Menu,
  Search,
  LogOut,
  User,
  Settings,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
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
import { getUserInitials } from '@/lib/utils/user';
import { sanitizeImageUrl } from '@/lib/utils/security';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

interface StudentTopNavProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
  isMobile: boolean;
}

const dummyNotifications = [
  {
    id: 1,
    title: 'Rent Payment Due',
    message: 'Your rent for December is due in 3 days.',
    time: '2 hours ago',
    icon: AlertCircle,
    color: 'text-amber-600 dark:text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    id: 2,
    title: 'New Roommate Request',
    message: 'John Doe sent you a roommate request.',
    time: '5 hours ago',
    icon: User,
    color: 'text-blue-600 dark:text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: 3,
    title: 'Maintenance Completed',
    message: 'The issue with the WiFi has been resolved.',
    time: '1 day ago',
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
];

export function StudentTopNav({
  onMenuClick,
  isSidebarOpen,
  isMobile,
}: StudentTopNavProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const displayName = React.useMemo(() => {
    if (!user) return 'Student';
    if (user.first_name || user.last_name) {
      return [user.first_name, user.last_name].filter(Boolean).join(' ');
    }
    return user.email;
  }, [user]);

  const initials = React.useMemo(() => {
    return displayName ? getUserInitials(displayName) : '';
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
      // Navigate to search results page with query
      router.push(`/student/search?q=${encodeURIComponent(searchQuery.trim())}`);
      console.log('Searching for:', searchQuery);
    }
  }, [searchQuery, router]);

  React.useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

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

      {/* Zone 1: Branding - Logo + RUMI */}
      <div className="flex items-center gap-2 mr-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-8 w-8">
            <Image src="/images/logo/logo.svg" alt="RUMI Logo" fill className="object-contain" />
          </div>
          <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">RUMI</span>
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
              placeholder="Search hostels, bookings, payments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-20 bg-muted/50 border-muted-foreground/20 focus-visible:ring-emerald-500"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </form>
      </div>

      {/* Zone 3: Utilities */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-950" />
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Notifications</p>
                <Link href="/student/notifications" className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                  View all
                </Link>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ScrollArea className="h-[300px]">
              <div className="flex flex-col gap-1 p-1">
                {dummyNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-3 rounded-md p-2 hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", notification.bgColor)}>
                      <notification.icon className={cn("h-4 w-4", notification.color)} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium leading-none">{notification.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{notification.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button asChild variant="outline" className="w-full justify-center text-xs h-8">
                <Link href="/student/notifications">
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
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {initials || 'ST'}
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
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/student/profile">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/student/settings">
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
