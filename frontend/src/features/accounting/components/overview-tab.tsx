'use client';

import * as React from 'react';
import { ArrowDownRight, ArrowUpRight, Scale } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils/cn';
import { useSummary } from '../hooks/use-accounting';
import { currentMonthKey, kes } from '../format';
import { MonthNav } from './month-nav';

function Tile({ icon: Icon, label, value, tone }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone?: 'good' | 'bad';
}) {
  return (
    <div className="rounded-2xl border bg-background p-4 shadow-sm">
      <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary',
        tone === 'bad' && 'bg-destructive/10 text-destructive')}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export function OverviewTab() {
  const [month, setMonth] = React.useState(currentMonthKey());
  const { data, isLoading } = useSummary(month);

  return (
    <div className="space-y-6">
      <MonthNav month={month} onChange={setMonth} />

      {isLoading || !data ? (
        <div className="skeleton h-28 rounded-2xl" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Tile icon={ArrowDownRight} label="Rent received" value={kes(data.income)} />
            <Tile icon={ArrowUpRight} label="Expenses" value={kes(data.expenses)} tone="bad" />
            <Tile icon={Scale} label="Net for the month" value={kes(data.net)} tone={Number(data.net) < 0 ? 'bad' : undefined} />
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <section className="rounded-2xl border bg-background shadow-sm lg:col-span-3">
              <div className="border-b px-5 py-4">
                <h2 className="text-base font-semibold">By property</h2>
                <p className="text-xs text-muted-foreground">Rent received against what you spent.</p>
              </div>
              {data.by_property.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-muted-foreground">Nothing recorded for this month yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead className="text-right">Income</TableHead>
                      <TableHead className="text-right">Expenses</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.by_property.map((p) => (
                      <TableRow key={p.property_id ?? 'none'}>
                        <TableCell className="font-medium">{p.property_name}</TableCell>
                        <TableCell className="text-right">{kes(p.income)}</TableCell>
                        <TableCell className="text-right">{kes(p.expenses)}</TableCell>
                        <TableCell className={cn('text-right font-medium', Number(p.net) < 0 && 'text-destructive')}>{kes(p.net)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </section>

            <section className="rounded-2xl border bg-background shadow-sm lg:col-span-2">
              <div className="border-b px-5 py-4">
                <h2 className="text-base font-semibold">Where the money went</h2>
              </div>
              {data.expenses_by_category.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-muted-foreground">No expenses this month.</p>
              ) : (
                <ul className="divide-y px-5">
                  {data.expenses_by_category.map((c) => (
                    <li key={c.category} className="flex items-center justify-between py-3 text-sm">
                      <span className="text-muted-foreground">{c.label}</span>
                      <span className="font-medium">{kes(c.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
