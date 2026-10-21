'use client';

import * as React from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import { useTenancies, useUnits } from '@/features/rental/hooks/use-rental';
import { usePaybillAccounts } from '@/features/paybill/hooks';
import { WhatsAppHelp } from '@/components/support/whatsapp-help';
import { MoveInDialog } from '@/features/rental/components/move-in-dialog';

/**
 * First-week checklist for a new landlord. Each step is read from real data,
 * so it ticks itself off; the card disappears once everything is done.
 */
export function GetStarted() {
  const { data: units = [], isLoading: unitsLoading } = useUnits();
  const { data: tenancies = [], isLoading: tenanciesLoading } = useTenancies();
  const { data: paybills = [], isLoading: paybillsLoading } = usePaybillAccounts();
  const [movingIn, setMovingIn] = React.useState(false);

  if (unitsLoading || tenanciesLoading || paybillsLoading) return null;

  const live = tenancies.filter((t) => t.status === 'active' || t.status === 'notice_period');
  const steps = [
    {
      done: units.length > 0,
      title: 'Add your property and units',
      hint: 'Units get numbered for you.',
      action: <Button asChild size="sm" variant="outline"><Link href="/landlord/rental/properties">Add property</Link></Button>,
    },
    {
      done: live.length > 0,
      title: 'Add your tenants',
      hint: 'Name, phone and rent. Invoices and reminders start on their own.',
      action: <Button size="sm" onClick={() => setMovingIn(true)}>Add tenant</Button>,
    },
    {
      done: paybills.length > 0,
      title: 'Tell tenants where to pay',
      hint: 'Your M-Pesa paybill number. Each tenant gets their own account number.',
      action: <Button asChild size="sm" variant="outline"><Link href="/landlord/rental/paybill">Add paybill</Link></Button>,
      help: 'paybill' as const,
    },
    {
      done: paybills.some((p) => p.registered_at),
      title: 'Turn on automatic M-Pesa receipts',
      hint: 'Once Safaricom approves, payments are matched and receipted without you lifting a finger.',
      action: <Button asChild size="sm" variant="outline"><Link href="/landlord/rental/paybill">Set up</Link></Button>,
      help: 'daraja' as const,
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;
  const next = steps.findIndex((s) => !s.done);

  return (
    <Card className="rounded-2xl border-primary/30">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Get started</CardTitle>
        <span className="text-xs font-medium text-muted-foreground">{doneCount} of {steps.length} done</span>
      </CardHeader>
      <CardContent>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <div className="h-full rounded-full bg-primary" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
        </div>
        <ol className="space-y-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className={cn(
                'flex items-start gap-3 rounded-xl p-3',
                index === next ? 'border border-primary/20 bg-primary/5' : '',
              )}
            >
              {step.done ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-label="Done" />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-label="To do" />
              )}
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-medium', step.done && 'text-muted-foreground line-through')}>{step.title}</p>
                {!step.done && <p className="text-xs text-muted-foreground">{step.hint}</p>}
                {index === next && 'help' in step && step.help && (
                  <WhatsAppHelp topic={step.help} label="We can set this up with you" className="mt-1.5 text-xs" />
                )}
              </div>
              {index === next && <div className="shrink-0">{step.action}</div>}
            </li>
          ))}
        </ol>
      </CardContent>
      <MoveInDialog open={movingIn} onOpenChange={setMovingIn} />
    </Card>
  );
}
