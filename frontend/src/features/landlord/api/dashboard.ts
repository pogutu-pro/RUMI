import { useQuery } from '@tanstack/react-query';
import { axiosInstance as axios } from '@/lib/api/client';
import type { ApiResponse } from '@/types/api.types';

/**
 * Dashboard overview data structure
 */
export interface LandlordDashboardData {
  monthlyRevenue: {
    month: string;
    revenue: number;
    occupancy: number;
  }[];
  hostelPerformance: {
    id: string;
    name: string;
    occupancy: number;
    revenue: number;
    trend: string;
    totalRooms: number;
    occupiedRooms: number;
  }[];
  bookingStatus: {
    confirmed: number;
    pending: number;
    cancelled: number;
  };
  stats: {
    totalRevenue: number;
    occupancyRate: number;
    activeHostels: number;
    pendingActions: number;
  };
}

/**
 * Activity feed item structure
 */
export interface LandlordActivity {
  id: string;
  type: 'booking' | 'payment' | 'alert' | 'cancellation' | 'maintenance';
  title: string;
  description: string;
  time: string;
  createdAt: string;
}

/**
 * Get landlord dashboard overview data
 * Endpoint: GET /api/v1/accounts/landlord/dashboard/
 * NOTE: Use existing endpoint. For detailed analytics, call /analytics/landlord/* endpoints asynchronously
 */
export const getLandlordDashboard = async (): Promise<LandlordDashboardData> => {
  try {
    const res = await axios.get<ApiResponse<LandlordDashboardData>>('/accounts/landlord/dashboard/');
    if (!res.data.data) {
      throw new Error('Failed to fetch dashboard data');
    }
    return res.data.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      // Return default empty structure for 404s
      return {
        monthlyRevenue: [],
        hostelPerformance: [],
        bookingStatus: { confirmed: 0, pending: 0, cancelled: 0 },
        stats: { totalRevenue: 0, occupancyRate: 0, activeHostels: 0, pendingActions: 0 }
      };
    }
    throw error;
  }
};

/**
 * Get landlord activity feed
 * Endpoint: GET /api/v1/admin/admin/activity-feed/
 * NOTE: Uses admin activity feed endpoint filtered for landlord context
 */
export const getLandlordActivityFeed = async (limit = 10): Promise<LandlordActivity[]> => {
  try {
    const res = await axios.get<ApiResponse<LandlordActivity[]>>('/admin/admin/activity-feed/', {
      params: { limit, role: 'landlord' },
    });
    return res.data.data || [];
  } catch (error: any) {
    if (error.response?.status === 404) {
      return [];
    }
    throw error;
  }
};

export const landlordDashboardApi = {
  getLandlordDashboard,
  getLandlordActivityFeed,
};
