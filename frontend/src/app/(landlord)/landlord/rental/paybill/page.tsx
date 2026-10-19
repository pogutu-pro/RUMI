'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/dashboard/page-header';
import { useTenancies } from '@/features/rental/hooks/use-rental';
import { formatDate, formatKes } from '@/features/ledger/lib/format';
import {
  useAssignPaybillTxn,
  useConnectPaybill,
  useIgnorePaybillTxn,
  usePaybillAccounts,
  usePaybillTransactions,
  useRegisterPaybill,
} from '@/features/paybill/hooks';
import type { PaybillTransaction } from '@/features/paybill/types';

const STATUS_LABEL: Record<string, string> = {
  matched: 'Matched',
  assigned: 'Assigned',
  unmatched: 'Needs attention',
  ignored: 'Not rent',
};

const MATCHED_BY: Record<string, string> = {
  reference: 'by account number',
  unit: 'by unit number',
  phone: 'by phone',
  manual: 'by hand',
};

export default function PaybillPage() {
  const [tab, setTab] = React.useState<'unmatched' | 'all'>('unmatched');
  const { data: accounts = [], isLoading: accountsLoading } = usePaybillAccounts();
  const { data: transactions = [], isLoading } = usePaybillTransactions(tab === 'unmatched' ? 'unmatched' : undefined);
  const register = useRegisterPaybill();
  const [connecting, setConnecting] = React.useState(false);
  const [assigning, setAssigning] = React.useState<PaybillTransaction | null>(null);
  const [ignoring, setIgnoring] = React.useState<PaybillTransaction | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="M-Pesa paybill"
        description="Tenants pay your own paybill with their account number; payments are matched, receipted and recorded automatically."
        action={
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setConnecting(true)}>
            Connect paybill
          </Button>
        }
      />

      {accountsLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : accounts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No paybill connected</CardTitle>
            <CardDescription>
              Connect your paybill or till to stop typing in M-Pesa payments by hand. You’ll need the Daraja app
              consumer key and secret for that paybill (Safaricom developer portal).
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {accounts.map((a) => (
            <Card key={a.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{a.shortcode_type === 'till' ? 'Till' : 'Paybill'} {a.shortcode}</span>
                  <Badge variant={a.environment === 'production' ? 'default' : 'secondary'}>{a.environment}</Badge>
                </CardTitle>
                <CardDescription>{a.display_name || '—'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  {a.registered_at ? `Registered with Safaricom ${formatDate(a.registered_at)}` : 'Not registered with Safaricom yet'}
                  {a.last_callback_at && ` · last payment ${formatDate(a.last_callback_at)}`}
                </p>
                {!a.has_credentials && (
                  <p className="text-destructive">Add the Daraja consumer key and secret to register.</p>
                )}
                <Button
                  size="sm"
                  variant={a.registered_at ? 'outline' : 'default'}
                  disabled={!a.has_credentials}
                  isLoading={register.isPending && register.variables === a.id}
                  onClick={() => register.mutate(a.id)}
                >
                  {a.registered_at ? 'Register again' : 'Register with Safaricom'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'unmatched' | 'all')}>
          <TabsList>
            <TabsTrigger value="unmatched">Needs attention</TabsTrigger>
            <TabsTrigger value="all">All M-Pesa payments</TabsTrigger>
          </TabsList>
        </Tabs>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {tab === 'unmatched' ? 'Every M-Pesa payment has been matched.' : 'No M-Pesa payments yet.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>M-Pesa code</TableHead>
                  <TableHead>Paid by</TableHead>
                  <TableHead>Account typed</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{formatDate(t.trans_time)}</TableCell>
                    <TableCell className="font-mono text-xs">{t.trans_id}</TableCell>
                    <TableCell>{t.payer_name || '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{t.bill_ref_number || '(blank)'}</TableCell>
                    <TableCell className="text-right">{formatKes(t.amount)}</TableCell>
                    <TableCell>
                      {t.tenant_name ? (
                        <span>
                          {t.tenant_name} · {t.unit_number}
                          <span className="block text-xs text-muted-foreground">
                            {MATCHED_BY[t.matched_by]}{t.receipt_number && ` · ${t.receipt_number}`}
                          </span>
                        </span>
                      ) : (
                        <Badge variant={t.status === 'unmatched' ? 'destructive' : 'outline'} title={t.note || undefined}>
                          {STATUS_LABEL[t.status]}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {t.status === 'unmatched' && (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => setAssigning(t)}>Assign</Button>
                          <Button size="sm" variant="ghost" onClick={() => setIgnoring(t)}>Not rent</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <ConnectDialog open={connecting} onOpenChange={setConnecting} />
      <AssignDialog txn={assigning} onClose={() => setAssigning(null)} />
      <IgnoreDialog txn={ignoring} onClose={() => setIgnoring(null)} />
    </div>
  );
}

function ConnectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const connect = useConnectPaybill();
  const [form, setForm] = React.useState({
    shortcode: '', shortcode_type: 'paybill' as 'paybill' | 'till', display_name: '',
    environment: 'production' as 'sandbox' | 'production', consumer_key: '', consumer_secret: '',
  });
  React.useEffect(() => {
    if (open) {
      setForm({ shortcode: '', shortcode_type: 'paybill', display_name: '', environment: 'production', consumer_key: '', consumer_secret: '' });
    }
  }, [open]);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    await connect.mutateAsync(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect a paybill or till</DialogTitle>
          <DialogDescription>
            The consumer key and secret come from the Daraja app linked to this paybill. They are stored encrypted and
            never shown again.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="pb-code">Paybill / till number</Label>
            <Input id="pb-code" inputMode="numeric" value={form.shortcode} onChange={(e) => set({ shortcode: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Type</Label>
            <Select value={form.shortcode_type} onValueChange={(v) => set({ shortcode_type: v as 'paybill' | 'till' })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="paybill">Paybill</SelectItem>
                <SelectItem value="till">Till (Buy Goods)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="pb-name">Name tenants see</Label>
            <Input id="pb-name" value={form.display_name} onChange={(e) => set({ display_name: e.target.value })} placeholder="e.g. Greenview Apartments" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pb-key">Consumer key</Label>
            <Input id="pb-key" autoComplete="off" value={form.consumer_key} onChange={(e) => set({ consumer_key: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pb-secret">Consumer secret</Label>
            <Input id="pb-secret" type="password" autoComplete="new-password" value={form.consumer_secret} onChange={(e) => set({ consumer_secret: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Environment</Label>
            <Select value={form.environment} onValueChange={(v) => set({ environment: v as 'sandbox' | 'production' })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="production">Live</SelectItem>
                <SelectItem value="sandbox">Sandbox (testing)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {form.shortcode_type === 'till' && (
          <p className="text-xs text-muted-foreground">
            Till payments have no account number, so they are matched by phone when Safaricom sends it, otherwise you
            assign them by hand.
          </p>
        )}
        <DialogFooter>
          <Button onClick={submit} isLoading={connect.isPending} disabled={!/^\d{5,7}$/.test(form.shortcode)}>
            Connect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignDialog({ txn, onClose }: { txn: PaybillTransaction | null; onClose: () => void }) {
  const { data: tenancies = [] } = useTenancies();
  const assign = useAssignPaybillTxn();
  const [tenancy, setTenancy] = React.useState('');
  React.useEffect(() => setTenancy(''), [txn]);

  const submit = async () => {
    if (!txn) return;
    await assign.mutateAsync({ id: txn.id, tenancy });
    onClose();
  };

  return (
    <Dialog open={!!txn} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Whose payment is {txn?.trans_id}?</DialogTitle>
          <DialogDescription>
            {formatKes(txn?.amount)} from {txn?.payer_name || 'unknown'}, account typed “{txn?.bill_ref_number || 'blank'}”.
            It will be applied to their oldest invoices and they’ll get a receipt.
          </DialogDescription>
        </DialogHeader>
        <Select value={tenancy} onValueChange={setTenancy}>
          <SelectTrigger><SelectValue placeholder="Choose tenant" /></SelectTrigger>
          <SelectContent>
            {tenancies.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.tenant_name} · {t.unit_number}{t.payment_reference ? ` (acc. ${t.payment_reference})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button onClick={submit} isLoading={assign.isPending} disabled={!tenancy}>Assign payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IgnoreDialog({ txn, onClose }: { txn: PaybillTransaction | null; onClose: () => void }) {
  const ignore = useIgnorePaybillTxn();
  const [note, setNote] = React.useState('');
  React.useEffect(() => setNote(''), [txn]);
  const submit = async () => {
    if (!txn) return;
    await ignore.mutateAsync({ id: txn.id, note });
    onClose();
  };
  return (
    <Dialog open={!!txn} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Not a rent payment?</DialogTitle>
          <DialogDescription>It stays on record but won’t be added to any tenant’s account.</DialogDescription>
        </DialogHeader>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why — e.g. shop sale" />
        <DialogFooter>
          <Button onClick={submit} isLoading={ignore.isPending} disabled={!note.trim()}>Mark as not rent</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
