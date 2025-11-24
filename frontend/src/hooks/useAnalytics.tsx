import { useState, useEffect, useCallback } from 'react';
import { analyticsAPI } from '../services/analyticsAPI';

interface DateRange {
  startDate: string;
  endDate: string;
}

interface RevenueAnalytics {
  total_revenue: number;
  monthly_data: Array<{ month: string; revenue: number }>;
  growth_percentage: number;
}

interface UserAnalytics {
  total_users: number;
  active_users: number;
  new_registrations: number;
  monthly_registrations: Array<{ month: string; count: number }>;
}

interface ProductAnalytics {
  total_products: number;
  total_sales: number;
  monthly_sales: Array<{ month: string; sales: number }>;
  top_categories: Array<{ category: string; count: number }>;
}

interface AnalyticsData {
  revenue: RevenueAnalytics | null;
  users: UserAnalytics | null;
  products: ProductAnalytics | null;
}

interface AnalyticsState {
  data: AnalyticsData;
  loading: {
    revenue: boolean;
    users: boolean;
    products: boolean;
  };
  error: {
    revenue: string | null;
    users: string | null;
    products: string | null;
  };
}

export const useAnalytics = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 6, 1).toISOString().split('T')[0], // 6 months ago
    endDate: new Date().toISOString().split('T')[0], // today
  });

  const [state, setState] = useState<AnalyticsState>({
    data: {
      revenue: null,
      users: null,
      products: null,
    },
    loading: {
      revenue: false,
      users: false,
      products: false,
    },
    error: {
      revenue: null,
      users: null,
      products: null,
    },
  });

  const fetchRevenueAnalytics = useCallback(async () => {
    setState(prev => ({ ...prev, loading: { ...prev.loading, revenue: true }, error: { ...prev.error, revenue: null } }));
    try {
      const response = await analyticsAPI.getRevenueAnalytics({
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
      });
      setState(prev => ({
        ...prev,
        data: { ...prev.data, revenue: response.data },
        loading: { ...prev.loading, revenue: false }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: { ...prev.error, revenue: error instanceof Error ? error.message : 'Failed to fetch revenue analytics' },
        loading: { ...prev.loading, revenue: false }
      }));
    }
  }, [dateRange]);

  const fetchUserAnalytics = useCallback(async () => {
    setState(prev => ({ ...prev, loading: { ...prev.loading, users: true }, error: { ...prev.error, users: null } }));
    try {
      const response = await analyticsAPI.getUserAnalytics({
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
      });
      setState(prev => ({
        ...prev,
        data: { ...prev.data, users: response.data },
        loading: { ...prev.loading, users: false }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: { ...prev.error, users: error instanceof Error ? error.message : 'Failed to fetch user analytics' },
        loading: { ...prev.loading, users: false }
      }));
    }
  }, [dateRange]);

  const fetchProductAnalytics = useCallback(async () => {
    setState(prev => ({ ...prev, loading: { ...prev.loading, products: true }, error: { ...prev.error, products: null } }));
    try {
      const response = await analyticsAPI.getProductAnalytics({
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
      });
      setState(prev => ({
        ...prev,
        data: { ...prev.data, products: response.data },
        loading: { ...prev.loading, products: false }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: { ...prev.error, products: error instanceof Error ? error.message : 'Failed to fetch product analytics' },
        loading: { ...prev.loading, products: false }
      }));
    }
  }, [dateRange]);

  const fetchAllAnalytics = useCallback(async () => {
    await Promise.all([
      fetchRevenueAnalytics(),
      fetchUserAnalytics(),
      fetchProductAnalytics(),
    ]);
  }, [fetchRevenueAnalytics, fetchUserAnalytics, fetchProductAnalytics]);

  const updateDateRange = useCallback((newDateRange: DateRange) => {
    setDateRange(newDateRange);
  }, []);

  useEffect(() => {
    fetchAllAnalytics();
  }, [fetchAllAnalytics]);

  return {
    ...state,
    dateRange,
    updateDateRange,
    refetch: fetchAllAnalytics,
  };
};