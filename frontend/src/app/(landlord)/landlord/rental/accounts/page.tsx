'use client';

import * as React from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/dashboard/page-header';
import { useTenancies } from '@/features/rental/hooks/use-rental';
import {
  useAssignLine, useCreateSupplier, useIgnoreLine, useImportStatement, usePostJournal, useReport, useStatementLines, useSuppliers,
} from '@/features/books/hooks';
import type { ReportRow } from '@/features/books/types';
import { formatDate, formatKes } from '@/features/ledger/lib/format';

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => `${today().slice(0, 8)}01`;

export default function AccountsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Accounts" description="Financial reports, statement reconciliation, suppliers and journal entries." />
      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="reconcile">Reconcile</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="journal">Journal entry</TabsTrigger>
        </TabsList>
        <TabsContent value="reports"><ReportsTab /></TabsContent>
        <TabsContent value="reconcile"><ReconcileTab /></TabsContent>
        <TabsContent value="suppliers"><SuppliersTab /></TabsContent>
        <TabsContent value="journal"><JournalTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function ReportsTab() {
  const [report, setReport] = React.useState('income_statement');
  const [start, setStart] = React.useState(monthStart());
  const [end, setEnd] = React.useState(today());
  const params = report === 'income_statement' ? { period_start: start, period_end: end } : { as_of: end };
  const { data, isLoading } = useReport(report, params);
  const rowTable = (rows: ReportRow[] = [], title: string) => (
    <div>
      <h3 className="mb-1 font-medium">{title}</h3>
      <Table>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={`${title}-${r.code}`}>
              <TableCell className="w-16 font-mono text-xs">{r.code}</TableCell>
              <TableCell>{r.name}</TableCell>
              <TableCell className="text-right">{formatKes(r.amount, { cents: true })}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
  return (
    <div className="space-y-4 pt-2 text-sm">
      <div className="flex flex-wrap items-end gap-3">
        <Select value={report} onValueChange={setReport}>
          <SelectTrigger className="w-52" aria-label="Report"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="income_statement">Income statement</SelectItem>
            <SelectItem value="balance_sheet">Balance sheet</SelectItem>
            <SelectItem value="trial_balance">Trial balance</SelectItem>
          </SelectContent>
        </Select>
        {report === 'income_statement' && <Input type="date" className="w-40" value={start} onChange={(e) => setStart(e.target.value)} aria-label="From" />}
        <Input type="date" className="w-40" value={end} onChange={(e) => setEnd(e.target.value)} aria-label={report === 'income_statement' ? 'To' : 'As of'} />
      </div>
      {isLoading || !data ? <p className="text-muted-foreground">Loading…</p> : report === 'income_statement' ? (
        <div className="space-y-4">
          {rowTable(data.income, 'Income')}
          {rowTable(data.expenses, 'Expenses')}
          <p className="text-right text-base font-semibold">
            {Number(data.net_income) < 0 ? 'Net loss' : 'Net income'}{' '}
            <span className={`tabular-nums ${Number(data.net_income) < 0 ? 'text-destructive' : 'text-success'}`}>
              {formatKes(data.net_income, { cents: true })}
            </span>
          </p>
        </div>
      ) : report === 'balance_sheet' ? (
        <div className="space-y-4">
          {rowTable(data.assets, `Assets — ${formatKes(data.total_assets)}`)}
          {rowTable(data.liabilities, 'Liabilities')}
          {rowTable(data.equity, 'Equity')}
          <p className="text-right font-semibold">Liabilities + equity {formatKes(data.total_liabilities_and_equity)}
            {data.balanced ? '' : ' — does not balance, contact support'}</p>
        </div>
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>Account</TableHead><TableHead className="text-right">Debit</TableHead><TableHead className="text-right">Credit</TableHead></TableRow></TableHeader>
          <TableBody>
            {(data.accounts as ReportRow[]).map((r) => (
              <TableRow key={r.code}>
                <TableCell><span className="font-mono text-xs">{r.code}</span> {r.name}</TableCell>
                <TableCell className="text-right">{Number(r.debit) ? formatKes(r.debit, { cents: true }) : ''}</TableCell>
                <TableCell className="text-right">{Number(r.credit) ? formatKes(r.credit, { cents: true }) : ''}</TableCell>
              </TableRow>
            ))}
            <TableRow className="font-semibold">
              <TableCell>Total</TableCell>
              <TableCell className="text-right">{formatKes(data.total_debit, { cents: true })}</TableCell>
              <TableCell className="text-right">{formatKes(data.total_credit, { cents: true })}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}
    </div>
  );
}

const PRESETS: Record<string, { date: string; amount: string; reference: string; description: string }> = {
  mpesa: { date: 'Completion Time', amount: 'Paid In', reference: 'Receipt No.', description: 'Details' },
  custom: { date: '', amount: '', reference: '', description: '' },
};

function ReconcileTab() {
  const importStatement = useImportStatement();
  const { data: lines = [] } = useStatementLines('unmatched');
  const { data: tenancies = [] } = useTenancies();
  const assign = useAssignLine();
  const ignore = useIgnoreLine();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [account, setAccount] = React.useState('1020');
  const [preset, setPreset] = React.useState('mpesa');
  const [columns, setColumns] = React.useState(PRESETS.mpesa);
  const [choice, setChoice] = React.useState<Record<string, string>>({});

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('account_code', account);
    (Object.keys(columns) as (keyof typeof columns)[]).forEach((k) => form.append(`${k}_column`, columns[k]));
    importStatement.mutate(form);
    e.target.value = '';
  };

  return (
    <div className="space-y-4 pt-2 text-sm">
      <p className="text-muted-foreground">
        Upload your bank or M-Pesa statement (CSV). Lines that match payments already recorded are ticked off; the rest wait
        here to be assigned to a tenant or marked as not rent.
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        <Select value={account} onValueChange={setAccount}>
          <SelectTrigger aria-label="Account"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1020">M-Pesa paybill</SelectItem>
            <SelectItem value="1010">Bank</SelectItem>
          </SelectContent>
        </Select>
        <Select value={preset} onValueChange={(v) => { setPreset(v); setColumns(PRESETS[v]); }}>
          <SelectTrigger aria-label="Statement format"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="mpesa">M-Pesa org portal export</SelectItem>
            <SelectItem value="custom">Other — name the columns</SelectItem>
          </SelectContent>
        </Select>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
        <Button leftIcon={<Upload className="h-4 w-4" />} isLoading={importStatement.isPending}
          disabled={!columns.date || !columns.amount} onClick={() => fileRef.current?.click()}>Upload CSV</Button>
      </div>
      {preset === 'custom' && (
        <div className="grid gap-2 sm:grid-cols-4">
          {(['date', 'amount', 'reference', 'description'] as const).map((k) => (
            <div key={k} className="space-y-1">
              <Label htmlFor={`col-${k}`}>{k === 'amount' ? 'Money-in column' : `${k[0].toUpperCase()}${k.slice(1)} column`}</Label>
              <Input id={`col-${k}`} value={columns[k]} onChange={(e) => setColumns({ ...columns, [k]: e.target.value })} />
            </div>
          ))}
        </div>
      )}
      <h3 className="font-medium">Needs attention ({lines.length})</h3>
      {lines.length === 0 ? <p className="text-muted-foreground">Nothing to reconcile.</p> : (
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Details</TableHead><TableHead className="text-right">Amount</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {lines.map((l) => (
              <TableRow key={l.id}>
                <TableCell>{formatDate(l.line_date)}</TableCell>
                <TableCell><span className="font-mono text-xs">{l.reference}</span><span className="block text-xs text-muted-foreground">{l.description}</span></TableCell>
                <TableCell className="text-right">{formatKes(l.amount)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Select value={choice[l.id] ?? ''} onValueChange={(v) => setChoice({ ...choice, [l.id]: v })}>
                      <SelectTrigger className="h-9 w-40" aria-label="Tenant"><SelectValue placeholder="Tenant…" /></SelectTrigger>
                      <SelectContent>
                        {tenancies.map((t) => <SelectItem key={t.id} value={t.id}>{t.tenant_name} · {t.unit_number}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="sm" disabled={!choice[l.id]} onClick={() => assign.mutate({ id: l.id, tenancy: choice[l.id] })}>Assign</Button>
                    <Button size="sm" variant="ghost" onClick={() => ignore.mutate({ id: l.id, note: 'Not rent' })}>Not rent</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function SuppliersTab() {
  const { data: suppliers = [] } = useSuppliers();
  const create = useCreateSupplier();
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  return (
    <div className="space-y-3 pt-2 text-sm">
      <div className="flex flex-wrap gap-2">
        <Input className="w-56" placeholder="Supplier name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Supplier name" />
        <Input className="w-40" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} aria-label="Supplier phone" />
        <Button size="sm" leftIcon={<Plus className="h-4 w-4" />} disabled={!name.trim()} isLoading={create.isPending}
          onClick={async () => { await create.mutateAsync({ name, phone }); setName(''); setPhone(''); }}>Add supplier</Button>
      </div>
      <ul className="space-y-1">
        {suppliers.map((s) => <li key={s.id}>{s.name}{s.phone && <span className="text-muted-foreground"> · {s.phone}</span>}</li>)}
      </ul>
    </div>
  );
}

function JournalTab() {
  const post = usePostJournal();
  const { data: accounts = [] } = useReport('accounts', {});
  const [memo, setMemo] = React.useState('');
  const [date, setDate] = React.useState(today());
  const [lines, setLines] = React.useState([{ account: '', debit: '', credit: '' }, { account: '', debit: '', credit: '' }]);
  const dr = lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const cr = lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const update = (i: number, patch: Partial<(typeof lines)[number]>) => setLines(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const submit = async () => {
    await post.mutateAsync({ entry_date: date, memo, lines: lines.filter((l) => l.account) });
    setMemo('');
    setLines([{ account: '', debit: '', credit: '' }, { account: '', debit: '', credit: '' }]);
  };
  return (
    <div className="space-y-3 pt-2 text-sm">
      <p className="text-muted-foreground">For opening balances and corrections. Debits must equal credits. Entries can’t be edited — post a reversing entry instead.</p>
      <div className="flex flex-wrap gap-2">
        <Input type="date" className="w-40" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Entry date" />
        <Input className="flex-1" placeholder="What is this entry for?" value={memo} onChange={(e) => setMemo(e.target.value)} aria-label="Memo" />
      </div>
      {lines.map((l, i) => (
        <div key={i} className="grid grid-cols-[1fr_7rem_7rem_auto] gap-2">
          <Select value={l.account} onValueChange={(v) => update(i, { account: v })}>
            <SelectTrigger aria-label="Account"><SelectValue placeholder="Account" /></SelectTrigger>
            <SelectContent>
              {(accounts as ReportRow[]).map((a) => <SelectItem key={a.code} value={a.code}>{a.code} {a.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="number" min="0" placeholder="Debit" aria-label="Debit" value={l.debit} onChange={(e) => update(i, { debit: e.target.value, credit: '' })} />
          <Input type="number" min="0" placeholder="Credit" aria-label="Credit" value={l.credit} onChange={(e) => update(i, { credit: e.target.value, debit: '' })} />
          <Button variant="ghost" size="icon" aria-label="Remove line" disabled={lines.length <= 2}
            onClick={() => setLines(lines.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <Button size="sm" variant="ghost" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setLines([...lines, { account: '', debit: '', credit: '' }])}>Add line</Button>
        <span className={dr === cr ? '' : 'text-destructive'}>Debits {formatKes(dr, { cents: true })} · Credits {formatKes(cr, { cents: true })}</span>
      </div>
      <Button onClick={submit} isLoading={post.isPending} disabled={!memo.trim() || dr === 0 || dr !== cr}>Post entry</Button>
      {dr !== cr && <Badge variant="destructive">Not balanced</Badge>}
    </div>
  );
}
