'use client';

import * as React from 'react';
import type { ReactNode } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { AdminSidebar } from '@/components/layouts/admin-sidebar';
import { AdminTopNav } from '@/components/layouts/admin-top-nav';
import { AdminBottomNav } from '@/components/layouts/admin-bottom-nav';
import { DashboardThemeProvider } from '@/components/providers/dashboard-theme-provider';
import { cn } from '@/lib/utils/cn';
import { useAppStore } from '@/stores/app.store';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: AdminLayoutProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  
  // Use Global UI Store
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  return (
    <DashboardThemeProvider>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
        {/* Desktop/Tablet Sidebar - Hidden on Mobile */}
        <div className="hidden md:block">
          <AdminSidebar
            isOpen={isSidebarOpen}
            setIsOpen={setSidebarOpen}
            isMobile={false}
          />
        </div>

        {/* Mobile Sidebar Sheet - Replaced by Bottom Nav on mobile, keeping this just in case but hidden for now or we can remove it entirely if strictly bottom nav. 
            The plan was to hide it or sync. Since BottomNav has 'More', we can hide this or ensure it doesn't conflict. 
            Existing code had:
             <div className="md:hidden">...</div>
            Let's keep it but ensure it's not triggered if we don't want it. 
            Actually, the TopNav has the hamburger menu. We need to hide that hamburger on mobile if we use BottomNav. 
        */}
        <div className="hidden"> 
           {/* Hiding the old mobile sidebar completely since we use BottomNav now */}
          <AdminSidebar
            isOpen={isMobileOpen}
            setIsOpen={setIsMobileOpen}
            isMobile={true}
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
            // Mobile menu click disabled or handles something else? 
            // Since we have bottom nav, top nav hamburger might be redundant on mobile. 
            // But let's leave it for now, maybe it can open the 'More' sheet? 
            // Or better, let's hide the hamburger in TopNav on mobile via CSS or prop if possible.
            // For now, doing nothing on mobile if we want to enforce bottom nav.
          }}
          isSidebarOpen={isSidebarOpen}
          isMobile={!isDesktop}
        />

        {/* Main Content */}
        <main
          className={cn(
            "relative z-0 transition-all duration-300 ease-in-out min-h-screen",
            // Mobile: edge-to-edge, minimal top padding, added bottom padding for nav
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
