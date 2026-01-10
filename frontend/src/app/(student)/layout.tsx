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
      <div className="min-h-screen bg-background flex">
        {/* Desktop Sidebar - Hidden on Mobile */}
        <div className="hidden md:block">
          <StudentSidebar
            isOpen={isSidebarOpen}
            setIsOpen={setSidebarOpen}
            isMobile={false}
          />
        </div>

        {/* Mobile Sidebar - Managed via Sheet/BottomNav logic if needed, currently hidden */}
        
        <div 
          className={cn(
            "flex-1 min-h-screen transition-all duration-300 flex flex-col",
            isDesktop && (isSidebarOpen ? "md:pl-72" : "md:pl-20")
          )}
        >
          {/* Top Navigation */}
          <StudentTopNav
            onMenuClick={() => {
              if (isDesktop) {
                setSidebarOpen(!isSidebarOpen);
              }
            }}
            isMobile={!isDesktop}
          />

          {/* Main Content */}
          <main
            className={cn(
              "flex-1 relative z-0 transition-all duration-300 ease-in-out overflow-hidden",
              // Mobile: edge-to-edge
              "px-3 pt-4 pb-24 sm:px-4",
              // Desktop: consistent padding
              "md:px-6 md:pt-8 md:pb-8 lg:px-8"
            )}
          >
            <div className="mx-auto max-w-6xl xl:max-w-7xl">
              {children}
            </div>
          </main>
        </div>

        {/* Bottom Navigation - Mobile Only */}
        <StudentBottomNav />
        
        {/* Global Comparison Tray */}
        <CompareTray comparePath="/student/compare" />
      </div>
    </DashboardThemeProvider>
  );
}
