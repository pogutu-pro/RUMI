import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import { getAnalytics, getAnalyticsBreakdown, exportAnalytics } from '@/features/analytics';
import { toast } from 'sonner';

export type AnalyticsPeriod = '7d' | '30d' | '90d' | '1y' | 'custom';

export interface CustomDateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Hook to fetch platform analytics
 * @param period - Time period for analytics
 * @param dateRange - Custom date range (only used when period is 'custom')
 * @returns Query result with analytics data
 */
export const useAnalytics = (
  period: AnalyticsPeriod = '30d',
  dateRange?: CustomDateRange
) => {
  return useQuery({
    queryKey: queryKeys.analytics.dashboard(period, dateRange),
    queryFn: () => getAnalytics(period, dateRange),
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

/**
 * Hook to fetch detailed analytics breakdown
 * @param category - Analytics category (users, bookings, revenue, etc.)
 * @param period - Time period for breakdown
 * @returns Query result with breakdown data
 */
export const useAnalyticsBreakdown = (
  category: 'users' | 'bookings' | 'revenue' | 'payments',
  period: AnalyticsPeriod = '30d'
) => {
  return useQuery({
    queryKey: [...queryKeys.analytics.dashboard(period), category, 'breakdown'],
    queryFn: () => getAnalyticsBreakdown(category, period),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook to export analytics data
 * @returns Mutation for exporting analytics
 */
export const useExportAnalytics = () => {
  return useMutation({
    mutationFn: ({ 
      period, 
      format,
      dateRange 
    }: { 
      period: AnalyticsPeriod; 
      format: 'csv' | 'pdf' | 'excel';
      dateRange?: CustomDateRange;
    }) => exportAnalytics(period, format, dateRange),
    onSuccess: (data) => {
      // Trigger download
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Analytics exported successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to export analytics';
      toast.error(message);
    },
  });
};

/**
 * Hook to get real-time analytics updates
 * @returns Query result with live metrics
 */
export const useLiveAnalytics = () => {
  return useQuery({
    queryKey: ['analytics', 'live'],
    queryFn: () => getAnalytics('7d'),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for live updates
  });
};
