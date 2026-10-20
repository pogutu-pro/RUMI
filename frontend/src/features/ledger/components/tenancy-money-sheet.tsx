'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Tenancy } from '@/features/rental/types';
import { LeaseTab } from '@/features/leasing/components';
import {
  useBillUtilitiesNow,
  useCreateDepositSettlement,
  useCreateRecurringCharge,
  useDeposit,
  useInvoiceDeposit,
  useMeterReadings,
  useRecordDepositHeld,
  useRecordMeterReading,
  useRecurringCharges,
  useSettlementAction,
  useStopRecurringCharge,
} from '../hooks/use-ledger';
import { EXTRA_LINE_TYPES, LINE_TYPE_LABEL, formatDate, formatKes } from '../lib/format';
import type {
  DepositDeduction,
  DepositDeductionKind,
  DepositSettlement,
  ExtraLineType,
  RefundMethod,
  Utility,
} from '../types';

const today = () => new Date().toISOString().slice(0, 10);

const METHOD_LABEL: Record<RefundMethod, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
  mpesa_paybill: 'M-Pesa',
  other: 'Other',
};

/**
 * Everything money-related for one tenancy that isn't rent itself:
 * recurring extras, the deposit (and its move-out settlement), and meters.
 */
export function TenancyMoneySheet({ tenancy, onClose }: { tenancy: Tenancy | null; onClose: () => void }) {
  return (
    <Sheet open={!!tenancy} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {tenancy && (
          <div className="space-y-4">
            <SheetHeader>
              <SheetTitle>{tenancy.tenant_name} · {tenancy.unit_number}</SheetTitle>
              <SheetDescription>Rent {formatKes(tenancy.monthly_rent)} / month · deposit {formatKes(tenancy.deposit)}</SheetDescription>
            </SheetHeader>
            <Tabs defaultValue="extras">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="extras">Extras</TabsTrigger>
                <TabsTrigger value="deposit">Deposit</TabsTrigger>
                <TabsTrigger value="meters">Meters</TabsTrigger>
                <TabsTrigger value="lease">Lease</TabsTrigger>
              </TabsList>
              <TabsContent value="extras"><RecurringChargesTab tenancy={tenancy} /></TabsContent>
              <TabsContent value="deposit"><DepositTab tenancy={tenancy} /></TabsContent>
              <TabsContent value="meters"><MetersTab tenancy={tenancy} /></TabsContent>
              <TabsContent value="lease"><LeaseTab tenancyId={tenancy.id} monthlyRent={tenancy.monthly_rent} /></TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------- extras

function RecurringChargesTab({ tenancy }: { tenancy: Tenancy }) {
  const { data: charges = [], isLoading } = useRecurringCharges(tenancy.id);
  const create = useCreateRecurringCharge(tenancy.id);
  const stop = useStopRecurringCharge(tenancy.id);
  const [lineType, setLineType] = React.useState<ExtraLineType>('service_charge');
  const [description, setDescription] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [start, setStart] = React.useState(today());

  const add = async () => {
    await create.mutateAsync({ line_type: lineType, description, amount, start_date: start });
    setDescription('');
    setAmount('');
  };

  const active = charges.filter((c) => c.is_active);

  return (
    <div className="space-y-4 pt-2">
      <p className="text-sm text-muted-foreground">
        Fixed amounts added to every rent invoice — service charge, garbage, parking, flat-rate water.
      </p>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : active.length === 0 ? (
        <p className="text-sm">No monthly extras.</p>
      ) : (
        <ul className="space-y-2">
          {active.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
              <span>
                {c.description || LINE_TYPE_LABEL[c.line_type]}
                <span className="block text-xs text-muted-foreground">from {formatDate(c.start_date)}</span>
              </span>
              <span className="flex items-center gap-2">
                {formatKes(c.amount)}/mo
                <Button variant="ghost" size="icon" aria-label="Stop charge" onClick={() => stop.mutate(c.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <Separator />
      <div className="grid grid-cols-2 gap-2">
        <Select value={lineType} onValueChange={(v) => setLineType(v as ExtraLineType)}>
          <SelectTrigger aria-label="Type"><SelectValue /></SelectTrigger>
          <SelectContent>
            {EXTRA_LINE_TYPES.map((t) => <SelectItem key={t} value={t}>{LINE_TYPE_LABEL[t]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input aria-label="Amount per month" type="number" min="0" placeholder="KES / month" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Input aria-label="Description" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Input aria-label="Start date" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
      </div>
      <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={add} isLoading={create.isPending} disabled={!(Number(amount) > 0)}>
        Add monthly extra
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------- deposit

function DepositTab({ tenancy }: { tenancy: Tenancy }) {
  const { data: deposit, isLoading } = useDeposit(tenancy.id);
  const invoiceDeposit = useInvoiceDeposit(tenancy.id);
  const recordHeld = useRecordDepositHeld(tenancy.id);
  const [heldMethod, setHeldMethod] = React.useState<RefundMethod>('cash');

  if (isLoading || !deposit) return <p className="pt-2 text-sm text-muted-foreground">Loading…</p>;

  const open = deposit.settlements.find((s) => s.status !== 'cancelled');
  const nothingInvoiced = Number(deposit.invoiced) === 0;

  return (
    <div className="space-y-4 pt-2">
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <Stat label="Agreed deposit" value={formatKes(deposit.required)} />
        <Stat label="Held now" value={formatKes(deposit.held)} />
        <Stat label="Invoiced" value={formatKes(deposit.invoiced)} />
        <Stat label="Unpaid" value={formatKes(deposit.outstanding)} />
      </dl>

      {Number(deposit.to_invoice) > 0 && !open && (
        <div className="space-y-2 rounded-md border p-3">
          <p className="text-sm">
            {nothingInvoiced
              ? 'This deposit isn’t in RumiaRent yet.'
              : `${formatKes(deposit.to_invoice)} of the deposit hasn’t been invoiced.`}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" isLoading={invoiceDeposit.isPending} onClick={() => invoiceDeposit.mutate(undefined)}>
              Invoice tenant {formatKes(deposit.to_invoice)}
            </Button>
            <span className="text-xs text-muted-foreground">or, if you already have it:</span>
            <Select value={heldMethod} onValueChange={(v) => setHeldMethod(v as RefundMethod)}>
              <SelectTrigger className="h-9 w-36" aria-label="How it was paid"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(METHOD_LABEL) as RefundMethod[]).map((m) => (
                  <SelectItem key={m} value={m}>{METHOD_LABEL[m]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              isLoading={recordHeld.isPending}
              onClick={() => recordHeld.mutate({ amount: deposit.to_invoice, method: heldMethod })}
            >
              Already received
            </Button>
          </div>
        </div>
      )}

      <Separator />
      {open ? <SettlementCard tenancyId={tenancy.id} settlement={open} /> : <SettlementDraftForm tenancyId={tenancy.id} held={deposit.held} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

const KIND_LABEL: Record<DepositDeductionKind, string> = {
  arrears: 'Unpaid rent & charges',
  damages: 'Damages / repairs',
  cleaning: 'Cleaning',
  other: 'Other',
};

function SettlementDraftForm({ tenancyId, held }: { tenancyId: string; held: string }) {
  const create = useCreateDepositSettlement(tenancyId);
  const [includeArrears, setIncludeArrears] = React.useState(true);
  const [deductions, setDeductions] = React.useState<DepositDeduction[]>([]);

  if (Number(held) <= 0) {
    return <p className="text-sm text-muted-foreground">Move-out settlement becomes available once a deposit is held.</p>;
  }

  const update = (i: number, patch: Partial<DepositDeduction>) =>
    setDeductions((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">Move-out: settle the deposit</h3>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={includeArrears} onCheckedChange={(v) => setIncludeArrears(v === true)} />
        Deduct any unpaid rent and charges automatically
      </label>
      {deductions.map((d, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_6rem_auto] gap-2">
          <Select value={d.kind} onValueChange={(v) => update(i, { kind: v as DepositDeductionKind })}>
            <SelectTrigger aria-label="Deduction type"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(['damages', 'cleaning', 'other'] as DepositDeductionKind[]).map((k) => (
                <SelectItem key={k} value={k}>{KIND_LABEL[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input aria-label="Deduction description" placeholder="What for" value={d.description} onChange={(e) => update(i, { description: e.target.value })} />
          <Input aria-label="Deduction amount" type="number" min="0" placeholder="KES" value={d.amount} onChange={(e) => update(i, { amount: e.target.value })} />
          <Button variant="ghost" size="icon" aria-label="Remove deduction" onClick={() => setDeductions((prev) => prev.filter((_, idx) => idx !== i))}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setDeductions((prev) => [...prev, { kind: 'damages', description: '', amount: '' }])}
        >
          Add deduction
        </Button>
        <Button
          size="sm"
          isLoading={create.isPending}
          disabled={deductions.some((d) => !(Number(d.amount) > 0) || !d.description.trim())}
          onClick={() => create.mutate({ deductions, include_arrears: includeArrears })}
        >
          Draft settlement
        </Button>
      </div>
    </div>
  );
}

function SettlementCard({
  tenancyId,
  settlement,
}: {
  tenancyId: string;
  settlement: DepositSettlement;
}) {
  const action = useSettlementAction(tenancyId);
  const [method, setMethod] = React.useState<RefundMethod>('mpesa_paybill');
  const [reference, setReference] = React.useState('');

  return (
    <div className="space-y-3 rounded-md border p-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium">{settlement.number}</span>
        <Badge variant={settlement.status === 'refunded' ? 'default' : 'secondary'}>{settlement.status}</Badge>
      </div>
      <dl className="space-y-1">
        <div className="flex justify-between"><dt>Deposit held</dt><dd>{formatKes(settlement.held_amount, { cents: true })}</dd></div>
        {settlement.deductions.map((d) => (
          <div key={d.id} className="flex justify-between text-muted-foreground">
            <dt>{KIND_LABEL[d.kind]} — {d.description}</dt>
            <dd>− {formatKes(d.amount, { cents: true })}</dd>
          </div>
        ))}
        <div className="flex justify-between font-semibold"><dt>Refund to tenant</dt><dd>{formatKes(settlement.refund_amount, { cents: true })}</dd></div>
      </dl>

      {settlement.status === 'draft' && (
        <div className="flex gap-2">
          <Button size="sm" isLoading={action.isPending} onClick={() => action.mutate({ id: settlement.id, action: 'approve' })}>
            Approve
          </Button>
          <Button size="sm" variant="ghost" onClick={() => action.mutate({ id: settlement.id, action: 'cancel' })}>
            Cancel draft
          </Button>
        </div>
      )}
      {settlement.status === 'approved' && (
        <div className="space-y-2">
          <p className="text-muted-foreground">Pay the tenant, then record how you refunded them.</p>
          <div className="grid grid-cols-2 gap-2">
            <Select value={method} onValueChange={(v) => setMethod(v as RefundMethod)}>
              <SelectTrigger aria-label="Refund method"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(METHOD_LABEL) as RefundMethod[]).map((m) => <SelectItem key={m} value={m}>{METHOD_LABEL[m]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input aria-label="Refund reference" placeholder="Reference (e.g. M-Pesa code)" value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <Button
            size="sm"
            isLoading={action.isPending}
            onClick={() => action.mutate({ id: settlement.id, action: 'refund', payload: { method, reference } })}
          >
            Record refund of {formatKes(settlement.refund_amount)}
          </Button>
        </div>
      )}
      {settlement.status === 'refunded' && (
        <p className="text-muted-foreground">
          Refunded {formatDate(settlement.refunded_on)} by {METHOD_LABEL[settlement.refund_method as RefundMethod] ?? '—'}
          {settlement.refund_reference && ` · ${settlement.refund_reference}`}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- meters

function MetersTab({ tenancy }: { tenancy: Tenancy }) {
  const { data: readings = [], isLoading } = useMeterReadings(tenancy.unit);
  const record = useRecordMeterReading();
  const billNow = useBillUtilitiesNow();
  const [utility, setUtility] = React.useState<Utility>('water');
  const [value, setValue] = React.useState('');
  const [date, setDate] = React.useState(today());

  const save = async () => {
    await record.mutateAsync({ unit: tenancy.unit, utility, reading_date: date, value });
    setValue('');
  };
  const unbilled = readings.filter((r) => !r.billed).length;

  return (
    <div className="space-y-4 pt-2">
      <p className="text-sm text-muted-foreground">
        Usage since the last reading is billed on the next rent invoice. The first reading is the starting point.
      </p>
      <div className="grid grid-cols-3 gap-2">
        <Select value={utility} onValueChange={(v) => setUtility(v as Utility)}>
          <SelectTrigger aria-label="Utility"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="water">Water</SelectItem>
            <SelectItem value="electricity">Electricity</SelectItem>
          </SelectContent>
        </Select>
        <Input aria-label="Meter reading" type="number" min="0" step="0.001" placeholder="Reading" value={value} onChange={(e) => setValue(e.target.value)} />
        <Input aria-label="Reading date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={save} isLoading={record.isPending} disabled={value === ''}>Save reading</Button>
        <Button size="sm" variant="outline" disabled={unbilled === 0} isLoading={billNow.isPending} onClick={() => billNow.mutate(tenancy.id)}>
          Bill usage now
        </Button>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : readings.length === 0 ? (
        <p className="text-sm">No readings yet.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {readings.map((r) => (
            <li key={r.id} className="flex justify-between">
              <span>{formatDate(r.reading_date)} · {r.utility === 'water' ? 'Water' : 'Electricity'} {Number(r.value)}</span>
              <span className="text-muted-foreground">
                {r.billed ? (r.billed_invoice_number ? `billed on ${r.billed_invoice_number}` : 'starting point') : 'not billed yet'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
