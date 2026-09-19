'use client';

import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePayments } from '@/features/rental/hooks/use-rental';
import { usePagination } from '@/hooks/use-pagination';
import { SimplePager } from '@/components/ui/simple-pager';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  success: 'default',
  pending: 'secondary',
  processing: 'secondary',
  failed: 'destructive',
  reversed: 'destructive',
  disputed: 'destructive',
};

export default function PaymentsPage() {
  const { data: payments = [], isLoading } = usePayments();
  const { pageItems: pagedPayments, pagerProps: paymentsPager } = usePagination(payments, 10);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Payments</h1>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payments yet.</p>
      ) : (
        <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedPayments.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '—'}</TableCell>
                <TableCell className="font-mono text-xs">{p.internal_reference}</TableCell>
                <TableCell>{p.payment_method}</TableCell>
                <TableCell>KES {p.amount}</TableCell>
                <TableCell><Badge variant={STATUS_VARIANT[p.status] ?? 'secondary'}>{p.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <SimplePager {...paymentsPager} />
        </>
      )}
    </div>
  );
}
