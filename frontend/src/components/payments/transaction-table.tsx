'use client';

import { usePayments } from '@/hooks/use-payments';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export function TransactionTable() {
  const { data: payments, isLoading } = usePayments();

  if (isLoading) {
    return <div>Loading transactions...</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Reference</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Method</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments?.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell className="font-mono text-sm">{payment.reference}</TableCell>
            <TableCell>{format(new Date(payment.date), 'PPp')}</TableCell>
            <TableCell className="capitalize">{payment.type}</TableCell>
            <TableCell>{payment.method}</TableCell>
            <TableCell className="font-medium">
              KES {payment.amount.toLocaleString()}
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  payment.status === 'completed'
                    ? 'default'
                    : payment.status === 'pending'
                    ? 'secondary'
                    : 'destructive'
                }
              >
                {payment.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
