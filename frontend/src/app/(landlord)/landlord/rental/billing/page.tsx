'use client';

import Link from 'next/link';
import * as React from 'react';
import { toast } from 'sonner';
import { Landmark } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusPill, type StatusPillProps } from '@/components/ui/status-pill';
import { PriceDisplay } from '@/components/ui/price-display';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  useBillingAccess,
  useManualPaymentInstructions,
  useMySubscription,
  useSubscribe,
  useSwitchPlan,
} from '@/features/billing/hooks/use-subscription';
import { usePlans } from '@/features/billing/hooks/use-plans';
import { navigateCheckoutTab, openCheckoutTab } from '@/lib/utils/checkout-window';
import { WhatsAppHelp } from '@/components/support/whatsapp-help';
import type { OrganizationSubscription, SubscriptionPlan } from '@/features/billing/types';

/** "Pay another way" — for a landlord with no card. Shows whatever a super
 * admin has configured (RumiaRent's real bank/paybill details), never
 * anything invented here. Subscribing this way activates nothing by
 * itself — it lands as 'pending' until a super admin confirms the payment
 * arrived. */
function ManualPayDialog({
  plan,
  onClose,
  onConfirm,
  isPending,
}: {
  plan: SubscriptionPlan | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}) {
  const { data, isLoading } = useManualPaymentInstructions(!!plan);

  return (
    <Dialog open={!!plan} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pay another way</DialogTitle>
          <DialogDescription>
            {plan && (
              <>
                For the {plan.name} plan (<PriceDisplay amount={plan.price} size="sm" />
                /month). Your plan activates once we confirm the payment has arrived — usually
                within one working day.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="skeleton h-24 rounded-xl" />
        ) : data?.instructions ? (
          <div className="whitespace-pre-wrap rounded-xl border bg-muted/40 p-4 font-mono text-sm">
            {data.instructions}
          </div>
        ) : (
          <p className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
            Payment details aren&apos;t set up yet — confirm below and our team will follow up with
            how to pay.
          </p>
        )}
        <WhatsAppHelp topic="plan" label="Questions about paying? Ask us on WhatsApp" />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" isLoading={isPending} onClick={onConfirm}>
            I&apos;ll pay this way
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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

/**
 * Billing: the landlord's RumiaRent subscription, and a pointer to how
 * tenants pay rent (straight to the landlord's own paybill), both
 * consuming existing, already-working endpoints with no backend changes.
 */
export default function BillingPayoutPage() {
  const { data: subscription, isLoading: subscriptionLoading, error: subscriptionError } =
    useMySubscription();
  const { data: access } = useBillingAccess();
  const { data: plans, isLoading: plansLoading, isError: plansError, refetch: refetchPlans } =
    usePlans();
  const subscribeMutation = useSubscribe();
  const switchPlanMutation = useSwitchPlan();
  const [manualPayPlan, setManualPayPlan] = React.useState<SubscriptionPlan | null>(null);
  const isManualPending = subscription?.status === 'pending' && subscription.billing_mode === 'manual';

  const subscriptionNotFound =
    (subscriptionError as { statusCode?: number } | undefined)?.statusCode === 404;

  // A landlord with no subscription, or one whose subscription isn't in
  // ACTIVE_STATUSES (pending/suspended/cancelled), is eligible for a fresh
  // "Subscribe to X" — mirrors SubscriptionService.subscribe()'s own guard.
  const isReactivatable = !subscription || !ACTIVE_STATUSES.includes(subscription.status);

  return (
    <div className="space-y-6">
      <PageHeader title="Billing" />

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

      {isManualPending && (
        <Card className="rounded-2xl border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-5">
            <div className="flex items-start gap-3">
              <Landmark className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {subscription?.plan_details.name} plan pending confirmation
                </p>
                <p className="text-sm text-muted-foreground">
                  We&apos;ll activate it as soon as we confirm your payment arrived.
                </p>
              </div>
            </div>
            <Button
              type="button" variant="outline" size="sm"
              onClick={() => subscription && setManualPayPlan(subscription.plan_details)}
            >
              View payment instructions
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">How tenants pay you</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Rent goes straight to your own M-Pesa paybill or bank account. RumiaRent never handles it: we only record
            each payment against the right tenant and send the receipt.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild variant="outline" size="sm">
              <Link href="/landlord/rental/paybill">Set up your M-Pesa paybill</Link>
            </Button>
            <WhatsAppHelp topic="paybill" label="Or let us set it up with you" />
          </div>
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

      {!plansLoading && !plansError && !isManualPending && plans && plans.length > 0 && (
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
                  {!isCurrentPlan && !isSwitchable && (
                    <button
                      type="button"
                      className="mt-3 w-full text-center text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                      onClick={() => setManualPayPlan(plan)}
                    >
                      No card? Pay another way
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Not sure which plan fits? <WhatsAppHelp topic="plan" label="Ask us on WhatsApp" className="align-middle" />
      </p>

      <ManualPayDialog
        plan={manualPayPlan}
        isPending={subscribeMutation.isPending}
        onClose={() => setManualPayPlan(null)}
        onConfirm={() => {
          if (!manualPayPlan) return;
          subscribeMutation.mutate(
            { planId: manualPayPlan.id, billingMode: 'manual' },
            {
              onSuccess: () => {
                setManualPayPlan(null);
                toast.success(`Noted — we'll activate your ${manualPayPlan.name} plan once payment is confirmed.`);
              },
            },
          );
        }}
      />
    </div>
  );
}
