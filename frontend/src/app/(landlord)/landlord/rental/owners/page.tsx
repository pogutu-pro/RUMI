'use client';

import * as React from 'react';
import { Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/dashboard/page-header';
import { useProperties } from '@/features/rental/hooks/use-rental';
import {
  useApproveOwnerStatement, useDownloadOwnerStatement, useOwnerPreview, useOwnerStatements, useOwnerTransactions,
  useOwners, useRecordOwnerTransaction, useSaveOwner, useSetPropertyOwner,
} from '@/features/agency/hooks';
import type { OwnerTransaction, PropertyOwner } from '@/features/agency/types';
import { formatDate, formatKes } from '@/features/ledger/lib/format';

const thisMonth = () => new Date().toISOString().slice(0, 7);
const today = () => new Date().toISOString().slice(0, 10);

export default function OwnersPage() {
  const { data: owners = [], isLoading } = useOwners();
  const [editing, setEditing] = React.useState<Partial<PropertyOwner> | null>(null);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const open = owners.find((o) => o.id === openId) ?? null;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Property owners"
        description="For agents: the landlords you manage for, their commission terms, statements and payouts."
        action={<Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing({})}>Add owner</Button>}
      />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : owners.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No owners yet. If you own the properties yourself you don’t need this page.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Owner</TableHead>
              <TableHead>Properties</TableHead>
              <TableHead>Fees</TableHead>
              <TableHead className="text-right">We owe them</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {owners.map((o) => (
              <TableRow key={o.id} className="cursor-pointer" onClick={() => setOpenId(o.id)}>
                <TableCell>{o.full_name}<span className="block text-xs text-muted-foreground">{o.phone || o.email}</span></TableCell>
                <TableCell>{o.property_ids.length}</TableCell>
                <TableCell className="text-sm">{Number(o.management_fee_percent)}% mgmt · {Number(o.letting_fee_percent)}% letting</TableCell>
                <TableCell className={`text-right ${Number(o.balance) < 0 ? 'text-destructive' : ''}`}>{formatKes(o.balance)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <OwnerDialog owner={editing} onClose={() => setEditing(null)} />
      <OwnerSheet owner={open} onClose={() => setOpenId(null)} onEdit={(o) => setEditing(o)} />
    </div>
  );
}

function OwnerDialog({ owner, onClose }: { owner: Partial<PropertyOwner> | null; onClose: () => void }) {
  const save = useSaveOwner();
  const [form, setForm] = React.useState<Partial<PropertyOwner>>({});
  React.useEffect(() => {
    if (owner) setForm({ payout_method: 'bank_transfer', management_fee_percent: '10', letting_fee_percent: '50', ...owner });
  }, [owner]);
  const set = (patch: Partial<PropertyOwner>) => setForm((f) => ({ ...f, ...patch }));
  const submit = async () => {
    const { full_name, phone, email, kra_pin, payout_method, payout_details, management_fee_percent, letting_fee_percent } = form;
    await save.mutateAsync({
      id: owner?.id,
      payload: { full_name, phone, email, kra_pin, payout_method, payout_details, management_fee_percent, letting_fee_percent },
    });
    onClose();
  };
  return (
    <Dialog open={!!owner} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{owner?.id ? 'Edit owner' : 'Add owner'}</DialogTitle>
          <DialogDescription>Commission terms apply to every statement from now on.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name" id="o-name" value={form.full_name ?? ''} onChange={(v) => set({ full_name: v })} wide />
          <Field label="Phone" id="o-phone" value={form.phone ?? ''} onChange={(v) => set({ phone: v })} />
          <Field label="Email (statements are sent here)" id="o-email" value={form.email ?? ''} onChange={(v) => set({ email: v })} />
          <Field label="Management fee %" id="o-mgmt" type="number" value={form.management_fee_percent ?? ''} onChange={(v) => set({ management_fee_percent: v })} />
          <Field label="Letting fee % of one month’s rent" id="o-let" type="number" value={form.letting_fee_percent ?? ''} onChange={(v) => set({ letting_fee_percent: v })} />
          <div className="space-y-1">
            <Label>Paid by</Label>
            <Select value={form.payout_method} onValueChange={(v) => set({ payout_method: v as PropertyOwner['payout_method'] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                <SelectItem value="mpesa_paybill">M-Pesa</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Field label="Account / number" id="o-acct" value={form.payout_details ?? ''} onChange={(v) => set({ payout_details: v })} />
          <Field label="KRA PIN" id="o-pin" value={form.kra_pin ?? ''} onChange={(v) => set({ kra_pin: v })} />
        </div>
        <DialogFooter>
          <Button onClick={submit} isLoading={save.isPending} disabled={!form.full_name?.trim()}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, id, value, onChange, type = 'text', wide }: {
  label: string; id: string; value: string; onChange: (v: string) => void; type?: string; wide?: boolean;
}) {
  return (
    <div className={`space-y-1 ${wide ? 'sm:col-span-2' : ''}`}>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function OwnerSheet({ owner, onClose, onEdit }: {
  owner: PropertyOwner | null; onClose: () => void; onEdit: (o: PropertyOwner) => void;
}) {
  return (
    <Sheet open={!!owner} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {owner && (
          <div className="space-y-4">
            <SheetHeader>
              <SheetTitle>{owner.full_name}</SheetTitle>
              <SheetDescription>
                {Number(owner.balance) >= 0
                  ? `You owe ${formatKes(owner.balance)}`
                  : `Owner owes ${formatKes(Math.abs(Number(owner.balance)))} (advance outstanding)`}
              </SheetDescription>
            </SheetHeader>
            <Button size="sm" variant="outline" onClick={() => onEdit(owner)}>Edit details & fees</Button>
            <Tabs defaultValue="statement">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="statement">Statements</TabsTrigger>
                <TabsTrigger value="payouts">Payouts</TabsTrigger>
                <TabsTrigger value="properties">Properties</TabsTrigger>
              </TabsList>
              <TabsContent value="statement"><StatementsTab owner={owner} /></TabsContent>
              <TabsContent value="payouts"><PayoutsTab owner={owner} /></TabsContent>
              <TabsContent value="properties"><PropertiesTab owner={owner} /></TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function StatementsTab({ owner }: { owner: PropertyOwner }) {
  const [month, setMonth] = React.useState(thisMonth());
  const { data: preview } = useOwnerPreview(owner.id, month);
  const { data: statements = [] } = useOwnerStatements(owner.id);
  const approve = useApproveOwnerStatement();
  const download = useDownloadOwnerStatement();
  const alreadyDone = statements.some((s) => s.period_start.startsWith(month));

  return (
    <div className="space-y-4 pt-2 text-sm">
      <Input type="month" className="w-44" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Statement month" />
      {preview && (
        <div className="space-y-1 rounded-md border p-3">
          <Row label="Rent & charges collected" value={formatKes(preview.totals.collected, { cents: true })} />
          {Number(preview.totals.deposit_deductions_kept) > 0 && <Row label="Deposit deductions kept" value={formatKes(preview.totals.deposit_deductions_kept, { cents: true })} />}
          <Row label="Expenses" value={`− ${formatKes(preview.totals.expenses, { cents: true })}`} />
          <Row label={`Management fee (${Number(preview.management_fee_percent)}%)`} value={`− ${formatKes(preview.totals.management_fee, { cents: true })}`} />
          {Number(preview.totals.letting_fee) > 0 && <Row label="Letting fees" value={`− ${formatKes(preview.totals.letting_fee, { cents: true })}`} />}
          <Row label="Net due for the month" value={formatKes(preview.totals.net, { cents: true })} strong />
          <Row label="Balance after payouts" value={formatKes(preview.closing_balance, { cents: true })} />
          <Button
            size="sm"
            className="mt-2"
            disabled={alreadyDone}
            isLoading={approve.isPending}
            onClick={() => approve.mutate({ id: owner.id, month })}
          >
            {alreadyDone ? 'Already approved' : 'Approve & email statement'}
          </Button>
        </div>
      )}
      <ul className="space-y-1">
        {statements.map((s) => (
          <li key={s.id} className="flex items-center justify-between">
            <span>{s.number} · {formatDate(s.period_start)} · net {formatKes(s.net_due)}</span>
            <Button variant="ghost" size="sm" leftIcon={<Download className="h-4 w-4" />} onClick={() => download.mutate({ id: s.id, number: s.number })}>PDF</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PayoutsTab({ owner }: { owner: PropertyOwner }) {
  const { data: transactions = [] } = useOwnerTransactions(owner.id);
  const record = useRecordOwnerTransaction();
  const [kind, setKind] = React.useState<OwnerTransaction['kind']>('remittance');
  const [amount, setAmount] = React.useState('');
  const [method, setMethod] = React.useState(owner.payout_method);
  const [reference, setReference] = React.useState('');
  const submit = async () => {
    await record.mutateAsync({
      id: owner.id,
      payload: { kind, amount, method: kind === 'advance_fee' ? '' : method, reference, transaction_date: today() },
    });
    setAmount('');
    setReference('');
  };
  const LABEL = { remittance: 'Paid to owner', advance: 'Advance / loan', advance_fee: 'Advance fee / interest' };
  return (
    <div className="space-y-4 pt-2 text-sm">
      <div className="grid grid-cols-2 gap-2">
        <Select value={kind} onValueChange={(v) => setKind(v as OwnerTransaction['kind'])}>
          <SelectTrigger aria-label="Type"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(LABEL) as OwnerTransaction['kind'][]).map((k) => <SelectItem key={k} value={k}>{LABEL[k]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input aria-label="Amount" type="number" min="0" placeholder="KES" value={amount} onChange={(e) => setAmount(e.target.value)} />
        {kind !== 'advance_fee' && (
          <Select value={method} onValueChange={(v) => setMethod(v as PropertyOwner['payout_method'])}>
            <SelectTrigger aria-label="Method"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bank_transfer">Bank transfer</SelectItem>
              <SelectItem value="mpesa_paybill">M-Pesa</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Input aria-label="Reference" placeholder="Reference" value={reference} onChange={(e) => setReference(e.target.value)} />
      </div>
      <Button size="sm" onClick={submit} isLoading={record.isPending} disabled={!(Number(amount) > 0)}>Record</Button>
      <p className="text-xs text-muted-foreground">RumiaRent records payouts; you send the money from your bank or M-Pesa.</p>
      <ul className="space-y-1">
        {transactions.map((t) => (
          <li key={t.id} className="flex justify-between">
            <span>{formatDate(t.transaction_date)} · {LABEL[t.kind]}{t.reference && ` · ${t.reference}`}</span>
            <span>{formatKes(t.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PropertiesTab({ owner }: { owner: PropertyOwner }) {
  const { data: properties = [] } = useProperties();
  const setOwner = useSetPropertyOwner();
  return (
    <ul className="space-y-2 pt-2 text-sm">
      {properties.map((p) => {
        const mine = p.owner === owner.id;
        const other = !!p.owner && !mine;
        return (
          <li key={p.id}>
            <label className={`flex items-center gap-2 ${other ? 'opacity-50' : ''}`}>
              <Checkbox
                checked={mine}
                disabled={other || setOwner.isPending}
                onCheckedChange={(v) => setOwner.mutate({ propertyId: p.id, ownerId: v === true ? owner.id : null })}
              />
              {p.name}{other && ' (another owner)'}
            </label>
          </li>
        );
      })}
    </ul>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? 'font-semibold' : ''}`}>
      <span className={strong ? '' : 'text-muted-foreground'}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
