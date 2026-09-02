'use client';

import { PageHeader } from '@/components/dashboard/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusPill, type StatusPillProps } from '@/components/ui/status-pill';
import { PriceDisplay } from '@/components/ui/price-display';
import { useMySubscription } from '@/features/billing/hooks/use-subscription';
import { usePayoutStatus } from '@/features/payout/hooks/use-payout';
import type { OrganizationSubscription } from '@/features/billing/types';
import type { PayoutStatus } from '@/features/payout/types';

const SUBSCRIPTION_STATUS_VARIANT: Record<
  OrganizationSubscription['status'],
  NonNullable<StatusPillProps['status']>
> = {
  active: 'success',
  pending: 'neutral',
  past_due: 'warning',
  suspended: 'danger',
  cancelled: 'danger',
};

const PAYOUT_STATUS_VARIANT: Record<PayoutStatus, NonNullable<StatusPillProps['status']>> = {
  active: 'success',
  pending_verification: 'warning',
  not_started: 'neutral',
};

/**
 * Combined "Billing & Payout" page (D-03) — one page, not two. Shows the
 * landlord's current subscription plan/status and payout status, both
 * consuming existing, already-working endpoints with no backend changes.
 */
export default function BillingPayoutPage() {
  const { data: subscription, isLoading: subscriptionLoading, error: subscriptionError } =
    useMySubscription();
  const { data: payout, isLoading: payoutLoading } = usePayoutStatus();

  const subscriptionNotFound =
    (subscriptionError as { statusCode?: number } | undefined)?.statusCode === 404;

  return (
    <div className="space-y-6">
      <PageHeader title="Billing & Payout" />

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Plan & Billing</CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptionLoading ? (
            <div className="skeleton h-16 rounded-xl" />
          ) : subscription ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-lg font-semibold">{subscription.plan_details.name}</p>
              <PriceDisplay amount={subscription.plan_details.price} size="md" />
              <StatusPill status={SUBSCRIPTION_STATUS_VARIANT[subscription.status]}>
                {subscription.status.replace('_', ' ')}
              </StatusPill>
            </div>
          ) : subscriptionNotFound ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-muted-foreground">No active subscription yet</p>
              <StatusPill status="neutral">No subscription</StatusPill>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Something went wrong. Please try again.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Payout</CardTitle>
        </CardHeader>
        <CardContent>
          {payoutLoading ? (
            <div className="skeleton h-16 rounded-xl" />
          ) : payout ? (
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill status={PAYOUT_STATUS_VARIANT[payout.status]}>
                {payout.status.replace(/_/g, ' ')}
              </StatusPill>
              {payout.status !== 'not_started' && (
                <p className="text-sm text-muted-foreground">
                  {payout.bank_name} · {payout.bank_account_number_masked}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Something went wrong. Please try again.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
