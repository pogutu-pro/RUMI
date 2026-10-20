'use client';

import * as React from 'react';
import { Plus, Undo2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/dashboard/page-header';
import { usePayments, useRecordManualPayment, useTenancies } from '@/features/rental/hooks/use-rental';
import { useReversePayment } from '@/features/ledger/hooks/use-ledger';
import { ReceiptDownloadButton, ReceiptResendButton } from '@/features/ledger/components/receipt-actions';
import { formatDate, formatKes } from '@/features/ledger/lib/format';
import type { Payment } from '@/features/rental/types';
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

const METHOD_LABEL: Record<string, string> = {
  paystack: 'Paystack',
  mpesa_paybill: 'M-Pesa',
  bank_transfer: 'Bank',
  cash: 'Cash',
  deposit_transfer: 'From deposit',
  other: 'Other',
};

export default function PaymentsPage() {
  const { data: payments = [], isLoading } = usePayments();
  const [recording, setRecording] = React.useState(false);
  const [reversing, setReversing] = React.useState<Payment | null>(null);
  const { pageItems: pagedPayments, pagerProps: paymentsPager } = usePagination(payments, 10);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payments"
        description="Money received. Anything not matched to an invoice is kept as the tenant’s credit and used automatically."
        action={
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setRecording(true)}>
            Record payment
          </Button>
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payments yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Kept as credit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedPayments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{formatDate(p.paid_at ?? p.created_at)}</TableCell>
                  <TableCell className="font-mono text-xs">{p.internal_reference}</TableCell>
                  <TableCell>{METHOD_LABEL[p.payment_method] ?? p.payment_method}</TableCell>
                  <TableCell className="text-right">{formatKes(p.amount)}</TableCell>
                  <TableCell className="text-right">
                    {Number(p.unapplied_amount ?? 0) > 0 ? formatKes(p.unapplied_amount) : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[p.status] ?? 'secondary'} title={p.notes || undefined}>{p.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {p.receipt ? (
                      <span className="flex items-center">
                        <ReceiptDownloadButton receipt={p.receipt} />
                        <ReceiptResendButton receiptId={p.receipt.id} />
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    {p.status === 'success' && p.payment_method !== 'deposit_transfer' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Reverse payment"
                        title="Reverse payment"
                        onClick={() => setReversing(p)}
                      >
                        <Undo2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <SimplePager {...paymentsPager} />
        </div>
      )}

      <RecordPaymentDialog open={recording} onOpenChange={setRecording} />
      <ReverseDialog payment={reversing} onClose={() => setReversing(null)} />
    </div>
  );
}

function RecordPaymentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: tenancies = [] } = useTenancies();
  const record = useRecordManualPayment();
  const [tenancy, setTenancy] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [method, setMethod] = React.useState('cash');
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setTenancy('');
      setAmount('');
      setMethod('cash');
      setNotes('');
    }
  }, [open]);

  const submit = async () => {
    await record.mutateAsync({ tenancy, amount, payment_method: method, notes });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a payment</DialogTitle>
          <DialogDescription>Cash or bank money a tenant paid you outside RumiaRent.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Tenant</Label>
            <Select value={tenancy} onValueChange={setTenancy}>
              <SelectTrigger><SelectValue placeholder="Choose tenancy" /></SelectTrigger>
              <SelectContent>
                {tenancies.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.tenant_name} · {t.unit_number}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="rp-amount">Amount (KES)</Label>
              <Input id="rp-amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="rp-notes">Note (optional)</Label>
            <Input id="rp-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. bank slip 4471" />
          </div>
          <p className="text-xs text-muted-foreground">
            Applied to the oldest unpaid invoices first; anything extra is kept as credit for the next one.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={submit} isLoading={record.isPending} disabled={!tenancy || !(Number(amount) > 0)}>
            Save payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReverseDialog({ payment, onClose }: { payment: Payment | null; onClose: () => void }) {
  const reverse = useReversePayment();
  const [reason, setReason] = React.useState('');

  React.useEffect(() => {
    if (payment) setReason('');
  }, [payment]);

  const submit = async () => {
    if (!payment) return;
    await reverse.mutateAsync({ paymentId: payment.id, reason });
    onClose();
  };

  return (
    <Dialog open={!!payment} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reverse {payment?.internal_reference}?</DialogTitle>
          <DialogDescription>
            Use this for a bounced cheque, a lost chargeback or a payment recorded by mistake. The{' '}
            {formatKes(payment?.amount)} comes off the tenant’s account and the invoices it paid become unpaid again.
            This can’t be undone.
          </DialogDescription>
        </DialogHeader>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Reason (kept in the audit log)" />
        <DialogFooter>
          <Button variant="destructive" onClick={submit} isLoading={reverse.isPending} disabled={!reason.trim()}>
            Reverse payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
