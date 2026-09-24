import { axiosInstance as axios } from '@/lib/api/client';
import type {
  BillingAccess,
  ManualPaymentInstructions,
  OrganizationSubscription,
  SubscribeResult,
  SubscriptionPlan,
} from '../types';

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
  getAccess: async (): Promise<BillingAccess> => {
    const res = await axios.get<BillingAccess>('/billing/access/');
    return res.data;
  },
  getMySubscription: async (): Promise<OrganizationSubscription> => {
    const res = await axios.get<OrganizationSubscription>('/billing/my-subscription/');
    return res.data;
  },
  subscribe: async (
    planId: string,
    billingMode: 'auto' | 'manual' = 'auto',
  ): Promise<SubscribeResult> => {
    const res = await axios.post<SubscribeResult>('/billing/subscribe/', {
      plan_id: planId,
      billing_mode: billingMode,
    });
    return res.data;
  },
  switchPlan: async (newPlanId: string): Promise<{ mode: string; status: string }> => {
    const res = await axios.post('/billing/switch-plan/', { new_plan_id: newPlanId });
    return res.data;
  },
  /** Readable by any landlord (to decide whether to use it) or super_admin. */
  getManualPaymentInstructions: async (): Promise<ManualPaymentInstructions> => {
    const res = await axios.get<ManualPaymentInstructions>('/billing/manual-payment-instructions/');
    return res.data;
  },
  /** super_admin only — the backend enforces this; this is not itself an access check. */
  setManualPaymentInstructions: async (instructions: string): Promise<ManualPaymentInstructions> => {
    const res = await axios.put<ManualPaymentInstructions>('/billing/manual-payment-instructions/', {
      instructions,
    });
    return res.data;
  },
};
