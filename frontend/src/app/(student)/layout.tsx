'use client';

import * as React from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { StudentSidebar } from '@/components/layouts/student-sidebar';
import { StudentTopNav } from '@/components/layouts/student-top-nav';
import { StudentBottomNav } from '@/components/layouts/student-bottom-nav';
import { DashboardThemeProvider } from '@/components/providers/dashboard-theme-provider';
import type { Metadata } from 'next';
import { CompareTray } from '@/features/hostels';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app.store';

interface StudentLayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: StudentLayoutProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  
  // Refactored to use Global useAppStore
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  // Persistence logic handles default state, no need for useEffect sync unless enforcing desktop open initially
  // React.useEffect(() => { setIsSidebarOpen(isDesktop); }, [isDesktop]);

  return (
    <DashboardThemeProvider>
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Desktop/Tablet Sidebar - Hidden on Mobile */}
      <div className="hidden md:block">
        <StudentSidebar
          isOpen={isSidebarOpen}
          setIsOpen={setSidebarOpen}
          isMobile={false}
        />
      </div>

      {/* Mobile Sidebar Sheet - Hidden because we use BottomNav on mobile */}
      <div className="hidden">
        <StudentSidebar
          isOpen={isMobileOpen}
          setIsOpen={setIsMobileOpen}
          isMobile={true}
        />
      </div>

      {/* Top Navigation */}
      <StudentTopNav
        onMenuClick={() => {
          if (isDesktop) {
            setSidebarOpen(!isSidebarOpen);
          }
          // Mobile menu disabled in favor of bottom nav
        }}
        isSidebarOpen={isSidebarOpen}
        isMobile={!isDesktop}
      />

      {/* Main Content - Mobile First Padding */}
      <main
        className={cn(
          "relative z-0 transition-all duration-300 ease-in-out min-h-screen",
          // Mobile: edge-to-edge, minimal top padding
          "px-3 pt-16 pb-24 sm:px-4",
          // Desktop: more padding and left margin for sidebar
          "md:px-6 md:pt-20 lg:px-10 lg:py-8",
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

      {/* Bottom Navigation - Mobile Only */}
      <StudentBottomNav />
      
      {/* Global Comparison Tray */}
      <CompareTray comparePath="/student/compare" />
    </div>
    </DashboardThemeProvider>
  );
}
