'use client';

import * as React from 'react';
import { Bell, Building2, CreditCard, FileClock, LayoutDashboard, LifeBuoy, MessageSquare, Settings, Users } from 'lucide-react';
import { UserRole } from '@/features/auth/stores/auth.types';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

const ADMIN_NAV = [
  { href: '/platform/overview', label: 'Overview', icon: LayoutDashboard },
  { href: '/platform/organizations', label: 'Organizations', icon: Building2 },
  { href: '/platform/users', label: 'Users', icon: Users },
  { href: '/platform/messages', label: 'Messages', icon: MessageSquare },
  { href: '/platform/support', label: 'Support', icon: LifeBuoy },
  { href: '/platform/billing', label: 'Billing', icon: CreditCard },
  { href: '/platform/notifications', label: 'Notifications', icon: Bell },
  { href: '/platform/audit', label: 'Audit log', icon: FileClock },
  { href: '/platform/settings', label: 'Settings', icon: Settings },
];

/**
 * Super-admin's own dashboard shell — every organization, every user, the
 * support-ticket queue (same view tech-support uses; super_admin is already
 * in its allowedRoles), and revenue. Mirrors tech-support/dashboard/
 * layout.tsx's shape (own top-level nav array).
 *
 * showOrgSwitcher is off here: OrganizationSwitcher writes to a
 * landlord-scoped store that none of this shell's sections read — every
 * section here is already platform-wide, not org-scoped.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      allowedRoles={[UserRole.SUPER_ADMIN]}
      nav={ADMIN_NAV}
      settingsHref="/platform/settings"
      maxWidth="max-w-5xl"
      showOrgSwitcher={false}
    >
      {children}
    </DashboardShell>
  );
}
