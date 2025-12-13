import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/features/inventory/api/inventory';
import { queryKeys } from '@/lib/react-query/query-keys';
import { toast } from 'sonner';
import { 
  ReportType, 
  SubmitReportPayload, 
  VerifyReportPayload,
  InventoryReport,
  CreateReportPayload 
} from '@/features/inventory/api/inventory';

// Queries
export const useMyInventoryReport = (bookingId: string | undefined, type: ReportType) => {
  return useQuery({
    queryKey: ['inventory', 'report', bookingId, type], // Using ad-hoc key for now since queryKeys usually centralized
    queryFn: async () => {
      if (!bookingId) return null;
      let report = await inventoryApi.getMyReport(bookingId, type);
      // Auto-create if not exists logic moved here or kept in component?
      // Ideally, the component handles "if no report, show Create button" or we auto-create.
      // For smooth transition, let's just fetch for now.
      return report;
    },
    enabled: !!bookingId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useInventoryReportById = (reportId: string) => {
  return useQuery({
    queryKey: ['inventory', 'report', reportId],
    queryFn: () => inventoryApi.getReportById(reportId),
    enabled: !!reportId,
    staleTime: 1000 * 60 * 5,
  });
};

// Mutations
export const useCreateInventoryReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReportPayload) => inventoryApi.createReport(payload),
    onSuccess: (data) => {
      toast.success('Report started');
      queryClient.invalidateQueries({ queryKey: ['inventory', 'report'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to start report');
    },
  });
};

export const useSubmitInventoryReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitReportPayload) => inventoryApi.submitReport(payload),
    onSuccess: (data) => {
      toast.success('Report submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['inventory', 'report'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to submit report');
    },
  });
};

export const useVerifyInventoryReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VerifyReportPayload) => inventoryApi.verifyReport(payload),
    onSuccess: (data) => {
      toast.success('Report verified successfully');
      queryClient.invalidateQueries({ queryKey: ['inventory', 'report'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to verify report');
    },
  });
};
