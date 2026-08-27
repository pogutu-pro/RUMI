'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTenancies, useRentBalance, usePayments, useInitiatePayment } from '@/features/rental/hooks/use-rental';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  success: 'default',
  pending: 'secondary',
  processing: 'secondary',
  failed: 'destructive',
  reversed: 'destructive',
};

export default function TenantRentalDashboard() {
  const { data: tenancies = [] } = useTenancies();
  const { data: balance } = useRentBalance();
  const { data: payments = [] } = usePayments();
  const initiate = useInitiatePayment();

  const activeTenancy = tenancies.find((t) => t.status === 'active') ?? tenancies[0];
  const nextCharge = (balance?.charges ?? [])
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">My tenancy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>Unit: <span className="font-medium">{activeTenancy.unit_number}</span></p>
          <p>Monthly rent: <span className="font-medium">KES {activeTenancy.monthly_rent}</span></p>
          {nextCharge && <p>Next due date: <span className="font-medium">{nextCharge.due_date}</span></p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Outstanding balance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-2xl font-semibold">KES {balance?.outstanding_total ?? '0.00'}</p>
          <Button onClick={handlePay} disabled={initiate.isPending} className="w-full">
            Pay rent
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
                  <TableCell>KES {p.amount}</TableCell>
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
