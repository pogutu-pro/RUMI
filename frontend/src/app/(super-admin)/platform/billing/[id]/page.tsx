'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { StatusPill, type StatusPillProps } from '@/components/ui/status-pill';
import { PriceDisplay } from '@/components/ui/price-display';
import { ErrorState } from '@/components/ui/error-state';
import { Button } from '@/components/ui/button';
import { FormDialogActions, FormRow } from '@/components/ui/form-layout';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/dashboard/page-header';
import { useAdminBillingDetail, useOverrideSubscription } from '@/features/admin-billing/hooks/use-admin-billing';
import { usePlans } from '@/features/billing/hooks/use-plans';
import { cn } from '@/lib/utils';

type PillStatus = NonNullable<StatusPillProps['status']>;

// Sentinel value for an unselected optional Select — Radix Select items
// cannot use an empty string as their value.
const NO_CHANGE = '__no_change__';

const SUBSCRIPTION_STATUSES = ['pending', 'active', 'past_due', 'suspended', 'cancelled'] as const;

const overrideSchema = z.object({
  plan_id: z.string(),
  status: z.string(),
  reason: z.string().trim().min(1, 'Reason is required').max(500),
});

// Color mapping per 06-UI-SPEC.md's status-color table.
const SUBSCRIPTION_STATUS_VARIANT: Record<string, PillStatus> = {
  active: 'success',
  pending: 'neutral',
  past_due: 'warning',
  suspended: 'danger',
  cancelled: 'danger',
};

const PAYOUT_STATUS_VARIANT: Record<string, PillStatus> = {
  active: 'success',
  pending_verification: 'warning',
  not_started: 'neutral',
};

const CHARGE_STATUS_VARIANT: Record<string, PillStatus> = {
  success: 'success',
  pending: 'neutral',
  failed: 'danger',
};

/**
 * Super-admin billing/payout/subscription-diagnostic view for a single
 * organization (ADMIN-01/ADMIN-02). Renders ONLY this billing content — no
 * property/unit/caretaker counts or other org context, per D-04's locked
 * field list.
 */
export default function AdminBillingDetailPage() {
  const params = useParams<{ id: string }>();
  const orgId = params.id;
  const { data, isLoading, isError, refetch } = useAdminBillingDetail(orgId);
  const { data: plans = [] } = usePlans();
  const overrideMutation = useOverrideSubscription();
  const [overrideOpen, setOverrideOpen] = React.useState(false);

  const overrideForm = useForm<z.infer<typeof overrideSchema>>({
    resolver: zodResolver(overrideSchema),
    defaultValues: { plan_id: NO_CHANGE, status: NO_CHANGE, reason: '' },
  });
  // react-hook-form's watch() returns a function that cannot be memoized
  // safely, so React Compiler skips auto-memoizing this component — a
  // known, accepted library-level limitation (not a bug), same pattern as
  // my-tickets-page.tsx's form.watch('category').
  // eslint-disable-next-line react-hooks/incompatible-library
  const reasonValue = overrideForm.watch('reason');
  const statusValue = overrideForm.watch('status');
  const isDestructiveStatus = statusValue === 'suspended' || statusValue === 'cancelled';

  const handleOverride = overrideForm.handleSubmit(async (values) => {
    try {
      await overrideMutation.mutateAsync({
        id: orgId,
        payload: {
          ...(values.plan_id !== NO_CHANGE && { plan_id: values.plan_id }),
          ...(values.status !== NO_CHANGE && { status: values.status }),
          reason: values.reason,
        },
      });
      setOverrideOpen(false);
      overrideForm.reset({ plan_id: NO_CHANGE, status: NO_CHANGE, reason: '' });
    } catch {
      // handled via overrideMutation.error / toast in the hook
    }
  });

  if (isLoading || !data) {
    return isError ? (
      <ErrorState onRetry={refetch} />
    ) : (
      <p className="text-sm text-muted-foreground">Loading…</p>
    );
  }

  const { organization, subscription, effective_plan, payout, last_charge_event } = data;
  const payoutStatus = payout?.status ?? 'not_started';

  return (
    <div className="space-y-6">
      <PageHeader
        title={organization.name}
        description={organization.slug}
        action={(
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={subscription ? (SUBSCRIPTION_STATUS_VARIANT[subscription.status] ?? 'neutral') : 'neutral'}>
              {subscription ? subscription.status : 'no subscription'}
            </StatusPill>
            <StatusPill status="neutral">{effective_plan.name}</StatusPill>
            <StatusPill status={PAYOUT_STATUS_VARIANT[payoutStatus] ?? 'neutral'}>{payoutStatus}</StatusPill>
          </div>
        )}
      />

      <div className="rounded-xl border bg-background p-6">
        <h2 className="text-sm font-semibold text-foreground">Last charge event</h2>
        {last_charge_event ? (
          <div className="mt-3 flex items-center justify-between">
            <div>
              <PriceDisplay amount={last_charge_event.amount} size="lg" />
              <p className="mt-1 text-xs text-muted-foreground">{last_charge_event.paystack_reference}</p>
            </div>
            <StatusPill status={CHARGE_STATUS_VARIANT[last_charge_event.status] ?? 'neutral'}>
              {last_charge_event.status}
            </StatusPill>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No charge history yet</p>
        )}
      </div>

      {/* Visually separated from the read-only diagnostics above per
          06-UI-SPEC.md's visual-hierarchy rule — an override action must
          never sit adjacent-and-confusable with read-only content. */}
      <div className="border-t pt-6">
        <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline">
              Override subscription
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Override {organization.name}&apos;s subscription</DialogTitle>
              <DialogDescription>
                Manually change this organization&apos;s plan or status. Leave a field on &quot;No change&quot; to keep it as it is.
              </DialogDescription>
            </DialogHeader>
            <Form {...overrideForm}>
              <form onSubmit={handleOverride} className="space-y-5">
                <FormField
                  control={overrideForm.control}
                  name="plan_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NO_CHANGE}>No change</SelectItem>
                          {plans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={overrideForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NO_CHANGE}>No change</SelectItem>
                          {SUBSCRIPTION_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s.replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={overrideForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for override</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          maxLength={500}
                          placeholder="e.g. Manual bank transfer received, comped for support issue #1234"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <p className={cn('text-sm', isDestructiveStatus ? 'text-destructive' : 'text-muted-foreground')}>
                  This directly changes the organization&apos;s billing record without charging or refunding via
                  Paystack. This action is logged and cannot be undone.
                </p>
                <FormDialogActions
                  submitLabel="Apply override"
                  isPending={overrideMutation.isPending}
                  disabled={!reasonValue?.trim()}
                />
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
