import api from '@/lib/api/client';
import { ApiResponse } from '@/types/api.types';

export const getAdminDashboardStats = async () => {
  const response = await api.axios.get<ApiResponse<any>>('/admin/super/dashboard/stats/');
  return response.data.data;
};

export const getUserStats = async () => {
  const response = await api.axios.get<ApiResponse<any>>('/admin/super/users/stats/');
  return response.data.data;
};

export const getSubscriptionStats = async () => {
  const response = await api.axios.get<ApiResponse<any>>('/admin/super/subscriptions/stats/');
  return response.data.data;
};

export const getPlatformStats = async () => {
  const response = await api.axios.get<ApiResponse<any>>('/admin/super/platform/stats/');
  return response.data.data;
};

export const getPaymentDisputeStats = async () => {
    const response = await api.axios.get<ApiResponse<any>>('/admin/super/payments/disputes/stats/');
    return response.data.data;
};
