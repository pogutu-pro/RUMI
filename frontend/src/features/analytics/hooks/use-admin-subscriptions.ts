import { useQuery } from '@tanstack/react-query';
import { getAllSubscriptions, getSubscriptionStats } from '../api/subscriptions';
import type { AdminSubscription, SubscriptionStats } from '../api/subscriptions';

/**
 * Hook to fetch all subscriptions for admin view
 */
export function useAdminSubscriptions() {
  return useQuery<AdminSubscription[]>({
    queryKey: ['admin', 'subscriptions', 'all'],
    queryFn: () => getAllSubscriptions(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to fetch subscription statistics for admin dashboard
 */
export function useSubscriptionStats() {
  return useQuery<SubscriptionStats>({
    queryKey: ['admin', 'subscriptions', 'stats'],
    queryFn: () => getSubscriptionStats(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
