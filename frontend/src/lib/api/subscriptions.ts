import api from './client';
import type { ApiResponse } from '@/types/api.types';
import type { SubscriptionPlan, UserSubscription } from '@/types/subscription.types';

export const getPlans = async (): Promise<SubscriptionPlan[]> => {
  const response = await api.axios.get<ApiResponse<SubscriptionPlan[]>>('/accounts/subscriptions/plans/');
  return response.data.data || [];
};

export const getPlanDetails = async (planId: string): Promise<SubscriptionPlan> => {
  const response = await api.axios.get<ApiResponse<SubscriptionPlan>>(`/accounts/subscriptions/plans/${planId}/`);
  if (!response.data.data) throw new Error('Plan not found');
  return response.data.data;
};

export const getMySubscription = async (): Promise<UserSubscription | null> => {
  const response = await api.axios.get<ApiResponse<UserSubscription>>('/accounts/subscriptions/my-subscription/');
  return response.data.data || null;
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
