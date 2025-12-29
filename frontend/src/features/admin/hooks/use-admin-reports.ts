import { useQuery } from '@tanstack/react-query';
import { 
    getPaymentTaxReports, 
    getSystemActivityFeed,
    getRefundRequests
} from '../api/reports';

export const useAdminTaxReports = () => {
  return useQuery({
    queryKey: ['admin-tax-reports'],
    queryFn: getPaymentTaxReports,
  });
};

export const useAdminSystemActivity = () => {
  return useQuery({
    queryKey: ['admin-system-activity'],
    queryFn: getSystemActivityFeed,
  });
};

export const useAdminRefunds = () => {
    return useQuery({
        queryKey: ['admin-refunds'],
        queryFn: getRefundRequests,
    });
};
