'use client';

import * as React from 'react';
import type { ReactNode } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { LandlordSidebar } from '@/components/layouts/landlord-sidebar';
import { LandlordBottomNav } from '@/components/layouts/landlord-bottom-nav';
import { LandlordTopNav } from '@/components/layouts/landlord-top-nav';
import { DashboardThemeProvider } from '@/components/providers/dashboard-theme-provider';
import { cn } from '@/lib/utils/cn';
import { useAppStore } from '@/stores/app.store';

interface LandlordLayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LandlordLayoutProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  
  // Refactored to use Global Store for persistence
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  // Initialize sidebar state based on screen size (only set valid defaults if not manually overridden, 
  // or rely on store persistence. For now, sync with desktop if it's a fresh load?)
  // Actually, standard pattern: Persistence holds truth. 
  // But on mobile, we might want it closed by default.
  // We'll let the persistent store decide, but maybe enforce closed on mobile initially?
  // Let's stick to the store's decision for desktop.

  return (
    <DashboardThemeProvider>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
        {/* Desktop/Tablet Sidebar - Hidden on Mobile */}
        <div className="hidden md:block">
          <LandlordSidebar
            isOpen={isSidebarOpen}
            setIsOpen={setSidebarOpen} 
            isMobile={false}
          />
        </div>

        {/* Bottom Navigation - Mobile Only */}
        <LandlordBottomNav />

        {/* Top Navigation */}
        <LandlordTopNav
          onMenuClick={() => {
            if (isDesktop) {
              setSidebarOpen(!isSidebarOpen);
            } else {
              setIsMobileOpen(!isMobileOpen);
            }
          }}
          isSidebarOpen={isSidebarOpen}
          isMobile={!isDesktop}
        />

        {/* Main Content - Mobile First Padding */}

          <main
            className={cn(
              "relative z-0 transition-all duration-300 ease-in-out min-h-screen",
              // Mobile: edge-to-edge, minimal top padding since Header is sticky
              "px-3 pt-4 pb-24 sm:px-4", // Added pb-24 for bottom nav space on mobile
              // Desktop: more padding and left margin for sidebar
              "md:px-6 md:pt-10 lg:px-10 lg:py-8",
              isDesktop && isSidebarOpen && "md:ml-64"
            )}
          >
          <div className={cn(
            "mx-auto",
            // Mobile: full width
            "w-full",
            // Desktop: constrained width
            "md:max-w-6xl xl:max-w-7xl"
          )}>
            {children}
          </div>
        </main>
      </div>
    </DashboardThemeProvider>
  );
}
