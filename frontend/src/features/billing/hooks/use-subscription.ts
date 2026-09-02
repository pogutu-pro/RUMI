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
      if (result.authorization_url) {
        // Auto mode redirects to Paystack — manual mode has no
        // authorization_url and just shows the success toast.
        window.location.href = result.authorization_url;
      } else {
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
