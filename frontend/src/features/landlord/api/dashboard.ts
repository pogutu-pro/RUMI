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
 * Endpoint: GET /api/v1/landlord/dashboard/overview/
 */
export const getLandlordDashboard = async (): Promise<LandlordDashboardData> => {
  const res = await axios.get<ApiResponse<LandlordDashboardData>>('/landlord/dashboard/overview/');
  if (!res.data.data) {
    throw new Error('Failed to fetch dashboard data');
  }
  return res.data.data;
};

/**
 * Get landlord activity feed
 * Endpoint: GET /api/v1/landlord/dashboard/activity-feed/
 */
export const getLandlordActivityFeed = async (limit = 10): Promise<LandlordActivity[]> => {
  const res = await axios.get<ApiResponse<LandlordActivity[]>>('/landlord/dashboard/activity-feed/', {
    params: { limit },
  });
  return res.data.data || [];
};

export const landlordDashboardApi = {
  getLandlordDashboard,
  getLandlordActivityFeed,
};
