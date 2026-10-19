import { axiosInstance as axios } from '@/lib/api/client';
import type { OrganizationSubscription, SubscriptionPlan } from '../types';

/**
 * RumiaRent billing API client. `listPlans` targets the public plan catalog
 * (AllowAny, no auth required) — see Backend/billing/views.py
 * SubscriptionPlanListView.
 *
 * `getMySubscription` 404s when the caller's organization has never
 * subscribed — see MyOrganizationSubscriptionView.get. That is a valid,
 * expected state, not a bug — callers must handle it as "no subscription
 * yet", not as an error.
 */
export const billingApi = {
  listPlans: async (): Promise<SubscriptionPlan[]> => {
    const res = await axios.get<SubscriptionPlan[]>('/billing/plans/');
    return res.data;
  },
  getMySubscription: async (): Promise<OrganizationSubscription> => {
    const res = await axios.get<OrganizationSubscription>('/billing/my-subscription/');
    return res.data;
  },
  subscribe: async (
    planId: string,
    billingMode: 'auto' | 'manual' = 'auto',
  ): Promise<{ mode: string; authorization_url?: string; internal_reference?: string; status?: string }> => {
    const res = await axios.post('/billing/subscribe/', {
      plan_id: planId,
      billing_mode: billingMode,
    });
    return res.data;
  },
  switchPlan: async (
    newPlanId: string,
  ): Promise<{ mode: string; authorization_url?: string; internal_reference?: string; status?: string }> => {
    const res = await axios.post('/billing/switch-plan/', { new_plan_id: newPlanId });
    return res.data;
  },
};
