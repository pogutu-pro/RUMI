'use client';

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { useTenancies, useRentBalance, usePayments, useInitiatePayment } from '@/features/rental/hooks/use-rental';
import type { RentCharge, Payment } from '@/features/rental/types';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  success: 'default',
  pending: 'secondary',
  processing: 'secondary',
  failed: 'destructive',
  reversed: 'destructive',
};

const PAGE_SIZE = 20;

function formatKes(amount: string | number) {
  const n = Number(amount);
  return `KES ${n.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

function heroStateFor(nextCharge: RentCharge | undefined, outstandingTotal: string | undefined) {
  const outstanding = Number(outstandingTotal ?? '0');
  if (!nextCharge || outstanding <= 0) {
    return {
      tone: 'border-success/30 bg-success/5',
      label: 'text-success',
      badge: "You're paid up",
    } as const;
  }
  if (nextCharge.status === 'overdue') {
    return {
      tone: 'border-destructive/30 bg-destructive/5',
      label: 'text-destructive',
      badge: 'Overdue',
    } as const;
  }
  return {
    tone: 'border-warning/30 bg-warning/5',
    label: 'text-warning',
    badge: 'Due',
  } as const;
}

const paymentColumns: ColumnDef<Payment>[] = [
  {
    accessorKey: 'paid_at',
    header: 'Date',
    cell: ({ row }) => {
      const paidAt = row.original.paid_at;
      return paidAt ? new Date(paidAt).toLocaleDateString() : '—';
    },
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => formatKes(row.original.amount),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={STATUS_VARIANT[row.original.status] ?? 'secondary'}>{row.original.status}</Badge>
    ),
  },
];

export default function TenantRentalDashboard() {
  const {
    data: tenancies = [],
    isLoading: tenanciesLoading,
    isError: tenanciesError,
  } = useTenancies();
  const {
    data: balance,
    isLoading: balanceLoading,
    isError: balanceError,
    refetch: refetchBalance,
  } = useRentBalance();
  const { data: payments = [], isLoading: paymentsLoading } = usePayments();
  const initiate = useInitiatePayment();
  const [page, setPage] = React.useState(1);

  const activeTenancy = tenancies.find((t) => t.status === 'active') ?? tenancies[0];
  const nextCharge = (balance?.charges ?? [])
    .filter((c) => c.status !== 'paid' && c.status !== 'waived')
    .slice()
    .sort((a, b) => a.due_date.localeCompare(b.due_date))[0];

  const handlePay = async () => {
    if (!activeTenancy) return;
    const amount = nextCharge?.outstanding ?? activeTenancy.monthly_rent;
    const result = await initiate.mutateAsync({ tenancyId: activeTenancy.id, amount });
    if (result.authorization_url) {
      window.location.href = result.authorization_url;
    }
  };

  if (tenanciesError || balanceError) {
    return <ErrorState onRetry={() => refetchBalance()} />;
  }

  if (tenanciesLoading || balanceLoading) {
    return <LoadingSkeleton type="card" />;
  }

  if (!activeTenancy) {
    return <p className="text-sm text-muted-foreground">No tenancy on file yet — contact your landlord.</p>;
  }

  const hero = heroStateFor(nextCharge, balance?.outstanding_total);
  const outstanding = Number(balance?.outstanding_total ?? '0');

  const paginatedPayments = payments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <Card className={`rounded-2xl border-2 ${hero.tone}`}>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wide ${hero.label}`}>{hero.badge}</span>
            <span className="text-xs text-muted-foreground">
              {activeTenancy.unit_number}
              {nextCharge && ` · due ${nextCharge.due_date}`}
            </span>
          </div>
          <p className="text-3xl font-semibold">
            {outstanding > 0 ? formatKes(outstanding) : formatKes(activeTenancy.monthly_rent)}
          </p>
          <p className="text-sm text-muted-foreground">
            {outstanding > 0 ? 'Outstanding balance' : `Monthly rent · next charge not due yet`}
          </p>
          <Button onClick={handlePay} disabled={initiate.isPending} className="w-full rounded-xl">
            Pay with Paystack
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lease details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Unit</dt>
              <dd className="text-sm font-medium">{activeTenancy.unit_number}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd><Badge variant="secondary">{activeTenancy.status}</Badge></dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Start date</dt>
              <dd className="text-sm font-medium">{activeTenancy.start_date}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">End date</dt>
              <dd className="text-sm font-medium">{activeTenancy.end_date ?? 'Ongoing'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Monthly rent</dt>
              <dd className="text-sm font-medium">{formatKes(activeTenancy.monthly_rent)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Deposit</dt>
              <dd className="text-sm font-medium">{formatKes(activeTenancy.deposit)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Rent due day</dt>
              <dd className="text-sm font-medium">{`Day ${activeTenancy.rent_due_day} of each month`}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Grace period</dt>
              <dd className="text-sm font-medium">{`${activeTenancy.grace_period_days} days`}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-2 font-medium">Payment history</h2>
        <DataTable<Payment, unknown>
          columns={paymentColumns}
          data={paginatedPayments}
          isLoading={paymentsLoading}
          totalItems={payments.length}
          pageSize={PAGE_SIZE}
          currentPage={page}
          onPageChange={setPage}
          onPageSizeChange={() => {}}
          emptyStateTitle="No payments yet"
          emptyStateDescription="Once you make a payment, it'll show up here with a full receipt trail."
        />
      </div>
    </div>
  );
}
