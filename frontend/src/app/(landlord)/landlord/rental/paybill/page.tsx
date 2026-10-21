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
  useUpdatePaybill,
} from '@/features/paybill/hooks';
import type { PaybillAccount, PaybillTransaction } from '@/features/paybill/types';
import { WhatsAppHelp } from '@/components/support/whatsapp-help';

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
  fuzzy: 'by a close match of the account number',
  alias: 'remembered from an earlier payment',
  manual: 'by hand',
};

export default function PaybillPage() {
  const [tab, setTab] = React.useState<'unmatched' | 'all'>('unmatched');
  const { data: accounts = [], isLoading: accountsLoading } = usePaybillAccounts();
  const { data: transactions = [], isLoading } = usePaybillTransactions(tab === 'unmatched' ? 'unmatched' : undefined);
  const register = useRegisterPaybill();
  const [connecting, setConnecting] = React.useState(false);
  const [keysFor, setKeysFor] = React.useState<PaybillAccount | null>(null);
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
            <CardTitle className="text-base">No paybill yet</CardTitle>
            <CardDescription>
              Add your paybill number so tenants see where to pay and their own account number. Payments start being
              matched and receipted automatically once Safaricom approves the connection (steps below).
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <WhatsAppHelp topic="paybill" label="Prefer we set it up with you? Message us on WhatsApp" />
          </CardContent>
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
                  <p className="text-muted-foreground">
                    Tenants can already pay this paybill. To match payments automatically, add the keys Safaricom gives
                    you (see the steps below).
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant={a.has_credentials ? 'outline' : 'default'} onClick={() => setKeysFor(a)}>
                    {a.has_credentials ? 'Change Safaricom keys' : 'Add Safaricom keys'}
                  </Button>
                  <Button
                    size="sm"
                    variant={a.registered_at ? 'outline' : 'default'}
                    disabled={!a.has_credentials}
                    isLoading={register.isPending && register.variables === a.id}
                    onClick={() => register.mutate(a.id)}
                  >
                    {a.registered_at ? 'Register again' : 'Register with Safaricom'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(accounts.length === 0 || accounts.some((a) => !a.registered_at)) && <SafaricomGuide />}

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
          <div>
            {/* Phones: one card per payment. */}
            <ul className="space-y-2 md:hidden">
              {transactions.map((t) => (
                <li key={t.id} className="rounded-xl border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{t.payer_name || 'Unknown payer'}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(t.trans_time)} · <span className="font-mono">{t.trans_id}</span>
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold tabular-nums">{formatKes(t.amount)}</p>
                  </div>
                  <p className="mt-2 text-sm">
                    Account typed <span className="font-mono">{t.bill_ref_number || '(blank)'}</span>
                    {t.tenant_name ? (
                      <span className="text-muted-foreground"> → {t.tenant_name} · {t.unit_number} ({MATCHED_BY[t.matched_by]})</span>
                    ) : null}
                  </p>
                  {t.unverified_source && (
                    <p className="mt-1 text-xs text-warning">Check against your M-Pesa statement</p>
                  )}
                  {t.status === 'unmatched' ? (
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => setAssigning(t)}>Assign to tenant</Button>
                      <Button size="sm" variant="outline" onClick={() => setIgnoring(t)}>Not rent</Button>
                    </div>
                  ) : !t.tenant_name ? (
                    <Badge variant="outline" className="mt-2">{STATUS_LABEL[t.status]}</Badge>
                  ) : null}
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead className="hidden md:table-cell">M-Pesa code</TableHead>
                  <TableHead>Paid by</TableHead>
                  <TableHead className="hidden md:table-cell">Account typed</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(t.trans_time)}</TableCell>
                    <TableCell className="hidden font-mono text-xs md:table-cell">{t.trans_id}</TableCell>
                    <TableCell>
                      {t.payer_name || '—'}
                      <span className="block font-mono text-xs text-muted-foreground md:hidden">
                        {t.trans_id} · {t.bill_ref_number || '(blank)'}
                      </span>
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs md:table-cell">{t.bill_ref_number || '(blank)'}</TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">{formatKes(t.amount)}</TableCell>
                    <TableCell>
                      {t.tenant_name ? (
                        <span>
                          {t.tenant_name} · {t.unit_number}
                          <span className="block text-xs text-muted-foreground">
                            {MATCHED_BY[t.matched_by]}{t.receipt_number && ` · ${t.receipt_number}`}
                          </span>
                        </span>
                      ) : (
                        <span>
                          <Badge variant={t.status === 'unmatched' ? 'destructive' : 'outline'} title={t.note || undefined}>
                            {STATUS_LABEL[t.status]}
                          </Badge>
                          {t.unverified_source && (
                            <span className="block text-xs text-warning">Check against your M-Pesa statement</span>
                          )}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {t.status === 'unmatched' && (
                        <div className="flex flex-wrap gap-1">
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
          </div>
        )}
      </div>

      <ConnectDialog open={connecting} onOpenChange={setConnecting} />
      <KeysDialog paybill={keysFor} onClose={() => setKeysFor(null)} />
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
            {txn?.bill_ref_number && !txn.unverified_source
              ? ` Next time “${txn.bill_ref_number}” is typed, it goes to this tenant automatically.`
              : ''}
          </DialogDescription>
          {txn?.unverified_source && (
            <p className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
              This notice came from an address Safaricom does not normally use. Find M-Pesa code {txn.trans_id} on
              your M-Pesa statement before assigning it.
            </p>
          )}
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


/** How a landlord gets Safaricom to send their paybill's payments to RumiaRent. */
function SafaricomGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Turn on automatic M-Pesa receipts</CardTitle>
        <CardDescription>
          A one-time approval from Safaricom, about 15 minutes. You need the phone of your paybill&apos;s M-Pesa
          administrator (the person who logs in to the M-Pesa business portal).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          <li>
            Sign up at <span className="font-medium">developer.safaricom.co.ke</span> (Safaricom&apos;s Daraja portal)
            with your business email.
          </li>
          <li>
            Choose <span className="font-medium">Go Live</span>, enter your paybill number and business name exactly as
            Safaricom has them, and confirm with the code sent to the administrator&apos;s phone.
          </li>
          <li>
            Open the live app Safaricom creates and copy its <span className="font-medium">Consumer Key</span> and{' '}
            <span className="font-medium">Consumer Secret</span>.
          </li>
          <li>
            Here, press <span className="font-medium">Add Safaricom keys</span>, paste them, then{' '}
            <span className="font-medium">Register with Safaricom</span>.
          </li>
          <li>
            Test: pay KES 10 to your paybill using a tenant&apos;s account number. It should appear below within a
            minute, with a receipt sent to the tenant.
          </li>
        </ol>
        <p className="mt-3 text-xs text-muted-foreground">
          Safaricom sometimes changes these screens. If you get stuck, Daraja support is apisupport@safaricom.co.ke.
          Until it is set up, tenants can still pay your paybill and you record payments by hand or upload your M-Pesa
          statement.
        </p>
        <div className="mt-4 flex flex-col gap-3 rounded-xl border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            <span className="font-medium">Rather not do this yourself?</span> We do it with you on a short WhatsApp
            chat, free.
          </p>
          <WhatsAppHelp topic="daraja" variant="button" />
        </div>
      </CardContent>
    </Card>
  );
}

function KeysDialog({ paybill, onClose }: { paybill: PaybillAccount | null; onClose: () => void }) {
  const update = useUpdatePaybill();
  const [key, setKey] = React.useState('');
  const [secret, setSecret] = React.useState('');
  React.useEffect(() => {
    setKey('');
    setSecret('');
  }, [paybill]);

  const save = async () => {
    if (!paybill) return;
    await update.mutateAsync({
      id: paybill.id,
      payload: { consumer_key: key.trim(), consumer_secret: secret.trim(), environment: 'production' },
    });
    onClose();
  };

  return (
    <Dialog open={!!paybill} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Safaricom keys for paybill {paybill?.shortcode}</DialogTitle>
          <DialogDescription>
            From your live app on developer.safaricom.co.ke. They are stored encrypted and never shown again.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="consumer-key">Consumer Key</Label>
            <Input id="consumer-key" value={key} onChange={(e) => setKey(e.target.value)} autoComplete="off" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="consumer-secret">Consumer Secret</Label>
            <Input id="consumer-secret" type="password" value={secret} onChange={(e) => setSecret(e.target.value)}
              autoComplete="off" />
          </div>
        </div>
        <WhatsAppHelp topic="daraja" label="Not sure where these are? We can help on WhatsApp" />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} isLoading={update.isPending} disabled={!key.trim() || !secret.trim()}>Save keys</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

