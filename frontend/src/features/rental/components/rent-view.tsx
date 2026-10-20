'use client';

import * as React from 'react';
import { Banknote, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/dashboard/page-header';
import { RecordPaymentDialog } from '@/features/rental/components/record-payment-dialog';
import { useGenerateRentCharges, useRentBalance, useTenancies } from '@/features/rental/hooks/use-rental';
import type { RentCharge } from '@/features/rental/types';
import { usePagination } from '@/hooks/use-pagination';
import { SimplePager } from '@/components/ui/simple-pager';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  paid: 'default',
  due: 'secondary',
  partially_paid: 'secondary',
  overdue: 'destructive',
  upcoming: 'secondary',
  waived: 'default',
  disputed: 'destructive',
};

function kes(value: string | number | undefined) {
  return `KES ${Number(value ?? 0).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`;
}

interface RentViewProps {
  /** Only landlords can trigger monthly charge generation. */
  canGenerateCharges?: boolean;
}

/**
 * Outstanding rent and the place to record rent that was paid outside the
 * app (cash, bank, direct M-Pesa). Shared by the landlord and caretaker
 * dashboards; the server enforces who may record what.
 */
export function RentView({ canGenerateCharges = false }: RentViewProps) {
  const { data: balance, isLoading } = useRentBalance();
  const { data: tenancies = [] } = useTenancies();
  const generate = useGenerateRentCharges();

  const [dialog, setDialog] = React.useState<{
    open: boolean;
    charge?: RentCharge;
  }>({ open: false });

  const activeTenancies = React.useMemo(
    () => tenancies.filter((t) => t.status === 'active' || t.status === 'notice_period'),
    [tenancies],
  );
  const tenancyById = React.useMemo(() => new Map(tenancies.map((t) => [t.id, t])), [tenancies]);
  const charges = balance?.charges ?? [];
  const { pageItems: pagedCharges, pagerProps: chargesPager } = usePagination(charges, 10);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rent"
        description="What is owed, and a place to record rent paid in cash, by bank or straight to you by M-Pesa."
        action={(
          <div className="flex flex-wrap items-center justify-end gap-2">
            {canGenerateCharges && (
              <Button
                variant="outline"
                onClick={() => generate.mutate()}
                disabled={generate.isPending}
                leftIcon={<RefreshCw className="h-4 w-4" />}
              >
                Generate charges
              </Button>
            )}
            <Button onClick={() => setDialog({ open: true })} leftIcon={<Banknote className="h-4 w-4" />}>
              Record payment
            </Button>
          </div>
        )}
      />

      <div className="grid grid-cols-2 gap-3 sm:max-w-xl">
        <div className="rounded-2xl border bg-background p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Outstanding</p>
          <p className="mt-1 text-xl font-semibold">{kes(balance?.outstanding_total)}</p>
        </div>
        <div className="rounded-2xl border bg-background p-4 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Overdue</p>
          <p className="mt-1 text-xl font-semibold text-destructive">{kes(balance?.overdue_total)}</p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : charges.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <p className="text-sm font-medium text-foreground">Nothing outstanding</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            Every charge is settled. If a tenant pays ahead in cash, use Record payment and it will apply to
            their next charge.
          </p>
        </div>
      ) : (
        <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="text-right">Amount due</TableHead>
              <TableHead className="text-right">Outstanding</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedCharges.map((c) => {
              const tenancy = tenancyById.get(c.tenancy);
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <p className="font-medium">{tenancy?.tenant_name ?? '—'}</p>
                    {tenancy && (
                      <p className="text-xs text-muted-foreground">
                        {tenancy.property_name} · {tenancy.unit_number}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{c.due_date}</TableCell>
                  <TableCell className="text-right">{kes(c.amount_due)}</TableCell>
                  <TableCell className="text-right font-medium">{kes(c.outstanding)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[c.status] ?? 'secondary'}>{c.status.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setDialog({ open: true, charge: c })}>
                      Record payment
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <SimplePager {...chargesPager} />
        </>
      )}

      <RecordPaymentDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        tenancies={activeTenancies}
        defaultTenancyId={dialog.charge?.tenancy}
        defaultAmount={dialog.charge ? Number(dialog.charge.outstanding) : undefined}
        rentChargeId={dialog.charge?.id}
      />
    </div>
  );
}
