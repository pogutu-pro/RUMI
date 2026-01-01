import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';
import { toast } from 'sonner';
import type { ApiResponse } from '@/types/api.types';
import type { PaymentMethod } from '../types';


export interface AddPaymentMethodRequest {
  type: 'mpesa' | 'card' | 'bank';
  name: string;
  details: Record<string, string>;
}

export interface UpdatePaymentMethodRequest {
  name?: string;
  details?: Record<string, string>;
}

/**
 * Hook to fetch all payment methods for the current user
 * @returns Query result with payment methods data
 */
export const usePaymentMethods = () => {
  return useQuery<PaymentMethod[], Error>({
    queryKey: ['paymentMethods'],
    queryFn: async () => {
      const response = await apiClient.axios.get<ApiResponse<PaymentMethod[]>>(
        '/api/v1/payment-methods/'
      );
      return response.data.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch a single payment method by ID
 * @param paymentMethodId - The ID of the payment method
 * @returns Query result with payment method data
 */
export const usePaymentMethod = (paymentMethodId: string | null | undefined) => {
  return useQuery<PaymentMethod, Error>({
    queryKey: ['paymentMethod', paymentMethodId],
    queryFn: async () => {
      if (!paymentMethodId) throw new Error('Payment method ID is required');
      const response = await apiClient.axios.get<ApiResponse<PaymentMethod>>(
        `/api/v1/payment-methods/${paymentMethodId}/`
      );
      return response.data.data!;
    },
    enabled: !!paymentMethodId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to add a new payment method
 * @returns Mutation for adding a payment method
 */
export const useAddPaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddPaymentMethodRequest) =>
      apiClient.axios.post<ApiResponse<PaymentMethod>>(
        '/api/v1/payment-methods/',
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      toast.success('Payment method added successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to add payment method';
      toast.error(message);
    },
  });
};

/**
 * Hook to update a payment method
 * @param paymentMethodId - The ID of the payment method to update
 * @returns Mutation for updating a payment method
 */
export const useUpdatePaymentMethod = (paymentMethodId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePaymentMethodRequest) =>
      apiClient.axios.patch<ApiResponse<PaymentMethod>>(
        `/api/v1/payment-methods/${paymentMethodId}/`,
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      queryClient.invalidateQueries({ queryKey: ['paymentMethod', paymentMethodId] });
      toast.success('Payment method updated successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update payment method';
      toast.error(message);
    },
  });
};

/**
 * Hook to delete a payment method
 * @param paymentMethodId - The ID of the payment method to delete
 * @returns Mutation for deleting a payment method
 */
export const useDeletePaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentMethodId: string) =>
      apiClient.axios.delete(`/api/v1/payment-methods/${paymentMethodId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      toast.success('Payment method deleted successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete payment method';
      toast.error(message);
    },
  });
};

/**
 * Hook to set a payment method as default
 * @returns Mutation for setting default payment method
 */
export const useSetDefaultPaymentMethod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentMethodId: string) =>
      apiClient.axios.post(`/api/v1/payment-methods/${paymentMethodId}/set-default/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentMethods'] });
      toast.success('Default payment method updated');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to set default payment method';
      toast.error(message);
    },
  });
};
