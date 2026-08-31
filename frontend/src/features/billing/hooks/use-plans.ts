'use client';

import { useQuery } from '@tanstack/react-query';
import { billingApi } from '../api/billing';

/**
 * 5-minute staleTime (not Infinity) — plan data is rarely edited and
 * nothing in this codebase invalidates this key on a mutation (unlike
 * onboarding-status, there is no plan-editing UI in this phase).
 */
export function usePlans() {
  return useQuery({
    queryKey: ['billing', 'plans'],
    queryFn: billingApi.listPlans,
    staleTime: 5 * 60 * 1000,
  });
}
