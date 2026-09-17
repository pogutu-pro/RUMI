'use client';

import * as React from 'react';
import { LifeBuoy, Newspaper } from 'lucide-react';
import { UserRole } from '@/features/auth/stores/auth.types';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

const TECH_SUPPORT_NAV = [
  { href: '/tech-support/dashboard', label: 'Tickets', icon: LifeBuoy },
  { href: '/tech-support/dashboard/blog', label: 'Blog', icon: Newspaper },
];

/** Tech support's own dashboard — ticket queue across every organization,
 * plus authoring the public RumiaRent blog (home/models.py:BlogPost). */
export default function TechSupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      allowedRoles={[UserRole.TECH_SUPPORT, UserRole.TECH_SUPPORT_ADMIN, UserRole.SUPER_ADMIN]}
      nav={TECH_SUPPORT_NAV}
      maxWidth="max-w-4xl"
    >
      {children}
    </DashboardShell>
  );
}
