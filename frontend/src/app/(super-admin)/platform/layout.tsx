'use client';

import * as React from 'react';
import { CreditCard } from 'lucide-react';
import { UserRole } from '@/features/auth/stores/auth.types';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

const ADMIN_NAV = [{ href: '/platform/billing', label: 'Billing', icon: CreditCard }];

/**
 * Super-admin's own dashboard shell — billing overview across every
 * organization. Mirrors tech-support/dashboard/layout.tsx's shape exactly
 * (own top-level nav array, single entry).
 *
 * DashboardShell unconditionally renders OrganizationSwitcher for any
 * super_admin regardless of which shell mounts it — harmless, pre-existing
 * coupling (the switcher only writes to a Zustand store this feature never
 * reads); not suppressed here, out of this plan's scope.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell allowedRoles={[UserRole.SUPER_ADMIN]} nav={ADMIN_NAV} maxWidth="max-w-5xl">
      {children}
    </DashboardShell>
  );
}
