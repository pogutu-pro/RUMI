'use client';

import * as React from 'react';
import { CreditCard, LayoutDashboard, LifeBuoy, MessageSquare, Settings } from 'lucide-react';
import { UserRole } from '@/features/auth/stores/auth.types';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

const TENANT_NAV = [
  { href: '/tenant/rental', label: 'My Rental', icon: LayoutDashboard },
  { href: '/tenant/rental/pay', label: 'Pay Rent', icon: CreditCard },
  { href: '/tenant/rental/messages', label: 'Messages', icon: MessageSquare },
  { href: '/tenant/rental/support', label: 'Support', icon: LifeBuoy },
  { href: '/tenant/rental/settings', label: 'Settings', icon: Settings },
];

/**
 * Own light layout, not the legacy (student) shell — 'student' role maps to
 * canonical 'tenant' server-side (User.get_canonical_role()), so both are
 * allowed here.
 */
export default function RentalTenantLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      allowedRoles={[UserRole.TENANT, UserRole.STUDENT]}
      nav={TENANT_NAV}
      mobileTabs={[
        { href: '/tenant/rental', label: 'Home', icon: LayoutDashboard },
        { href: '/tenant/rental/pay', label: 'Pay', icon: CreditCard },
        { href: '/tenant/rental/messages', label: 'Messages', icon: MessageSquare },
      ]}
      settingsHref="/tenant/rental/settings"
    >
      {children}
    </DashboardShell>
  );
}
