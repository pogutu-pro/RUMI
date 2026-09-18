'use client';

import Link from 'next/link';
import { Building2, LifeBuoy, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PriceDisplay } from '@/components/ui/price-display';
import { PageHeader } from '@/components/dashboard/page-header';
import { useAdminPlatformOverview } from '@/features/admin-billing/hooks/use-admin-billing';

const ROLE_LABEL: Record<string, string> = {
  tenant: 'Tenants',
  landlord: 'Landlords',
  caretaker: 'Caretakers',
  tech_support: 'Tech Support',
  tech_support_admin: 'Tech Support',
  super_admin: 'Super Admins',
  student: 'Tenants',
};

const ROLE_ORDER = ['landlord', 'tenant', 'caretaker', 'tech_support', 'super_admin'];

function StatCard({ title, value, hint, loading }: { title: string; value: React.ReactNode; hint?: string; loading?: boolean }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="skeleton h-8 w-20 rounded-lg" />
        ) : (
          <p className="text-2xl font-bold text-foreground">{value}</p>
        )}
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default function AdminOverviewPage() {
  const { data, isLoading } = useAdminPlatformOverview();

  // Merge role counts the backend actually returned with a fixed display
  // order — a role with 0 users still shows, one the backend never seeds
  // (e.g. a future role) still renders via ROLE_LABEL's fallback.
  const roleCounts = data?.users_by_role ?? {};
  const roleRows = ROLE_ORDER.filter((role) => role in roleCounts || Object.keys(roleCounts).length === 0).map((role) => ({
    role,
    label: ROLE_LABEL[role] ?? role,
    count: roleCounts[role] ?? 0,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Overview" description="Every headline number for the platform, at a glance." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total users" value={data?.total_users ?? 0} hint="Across every role" loading={isLoading} />
        <StatCard title="Organizations" value={data?.total_organizations ?? 0} hint="Landlord accounts on the platform" loading={isLoading} />
        <StatCard
          title="Total revenue"
          value={<PriceDisplay amount={data?.total_revenue ?? 0} size="lg" showDecimals={false} />}
          hint="All-time, successful payments only"
          loading={isLoading}
        />
        <StatCard
          title="Open support tickets"
          value={data?.open_support_tickets ?? 0}
          hint={`${data?.total_support_tickets ?? 0} total`}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" /> Users by role
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="skeleton h-32 w-full rounded-lg" />
            ) : (
              <div className="divide-y">
                {roleRows.map((row) => (
                  <div key={row.role} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-semibold text-foreground">{row.count}</span>
                  </div>
                ))}
              </div>
            )}
            <Link href="/platform/users" className="mt-4 inline-block text-sm text-primary underline">
              Manage users →
            </Link>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" /> Money
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">MRR</span>
                <PriceDisplay amount={data?.mrr ?? 0} showDecimals={false} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">This month</span>
                <PriceDisplay amount={data?.revenue_this_month ?? 0} showDecimals={false} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Paying organizations</span>
                <span className="font-semibold text-foreground">{data?.paying_organizations ?? 0}</span>
              </div>
              <Link href="/platform/billing" className="inline-block text-sm text-primary underline">
                View billing →
              </Link>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <LifeBuoy className="h-4 w-4" /> Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Open + in progress</span>
                <span className="font-semibold text-foreground">{data?.open_support_tickets ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">All time</span>
                <span className="font-semibold text-foreground">{data?.total_support_tickets ?? 0}</span>
              </div>
              <Link href="/platform/support" className="inline-block text-sm text-primary underline">
                View ticket queue →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
