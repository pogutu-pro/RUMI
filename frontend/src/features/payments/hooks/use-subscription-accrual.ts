import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

export interface SubscriptionAccrual {
  period_start: string;
  as_of: string;
  total_occupied_bed_days: number;
  projected_accrual: number;
  currency: string;
  hostel_breakdown: Array<{
    hostel__name: string;
    bed_days: number;
  }>;
}

export function useSubscriptionAccrual() {
  return useQuery<SubscriptionAccrual>({
    queryKey: ['subscription-accrual'],
    queryFn: async () => {
      const response = await apiClient.get<SubscriptionAccrual>('/payments/subscriptions/accrual/');
      return response.data;
    },
  });
}
