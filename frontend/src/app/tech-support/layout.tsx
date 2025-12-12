'use client';

import * as React from 'react';
import type { ReactNode } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { TechSupportSidebar } from '@/components/layouts/tech-support-sidebar';
import { TechSupportTopNav } from '@/components/layouts/tech-support-top-nav';
import { DashboardThemeProvider } from '@/components/providers/dashboard-theme-provider';
import { cn } from '@/lib/utils/cn';
import { useAdminStore } from '@/features/admin';

interface TechSupportLayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: TechSupportLayoutProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { isSidebarOpen, setSidebarOpen } = useAdminStore();
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

        {/* Mobile Sidebar Sheet */}
        <div className="md:hidden">
          <TechSupportSidebar
            isOpen={isMobileOpen}
            setIsOpen={setIsMobileOpen}
            isMobile={true}
          />
        </div>

        {/* Top Navigation */}
        <TechSupportTopNav
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

        {/* Main Content */}
        <main
          className={cn(
            "relative z-0 transition-all duration-300 ease-in-out min-h-screen",
            // Mobile: edge-to-edge, minimal top padding
            "px-3 pt-20 pb-4 sm:px-4",
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
