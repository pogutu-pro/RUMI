'use client';

import * as React from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { StudentSidebar } from '@/components/layouts/student-sidebar';
import { StudentTopNav } from '@/components/layouts/student-top-nav';
import { StudentBottomNav } from '@/components/layouts/student-bottom-nav';
import { UnifiedThemeProvider } from '@/components/providers/unified-theme-provider';
import type { Metadata } from 'next';
import { CompareTray } from '@/features/hostels';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/ui.store';

interface StudentLayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: StudentLayoutProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  
  // Refactored to use Global useAppStore
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  
  return (
    <UnifiedThemeProvider>
      <div className="min-h-screen bg-background flex">
        {/* Desktop Sidebar - Hidden on Mobile */}
        <div className="hidden md:block">
          <StudentSidebar
            isOpen={isSidebarOpen}
            setIsOpen={setSidebarOpen}
            isMobile={false}
          />
        </div>

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
              "px-3 pt-4 pb-24 sm:px-4",
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
    </UnifiedThemeProvider>
  );
}
