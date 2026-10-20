'use client';

import { useQuery } from '@tanstack/react-query';
import { billingApi } from '../api/billing';

/**
 * Prices are edited by a super admin (Platform > Billing > Plans), and the
 * homepage, pricing page, onboarding and landlord billing page all read this
 * key. A short staleTime plus refetch-on-focus makes a price change show up
 * within seconds of the next visit instead of after five minutes.
 */
export function usePlans() {
  return useQuery({
    queryKey: ['billing', 'plans'],
    queryFn: billingApi.listPlans,
    staleTime: 30 * 1000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}
