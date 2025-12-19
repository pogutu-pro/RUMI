'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import { paymentsApi } from '../api/payments';
import { 
  MpesaInitializeRequest, 
  CreateMpesaConfigRequest,
  PaymentInitializeRequest,
  Payment
} from '../types';
import { toast } from 'sonner';

// -- Student & Landlord Transaction Hooks --

export const useStudentTransactions = (filters?: any) => {
  return useQuery({
    queryKey: [...queryKeys.payments.all, 'student', filters],
    queryFn: () => paymentsApi.getStudentTransactionsWithReceipts(filters),
  });
};

export const useLandlordTransactions = (filters?: any) => {
  return useQuery({
    queryKey: [...queryKeys.payments.all, 'landlord', filters],
    queryFn: () => paymentsApi.getLandlordPayments(filters),
  });
};

export const useLandlordPayouts = () => {
  return useQuery({
    queryKey: [...queryKeys.payments.all, 'landlord', 'payouts'],
    queryFn: () => paymentsApi.getLandlordPayouts(),
  });
};

export const useAdminTransactions = (filters?: any) => {
  return useQuery({
    queryKey: [...queryKeys.payments.all, 'admin', filters],
    queryFn: () => paymentsApi.getAdminPayments(filters),
  });
};

export const usePaymentStats = () => {
  return useQuery({
    queryKey: queryKeys.payments.stats(),
    queryFn: () => paymentsApi.getPaymentStats(),
  });
};

export const useReceipt = (transactionId: string | number) => {
  return useQuery({
    queryKey: [...queryKeys.payments.all, 'receipt', transactionId],
    queryFn: () => paymentsApi.getReceipt(transactionId),
    enabled: !!transactionId,
  });
};

// -- M-Pesa Specific Hooks --

export const useInitializeMpesaPayment = () => {
  return useMutation({
    mutationFn: (data: MpesaInitializeRequest) => paymentsApi.initializeMpesaPayment(data),
    onError: (error: any) => {
      toast.error(error.message || 'Failed to initiate M-Pesa payment');
    },
  });
};

export const useMpesaPaymentStatus = (params: { 
  transaction_id?: string | number; 
  checkout_request_id?: string;
}, options?: { enabled?: boolean; refetchInterval?: number | false }) => {
  return useQuery({
    queryKey: [...queryKeys.payments.all, 'mpesa', 'status', params.transaction_id || params.checkout_request_id],
    queryFn: () => paymentsApi.getMpesaPaymentStatus(params),
    enabled: options?.enabled !== false && (!!params.transaction_id || !!params.checkout_request_id),
    refetchInterval: options?.refetchInterval ?? 5000, 
  });
};

export const useMpesaConfigs = () => {
  return useQuery({
    queryKey: [...queryKeys.payments.all, 'mpesa', 'configs'],
    queryFn: () => paymentsApi.getMpesaConfigs(),
  });
};

export const useCreateMpesaConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMpesaConfigRequest) => paymentsApi.createMpesaConfig(data),
    onSuccess: () => {
      toast.success('M-Pesa configuration added successfully');
      queryClient.invalidateQueries({ queryKey: [...queryKeys.payments.all, 'mpesa', 'configs'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add M-Pesa configuration');
    },
  });
};

// -- Legacy/Generic Compatibility --

export const useInitiatePayment = () => {
  return useMutation({
    mutationFn: (data: PaymentInitializeRequest) => paymentsApi.initiatePayment(data),
    onSuccess: () => {
      toast.success('Payment initiated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to initiate payment');
    },
  });
};

export const usePayments = useStudentTransactions;
