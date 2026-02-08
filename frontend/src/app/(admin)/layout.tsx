'use client';

import * as React from 'react';
import type { ReactNode } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { AdminSidebar } from '@/components/layouts/admin-sidebar';
import { AdminTopNav } from '@/components/layouts/admin-top-nav';
import { AdminBottomNav } from '@/components/layouts/admin-bottom-nav';
import { UnifiedThemeProvider } from '@/components/providers/unified-theme-provider';
import { cn } from '@/lib/utils/cn';
import { useUiStore } from '@/stores/ui.store';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: AdminLayoutProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  
  // Use Global UI Store
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  
  return (
    <UnifiedThemeProvider>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
        {/* Desktop/Tablet Sidebar - Hidden on Mobile */}
        <div className="hidden md:block">
          <AdminSidebar
            isOpen={isSidebarOpen}
            setIsOpen={setSidebarOpen}
            isMobile={false}
          />
        </div>

        {/* Bottom Navigation - Mobile Only */}
        <AdminBottomNav />

        {/* Top Navigation */}
        <AdminTopNav
          onMenuClick={() => {
            if (isDesktop) {
              setSidebarOpen(!isSidebarOpen);
            } 
          }}
          isSidebarOpen={isSidebarOpen}
          isMobile={!isDesktop}
        />

        {/* Main Content */}
        <main
          className={cn(
            "relative z-0 transition-all duration-300 ease-in-out min-h-screen",
            "px-3 pt-20 pb-24 sm:px-4",
            "md:px-6 md:pt-24 lg:px-10 lg:py-8",
            isSidebarOpen ? "md:ml-72" : "md:ml-20"
          )}
        >
          <div className={cn(
            "mx-auto w-full md:max-w-6xl xl:max-w-7xl"
          )}>
            {children}
          </div>
        </main>
      </div>
    </UnifiedThemeProvider>
  );
}
