import { axiosInstance as axios } from '@/lib/api/client';
import type { SubscriptionPlan } from '../types';

/**
 * RumiaRent billing API client. `listPlans` targets the public plan catalog
 * (AllowAny, no auth required) — see Backend/billing/views.py
 * SubscriptionPlanListView.
 */
export const billingApi = {
  listPlans: async (): Promise<SubscriptionPlan[]> => {
    const res = await axios.get<SubscriptionPlan[]>('/billing/plans/');
    return res.data;
  },
};
