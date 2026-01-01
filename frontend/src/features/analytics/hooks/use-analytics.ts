import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import { 
  getAnalytics, 
  getAnalyticsBreakdown, 
  exportAnalytics,
  getLandlordOccupancy,
  getLandlordRevenue,
  getLandlordPerformance,
  getLandlordFinancialReports
} from '../api/analytics';
import { toast } from 'sonner';

import type { AnalyticsPeriod, CustomDateRange } from '@/features/analytics/types/types';


/**
 * Hook to fetch platform analytics (Generic)
 */
export const useAnalytics = (
  period: AnalyticsPeriod = '30d',
  dateRange?: CustomDateRange
) => {
  return useQuery({
    queryKey: queryKeys.analytics.dashboard(period, dateRange),
    queryFn: () => getAnalytics(period, dateRange),
    staleTime: 15 * 60 * 1000, 
    refetchInterval: 5 * 60 * 1000, 
  });
};

/**
 * Hooks for Landlord Specific Analytics (Real World API)
 */
export const useLandlordRevenue = (period: AnalyticsPeriod = '30d') => {
  return useQuery({
    queryKey: [...queryKeys.analytics.all, 'landlord', 'revenue', period],
    queryFn: () => getLandlordRevenue(period),
  });
};

export const useLandlordOccupancy = (period: AnalyticsPeriod = '30d') => {
  return useQuery({
      queryKey: [...queryKeys.analytics.all, 'landlord', 'occupancy', period],
      queryFn: () => getLandlordOccupancy(period),
  });
};

export const useLandlordPerformance = () => {
    return useQuery({
        queryKey: [...queryKeys.analytics.all, 'landlord', 'performance'],
        queryFn: getLandlordPerformance,
    });
};

export const useLandlordFinancialReports = (period: AnalyticsPeriod = '30d') => {
    return useQuery({
        queryKey: [...queryKeys.analytics.all, 'landlord', 'reports', period],
        queryFn: () => getLandlordFinancialReports(period),
    });
};

/**
 * Hook to fetch detailed analytics breakdown
 */
export const useAnalyticsBreakdown = (
  category: 'users' | 'bookings' | 'revenue' | 'payments',
  period: AnalyticsPeriod = '30d'
) => {
  return useQuery({
    queryKey: [...queryKeys.analytics.dashboard(period), category, 'breakdown'],
    queryFn: () => getAnalyticsBreakdown(category, period),
    staleTime: 10 * 60 * 1000, 
  });
};

/**
 * Hook to export analytics data
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
 */
export const useLiveAnalytics = () => {
  return useQuery({
    queryKey: ['analytics', 'live'],
    queryFn: () => getAnalytics('7d'),
    staleTime: 30 * 1000, 
    refetchInterval: 30 * 1000, 
  });
};
