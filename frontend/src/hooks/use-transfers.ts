import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTransfers, updateTransferStatus } from '@/lib/api/transfers';
import { queryKeys } from '@/lib/react-query/query-keys';
import { TransferRequest } from '@/types/entities.types';

export const useTransfers = () => {
  return useQuery({
    queryKey: queryKeys.transfers.all,
    queryFn: getTransfers,
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
