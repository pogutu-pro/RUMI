import { useQuery } from '@tanstack/react-query';
import { 
    getAdminDashboardStats, 
    getUserStats, 
    getSubscriptionStats, 
    getPlatformStats,
    getPaymentDisputeStats
} from '../api/analytics';

export const useAdminDashboardStats = () => {
  return useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: getAdminDashboardStats,
  });
};

export const useAdminUserStats = () => {
  return useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: getUserStats,
  });
};

export const useAdminSubscriptionStats = () => {
  return useQuery({
    queryKey: ['admin-subscription-stats'],
    queryFn: getSubscriptionStats,
  });
};

export const useAdminPlatformStats = () => {
  return useQuery({
    queryKey: ['admin-platform-stats'],
    queryFn: getPlatformStats,
  });
};

export const useAdminPaymentDisputeStats = () => {
    return useQuery({
        queryKey: ['admin-payment-dispute-stats'],
        queryFn: getPaymentDisputeStats,
    });
};
