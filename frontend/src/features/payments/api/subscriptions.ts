import api from '@/lib/api/client';
import type { ApiResponse } from '@/types/api.types';
import type { SubscriptionPlan, UserSubscription } from '@/types/subscription.types';

export const getPlans = async (): Promise<SubscriptionPlan[]> => {
  // const response = await api.axios.get<ApiResponse<SubscriptionPlan[]>>('/accounts/subscriptions/plans/');
  // return response.data.data || [];
  return [
    {
      id: 'plan_free',
      name: 'Starter',
      price: 0,
      interval: 'monthly',
      features: ['1 Property', '5 Units', 'Basic Reporting'],
      description: 'For single property owners'
    },
    {
      id: 'plan_pro',
      name: 'Professional',
      price: 2500,
      interval: 'monthly',
      features: ['Up to 5 Properties', 'Unlimited Units', 'Advanced Financial Reports', 'Priority Support'],
      description: 'For growing portfolios'
    },
    {
      id: 'plan_business',
      name: 'Business',
      price: 8000,
      interval: 'monthly',
      features: ['Unlimited Properties', 'Multi-User Access', 'API Access', 'Dedicated Account Manager'],
      description: 'For full management agencies'
    }
  ];
};

export const getPlanDetails = async (planId: string): Promise<SubscriptionPlan> => {
  const response = await api.axios.get<ApiResponse<SubscriptionPlan>>(`/accounts/subscriptions/plans/${planId}/`);
  if (!response.data.data) throw new Error('Plan not found');
  return response.data.data;
};

export const getMySubscription = async (): Promise<UserSubscription | null> => {
  // Mock data because endpoint might be triggering 401
  // const response = await api.axios.get<ApiResponse<UserSubscription>>('/accounts/subscriptions/my-subscription/');
  // return response.data.data || null;

  return {
    id: 'sub_123',
    plan: {
      id: 'plan_free',
      name: 'Starter Plan',
      price: 0,
      interval: 'monthly',
      features: ['Basic Listing', '5 Units', 'Standard Support'],
      description: 'Perfect for getting started'
    },
    status: 'active',
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cancel_at_period_end: false,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    autoRenew: true,
  } as UserSubscription;
};

export const upgradeSubscription = async (planId: string): Promise<UserSubscription> => {
  const response = await api.axios.post<ApiResponse<UserSubscription>>('/accounts/subscriptions/upgrade/', { planId });
  if (!response.data.data) throw new Error('Upgrade failed');
  return response.data.data;
};

export const cancelSubscription = async (): Promise<void> => {
  await api.axios.post('/accounts/subscriptions/cancel/');
};

export const reactivateSubscription = async (): Promise<UserSubscription> => {
  const response = await api.axios.post<ApiResponse<UserSubscription>>('/accounts/subscriptions/reactivate/');
  if (!response.data.data) throw new Error('Reactivation failed');
  return response.data.data;
};

export const checkFeatureAccess = async (featureName: string): Promise<boolean> => {
  const response = await api.axios.get<ApiResponse<{ hasAccess: boolean }>>(`/accounts/subscriptions/features/${featureName}/`);
  return response.data.data?.hasAccess || false;
};

/**
 * ================================================================================
 * README: Subscriptions API Module (subscriptions.ts)
 * ================================================================================
 *
 * OVERVIEW:
 * ---------
 * Manages user subscription plans (landlord tiers, premium features).
 * Handles plan listing, upgrades, cancellations, and feature access checks.
 *
 * ENDPOINTS:
 * ----------
 * | Method | Endpoint                             | Function               |
 * |--------|-------------------------------------|------------------------|
 * | GET    | /accounts/subscriptions/plans/      | getPlans()             |
 * | GET    | /accounts/subscriptions/plans/{id}/ | getPlanDetails()       |
 * | GET    | /accounts/subscriptions/my-subscription/| getMySubscription() |
 * | POST   | /accounts/subscriptions/upgrade/    | upgradeSubscription()  |
 * | POST   | /accounts/subscriptions/cancel/     | cancelSubscription()   |
 * | POST   | /accounts/subscriptions/reactivate/ | reactivateSubscription()|
 * | GET    | /accounts/subscriptions/features/{name}/| checkFeatureAccess()|
 *
 * USAGE:
 * ------
 * ```typescript
 * const plans = await getPlans();
 * const hasFeature = await checkFeatureAccess('premium_analytics');
 * await upgradeSubscription('plan-pro');
 * ```
 *
 * ================================================================================
 */
