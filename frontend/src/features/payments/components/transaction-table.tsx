'use client';

import { usePayments } from '@/features/payments';
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
import { cn } from '@/lib/utils';

export function TransactionTable() {
  const { data: payments, isLoading } = usePayments();

  if (isLoading) {
    return <div>Loading transactions...</div>;
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="font-black text-muted-foreground uppercase text-[10px] tracking-widest">Reference</TableHead>
            <TableHead className="font-black text-muted-foreground uppercase text-[10px] tracking-widest">Date</TableHead>
            <TableHead className="font-black text-muted-foreground uppercase text-[10px] tracking-widest">Type</TableHead>
            <TableHead className="font-black text-muted-foreground uppercase text-[10px] tracking-widest">Method</TableHead>
            <TableHead className="font-black text-muted-foreground uppercase text-[10px] tracking-widest">Amount</TableHead>
            <TableHead className="font-black text-muted-foreground uppercase text-[10px] tracking-widest">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments?.map((payment) => (
            <TableRow key={payment.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="font-mono text-sm font-black text-foreground">{payment.reference}</TableCell>
              <TableCell className="text-muted-foreground font-black text-xs">{format(new Date(payment.date), 'PP')}</TableCell>
              <TableCell className="capitalize font-black text-foreground text-xs">{payment.type}</TableCell>
              <TableCell className="text-muted-foreground font-black text-xs uppercase">{payment.method}</TableCell>
              <TableCell className="font-black text-foreground">
                KES {payment.amount.toLocaleString()}
              </TableCell>
              <TableCell>
                <Badge
                  className={cn(
                    "font-black uppercase text-[9px] px-2 h-5",
                    payment.status === 'completed' && "bg-emerald-500 hover:bg-emerald-600",
                    payment.status === 'pending' && "bg-amber-500/10 text-amber-600 border-none",
                    payment.status === 'failed' && "bg-red-500/10 text-red-600 border-none"
                  )}
                >
                  {payment.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
