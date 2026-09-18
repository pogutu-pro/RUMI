'use client';

import * as React from 'react';
import Link from 'next/link';
import { SearchInput } from '@/components/ui/search-input';
import { StatusPill, type StatusPillProps } from '@/components/ui/status-pill';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { useAdminBillingList } from '@/features/admin-billing/hooks/use-admin-billing';

type PillStatus = NonNullable<StatusPillProps['status']>;

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

/**
 * Shared organization directory table — used by both the standalone
 * Organizations page and (in a shorter form) the Billing revenue page.
 * Single source of truth for AdminOrganizationBillingListView's row shape.
 */
export function OrganizationsTable() {
  const [search, setSearch] = React.useState('');
  const { data: rows = [], isLoading, isError, refetch } = useAdminBillingList(search);

  return (
    <div className="space-y-4">
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
