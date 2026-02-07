'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {Badge } from '@/components/ui/badge';
import { FileDown, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api/client';

interface Invoice {
  id: string;
  invoice_number: string;
  billing_period_start: string;
  billing_period_end: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issued_at: string;
  due_date: string;
  paid_at: string | null;
  pdf_url: string | null;
}

interface InvoiceHistoryListProps {
  hostelId: string;
}

const STATUS_VARIANTS = {
  draft: 'outline',
  sent: 'secondary',
  paid: 'default',
  overdue: 'destructive',
  cancelled: 'outline',
} as const;

export function InvoiceHistoryList({ hostelId }: InvoiceHistoryListProps) {
  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ['invoices', hostelId],
    queryFn: async () => {
      const response = await apiClient.axios.get(`/api/v1/subscriptions/invoices/${hostelId}/`);
      return response.data.data || [];
    },
    enabled: !!hostelId,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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

  const handleDownloadPDF = async (invoice: Invoice) => {
    if (!invoice.pdf_url) return;
    window.open(invoice.pdf_url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No invoices yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/50">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Billing Period</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
              <TableCell className="text-sm">
                {formatDate(invoice.billing_period_start)} - {formatDate(invoice.billing_period_end)}
              </TableCell>
              <TableCell className="font-semibold">
                {formatCurrency(invoice.amount)}
              </TableCell>
              <TableCell className="text-sm">
                {formatDate(invoice.due_date)}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANTS[invoice.status]} className="uppercase text-xs">
                  {invoice.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {invoice.pdf_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadPDF(invoice)}
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
