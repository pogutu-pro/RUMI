'use client';

import { useQuery } from '@tanstack/react-query';
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
