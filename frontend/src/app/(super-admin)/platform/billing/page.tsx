'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PriceDisplay } from '@/components/ui/price-display';
import { PageHeader } from '@/components/dashboard/page-header';
import { useAdminRevenueSummary } from '@/features/admin-billing/hooks/use-admin-billing';

export default function AdminBillingListPage() {
  const { data: revenue, isLoading: revenueLoading } = useAdminRevenueSummary();

  return (
    <div className="space-y-6">
      <PageHeader title="Billing" description="What the platform has actually earned, and every organization's plan, status, and payout." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <div className="skeleton h-8 w-32 rounded-lg" />
            ) : (
              <PriceDisplay amount={revenue?.total_revenue ?? 0} size="lg" showDecimals={false} />
            )}
            <p className="mt-1 text-xs text-muted-foreground">All-time, successful payments only</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This month</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <div className="skeleton h-8 w-32 rounded-lg" />
            ) : (
              <PriceDisplay amount={revenue?.revenue_this_month ?? 0} size="lg" showDecimals={false} />
            )}
            <p className="mt-1 text-xs text-muted-foreground">Collected so far this calendar month</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MRR</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <div className="skeleton h-8 w-32 rounded-lg" />
            ) : (
              <PriceDisplay amount={revenue?.mrr ?? 0} size="lg" showDecimals={false} />
            )}
            <p className="mt-1 text-xs text-muted-foreground">Sum of active subscriptions&apos; plan price</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paying organizations</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <div className="skeleton h-8 w-16 rounded-lg" />
            ) : (
              <p className="text-2xl font-bold text-foreground">{revenue?.active_subscriptions_count ?? 0}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">Active subscriptions right now</p>
          </CardContent>
        </Card>
      </div>

      <Link
        href="/platform/organizations"
        className="flex items-center justify-between rounded-2xl border bg-background p-5 text-sm font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-muted/40"
      >
        <span>View every organization&apos;s plan, subscription, and payout status</span>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    </div>
  );
}
