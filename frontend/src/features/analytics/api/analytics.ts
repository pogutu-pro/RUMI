import apiClient from '@/lib/api/client';
import type { PlatformAnalytics } from '@/types/entities.types';
import type { ApiResponse } from '@/types/api.types';

export interface CustomDateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Get generic platform analytics
 */
export const getAnalytics = async (
  period: string,
  dateRange?: CustomDateRange
): Promise<PlatformAnalytics> => {
  const response = await apiClient.axios.get<ApiResponse<any>>(
    '/landlord/dashboard/overview/',
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

  const data = response.data.data;
  
  // Map specialized landlord dashboard data to expected PlatformAnalytics shape
  return {
    totalUsers: data?.stats?.total_users || 0,
    activeUsers: data?.stats?.active_users || 0,
    totalHostels: data?.stats?.active_hostels || 0,
    totalBookings: data?.stats?.total_bookings || 0,
    totalRevenue: data?.stats?.total_revenue || 0,
    userGrowth: data?.growth?.users || { current: 0, previous: 0, percentage: 0 },
    bookingGrowth: data?.growth?.bookings || { current: 0, previous: 0, percentage: 0 },
    revenueGrowth: data?.growth?.revenue || { current: 0, previous: 0, percentage: 0 },
    period: period as any,
    trends: data?.monthly_revenue || [],
    propertyPerformance: data?.hostel_performance || [],
    platformMetrics: [],
    revenueDistribution: data?.booking_status ? [
      { name: 'Confirmed', value: data.booking_status.confirmed },
      { name: 'Pending', value: data.booking_status.pending },
      { name: 'Cancelled', value: data.booking_status.cancelled }
    ] : [],
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
 * LANDLORD SPECIFIC ANALYTICS ENDPOINTS
 * aligned with SETUP_GUIDE.md
 */

// /analytics/landlord/financial-reports/
export const getLandlordFinancialReports = async (period: string = '30d'): Promise<any[]> => {
  const response = await apiClient.axios.get<ApiResponse<any[]>>(
    '/analytics/landlord/financial-reports/',
    { params: { period } }
  );
  return response.data.data || [];
};

// /analytics/landlord/occupancy/
export const getLandlordOccupancy = async (period: string = '30d'): Promise<any> => {
  const response = await apiClient.axios.get<ApiResponse<any>>(
    '/analytics/landlord/occupancy/',
    { params: { period } }
  );
  return response.data.data || { rate: 0, growth: 0 };
};

// /analytics/landlord/revenue/
export const getLandlordRevenue = async (period: string = '30d'): Promise<any> => {
   const response = await apiClient.axios.get<ApiResponse<any>>(
    '/analytics/landlord/revenue/',
    { params: { period } }
  );
  return response.data.data || { totalRevenue: 0, trends: [], growth: 0 };
};

// /analytics/landlord/performance/
export const getLandlordPerformance = async (): Promise<any[]> => {
   const response = await apiClient.axios.get<ApiResponse<any[]>>(
    '/analytics/landlord/performance/'
  );
  return response.data.data || [];
};

/**
 * Export analytics data
 * Matches generic export used in guide
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
