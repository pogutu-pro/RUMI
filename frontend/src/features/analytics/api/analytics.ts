import apiClient from '@/lib/api/client';
import type { PlatformAnalytics } from '@/types/entities.types';
import type { ApiResponse } from '@/types/api.types';

export interface CustomDateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Get platform analytics
 */
export const getAnalytics = async (
  period: string,
  dateRange?: CustomDateRange
): Promise<PlatformAnalytics> => {
  const response = await apiClient.axios.get<ApiResponse<PlatformAnalytics>>(
    '/analytics/dashboard/',
    {
      params: {
        period,
        ...(dateRange && {
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        }),
      },
    }
  );

  return response.data.data || {
    totalUsers: 0,
    activeUsers: 0,
    totalHostels: 0,
    totalBookings: 0,
    totalRevenue: 0,
    userGrowth: { current: 0, previous: 0, percentage: 0 },
    bookingGrowth: { current: 0, previous: 0, percentage: 0 },
    revenueGrowth: { current: 0, previous: 0, percentage: 0 },
    period: period as any,
    trends: [],
    propertyPerformance: [],
    platformMetrics: [],
    revenueDistribution: [],
  };
};

/**
 * Get detailed analytics breakdown
 */
export const getAnalyticsBreakdown = async (
  category: 'users' | 'bookings' | 'revenue' | 'payments',
  period: string
): Promise<any> => {
  const response = await apiClient.axios.get<ApiResponse<any>>(
    `/analytics/breakdown/${category}/`,
    { params: { period } }
  );
  return response.data.data || [];
};

/**
 * Export analytics data
 */
export const exportAnalytics = async (
  period: string,
  format: 'csv' | 'pdf' | 'excel',
  dateRange?: CustomDateRange
): Promise<Blob> => {
  const response = await apiClient.axios.post(
    '/analytics/export/',
    {
      period,
      format,
      ...(dateRange && {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
      }),
    },
    {
      responseType: 'blob',
    }
  );
  return response.data;
};

/**
 * ================================================================================
 * README: Analytics API Module (analytics.ts)
 * ================================================================================
 *
 * OVERVIEW:
 * ---------
 * Provides analytics and dashboard data for platform administrators and landlords.
 * Includes user growth, booking metrics, revenue tracking, and data export.
 *
 * BACKEND ENDPOINTS:
 * ------------------
 * | Method | Endpoint                           | Function              |
 * |--------|-----------------------------------|----------------------|
 * | GET    | /api/v1/analytics/dashboard/      | getAnalytics()        |
 * | GET    | /api/v1/analytics/breakdown/{cat}/| getAnalyticsBreakdown()|
 * | POST   | /api/v1/analytics/export/         | exportAnalytics()     |
 *
 * FEATURES:
 * ---------
 * - Dashboard Analytics: Users, bookings, revenue with growth metrics
 * - Breakdown by category: users, bookings, revenue, payments
 * - Export: CSV, PDF, Excel formats
 * - Custom date ranges supported
 *
 * USAGE:
 * ------
 * ```typescript
 * import { getAnalytics, exportAnalytics } from './analytics';
 *
 * const stats = await getAnalytics('monthly');
 * const blob = await exportAnalytics('monthly', 'csv');
 * ```
 *
 * ================================================================================
 */
