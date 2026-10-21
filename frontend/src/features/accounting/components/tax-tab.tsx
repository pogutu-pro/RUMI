'use client';

import * as React from 'react';
import { AlertCircle, CalendarClock, CheckCircle2, Clock, ExternalLink, Info, RotateCcw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusPill } from '@/components/ui/status-pill';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { FormDialogActions } from '@/components/ui/form-layout';
import { cn } from '@/lib/utils/cn';
import { accountingApi } from '../api/accounting';
import {
  useMarkFiled, useMriMonth, useMriYear, useSaveKraPin, useTaxProfile, useUnmarkFiled,
} from '../hooks/use-accounting';
import { currentMonthKey, dateLabel, kes, lastMonthKey, monthLabel } from '../format';
import type { MriMonth, MriStatus } from '../types';
import { MonthNav } from './month-nav';

const PIN_PATTERN = /^[AP]\d{9}[A-Z]$/;

const STATUS_STYLE: Record<MriStatus | 'nil', { card: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
  filed: { card: 'from-emerald-600 to-emerald-800', label: 'Filed', icon: CheckCircle2 },
  due: { card: 'from-amber-500 to-orange-600', label: 'Due', icon: CalendarClock },
  overdue: { card: 'from-red-600 to-rose-700', label: 'Overdue', icon: AlertCircle },
  in_progress: { card: 'from-slate-600 to-slate-800', label: 'Month in progress', icon: Clock },
  nil: { card: 'from-slate-600 to-slate-800', label: 'Nil return', icon: Info },
};

