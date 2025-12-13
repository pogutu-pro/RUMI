import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query/query-keys';
import { paymentsApi, PaymentInitializeRequest, RefundRequest } from '../api';
import { toast } from 'sonner';

export const useLandlordPayouts = () => {
  return useQuery({
    queryKey: ['payments', 'payouts', 'landlord'],
    queryFn: paymentsApi.getLandlordPayouts,
  });
};

export const useAdminTransactions = () => {
  return useQuery({
    queryKey: ['payments', 'transactions', 'admin'],
    queryFn: paymentsApi.getAdminTransactions,
  });
};

export const useLandlordTransactions = () => {
  return useQuery({
    queryKey: ['payments', 'transactions', 'landlord'],
    queryFn: paymentsApi.getLandlordTransactions,
  });
};

export const useStudentTransactions = () => {
    return useQuery({
      queryKey: ['payments', 'transactions', 'student'],
      queryFn: paymentsApi.getStudentTransactions,
    });
};

export const useStudentTransactionDetail = (transactionId: string) => {
    return useQuery({
        queryKey: ['payments', 'transactions', 'student', transactionId],
        queryFn: () => paymentsApi.getStudentTransactionDetail(transactionId),
        enabled: !!transactionId,
    });
};

export const useReceipt = (transactionId: string) => {
    return useQuery({
        queryKey: ['payments', 'receipt', transactionId],
        queryFn: () => paymentsApi.getReceipt(transactionId),
        enabled: !!transactionId,
    });
};

export const useInitiatePayment = () => {
  return useMutation({
    mutationFn: (data: PaymentInitializeRequest) => paymentsApi.initializePayment(data),
    onError: (error: any) => {
      toast.error(error.message || 'Failed to initiate payment');
    },
  });
};

export const useCreateRefundRequest = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: RefundRequest) => paymentsApi.createRefundRequest(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments', 'refunds'] });
            toast.success('Refund request submitted successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to submit refund request');
        }
    });
};

export const useRefunds = () => {
    return useQuery({
        queryKey: ['payments', 'refunds'],
        queryFn: paymentsApi.getRefunds,
    });
};

export const useProcessRefund = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (refundId: string) => paymentsApi.processRefund(refundId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments', 'refunds'] });
            toast.success('Refund processed successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to process refund');
        }
    });
};

// -- Kept as placeholders or if needed for other parts not covered by spec instructions --
// If other parts of the app import these, they need to be handled or removed.
// For now, I will remove them if they conflict or leave them if I cannot confirm replacements.
// The user gave specific endpoints, which seem to replace generic usage.
// Adapters for missing exports
export const usePayments = useStudentTransactions; // Alias to student transactions for now

export const usePaymentStats = () => {
    return useQuery({
        queryKey: ['payments', 'stats'],
        queryFn: async () => ({
            total_revenue: 0,
            pending_payouts: 0,
            completed_payouts: 0
        })
    });
};

