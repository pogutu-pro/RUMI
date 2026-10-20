'use client';

import * as React from 'react';
import {
  Briefcase,
  Building2,
  Calculator,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Gavel,
  HardHat,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  Receipt,
  Settings2,
  SlidersHorizontal,
  Smartphone,
  Users,
  Wallet,
} from 'lucide-react';
import { useAuth } from '@/features/auth';
import { UserRole } from '@/features/auth/stores/auth.types';
import { DashboardShell, type DashboardShellNavItem } from '@/components/dashboard/dashboard-shell';
import { PayoutPendingBanner } from '@/features/payout/components/payout-pending-banner';
import { attentionBadges, useAttention } from '@/features/attention/hooks';

// Grouped so the sidebar stays scannable (shallow navigation): daily money
// work first, setup last. Badges show only items that need action now.
const NAV: DashboardShellNavItem[] = [
  { href: '/landlord/rental', label: 'Dashboard', icon: LayoutDashboard },
  { section: 'Money', href: '/landlord/rental/rent', label: 'Rent & invoices', icon: Wallet },
  { section: 'Money', href: '/landlord/rental/payments', label: 'Payments', icon: CreditCard },
  { section: 'Money', href: '/landlord/rental/paybill', label: 'M-Pesa paybill', icon: Smartphone },
  { section: 'Money', href: '/landlord/rental/debt', label: 'Debt recovery', icon: Gavel },
  { section: 'Money', href: '/landlord/rental/expenses', label: 'Expenses', icon: Receipt },
  { section: 'Property', href: '/landlord/rental/properties', label: 'Properties & vacancies', icon: Building2 },
  { section: 'Property', href: '/landlord/rental/tenancies', label: 'Tenancies', icon: FileText },
  { section: 'Property', href: '/landlord/rental/tenants', label: 'Tenants', icon: Users },
  { section: 'Property', href: '/landlord/rental/messages', label: 'Messages', icon: Megaphone },
  { section: 'Reports', href: '/landlord/rental/statements', label: 'Statements', icon: FileSpreadsheet },
  { section: 'Reports', href: '/landlord/rental/accounts', label: 'Accounts', icon: Calculator },
  { section: 'Reports', href: '/landlord/rental/owners', label: 'Property owners', icon: Briefcase },
  { section: 'Settings', href: '/landlord/rental/rules', label: 'Rent rules', icon: SlidersHorizontal },
  { section: 'Settings', href: '/landlord/rental/caretakers', label: 'Caretakers', icon: HardHat },
  { section: 'Settings', href: '/landlord/rental/billing', label: 'Billing & payout', icon: Settings2 },
  { section: 'Settings', href: '/landlord/rental/support', label: 'Support', icon: LifeBuoy },
];

/**
 * Own layout for the rental product — renders through the shared
 * DashboardShell (collapsible desktop sidebar, mobile drawer, auth-guard,
 * logout). Deliberately not the legacy hostel LandlordSidebar shell.
 */
export default function RentalLandlordLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const { data: attention } = useAttention(!isSuperAdmin);
  const badges = attentionBadges(attention);
  const nav = NAV.map((item) => ({ ...item, badge: badges[item.href] }));

  return (
    <DashboardShell
      allowedRoles={[UserRole.LANDLORD, UserRole.SUPER_ADMIN]}
      nav={nav}
      bannerSlot={!isSuperAdmin ? <PayoutPendingBanner /> : null}
    >
      {children}
    </DashboardShell>
  );
}
