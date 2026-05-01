'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import { paymentsApi } from '../api/payments';
import {
  PaymentInitializeRequest,
  Payment,
  RentPeriod,
  StudentWallet,
  TransferLog
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

// -- RentPeriod Architecture Hooks --

export const useRentPeriods = (filters?: any) => {
  return useQuery({
    queryKey: [...queryKeys.payments.all, 'rent-periods', filters],
    queryFn: () => paymentsApi.getRentPeriods(filters),
  });
};


export const useCurrentRentPeriod = () => {
  return useQuery({
    queryKey: [...queryKeys.payments.all, 'rent-periods', 'current'],
    queryFn: () => paymentsApi.getCurrentRentPeriod(),
  });
};

export const useOverdueRentPeriods = () => {
  return useQuery({
    queryKey: [...queryKeys.payments.all, 'rent-periods', 'overdue'],
    queryFn: () => paymentsApi.getOverdueRentPeriods(),
  });
};

export const useRentSummary = () => {
  return useQuery({
    queryKey: [...queryKeys.payments.all, 'rent-periods', 'summary'],
    queryFn: () => paymentsApi.getRentSummary(),
  });
};

export const useMyWallet = () => {
  return useQuery({
    queryKey: [...queryKeys.payments.all, 'wallet', 'my'],
    queryFn: () => paymentsApi.getMyWallet(),
  });
};

export const useTransferHistory = (filters?: any) => {
  return useQuery({
    queryKey: [...queryKeys.payments.all, 'transfers', filters],
    queryFn: () => paymentsApi.getTransferHistory(filters),
  });
};

export const useAllWallets = (filters?: any) => {
  return useQuery({
    queryKey: [...queryKeys.payments.all, 'wallets', 'all', filters],
    queryFn: () => paymentsApi.getAllWallets(filters),
  });
};


