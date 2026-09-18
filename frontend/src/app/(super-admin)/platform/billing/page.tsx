'use client';

import * as React from 'react';
import Link from 'next/link';
import { SearchInput } from '@/components/ui/search-input';
import { StatusPill, type StatusPillProps } from '@/components/ui/status-pill';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PriceDisplay } from '@/components/ui/price-display';
import { PageHeader } from '@/components/dashboard/page-header';
import {
  useAdminBillingList,
  useAdminRevenueSummary,
} from '@/features/admin-billing/hooks/use-admin-billing';

type PillStatus = NonNullable<StatusPillProps['status']>;

// Color mapping per 06-UI-SPEC.md's status-color table.
const SUBSCRIPTION_STATUS_VARIANT: Record<string, PillStatus> = {
  active: 'success',
  pending: 'neutral',
  past_due: 'warning',
  suspended: 'danger',
  cancelled: 'danger',
};

const PAYOUT_STATUS_VARIANT: Record<string, PillStatus> = {
  active: 'success',
  pending_verification: 'warning',
  not_started: 'neutral',
};

export default function AdminBillingListPage() {
  const [search, setSearch] = React.useState('');
  const { data: rows = [], isLoading, isError, refetch } = useAdminBillingList(search);
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

      <SearchInput onSearch={setSearch} placeholder="Search by organization name…" debounceTime={300} />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : rows.length === 0 ? (
        search ? (
          <EmptyState variant="search" title="No organizations found" description="Try a different search term." />
        ) : (
          <EmptyState
            variant="default"
            title="No organizations yet"
            description="Organizations will appear here once landlords sign up."
          />
        )
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Payout</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>
                  {row.plan_name ? (
                    <StatusPill status="neutral">{row.plan_name}</StatusPill>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {row.subscription_status ? (
                    <StatusPill status={SUBSCRIPTION_STATUS_VARIANT[row.subscription_status] ?? 'neutral'}>
                      {row.subscription_status}
                    </StatusPill>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusPill status={PAYOUT_STATUS_VARIANT[row.payout_status] ?? 'neutral'}>
                    {row.payout_status}
                  </StatusPill>
                </TableCell>
                <TableCell>
                  <Link href={`/platform/billing/${row.id}`} className="text-primary underline">
                    View
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
