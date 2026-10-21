'use client';

import * as React from 'react';
import { LayoutDashboard, Building2, Users, Wallet, MessageSquare, LifeBuoy, Settings } from 'lucide-react';
import { UserRole } from '@/features/auth/stores/auth.types';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

const NAV = [
  { href: '/caretaker/rental', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/caretaker/rental/properties', label: 'Properties', icon: Building2 },
  { href: '/caretaker/rental/tenants', label: 'Tenants', icon: Users },
  { href: '/caretaker/rental/rent', label: 'Rent', icon: Wallet },
  { href: '/caretaker/rental/messages', label: 'Messages', icon: MessageSquare },
  { href: '/caretaker/rental/support', label: 'Support', icon: LifeBuoy },
  { href: '/caretaker/rental/settings', label: 'Settings', icon: Settings },
];

/** Caretaker's own rental layout — scoped to their assigned properties only. */
export default function RentalCaretakerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      allowedRoles={[UserRole.CARETAKER]}
      nav={NAV}
      mobileTabs={[
        { href: '/caretaker/rental', label: 'Home', icon: LayoutDashboard },
        { href: '/caretaker/rental/rent', label: 'Rent', icon: Wallet },
        { href: '/caretaker/rental/tenants', label: 'Tenants', icon: Users },
        { href: '/caretaker/rental/messages', label: 'Messages', icon: MessageSquare },
      ]}
      settingsHref="/caretaker/rental/settings"
    >
      {children}
    </DashboardShell>
  );
}
