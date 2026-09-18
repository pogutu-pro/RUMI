'use client';

import * as React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Wallet,
  CreditCard,
  LifeBuoy,
  HardHat,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/features/auth';
import { UserRole } from '@/features/auth/stores/auth.types';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import { PayoutPendingBanner } from '@/features/payout/components/payout-pending-banner';

const NAV = [
  { href: '/landlord/rental', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/landlord/rental/properties', label: 'Properties', icon: Building2 },
  { href: '/landlord/rental/tenants', label: 'Tenants', icon: Users },
  { href: '/landlord/rental/caretakers', label: 'Caretakers', icon: HardHat },
  { href: '/landlord/rental/tenancies', label: 'Tenancies', icon: FileText },
  { href: '/landlord/rental/rent', label: 'Rent', icon: Wallet },
  { href: '/landlord/rental/payments', label: 'Payments', icon: CreditCard },
  { href: '/landlord/rental/billing', label: 'Billing & Payout', icon: CreditCard },
  { href: '/landlord/rental/support', label: 'Support', icon: LifeBuoy },
  { href: '/landlord/rental/settings', label: 'Settings', icon: Settings },
];

/**
 * Own layout for the rental product — renders through the shared
 * DashboardShell (collapsible desktop sidebar, mobile drawer, auth-guard,
 * logout). Deliberately not the legacy hostel LandlordSidebar shell.
 */
export default function RentalLandlordLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

  return (
    <DashboardShell
      allowedRoles={[UserRole.LANDLORD, UserRole.SUPER_ADMIN]}
      nav={NAV}
      settingsHref="/landlord/rental/settings"
      bannerSlot={!isSuperAdmin ? <PayoutPendingBanner /> : null}
    >
      {children}
    </DashboardShell>
  );
}
