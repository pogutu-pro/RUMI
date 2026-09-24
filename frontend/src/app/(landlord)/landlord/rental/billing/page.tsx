'use client';

import * as React from 'react';
import { PageHeader } from '@/components/dashboard/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusPill, type StatusPillProps } from '@/components/ui/status-pill';
import { PriceDisplay } from '@/components/ui/price-display';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import {
  useBillingAccess,
  useMySubscription,
  useSubscribe,
  useSwitchPlan,
} from '@/features/billing/hooks/use-subscription';
import { usePlans } from '@/features/billing/hooks/use-plans';
import { usePayoutStatus } from '@/features/payout/hooks/use-payout';
import { navigateCheckoutTab, openCheckoutTab } from '@/lib/utils/checkout-window';
import { PayoutDetailsForm } from '@/features/payout/components/payout-details-form';
import type { OrganizationSubscription } from '@/features/billing/types';
import type { PayoutStatus } from '@/features/payout/types';

// Mirrors SubscriptionService.ACTIVE_STATUSES (Backend/billing/services/subscription_service.py)
// exactly — only a subscription in one of these statuses is excluded from "reactivation"
// (i.e. shown "Switch to X" / "Current plan" instead of "Subscribe to X").
const ACTIVE_STATUSES: OrganizationSubscription['status'][] = ['active', 'past_due'];

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
  const { data: access } = useBillingAccess();
  const { data: payout, isLoading: payoutLoading } = usePayoutStatus();
  const { data: plans, isLoading: plansLoading, isError: plansError, refetch: refetchPlans } =
    usePlans();
  const subscribeMutation = useSubscribe();
  const switchPlanMutation = useSwitchPlan();
  const [editingPayout, setEditingPayout] = React.useState(false);

  const subscriptionNotFound =
    (subscriptionError as { statusCode?: number } | undefined)?.statusCode === 404;

  // A landlord with no subscription, or one whose subscription isn't in
  // ACTIVE_STATUSES (pending/suspended/cancelled), is eligible for a fresh
  // "Subscribe to X" — mirrors SubscriptionService.subscribe()'s own guard.
  const isReactivatable = !subscription || !ACTIVE_STATUSES.includes(subscription.status);

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
            access?.on_trial ? (
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-lg font-semibold">Enterprise · free trial</p>
                  <StatusPill status="success">
                    {access.trial_days_left} {access.trial_days_left === 1 ? 'day' : 'days'} left
                  </StatusPill>
                </div>
                <p className="text-sm text-muted-foreground">
                  Every feature is unlocked until your trial ends. Choose a plan below to carry on without a break.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  {access?.trial_expired
                    ? 'Your free trial has ended. You are on the Starter plan limits.'
                    : 'No active subscription yet'}
                </p>
                <StatusPill status="neutral">No subscription</StatusPill>
              </div>
            )
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
        <CardContent className="space-y-5">
          {payoutLoading ? (
            <div className="skeleton h-16 rounded-xl" />
          ) : payout ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
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
                {payout.status !== 'not_started' && !editingPayout && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingPayout(true)}>
                    Edit bank details
                  </Button>
                )}
              </div>

              {payout.status === 'not_started' && (
                <div>
                  <p className="mb-4 text-sm text-muted-foreground">
                    This is where tenant rent payments actually get paid out to you — add your
                    bank details so Paystack can settle rent into your account.
                  </p>
                  <PayoutDetailsForm />
                </div>
              )}

              {payout.status !== 'not_started' && editingPayout && (
                <div className="border-t pt-5">
                  <PayoutDetailsForm onSuccess={() => setEditingPayout(false)} />
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Something went wrong. Please try again.
            </p>
          )}
        </CardContent>
      </Card>

      {plansLoading && (
        <div className="grid gap-6 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-64 rounded-3xl" />
          ))}
        </div>
      )}

      {!plansLoading && plansError && (
        <ErrorState
          title="Couldn't load pricing"
          message="We're having trouble reaching pricing right now. Try again in a moment."
          onRetry={() => refetchPlans()}
        />
      )}

      {!plansLoading && !plansError && plans && plans.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-3">
          {plans.map((plan) => {
            const isCurrentPlan = !isReactivatable && subscription?.plan === plan.id;
            const isSwitchable = !isReactivatable && subscription?.plan !== plan.id;
            const isSubscribingThisPlan =
              subscribeMutation.isPending && subscribeMutation.variables?.planId === plan.id;
            const isSwitchingThisPlan =
              switchPlanMutation.isPending && switchPlanMutation.variables === plan.id;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl border p-8 ${
                  isCurrentPlan
                    ? 'border-primary bg-card shadow-xl'
                    : 'border-border bg-card shadow-sm'
                }`}
              >
                <h3 className="text-2xl font-semibold text-foreground">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <PriceDisplay amount={plan.price} size="lg" />
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>

                <div className="mt-6">
                  {isCurrentPlan ? (
                    <StatusPill status="success">Current plan</StatusPill>
                  ) : isSwitchable ? (
                    <Button
                      type="button"
                      className="w-full"
                      disabled={isSwitchingThisPlan}
                      isLoading={isSwitchingThisPlan}
                      onClick={() => switchPlanMutation.mutate(plan.id)}
                    >
                      Switch to {plan.name}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="w-full"
                      disabled={isSubscribingThisPlan}
                      isLoading={isSubscribingThisPlan}
                      onClick={() => {
                        // Must happen synchronously, before the mutation's
                        // async request resolves, or the browser blocks it
                        // as an unsolicited popup — see checkout-window.ts.
                        const checkoutTab = openCheckoutTab();
                        subscribeMutation.mutate(
                          { planId: plan.id, billingMode: 'auto' },
                          {
                            onSuccess: (result) => {
                              if (result.authorization_url) {
                                navigateCheckoutTab(checkoutTab, result.authorization_url);
                              } else {
                                checkoutTab?.close();
                              }
                            },
                            onError: () => checkoutTab?.close(),
                          },
                        );
                      }}
                    >
                      Subscribe to {plan.name}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
