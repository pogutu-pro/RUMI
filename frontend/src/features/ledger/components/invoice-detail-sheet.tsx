'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useInvoice, useIssueCreditNote, useSetDisputed } from '../hooks/use-ledger';
import { INVOICE_TYPE_LABEL, formatDate, formatKes } from '../lib/format';
import { InvoiceStatusBadge } from './invoice-status-badge';

interface InvoiceDetailSheetProps {
  invoiceId: string | null;
  onClose: () => void;
  /** 'landlord' can waive and clear disputes; 'tenant' can only raise a dispute. */
  audience: 'landlord' | 'tenant';
}

export function InvoiceDetailSheet({ invoiceId, onClose, audience }: InvoiceDetailSheetProps) {
  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const [waiveOpen, setWaiveOpen] = React.useState(false);
  const [disputeOpen, setDisputeOpen] = React.useState(false);
  const setDisputed = useSetDisputed();

  const canWaive = audience === 'landlord' && invoice && Number(invoice.outstanding) > 0;

  return (
    <Sheet open={!!invoiceId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {isLoading || !invoice ? (
          <p className="pt-8 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="space-y-5">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                {invoice.number}
                <InvoiceStatusBadge status={invoice.status} />
              </SheetTitle>
              <SheetDescription>
                {INVOICE_TYPE_LABEL[invoice.invoice_type]} · {invoice.tenant_name} · {invoice.unit_number}
              </SheetDescription>
            </SheetHeader>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Period</dt>
                <dd>{formatDate(invoice.period_start)} – {formatDate(invoice.period_end)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Due</dt>
                <dd>{formatDate(invoice.due_date)}</dd>
              </div>
            </dl>

            <div>
              <h3 className="mb-2 text-sm font-medium">Items</h3>
              <ul className="space-y-2 text-sm">
                {invoice.lines.map((line) => (
                  <li key={line.id} className="flex justify-between gap-4">
                    <span>
                      {line.description}
                      {Number(line.quantity) !== 1 && (
                        <span className="block text-xs text-muted-foreground">
                          {Number(line.quantity)} × {formatKes(line.unit_price, { cents: true })}
                        </span>
                      )}
                    </span>
                    <span className="whitespace-nowrap">{formatKes(line.amount, { cents: true })}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            <dl className="space-y-1 text-sm">
              <Row label="Total" value={formatKes(invoice.amount_due, { cents: true })} />
              {Number(invoice.amount_credited) > 0 && (
                <Row label="Credited" value={`− ${formatKes(invoice.amount_credited, { cents: true })}`} />
              )}
              <Row label="Paid" value={`− ${formatKes(invoice.amount_paid, { cents: true })}`} />
              <Row label="Outstanding" value={formatKes(invoice.outstanding, { cents: true })} strong />
            </dl>

            {invoice.payments.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium">Payments</h3>
                <ul className="space-y-1 text-sm">
                  {invoice.payments.map((p) => (
                    <li key={`${p.payment_id}-${p.amount}`} className="flex justify-between">
                      <span className="text-muted-foreground">
                        {formatDate(p.paid_at)} · <span className="font-mono text-xs">{p.reference}</span>
                      </span>
                      <span>{formatKes(p.amount, { cents: true })}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {invoice.credit_notes.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium">Credit notes</h3>
                <ul className="space-y-1 text-sm">
                  {invoice.credit_notes.map((note) => (
                    <li key={note.id} className="flex justify-between gap-4">
                      <span className="text-muted-foreground">
                        {note.number} · {note.reason}
                      </span>
                      <span>{formatKes(note.amount, { cents: true })}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              {canWaive && (
                <Button variant="outline" size="sm" onClick={() => setWaiveOpen(true)}>
                  Waive / discount
                </Button>
              )}
              {audience === 'landlord' && invoice.is_disputed && (
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={setDisputed.isPending}
                  onClick={() => setDisputed.mutate({ invoiceId: invoice.id, disputed: false })}
                >
                  Resolve dispute
                </Button>
              )}
              {audience === 'tenant' && !invoice.is_disputed && Number(invoice.outstanding) > 0 && (
                <Button variant="outline" size="sm" onClick={() => setDisputeOpen(true)}>
                  Something wrong? Dispute
                </Button>
              )}
            </div>

            <CreditNoteDialog
              open={waiveOpen}
              onOpenChange={setWaiveOpen}
              invoiceId={invoice.id}
              maxAmount={invoice.outstanding}
            />
            <DisputeDialog open={disputeOpen} onOpenChange={setDisputeOpen} invoiceId={invoice.id} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? 'font-semibold' : ''}`}>
      <dt className={strong ? '' : 'text-muted-foreground'}>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function CreditNoteDialog({
  open,
  onOpenChange,
  invoiceId,
  maxAmount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  maxAmount: string;
}) {
  const issue = useIssueCreditNote();
  const [amount, setAmount] = React.useState(maxAmount);
  const [reason, setReason] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setAmount(maxAmount);
      setReason('');
    }
  }, [open, maxAmount]);

  const tooMuch = Number(amount) > Number(maxAmount);
  const submit = async () => {
    await issue.mutateAsync({ invoiceId, amount, reason });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Waive or discount</DialogTitle>
          <DialogDescription>Issues a credit note that reduces what the tenant owes on this invoice.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="cn-amount">Amount (up to {formatKes(maxAmount, { cents: true })})</Label>
            <Input id="cn-amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            {tooMuch && <p className="text-xs text-destructive">Can’t credit more than is unpaid.</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="cn-reason">Reason (shown on the credit note)</Label>
            <Textarea id="cn-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={submit}
            isLoading={issue.isPending}
            disabled={!reason.trim() || !(Number(amount) > 0) || tooMuch}
          >
            Issue credit note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DisputeDialog({
  open,
  onOpenChange,
  invoiceId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
}) {
  const setDisputed = useSetDisputed();
  const [note, setNote] = React.useState('');
  const submit = async () => {
    await setDisputed.mutateAsync({ invoiceId, disputed: true, note });
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dispute this invoice</DialogTitle>
          <DialogDescription>
            Tell your landlord what’s wrong. While it’s disputed you won’t get reminders or late penalties for it.
          </DialogDescription>
        </DialogHeader>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="e.g. I paid this in cash on 3 May" />
        <DialogFooter>
          <Button onClick={submit} isLoading={setDisputed.isPending} disabled={!note.trim()}>
            Send dispute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
