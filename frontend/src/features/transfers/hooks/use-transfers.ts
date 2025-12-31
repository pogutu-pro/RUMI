import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTransfers, getAllTransfers, updateTransferStatus } from '@/features/transfers';
import { queryKeys } from '@/lib/react-query/query-keys';
import { TransferRequest } from '@/features/transfers';

export const useTransfers = (hostelId: string) => {
  return useQuery({
    queryKey: [...queryKeys.transfers.all, hostelId],
    queryFn: () => getTransfers(hostelId),
    enabled: !!hostelId,
  });
};

export const useAllTransfers = () => {
  return useQuery({
    queryKey: ['transfers', 'all'],
    queryFn: getAllTransfers,
  });
};

export const useUpdateTransferStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TransferRequest['status'] }) =>
      updateTransferStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transfers.all });
    },
  });
};
