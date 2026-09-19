'use client';

import * as React from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { accountingApi } from '../api/accounting';
import type { ExportKind } from '../types';

const today = () => new Date().toISOString().slice(0, 10);
const yearStart = () => `${new Date().getFullYear()}-01-01`;

const EXPORTS: { kind: ExportKind; title: string; blurb: string; steps?: string }[] = [
  {
    kind: 'quickbooks_bank',
    title: 'QuickBooks: bank transactions',
    blurb: 'Rent received and expenses as Date, Description, Amount (money out is negative), the format QuickBooks Online expects.',
    steps: 'In QuickBooks Online go to Banking, then Upload transactions, choose this file and pick the date format dd/mm/yyyy.',
  },
  {
    kind: 'quickbooks_journal',
    title: 'QuickBooks: journal entries',
    blurb: 'One balanced journal entry per transaction: the bank against Rental Income or an expense account.',
    steps: 'Journal import is not available in every QuickBooks region. Create accounts named Bank Account, Rental Income and the expense names in the file first, or rename them to match yours.',
  },
  {
    kind: 'ledger',
    title: 'Full ledger',
    blurb: 'Every rent payment and expense in date order, with property, category and reference. Opens in Excel or Google Sheets.',
  },
];

export function ExportTab() {
  const [from, setFrom] = React.useState(yearStart());
  const [to, setTo] = React.useState(today());
  const [busy, setBusy] = React.useState<ExportKind | null>(null);
  const valid = from && to && from <= to;

  const run = async (kind: ExportKind) => {
    setBusy(kind);
    try {
      await accountingApi.download(kind, { from, to });
    } catch (err) {
      toast.error((err as { message?: string })?.message || 'Could not prepare the file');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4 rounded-2xl border bg-background p-5 shadow-sm">
        <div className="space-y-1.5">
          <Label htmlFor="export-from">From</Label>
          <Input id="export-from" type="date" className="h-11 w-44" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="export-to">To</Label>
          <Input id="export-to" type="date" className="h-11 w-44" value={to} min={from} max={today()} onChange={(e) => setTo(e.target.value)} />
        </div>
        <p className="pb-2 text-xs text-muted-foreground">Up to three years at a time.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {EXPORTS.map((e) => (
          <section key={e.kind} className="flex flex-col rounded-2xl border bg-background p-5 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <h2 className="mt-3 text-base font-semibold">{e.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{e.blurb}</p>
            {e.steps && <p className="mt-2 rounded-lg bg-muted/50 p-2.5 text-xs text-muted-foreground">{e.steps}</p>}
            <Button
              className="mt-auto pt-0"
              variant="outline"
              disabled={!valid || busy !== null}
              isLoading={busy === e.kind}
              onClick={() => void run(e.kind)}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Download CSV
            </Button>
          </section>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Rental income tax by month has its own download on the Tax tab.
      </p>
    </div>
  );
}