function FiledDialog({ month, open, onClose }: { month: string; open: boolean; onClose: () => void }) {
  const mark = useMarkFiled();
  const [reference, setReference] = React.useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await mark.mutateAsync({ month, reference: reference.trim() });
      setReference('');
      onClose();
    } catch {
      // the hook shows the error
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark {monthLabel(month)} as filed</DialogTitle>
          <DialogDescription>
            Only do this after you have filed the return and paid on iTax or eRITS. It keeps a record of the figures you
            filed, so RumiaRent can warn you if rent for that month changes afterwards.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="mri-reference">Payment or receipt reference (optional)</Label>
            <Input id="mri-reference" className="h-11" maxLength={100} placeholder="e.g. the M-Pesa code or PRN" value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <FormDialogActions submitLabel="Mark as filed" isPending={mark.isPending} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Hero({ data }: { data: MriMonth }) {
  const unmark = useUnmarkFiled();
  const [dialog, setDialog] = React.useState(false);
  const key = data.month.slice(0, 7);
  const styleKey = data.is_nil && data.status !== 'filed' && data.status !== 'in_progress' ? 'nil' : data.status;
  const style = STATUS_STYLE[styleKey];
  const Icon = style.icon;

  return (
    <section className={cn('relative overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white shadow-lg sm:p-8', style.card)}>
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
            <Icon className="h-3.5 w-3.5" aria-hidden /> {style.label}
          </span>
          <div>
            <p className="text-sm text-white/80">Rent received in {monthLabel(key)}</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">{kes(data.gross_rent)}</p>
          </div>
          <div className="space-y-1 text-sm text-white/85">
            <p>
              Rental income tax at {data.rate}%: <span className="font-semibold text-white">{kes(data.mri_due)}</span>
            </p>
            <p>
              {data.status === 'filed' && data.filing
                ? `Filed on ${dateLabel(data.filing.filed_on)}${data.filing.reference ? ` (${data.filing.reference})` : ''}`
                : data.status === 'in_progress'
                  ? `The month has not finished. Declare by ${dateLabel(data.deadline)}.`
                  : `File and pay by ${dateLabel(data.deadline)}`}
            </p>
          </div>
        </div>

        {data.status === 'filed' ? (
          <Button
            variant="outline"
            className="h-11 border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
            isLoading={unmark.isPending}
            onClick={() => unmark.mutate(key)}
            leftIcon={<RotateCcw className="h-4 w-4" />}
          >
            Undo
          </Button>
        ) : (
          <Button
            className="h-12 rounded-xl bg-white px-6 text-base font-semibold text-gray-900 shadow-md hover:bg-white/90"
            disabled={data.status === 'in_progress'}
            onClick={() => setDialog(true)}
          >
            I have filed this
          </Button>
        )}
      </div>
      <FiledDialog month={key} open={dialog} onClose={() => setDialog(false)} />
    </section>
  );
}

function Notices({ data }: { data: MriMonth }) {
  const notes: { tone: 'info' | 'warn'; text: React.ReactNode }[] = [];
  if (data.filing?.changed_since) {
    notes.push({
      tone: 'warn',
      text: `Rent for this month changed after you filed. You filed on ${kes(data.filing.gross_rent_at_filing)} (tax ${kes(data.filing.mri_at_filing)}); it is now ${kes(data.gross_rent)}. You may need to file an amended return.`,
    });
  }
  if (data.band === 'below') {
    notes.push({
      tone: 'info',
      text: `Your rent over the last 12 months is ${kes(data.rolling_12_months)}, below ${kes(data.annual_min)}. Rental income tax may not apply to you. Confirm with KRA before you file.`,
    });
  } else if (data.band === 'above') {
    notes.push({
      tone: 'info',
      text: `Your rent over the last 12 months is ${kes(data.rolling_12_months)}, above ${kes(data.annual_max)}. Above that limit rental income is normally declared with your other income in your annual return instead. Confirm with KRA.`,
    });
  }
  if (notes.length === 0) return null;
  return (
    <div className="space-y-2">
      {notes.map((n, i) => (
        <div
          key={i}
          role={n.tone === 'warn' ? 'alert' : 'note'}
          className={cn(
            'flex items-start gap-3 rounded-2xl border p-4 text-sm',
            n.tone === 'warn' ? 'border-amber-500/40 bg-amber-500/10' : 'bg-muted/40',
          )}
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <p className="text-muted-foreground">{n.text}</p>
        </div>
      ))}
    </div>
  );
}

function KraPinCard() {
  const { data } = useTaxProfile();
  const save = useSaveKraPin();
  const [draft, setDraft] = React.useState<string | null>(null);
  const value = draft ?? data?.kra_pin ?? '';
  const valid = value === '' || PIN_PATTERN.test(value);
  const changed = value !== (data?.kra_pin ?? '');

  const submit = async () => {
    try {
      await save.mutateAsync(value);
      setDraft(null);
    } catch (err) {
      toast.error((err as { message?: string })?.message || 'That PIN was not accepted');
    }
  };

  return (
    <section className="rounded-2xl border bg-background p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-semibold"><ShieldCheck className="h-4 w-4" /> Your KRA PIN</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Kept so your filing worksheet has it ready. RumiaRent never asks for your iTax password.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input
          className="h-11 flex-1 font-mono uppercase"
          placeholder="A123456789B"
          maxLength={11}
          value={value}
          onChange={(e) => setDraft(e.target.value.toUpperCase().replace(/\s/g, ''))}
          aria-invalid={!valid}
          aria-label="KRA PIN"
        />
        <Button className="h-11" disabled={!changed || !valid || save.isPending} isLoading={save.isPending} onClick={() => void submit()}>
          Save
        </Button>
      </div>
      {!valid && <p className="mt-1.5 text-xs font-medium text-destructive">A KRA PIN looks like A123456789B: a letter, nine digits, a letter.</p>}
    </section>
  );
}

function HowToFile() {
  const steps = [
    'Sign in to iTax or eRITS with your KRA PIN and password. Do this on KRA\'s site, never here.',
    'Open the Monthly Rental Income (MRI) return and enter the rent received shown above for that month.',
    'Pay the tax using the payment slip KRA generates (M-Pesa or bank), by the 20th of the following month.',
    'Come back here and press "I have filed this" so you have a record and the reminders stop.',
  ];
  return (
    <section className="rounded-2xl border bg-background p-5 shadow-sm">
      <h2 className="text-base font-semibold">How to file</h2>
      <ol className="mt-3 space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3 text-sm text-muted-foreground">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <a
        href="https://itax.kra.go.ke"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80"
      >
        Open iTax <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </a>
    </section>
  );
}

function YearTable({ year, onPick }: { year: number; onPick: (month: string) => void }) {
  const { data, isLoading } = useMriYear(year);
  const [downloading, setDownloading] = React.useState(false);

  const download = async () => {
    setDownloading(true);
    try {
      await accountingApi.download('mri', { year });
    } catch {
      toast.error('Could not download the file');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="rounded-2xl border bg-background shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">{year} at a glance</h2>
          <p className="text-xs text-muted-foreground">Tap a month to see its breakdown.</p>
        </div>
        <Button size="sm" variant="outline" isLoading={downloading} onClick={() => void download()}>Download CSV</Button>
      </div>
      {isLoading || !data ? (
        <p className="px-5 py-8 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Rent received</TableHead>
              <TableHead className="text-right">MRI due</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.months.map((m) => {
              const key = m.month.slice(0, 7);
              const future = key > currentMonthKey();
              return (
                <TableRow key={m.month} className={cn(!future && 'cursor-pointer')} onClick={() => !future && onPick(key)}>
                  <TableCell className="font-medium">{monthLabel(key)}</TableCell>
                  <TableCell className="text-right">{future ? '—' : kes(m.gross_rent)}</TableCell>
                  <TableCell className="text-right">{future ? '—' : kes(m.mri_due)}</TableCell>
                  <TableCell>
                    {future ? null : m.status === 'filed' ? (
                      <StatusPill status="success">Filed</StatusPill>
                    ) : m.is_nil && m.status !== 'in_progress' ? (
                      // No rent recorded in RumiaRent: nothing to work out from here.
                      <StatusPill status="neutral">No rent recorded</StatusPill>
                    ) : m.status === 'overdue' ? (
                      <StatusPill status="danger">Overdue</StatusPill>
                    ) : m.status === 'due' ? (
                      <StatusPill status="warning">Due</StatusPill>
                    ) : (
                      <StatusPill status="neutral">In progress</StatusPill>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow>
              <TableCell className="font-semibold">Total</TableCell>
              <TableCell className="text-right font-semibold">{kes(data.total_gross_rent)}</TableCell>
              <TableCell className="text-right font-semibold">{kes(data.total_mri_due)}</TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      )}
    </section>
  );
}

export function TaxTab() {
  const [month, setMonth] = React.useState(lastMonthKey());
  const { data, isLoading } = useMriMonth(month);
  const year = Number(month.slice(0, 4));

  return (
    <div className="space-y-6">
      <MonthNav month={month} onChange={setMonth} />

      {isLoading || !data ? (
        <div className="skeleton h-56 rounded-3xl" />
      ) : (
        <>
          <Hero data={data} />
          <Notices data={data} />

          {data.by_property.length > 0 && (
            <section className="rounded-2xl border bg-background shadow-sm">
              <div className="border-b px-5 py-4">
                <h2 className="text-base font-semibold">Rent received by property</h2>
                <p className="text-xs text-muted-foreground">Tax is worked out on the total; this shows where it came from.</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead className="text-right">Payments</TableHead>
                    <TableHead className="text-right">Rent received</TableHead>
                    <TableHead className="text-right">Tax share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.by_property.map((p) => (
                    <TableRow key={p.property_id ?? 'none'}>
                      <TableCell className="font-medium">{p.property_name}</TableCell>
                      <TableCell className="text-right">{p.payments}</TableCell>
                      <TableCell className="text-right">{kes(p.amount)}</TableCell>
                      <TableCell className="text-right">{kes(p.mri)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </section>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <HowToFile />
            <KraPinCard />
          </div>
        </>
      )}

      <YearTable year={year} onPick={setMonth} />
    </div>
  );
}
