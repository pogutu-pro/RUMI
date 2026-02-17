'use client';

import * as React from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Bell, Clock, User, Settings, AlertTriangle, CheckCircle, Info, type LucideIcon } from 'lucide-react';

import { useAuth } from '@/features/auth';
import { useNotifications } from '@/features/notifications';
import type { Notification } from '@/features/notifications';
import { LandlordSidebar } from '@/components/layouts/landlord-sidebar';
import { LandlordBottomNav } from '@/components/layouts/landlord-bottom-nav';
import { LandlordTopNav } from '@/components/layouts/landlord-top-nav';
import { UnifiedThemeProvider } from '@/components/providers/unified-theme-provider';

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
import { useUiStore } from '@/stores/ui.store';

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

interface LandlordLayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LandlordLayoutProps) {
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Connect to Global UI Store
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);

  return (
    <UnifiedThemeProvider>
      <div className="min-h-screen bg-background flex">
        {/* Sidebar - Hidden on Mobile */}
        {!isMobile && (
          <LandlordSidebar 
            isOpen={isSidebarOpen} 
            setIsOpen={setSidebarOpen} 
            isMobile={false}
          />
        )}

        <div 
          className={cn(
            "flex-1 min-h-screen transition-all duration-300",
            !isMobile && (isSidebarOpen ? "md:pl-80" : "md:pl-24")
          )}
        >
          <LandlordTopNav 
            isSidebarOpen={isSidebarOpen} 
            isMobile={isMobile} 
            onMenuClick={() => setSidebarOpen(!isSidebarOpen)} 
          />

          {/* Main Content */}
          <main
            id="main-content"
            className={cn(
              "relative z-0 transition-all duration-300 ease-in-out min-h-screen",
              "px-3 pt-4 pb-24 sm:px-4",
              "md:px-6 md:pt-8 md:pb-8 lg:px-8"
            )}
          >
            <div className="mx-auto max-w-6xl xl:max-w-7xl">{children}</div>
          </main>
        </div>

        {/* Bottom Navigation - Mobile Only */}
        <LandlordBottomNav />
      </div>
    </UnifiedThemeProvider>
  );
}
