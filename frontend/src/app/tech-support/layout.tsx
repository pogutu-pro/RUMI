'use client';

import * as React from 'react';
import type { ReactNode } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { TechSupportSidebar } from '@/components/layouts/tech-support-sidebar';
import { TechSupportTopNav } from '@/components/layouts/tech-support-top-nav';
import { TechSupportBottomNav } from '@/components/layouts/tech-support-bottom-nav';
import { DashboardThemeProvider } from '@/components/providers/dashboard-theme-provider';
import { cn } from '@/lib/utils/cn';
import { useAppStore } from '@/stores/app.store';

interface TechSupportLayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: TechSupportLayoutProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  return (
    <DashboardThemeProvider>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
        {/* Desktop/Tablet Sidebar - Hidden on Mobile */}
        <div className="hidden md:block">
          <TechSupportSidebar
            isOpen={isSidebarOpen}
            setIsOpen={setSidebarOpen}
            isMobile={false}
          />
        </div>

        {/* Mobile Sidebar Sheet - Hidden in favor of Bottom Nav */}
        <div className="hidden">
          <TechSupportSidebar
            isOpen={isMobileOpen}
            setIsOpen={setIsMobileOpen}
            isMobile={true}
          />
        </div>

        {/* Bottom Navigation - Mobile Only */}
        <TechSupportBottomNav />

        {/* Top Navigation */}
        <TechSupportTopNav
          onMenuClick={() => {
            if (isDesktop) {
              setSidebarOpen(!isSidebarOpen);
            }
            // Mobile menu click disabled
          }}
          isSidebarOpen={isSidebarOpen}
          isMobile={!isDesktop}
        />

        {/* Main Content */}
        <main
          className={cn(
            "relative z-0 transition-all duration-300 ease-in-out min-h-screen",
            // Mobile: edge-to-edge, minimal top padding, added bottom padding
            "px-3 pt-20 pb-24 sm:px-4",
            // Desktop: more padding, always leave space for collapsed sidebar only
            "md:px-6 md:pt-24 lg:px-10 lg:py-8",
            isSidebarOpen ? "md:ml-72" : "md:ml-20" // Adjust margin based on sidebar state
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
