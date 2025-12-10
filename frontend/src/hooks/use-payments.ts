import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import {
  getPayments,
  getPaymentStats,
  initiatePayment,
  verifyPayment,
  getPaymentMethods,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  enableRecurringPayment,
  cancelRecurringPayment,
  GetPaymentsFilters,
} from '@/lib/api/payments';
import { toast } from 'sonner';

export const usePayments = (filters?: GetPaymentsFilters) => {
  return useQuery({
    queryKey: queryKeys.payments.list(filters as Record<string, unknown> | undefined),
    queryFn: () => getPayments(filters),
  });
};

export const usePaymentStats = () => {
  return useQuery({
    queryKey: queryKeys.payments.stats(),
    queryFn: getPaymentStats,
  });
};

export const useInitiatePayment = () => {
  return useMutation({
    mutationFn: ({ bookingId, method }: { bookingId: string; method: 'mpesa' | 'bank' }) =>
      initiatePayment(bookingId, method),
    onError: (error: any) => {
      toast.error(error.message || 'Failed to initiate payment');
    },
  });
};

export const useVerifyPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment-stats'] });
      toast.success('Payment verified successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to verify payment');
    },
  });
};

export const usePaymentMethods = () => {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: getPaymentMethods,
  });
};

export const useSetDefaultPaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setDefaultPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('Default payment method updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update default payment method');
    },
  });
};

export const useDeletePaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
      toast.success('Payment method deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete payment method');
    },
  });
};

export const useRecurringPayments = () => {
  // Placeholder for recurring payments query if needed
  return {};
};

export const useEnableRecurringPayment = () => {
  return useMutation({
    mutationFn: enableRecurringPayment,
    onSuccess: () => {
      toast.success('Recurring payment enabled');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to enable recurring payment');
    },
  });
};

export const useCancelRecurringPayment = () => {
  return useMutation({
    mutationFn: cancelRecurringPayment,
    onSuccess: () => {
      toast.success('Recurring payment cancelled');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to cancel recurring payment');
    },
  });
};
