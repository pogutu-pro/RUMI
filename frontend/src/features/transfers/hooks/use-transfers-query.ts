import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getMyTransfers, 
  getAvailableRooms, 
  getTransferPolicy,
  createTransferRequest,
  cancelTransferRequest
} from '@/features/transfers/api/transfers';
import { FilterRoomsInput } from '@/lib/validations/transfer.schema';
import { toast } from 'sonner';

export const useMyTransfers = (hostelId: string | undefined) => {
  return useQuery({
    queryKey: ['transfers', 'my', hostelId],
    queryFn: () => getMyTransfers(hostelId!),
    enabled: !!hostelId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useAvailableRooms = (hostelId: string | undefined, filters?: FilterRoomsInput) => {
  return useQuery({
    queryKey: ['transfers', 'rooms', hostelId, filters],
    queryFn: () => getAvailableRooms(hostelId!, filters),
    enabled: !!hostelId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useTransferPolicy = (hostelId: string | undefined) => {
  return useQuery({
    queryKey: ['transfers', 'policy', hostelId],
    queryFn: () => getTransferPolicy(hostelId!),
    enabled: !!hostelId,
    staleTime: Infinity, // Policy rarely changes
  });
};

export const useCreateTransfer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ hostelId, data }: { hostelId: string, data: any }) => createTransferRequest(hostelId, data),
        onSuccess: (data, variables) => {
            toast.success('Transfer request submitted');
            queryClient.invalidateQueries({ queryKey: ['transfers', 'my', variables.hostelId] });
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to submit transfer request');
        }
    });
};

export const useCancelTransfer = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ hostelId, transferId }: { hostelId: string, transferId: string }) => cancelTransferRequest(hostelId, transferId),
        onSuccess: (data, variables) => {
            toast.success('Transfer request cancelled');
            queryClient.invalidateQueries({ queryKey: ['transfers', 'my', variables.hostelId] });
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to cancel request');
        }
    });
};
