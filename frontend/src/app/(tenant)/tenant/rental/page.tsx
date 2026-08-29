'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTenancies, useRentBalance, usePayments, useInitiatePayment } from '@/features/rental/hooks/use-rental';
import type { RentCharge } from '@/features/rental/types';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  success: 'default',
  pending: 'secondary',
  processing: 'secondary',
  failed: 'destructive',
  reversed: 'destructive',
};

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

export default function TenantRentalDashboard() {
  const { data: tenancies = [] } = useTenancies();
  const { data: balance } = useRentBalance();
  const { data: payments = [] } = usePayments();
  const initiate = useInitiatePayment();

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

  if (!activeTenancy) {
    return <p className="text-sm text-muted-foreground">No tenancy on file yet — contact your landlord.</p>;
  }

  const hero = heroStateFor(nextCharge, balance?.outstanding_total);
  const outstanding = Number(balance?.outstanding_total ?? '0');

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

      <div>
        <h2 className="mb-2 font-medium">Payment history</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>{formatKes(p.amount)}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[p.status] ?? 'secondary'}>{p.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
