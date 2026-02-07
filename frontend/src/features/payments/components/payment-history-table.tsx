'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPayments } from '../api/payments';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { ReceiptGenerator } from './receipt-generator';

interface PaymentHistoryTableProps {
  userId?: string;
  limit?: number;
}

const STATUS_VARIANTS = {
  success: 'default',
  completed: 'default',
  pending: 'secondary',
  pending_stk_push: 'secondary',
  processing: 'secondary',
  failed: 'destructive',
  cancelled: 'outline',
} as const;

export function PaymentHistoryTable({ userId, limit = 20 }: PaymentHistoryTableProps) {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', userId, limit],
    queryFn: () => getPayments({ userId }),
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No payment history yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/50">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Bed</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium">
                {formatDate(payment.date)}
              </TableCell>
              <TableCell className="font-semibold">
                {formatCurrency(payment.amount)}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="uppercase text-xs">
                  {payment.method}
                </Badge>
              </TableCell>
              <TableCell>
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {payment.reference}
                </code>
              </TableCell>
              <TableCell>
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {(payment as any).rent_period_details?.bed_code || '-'}
                </code>
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANTS[payment.status as keyof typeof STATUS_VARIANTS] || 'default'}>
                  {payment.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {(payment.status === 'success' || payment.status === 'completed') && (
                  <ReceiptGenerator 
                    transactionRef={payment.reference} 
                    trigger={
                      <Button variant="ghost" size="sm">
                        <FileText className="w-4 h-4 mr-2" />
                        Receipt
                      </Button>
                    }
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
