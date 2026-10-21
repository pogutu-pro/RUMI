'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/dashboard/page-header';
import {
  useGenerateRentCharges, useRecordManualPayment, useRentBalance, useTenancies,
} from '@/features/rental/hooks/use-rental';
import { useInvoices } from '@/features/ledger/hooks/use-ledger';
import { AdhocInvoiceDialog } from '@/features/ledger/components/adhoc-invoice-dialog';
import { InvoiceDetailSheet } from '@/features/ledger/components/invoice-detail-sheet';
import { InvoiceStatusBadge } from '@/features/ledger/components/invoice-status-badge';
import { INVOICE_TYPE_LABEL, formatDate, formatKes } from '@/features/ledger/lib/format';
import type { Invoice } from '@/features/ledger/types';
import { usePagination } from '@/hooks/use-pagination';
import { SimplePager } from '@/components/ui/simple-pager';

type Filter = 'open' | 'overdue' | 'disputed' | 'all';

const OPEN = new Set(['due', 'overdue', 'partially_paid', 'upcoming', 'disputed']);

export default function InvoicesPage() {
  const [filter, setFilter] = React.useState<Filter>('open');
  const { data: invoices = [], isLoading } = useInvoices();
  const { data: balance } = useRentBalance();
  const { data: tenancies = [] } = useTenancies();
  const generate = useGenerateRentCharges();

  const [selected, setSelected] = React.useState<string | null>(null);
  const [newCharge, setNewCharge] = React.useState(false);
  const [paying, setPaying] = React.useState<Invoice | null>(null);

  const visible = invoices.filter((i) => {
    if (filter === 'open') return OPEN.has(i.status) && Number(i.outstanding) > 0;
    if (filter === 'overdue') return i.status === 'overdue';
    if (filter === 'disputed') return i.is_disputed;
    return true;
  });
  const { pageItems, pagerProps } = usePagination(visible, 20, filter);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Rent & invoices"
        description="Every amount owed — rent, deposits, extras and penalties — with what has been paid."
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => generate.mutate()} isLoading={generate.isPending}>
              Bill rent now
            </Button>
            <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setNewCharge(true)}>
              New charge
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Summary label="Outstanding" value={formatKes(balance?.outstanding_total)} />
        <Summary label="Overdue" value={formatKes(balance?.overdue_total)} tone="destructive" />
        <Summary label="Tenant credit held" value={formatKes(balance?.credit_total)} />
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="open">Unpaid</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="disputed">Disputed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {filter === 'all' ? 'No invoices yet.' : 'Nothing here — all clear.'}
        </p>
      ) : (
        <div>
          {/* Phones: one card per invoice; tap it for the details. */}
          <ul className="space-y-2 md:hidden">
            {pageItems.map((invoice) => (
              <li key={invoice.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(invoice.id)}
                  onKeyDown={(e) => e.key === 'Enter' && setSelected(invoice.id)}
                  className="rounded-xl border bg-background p-4 active:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{invoice.tenant_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {invoice.unit_number} · {INVOICE_TYPE_LABEL[invoice.invoice_type]} · due {formatDate(invoice.due_date)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold tabular-nums">{formatKes(invoice.outstanding)}</p>
                      <InvoiceStatusBadge status={invoice.status} />
                    </div>
                  </div>
                  {Number(invoice.outstanding) > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 w-full"
                      onClick={(e) => { e.stopPropagation(); setPaying(invoice); }}
                    >
                      Record payment
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((invoice) => (
                <TableRow key={invoice.id} className="cursor-pointer" onClick={() => setSelected(invoice.id)}>
                  <TableCell>
                    <span className="font-mono text-xs">{invoice.number}</span>
                    <span className="block text-xs text-muted-foreground">{INVOICE_TYPE_LABEL[invoice.invoice_type]}</span>
                  </TableCell>
                  <TableCell>
                    {invoice.tenant_name}
                    <span className="block text-xs text-muted-foreground">{invoice.unit_number}</span>
                  </TableCell>
                  <TableCell>{formatDate(invoice.due_date)}</TableCell>
                  <TableCell className="text-right">{formatKes(invoice.amount_due)}</TableCell>
                  <TableCell className="text-right">{formatKes(invoice.outstanding)}</TableCell>
                  <TableCell><InvoiceStatusBadge status={invoice.status} /></TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {Number(invoice.outstanding) > 0 && (
                      <Button size="sm" variant="outline" onClick={() => setPaying(invoice)}>
                        Record payment
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
          <SimplePager {...pagerProps} />
        </div>
      )}

      <InvoiceDetailSheet invoiceId={selected} onClose={() => setSelected(null)} audience="landlord" />
      <AdhocInvoiceDialog open={newCharge} onOpenChange={setNewCharge} tenancies={tenancies} />
      <RecordPaymentDialog invoice={paying} onClose={() => setPaying(null)} />
    </div>
  );
}

function Summary({ label, value, tone }: { label: string; value: string; tone?: 'destructive' }) {
  return (
    <div className="rounded-md border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`text-xl font-semibold ${tone === 'destructive' ? 'text-destructive' : ''}`}>{value}</p>
    </div>
  );
}

function RecordPaymentDialog({ invoice, onClose }: { invoice: Invoice | null; onClose: () => void }) {
  const record = useRecordManualPayment();
  const [amount, setAmount] = React.useState('');
  const [method, setMethod] = React.useState('cash');

  React.useEffect(() => {
    if (invoice) {
      setAmount(invoice.outstanding);
      setMethod('cash');
    }
  }, [invoice]);

  const tooMuch = invoice ? Number(amount) > Number(invoice.outstanding) : false;

  const submit = async () => {
    if (!invoice) return;
    await record.mutateAsync({
      tenancy: invoice.tenancy,
      amount,
      rent_charge_id: invoice.id,
      payment_method: method,
    });
    onClose();
  };

  return (
    <Dialog open={!!invoice} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment for {invoice?.number}</DialogTitle>
          <DialogDescription>Cash or bank money you received for this invoice.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="pay-amount">Amount received (KES)</Label>
            <Input id="pay-amount" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            {tooMuch && (
              <p className="text-xs text-destructive">
                More than this invoice’s balance. Record an overpayment without choosing an invoice from Payments instead.
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label>How it was paid</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">The tenant gets a receipt by SMS and email.</p>
        </div>
        <DialogFooter>
          <Button onClick={submit} isLoading={record.isPending} disabled={!(Number(amount) > 0) || tooMuch}>
            Save payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
