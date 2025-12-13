import apiClient from '@/lib/api/client';
import { ApiResponse } from '@/types/api.types';

// -- Types --

export interface DashboardStats {
  totalBookings?: number;
  activeBookings?: number;
  totalSpent?: number;
  totalEarned?: number;
  occupancyRate?: number;
  // Add other stats fields as needed
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivity: any[]; // Define specific activity type if available
  upcomingPayments?: any[];
  notifications?: any[];
}

// -- API Service --

export const dashboardApi = {
  // Student Dashboard
  // GET /accounts/dashboard/
  getStudentDashboard: async () => {
    const res = await apiClient.get<ApiResponse<DashboardData>>(
      '/accounts/dashboard/'
    );
    return res.data.data;
  },

  // Landlord Dashboard
  // GET /accounts/landlord/dashboard/
  getLandlordDashboard: async () => {
    const res = await apiClient.get<ApiResponse<DashboardData>>(
      '/accounts/landlord/dashboard/'
    );
    return res.data.data;
  },
};
