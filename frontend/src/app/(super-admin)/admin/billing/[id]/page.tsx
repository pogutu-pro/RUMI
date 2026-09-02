'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { StatusPill, type StatusPillProps } from '@/components/ui/status-pill';
import { PriceDisplay } from '@/components/ui/price-display';
import { ErrorState } from '@/components/ui/error-state';
import { PageHeader } from '@/components/dashboard/page-header';
import { useAdminBillingDetail } from '@/features/admin-billing/hooks/use-admin-billing';

type PillStatus = NonNullable<StatusPillProps['status']>;

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
    </div>
  );
}
