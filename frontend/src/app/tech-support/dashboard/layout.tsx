'use client';

import * as React from 'react';
import { Briefcase, LifeBuoy, MessageSquare, Newspaper, Settings } from 'lucide-react';
import { UserRole } from '@/features/auth/stores/auth.types';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

const TECH_SUPPORT_NAV = [
  { href: '/tech-support/dashboard', label: 'Tickets', icon: LifeBuoy },
  { href: '/tech-support/dashboard/messages', label: 'Messages', icon: MessageSquare },
  { href: '/tech-support/dashboard/blog', label: 'Blog', icon: Newspaper },
  { href: '/tech-support/dashboard/careers', label: 'Careers', icon: Briefcase },
  { href: '/tech-support/dashboard/settings', label: 'Settings', icon: Settings },
];

/** Tech support's own dashboard — ticket queue across every organization,
 * plus authoring the public RumiaRent blog (home/models.py:BlogPost).
 * super_admin is also allowed here (from the platform shell's Support link)
 * — showOrgSwitcher is off because neither page here reads the
 * landlord-scoped selected-org store the switcher writes to. */
export default function TechSupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      allowedRoles={[UserRole.TECH_SUPPORT, UserRole.TECH_SUPPORT_ADMIN, UserRole.SUPER_ADMIN]}
      nav={TECH_SUPPORT_NAV}
      settingsHref="/tech-support/dashboard/settings"
      maxWidth="max-w-4xl"
      showOrgSwitcher={false}
    >
      {children}
    </DashboardShell>
  );
}
