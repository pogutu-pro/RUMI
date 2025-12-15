import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminActivityFeed, getPaymentDisputes, getDisputeStats, updateDisputeStatus, resolveDispute } from '../api/admin';
import type { AdminActivity, PaymentDispute, DisputeStats } from '../api/admin';
import { toast } from 'sonner';

/**
 * Hook to fetch admin activity feed
 */
export function useAdminActivityFeed(limit = 10) {
  return useQuery<AdminActivity[]>({
    queryKey: ['admin', 'activity-feed', limit],
    queryFn: () => getAdminActivityFeed(limit),
    staleTime: 1000 * 30, // 30 seconds - more frequent for activity feed
    refetchInterval: 1000 * 60, // Auto-refresh every minute
  });
}

/**
 * Hook to fetch all payment disputes
 */
export function usePaymentDisputes() {
  return useQuery<PaymentDispute[]>({
    queryKey: ['admin', 'payments', 'disputes'],
    queryFn: () => getPaymentDisputes(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to fetch dispute statistics
 */
export function useDisputeStats() {
  return useQuery<DisputeStats>({
    queryKey: ['admin', 'payments', 'disputes', 'stats'],
    queryFn: () => getDisputeStats(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to update dispute status
 */
export function useUpdateDisputeStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: PaymentDispute['status']; notes?: string }) =>
      updateDisputeStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments', 'disputes'] });
      toast.success('Dispute status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update dispute status');
    },
  });
}

/**
 * Hook to resolve dispute
 */
export function useResolveDispute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: { outcome: 'refund' | 'reject'; notes: string; refundAmount?: number } }) =>
      resolveDispute(id, resolution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments', 'disputes'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments', 'disputes', 'stats'] });
      toast.success('Dispute resolved successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to resolve dispute');
    },
  });
}
