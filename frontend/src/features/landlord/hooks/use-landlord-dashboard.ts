import { useQuery } from '@tanstack/react-query';
import { getLandlordDashboard, getLandlordActivityFeed } from '../api/dashboard';
import type { LandlordDashboardData, LandlordActivity } from '../api/dashboard';

/**
 * Hook to fetch landlord dashboard overview data
 * Returns monthly revenue trends, hostel performance, booking stats, and KPIs
 */
export function useLandlordDashboard() {
  return useQuery<LandlordDashboardData>({
    queryKey: ['landlord', 'dashboard', 'overview'],
    queryFn: () => getLandlordDashboard(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch landlord activity feed
 * Returns recent activities like bookings, payments, maintenance requests
 */
export function useLandlordActivityFeed(limit = 10) {
  return useQuery<LandlordActivity[]>({
    queryKey: ['landlord', 'dashboard', 'activity-feed', limit],
    queryFn: () => getLandlordActivityFeed(limit),
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes for real-time updates
  });
}
