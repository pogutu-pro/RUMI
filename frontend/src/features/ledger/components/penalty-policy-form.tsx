'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePenaltyPolicy, useSavePenaltyPolicy } from '../hooks/use-ledger';
import type { PenaltyPolicy } from '../types';

/** Organization-wide late-penalty rules (off by default). */
export function PenaltyPolicyForm() {
  const { data: policy, isLoading } = usePenaltyPolicy();
  const save = useSavePenaltyPolicy();
  const [draft, setDraft] = React.useState<PenaltyPolicy | null>(null);

  React.useEffect(() => {
    if (policy) setDraft(policy);
  }, [policy]);

  if (isLoading || !draft) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const set = (patch: Partial<PenaltyPolicy>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const amountMissing = draft.enabled && draft.method === 'fixed' && !(Number(draft.amount) > 0);
  const percentInvalid = draft.enabled && draft.method === 'percent' && !(Number(draft.percent) > 0 && Number(draft.percent) <= 100);

  const submit = () =>
    save.mutate({
      enabled: draft.enabled,
      method: draft.method,
      amount: draft.amount || '0',
      percent: draft.percent || '0',
      grace_days: draft.grace_days,
      frequency: draft.frequency,
      cap_percent_of_invoice: draft.cap_percent_of_invoice || null,
      applies_to: draft.applies_to.length ? draft.applies_to : ['rent'],
      notify_tenant: draft.notify_tenant,
    });

  return (
    <div className="space-y-4">
      <label className="flex items-center justify-between gap-4">
        <span>
          <span className="block font-medium">Charge late penalties</span>
          <span className="text-sm text-muted-foreground">
            Added as a separate invoice once rent is overdue past the grace period. You can always waive one.
          </span>
        </span>
        <Switch checked={draft.enabled} onCheckedChange={(v) => set({ enabled: v })} aria-label="Charge late penalties" />
      </label>

      <fieldset disabled={!draft.enabled} className="grid gap-4 disabled:opacity-60 sm:grid-cols-2">
        <div className="space-y-1">
          <Label>Penalty</Label>
          <Select value={draft.method} onValueChange={(v) => set({ method: v as PenaltyPolicy['method'] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Fixed amount</SelectItem>
              <SelectItem value="percent">Percent of overdue balance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {draft.method === 'fixed' ? (
          <div className="space-y-1">
            <Label htmlFor="penalty-amount">Amount (KES)</Label>
            <Input id="penalty-amount" type="number" min="0" value={draft.amount} onChange={(e) => set({ amount: e.target.value })} />
            {amountMissing && <p className="text-xs text-destructive">Enter an amount.</p>}
          </div>
        ) : (
          <div className="space-y-1">
            <Label htmlFor="penalty-percent">Percent</Label>
            <Input id="penalty-percent" type="number" min="0" max="100" value={draft.percent} onChange={(e) => set({ percent: e.target.value })} />
            {percentInvalid && <p className="text-xs text-destructive">Between 0 and 100.</p>}
          </div>
        )}
        <div className="space-y-1">
          <Label htmlFor="penalty-grace">Grace days after due date</Label>
          <Input
            id="penalty-grace"
            type="number"
            min="0"
            placeholder="Each tenancy's own grace period"
            value={draft.grace_days ?? ''}
            onChange={(e) => set({ grace_days: e.target.value === '' ? null : Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1">
          <Label>How often</Label>
          <Select value={draft.frequency} onValueChange={(v) => set({ frequency: v as PenaltyPolicy['frequency'] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="once">Once per overdue invoice</SelectItem>
              <SelectItem value="monthly">Again every month it stays unpaid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="penalty-cap">Cap (% of the invoice, optional)</Label>
          <Input
            id="penalty-cap"
            type="number"
            min="0"
            value={draft.cap_percent_of_invoice ?? ''}
            onChange={(e) => set({ cap_percent_of_invoice: e.target.value || null })}
          />
        </div>
        <label className="flex items-center gap-3 self-end pb-2 text-sm">
          <Switch checked={draft.notify_tenant} onCheckedChange={(v) => set({ notify_tenant: v })} aria-label="Notify tenant" />
          Tell the tenant when a penalty is added
        </label>
      </fieldset>

      <Button onClick={submit} isLoading={save.isPending} disabled={amountMissing || percentInvalid}>
        Save penalty rules
      </Button>
    </div>
  );
}
