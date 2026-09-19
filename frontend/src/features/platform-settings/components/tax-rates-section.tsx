'use client';

import * as React from 'react';
import { Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSaveTaxRates, useTaxRates } from '../hooks/use-platform-settings';
import type { TaxRates } from '../types';

const FIELDS: { key: keyof TaxRates; label: string; hint: string; step?: string }[] = [
  { key: 'mri_rate', label: 'MRI rate (%)', hint: 'Currently 7.5% of gross rent.', step: '0.01' },
  { key: 'mri_annual_min', label: 'Lower limit (KES a year)', hint: 'Below this, MRI may not apply.' },
  { key: 'mri_annual_max', label: 'Upper limit (KES a year)', hint: 'Above this, rent goes in the annual return.' },
  { key: 'filing_due_day', label: 'Filing day of the month', hint: 'Returns are due by this day of the next month (1 to 28).' },
];

/** The rental income tax parameters behind every landlord's Accounting figures. */
export function TaxRatesSection() {
  const { data, isLoading } = useTaxRates();
  const save = useSaveTaxRates();
  const [draft, setDraft] = React.useState<Partial<Record<keyof TaxRates, string>>>({});
  const [error, setError] = React.useState('');

  const value = (key: keyof TaxRates) => draft[key] ?? String(data?.[key] ?? '');
  const dirty = Object.keys(draft).length > 0;

  const submit = async () => {
    setError('');
    try {
      await save.mutateAsync({
        mri_rate: value('mri_rate'),
        mri_annual_min: value('mri_annual_min'),
        mri_annual_max: value('mri_annual_max'),
        filing_due_day: Number(value('filing_due_day')),
      });
      setDraft({});
    } catch (err) {
      setError((err as { message?: string })?.message || 'Could not save the rates');
    }
  };

  return (
    <section className="rounded-2xl border bg-background shadow-sm">
      <div className="border-b px-5 py-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground"><Percent className="h-4 w-4" /> Rental income tax (MRI)</h2>
        <p className="text-xs text-muted-foreground">
          The rate and limits behind the Accounting page. KRA has changed them before (10% became 7.5% in 2024), so keep them in step
          with KRA. A change applies to every landlord straight away.
        </p>
      </div>
      <div className="grid gap-5 px-5 py-5 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <Label htmlFor={`tax-${f.key}`}>{f.label}</Label>
            <Input
              id={`tax-${f.key}`} className="h-11" type="number" inputMode="decimal" step={f.step ?? 'any'}
              disabled={isLoading} value={value(f.key)}
              onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">{f.hint}</p>
          </div>
        ))}
      </div>
      {error && <p role="alert" className="px-5 pb-2 text-sm font-medium text-destructive">{error}</p>}
      <div className="border-t px-5 py-4">
        <Button disabled={!dirty || save.isPending} isLoading={save.isPending} onClick={() => void submit()}>Save rates</Button>
      </div>
    </section>
  );
}
