import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import { studentDashboardApi } from '@/features/student';
import type {
  StudentDashboardData,
  RentStatusInfo,
  Transaction,
  ActivityEvent,
  SupportTicketSummary,
} from '@/types/entities.types';

/**
 * Hook to fetch complete student dashboard data
 * Polls every 30 seconds for fresh data
 */
export function useStudentDashboard() {
  return useQuery({
    queryKey: queryKeys.studentDashboard.data(),
    queryFn: () => studentDashboardApi.getDashboardData(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Poll every 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch rent payment status
 * Polls every 60 seconds
 */
export function useRentStatus() {
  return useQuery<RentStatusInfo>({
    queryKey: queryKeys.studentDashboard.rentStatus(),
    queryFn: () => studentDashboardApi.getRentStatus(),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Poll every minute
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch recent transactions
 * @param limit - Number of transactions to fetch (default: 5)
 */
export function useRecentTransactions(limit: number = 5) {
  return useQuery<Transaction[]>({
    queryKey: queryKeys.studentDashboard.transactions(limit),
    queryFn: () => studentDashboardApi.getRecentTransactions(limit),
    staleTime: 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch unread message count
 * Polls every 30 seconds for real-time updates
 */
export function useUnreadMessages() {
  return useQuery<number>({
    queryKey: queryKeys.studentDashboard.messages(),
    queryFn: () => studentDashboardApi.getUnreadMessageCount(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Poll every 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch active support tickets
 * Polls every 60 seconds
 */
export function useActiveTickets() {
  return useQuery<SupportTicketSummary[]>({
    queryKey: queryKeys.studentDashboard.tickets(),
    queryFn: () => studentDashboardApi.getActiveTickets(),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Poll every minute
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch activity feed
 * Polls every 2 minutes
 * @param limit - Number of events to fetch (default: 5)
 */
export function useActivityFeed(limit: number = 5) {
  return useQuery<ActivityEvent[]>({
    queryKey: queryKeys.studentDashboard.activity(limit),
    queryFn: () => studentDashboardApi.getActivityFeed(limit),
    staleTime: 120 * 1000, // 2 minutes
    refetchInterval: 120 * 1000, // Poll every 2 minutes
    refetchOnWindowFocus: true,
  });
}
