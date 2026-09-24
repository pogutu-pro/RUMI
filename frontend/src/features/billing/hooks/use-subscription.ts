'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { billingApi } from '../api/billing';

const MY_SUBSCRIPTION_KEY = ['billing', 'my-subscription'] as const;

/**
 * A 404 here means the organization has never subscribed — a normal, valid
 * "no subscription yet" state (see billingApi.getMySubscription), not a
 * transient failure. Do not retry it; retry other errors up to twice,
 * matching the codebase's default React Query retry conventions.
 */
export const useMySubscription = () =>
  useQuery({
    queryKey: MY_SUBSCRIPTION_KEY,
    queryFn: billingApi.getMySubscription,
    retry: (count, err) =>
      (err as { statusCode?: number } | undefined)?.statusCode === 404 ? false : count < 2,
  });

/**
 * 502 = Paystack-provider rejection (PaymentProviderError), distinct from a
 * generic 400 validation failure — see UI-SPEC's Copywriting Contract and
 * use-payout.ts's useSubmitPayoutDetails 502-branch pattern, copied here.
 */
function billingErrorMessage(err: unknown, fallback: string): string {
  const status = (err as { statusCode?: number } | undefined)?.statusCode;
  if (status === 502) {
    return "We couldn't process that plan change. Please try again, or contact support if this keeps happening.";
  }
  return (err as { message?: string } | undefined)?.message || fallback;
}

export const useSubscribe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, billingMode }: { planId: string; billingMode: 'auto' | 'manual' }) =>
      billingApi.subscribe(planId, billingMode),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: MY_SUBSCRIPTION_KEY });
      // Auto mode has an authorization_url to send the caller to Paystack
      // with — manual mode doesn't, so this is where it's done. The
      // caller (billing/page.tsx) opens the checkout tab itself, since
      // only it has the synchronous click-handler context a browser
      // requires before allowing window.open.
      if (!result.authorization_url) {
        toast.success('Subscribed');
      }
    },
    onError: (err) => {
      toast.error(billingErrorMessage(err, 'Could not update your plan'));
    },
  });
};

export const useSwitchPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (newPlanId: string) => billingApi.switchPlan(newPlanId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MY_SUBSCRIPTION_KEY });
      toast.success('Plan updated');
    },
    onError: (err) => {
      toast.error(billingErrorMessage(err, 'Could not update your plan'));
    },
  });
};

/**
 * What the landlord is entitled to right now, and whether that is the free
 * new-landlord trial. Refetched on focus so the days-left count and the
 * post-subscribe state never go stale.
 */
export const useBillingAccess = () =>
  useQuery({
    queryKey: ['billing', 'access'],
    queryFn: billingApi.getAccess,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
