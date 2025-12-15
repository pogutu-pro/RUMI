import { useQuery } from '@tanstack/react-query';
import { axiosInstance as axios } from '@/lib/api/client';
import type { ApiResponse } from '@/types/api.types';

/**
 * Admin subscription data types
 */
export interface AdminSubscription {
  id: string;
  userId: string;
  userName: string;
  planName: string;
  status: 'active' | 'past_due' | 'cancelled' | 'trialing';
  amount: number;
  nextBillingDate: string | null;
  paymentMethod: string;
  createdAt: string;
  cancelledAt?: string;
}

export interface SubscriptionStats {
  activeCount: number;
  monthlyRecurringRevenue: number;
  pastDueCount: number;
  churnRate: number;
}

/**
 * Get all subscriptions (admin only)
 * Endpoint: GET /api/v1/admin/subscriptions/
 */
export const getAllSubscriptions = async (): Promise<AdminSubscription[]> => {
  const res = await axios.get<ApiResponse<AdminSubscription[]>>('/admin/subscriptions/');
  return res.data.data || [];
};

/**
 * Get subscription statistics (admin only)
 * Endpoint: GET /api/v1/admin/subscriptions/stats/
 */
export const getSubscriptionStats = async (): Promise<SubscriptionStats> => {
  const res = await axios.get<ApiResponse<SubscriptionStats>>('/admin/subscriptions/stats/');
  if (!res.data.data) {
    // Return default values if no data
    return {
      activeCount: 0,
      monthlyRecurringRevenue: 0,
      pastDueCount: 0,
      churnRate: 0,
    };
  }
  return res.data.data;
};

export const adminSubscriptionsApi = {
  getAllSubscriptions,
  getSubscriptionStats,
};
